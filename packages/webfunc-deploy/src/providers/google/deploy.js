/**
 * Copyright (c) 2018, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const gcp = require('./gcp')
const { error, wait, success, link, bold } = require('../../utils/console')
const { zipToBuffer } = require('../../utils/files')
const { identity, promise, date }  = require('../../utils')
const utils = require('./utils')

const deploy = (options={ debug:false, projectPath:null }) => Promise.resolve(null).then(() => {
	//////////////////////////////
	// 1. Show current project and help the user to confirm that's the right one.
	//////////////////////////////
	return utils.project.confirm(options).then(({ token, projectId }) => {
		const bucket = { name: `webfunc-deployment-${date.timestamp({ short:false })}-${identity.new()}${identity.new()}`.toLowerCase(), projectId }
		let zip = { name: 'webfunc-app.zip' }
		//////////////////////////////
		// 2. Zip project 
		//////////////////////////////
		const zippingDone = wait('Zipping project...')
		return zipToBuffer(options.projectPath || process.cwd(), options).then(({ filesCount, buffer }) => {
			zippingDone()
			console.log(success(`Nodejs app(${filesCount} files) zipped.`))
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
						console.log(success(`Google Cloud bucket ${bold(bucket.name)} created.`))
					})
					.catch(e => { bucketCreationDone(); throw e })
			})
			//////////////////////////////
			// 4. Upload zip to bucket
			//////////////////////////////
			.then(() => {
				const zipSize = (zip.file.length/1024/1024).toFixed(2)
				const start = Date.now()
				const uploadDone = wait(`Uploading nodejs app (${zipSize}MB) to bucket`)
				return gcp.bucket.uploadZip(zip, bucket, token, options)
					.then(() => {
						uploadDone()
						console.log(success(`Nodejs app (${zipSize}MB) uploaded in ${((Date.now() - start)/1000).toFixed(2)} seconds to bucket ${bold(bucket.name)}.`))
					})
					.catch(e => { uploadDone(); throw e })
			})
			//////////////////////////////
			// 5. Deploying project
			//////////////////////////////
			.then(() => {
				const deploymentDone = wait('Deploying your nodejs app')
				return gcp.app.deploy({ bucket, zip }, token, options).then(({ data }) => {
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
				() => gcp.app.getOperationStatus(operationId, bucket.projectId, token, options).catch(e => {
					console.log(error(`Unable to verify deployment status. Manually check the status of your build here: ${link(`https://console.cloud.google.com/cloud-build/builds?project=${bucket.projectId}`)}`))
					throw e
				}), 
				({ data }) => {
					if (data && data.done) {
						deploymentDone()
						return true
					}
					else if (data && data.message) {
						console.log(error('Failed to deploy. Though your project was successfully uploaded to Google Cloud Platform, an error occured during the deployment to App Engine. Details:', JSON.stringify(data, null, '  ')))
						throw new Error('Deployment failed.')
					} else 
						return false
				})
			).then(({ data }) => {
				console.log(success(`Nodejs app successfully deployed in project ${bold(bucket.projectId)}'s App Engine.`))
				console.log(data)
			})

	}).catch(e => {
		console.log(error('Deployment failed!', e.message, e.stack))
		throw e
	})
})

deploy({ debug:false, projectPath: '/Users/nicolasdao/Documents/projects/temp/app' })


module.exports = deploy



