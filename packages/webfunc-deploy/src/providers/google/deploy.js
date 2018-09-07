/**
 * Copyright (c) 2018, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const clipboardy = require('clipboardy')
const gcp = require('./gcp')
const { error, wait, success, link, bold, info, note } = require('../../utils/console')
const { zipToBuffer } = require('../../utils/files')
const { identity, promise, date }  = require('../../utils')
const utils = require('./utils')
const projectHelper = require('./project')

const createBucket = (projectId, bucketName, token, options={}) => {
	const bucketCreationDone = wait('Creating new deployment bucket')
	return gcp.bucket.create(bucketName, projectId, token, { debug: options.debug, verbose: false })
		.then(() => {
			bucketCreationDone()
			console.log(success(`Bucket successfully created (${bucketName}).`))
		})
		.catch(e => { 
			bucketCreationDone()
			try {
				const er = JSON.parse(e.message)
				if (er.code == 403 && er.message.indexOf('absent billing account') >= 0) {
					return projectHelper.enableBilling(projectId, token, options).then(({ answer }) => {
						if (answer == 'n') throw e
						return createBucket(projectId, bucketName, token, options)
					})
				}
			} catch(_e) { (() => null)(_e) }
			throw e 
		})
}

const deploy = (serviceName, options={ debug:false, projectPath:null, promote:true }) => Promise.resolve(null).then(() => {
	if (options.promote === undefined) options.promote = true
	serviceName = serviceName || 'default'
	let waitDone

	let service = { name: serviceName, version: `v${date.timestamp({ short:false })}` }

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
		waitDone = wait('Zipping project...')
		return zipToBuffer(options.projectPath || process.cwd(), options).then(({ filesCount, buffer }) => {
			waitDone()
			console.log(success(`Nodejs app (${filesCount} files) successfully zipped.`))
			zip.file = buffer
			zip.filesCount = filesCount
		}).catch(e => { waitDone(); throw e })
			//////////////////////////////
			// 3. Create bucket & Check that the 'default' service exists
			//////////////////////////////
			.then(() => {
				const bucketTask = createBucket(bucket.projectId, bucket.name, token, options).catch(e => ({ _error: e }))
				const testDefaultServiceExistsTask = service.name == 'default' 
					? Promise.resolve({ data: true })
					: gcp.app.service.get(bucket.projectId, 'default', token, { debug: options.debug, verbose: false }).catch(e => ({ _error: e }))
				return Promise.all([bucketTask, testDefaultServiceExistsTask]).then(values => {
					const e = values.find(v => v && v._error) 
					if (e)
						throw e._error
					// 3.1. There is no 'default' 
					if (!values[1].data) {
						console.log(info(`No 'default' service defined yet. Choosing the 'default' service to deploy the app rather than '${service.name}' (this is a Google Cloud Platform constraint).`))
						service.name = 'default'
					}
				})
			})
			//////////////////////////////
			// 4. Upload zip to bucket
			//////////////////////////////
			.then(() => {
				const zipSize = (zip.file.length/1024/1024).toFixed(2)
				const uploadStart = Date.now()
				waitDone = wait(`Uploading nodejs app (${zipSize}MB) to bucket`)
				return gcp.bucket.uploadZip(zip, bucket, token, options)
					.then(() => {
						waitDone()
						console.log(success(`App (${zipSize}MB) successfully uploaded to bucket in ${((Date.now() - uploadStart)/1000).toFixed(2)} seconds.`))
					})
					.catch(e => { waitDone(); throw e })
			})	
			//////////////////////////////
			// 5. Deploying project
			//////////////////////////////
			.then(() => {
				deployStart = Date.now()
				waitDone = wait(`Deploying nodejs app to project ${bold(bucket.projectId)} under App Engine's service ${bold(service.name)} version ${bold(service.version)}`)
				return gcp.app.deploy({ bucket, zip }, service, token, options).then(({ data }) => {
					if (!data.operationId) {
						const msg = 'Unexpected response. Could not determine the operationId used to check the deployment status.'
						console.log(error(msg))
						throw new Error(msg)
					}
					return { operationId: data.operationId }
				})
			})
			////////////////////////////////////
			// 6. Checking deployment status
			////////////////////////////////////
			.then(({ operationId }) => promise.check(
				() => gcp.app.getOperationStatus(bucket.projectId, operationId, token, options).catch(e => {
					console.log(error(`Unable to verify deployment status. Manually check the status of your build here: ${link(`https://console.cloud.google.com/cloud-build/builds?project=${bucket.projectId}`)}`))
					throw e
				}), 
				({ data }) => {
					if (data && data.done) {
						waitDone()
						return true
					}
					else if (data && data.message) {
						console.log(error('Fail to deploy. Though your project was successfully uploaded to Google Cloud Platform, an error occured during the deployment to App Engine. Details:', JSON.stringify(data, null, '  ')))
						throw new Error('Deployment failed.')
					} else 
						return false
				})
			).then(({ data }) => {
				const showVersionUrl = data && data.response && data.response.versionUrl
				console.log(success(`App successfully deployed to App Engine's service ${bold(service.name)} (version: ${service.version}) in ${((Date.now() - deployStart)/1000).toFixed(2)} seconds.`))
				if (showVersionUrl) {
					const svcUrl = options.promote 
						? data.response.versionUrl.replace(`https://${service.version}-dot-`, 'https://')
						: data.response.versionUrl
					return svcUrl
				}
				return null
			})
			////////////////////////////////////
			// 7. Migrating traffic
			////////////////////////////////////
			.then(svcUrl => {
				if (options.promote) {
					waitDone = wait('Migrating app traffic to this version')
					// 7.1. Checking which service version is currently serving all traffic.
					return gcp.app.service.get(bucket.projectId, service.name, token, options)
						.then(({ data }) => {
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
												waitDone()
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
							waitDone()
							return (svcUrl ? clipboardy.write(svcUrl) : Promise.resolve(null)).then(() => {
								console.log(success('Traffic successfully migrated to new version.'))
								if (svcUrl)
									console.log(success(`App available at ${bold(link(svcUrl))} (copied to clipboard).`))
							})
						})
				} else
					(svcUrl ? clipboardy.write(svcUrl) : Promise.resolve(null)).then(() => {
						if (svcUrl)
							console.log(success(`App available at ${bold(link(svcUrl))} (copied to clipboard).`))
					})
			})
			////////////////////////////////////
			// 8. More info message
			////////////////////////////////////
			.then(() => {
				console.log(note(`More details about this deployment in your Google Cloud Dashboard: ${link(`https://console.cloud.google.com/appengine/versions?project=${bucket.projectId}&serviceId=${service.name}`)}`))
			})

	}).catch(e => {
		waitDone()
		console.log(error('Deployment failed!', e.message, e.stack))
		throw e
	})
})

deploy('web-api', { debug:false, projectPath: '/Users/nicolasdao/Documents/projects/temp/app' })


module.exports = deploy



