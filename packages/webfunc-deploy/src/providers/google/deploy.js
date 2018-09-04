/**
 * Copyright (c) 2018, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const gcp = require('./gcp')
const { error, wait, success, link, bold, info } = require('../../utils/console')
const { zipToBuffer } = require('../../utils/files')
const { identity, promise, date }  = require('../../utils')
const utils = require('./utils')

const deploy = (serviceName, options={ debug:false, projectPath:null, promote:true }) => Promise.resolve(null).then(() => {
	if (options.promote === undefined) options.promote = true
	if (!serviceName)
		throw new Error('Missing required argument \'serviceName\'.')

	const service = { name: serviceName, version: `v${date.timestamp({ short:false })}` }

	//////////////////////////////
	// 1. Show current project and app engine details to help the user confirm that's the right one.
	//////////////////////////////
	return utils.project.confirm(options).then(({ token, projectId }) => {
		const bucket = { name: `webfunc-deployment-${service.version}-${identity.new()}`.toLowerCase(), projectId }
		let zip = { name: 'webfunc-app.zip' }
		let deployStart
		//////////////////////////////
		// 2. Zip project 
		//////////////////////////////
		const zippingDone = wait('Zipping project...')
		return zipToBuffer(options.projectPath || process.cwd(), options).then(({ filesCount, buffer }) => {
			zippingDone()
			console.log(success(`Nodejs app(${filesCount} files) successfully zipped.`))
			zip.file = buffer
			zip.filesCount = filesCount
		}).catch(e => { zippingDone(); throw e })
			//////////////////////////////
			// 3. Create bucket
			//////////////////////////////
			.then(() => {
				const bucketCreationDone = wait('Creating new deployment bucket')
				return gcp.bucket.create(bucket.name, bucket.projectId, token, options)
					.then(() => {
						bucketCreationDone()
						console.log(success(`Bucket ${bold(bucket.name)} successfully created.`))
					})
					.catch(e => { bucketCreationDone(); throw e })
			})
			//////////////////////////////
			// 4. Upload zip to bucket
			//////////////////////////////
			.then(() => {
				const zipSize = (zip.file.length/1024/1024).toFixed(2)
				const uploadStart = Date.now()
				const uploadDone = wait(`Uploading nodejs app (${zipSize}MB) to bucket`)
				return gcp.bucket.uploadZip(zip, bucket, token, options)
					.then(() => {
						uploadDone()
						console.log(success(`App (${zipSize}MB) successfully uploaded to bucket in ${((Date.now() - uploadStart)/1000).toFixed(2)} seconds.`))
					})
					.catch(e => { uploadDone(); throw e })
			})
			//////////////////////////////
			// 5. Deploying project
			//////////////////////////////
			.then(() => {
				deployStart = Date.now()
				const deploymentDone = wait(`Deploying nodejs app to project ${bold(bucket.projectId)} under App Engine's service ${bold(service.name)} version ${bold(service.version)}`)
				return gcp.app.deploy({ bucket, zip }, service, token, options).then(({ data }) => {
					if (!data.operationId) {
						const msg = 'Unexpected response. Could not determine the operationId used to check the deployment status.'
						console.log(error(msg))
						throw new Error(msg)
					}
					return { deploymentDone, operationId: data.operationId }
				})
			})
			////////////////////////////////////
			// 6. Checking deployment status
			////////////////////////////////////
			.then(({ deploymentDone, operationId }) => promise.check(
				() => gcp.app.getOperationStatus(bucket.projectId, operationId, token, options).catch(e => {
					console.log(error(`Unable to verify deployment status. Manually check the status of your build here: ${link(`https://console.cloud.google.com/cloud-build/builds?project=${bucket.projectId}`)}`))
					throw e
				}), 
				({ data }) => {
					if (data && data.done) {
						deploymentDone()
						return true
					}
					else if (data && data.message) {
						console.log(error('Fail to deploy. Though your project was successfully uploaded to Google Cloud Platform, an error occured during the deployment to App Engine. Details:', JSON.stringify(data, null, '  ')))
						throw new Error('Deployment failed.')
					} else 
						return false
				})
			).then(({ data }) => {
				console.log(success(`App successfully deployed App Engine's service ${bold(service.name)} (version: ${bold(service.version)}) in ${((Date.now() - deployStart)/1000).toFixed(2)} seconds.`))
				if (data && data.response && data.response.versionUrl) {
					console.log(info(`This version is available at ${bold(link(data.response.versionUrl))}`))
					const svcUrl = data.response.versionUrl.replace(`https://${service.version}-dot-`, 'https://')
					return svcUrl
				}
				return null
			})
			////////////////////////////////////
			// 7. Migrating traffic
			////////////////////////////////////
			.then(svcUrl => {
				if (options.promote) {
					const migartingTrafficDone = wait('Migrating app traffic to this version')
					// 7.1. Checking which service version is currently serving all traffic.
					return gcp.app.service.get(bucket.projectId, service.name, token, options).then(({ data }) => {
						if (!data || !data.split || !data.split.allocations || !Object.keys(data.split.allocations).some(key => key == service.version)) {
							// 7.1.1. The current service version is different from the newly deployed. Time to migrate traffic...
							return gcp.app.service.version.migrateAllTraffic(bucket.projectId, service.name, service.version, token, options)
								.then(({ data }) => promise.check(
									() => gcp.app.getOperationStatus(bucket.projectId, data.operationId, token, options).catch(e => {
										console.log(error(`Unable to verify deployment status. Manually check the status of your build here: ${link(`https://console.cloud.google.com/cloud-build/builds?project=${bucket.projectId}`)}`))
										throw e
									}), 
									({ data }) => {
										if (data && data.done) {
											migartingTrafficDone()
											return true
										}
										else if (data && data.message) {
											console.log(error(`Fail to migrate traffic to version ${bold(service.version)}. Details:`, JSON.stringify(data, null, '  ')))
											throw new Error('Traffic migration failed.')
										} else 
											return false
									}))
						}
						// 7.1.2. The current service version is the same as the new version. That means that the new version is already serbing all the traffic.
					})
						.then(() => {
							console.log(success(`Traffic successfully migrated to new version.${svcUrl ? ` App available at ${bold(link(svcUrl))}.` : ''}`))
						})
				}
			})
			////////////////////////////////////
			// 8. More info message
			////////////////////////////////////
			.then(() => {
				console.log(info(`More details about this deployment in your Google Cloud Dashboard: ${link(`https://console.cloud.google.com/appengine/versions?project=${bucket.projectId}&serviceId=${service.name}`)}`))
			})

	}).catch(e => {
		console.log(error('Deployment failed!', e.message, e.stack))
		throw e
	})
})

//deploy('web-api', { debug:false, projectPath: '/Users/nicolasdao/Documents/projects/temp/app' })


module.exports = deploy



