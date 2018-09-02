/**
 * Copyright (c) 2018, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const gcp = require('./gcp')
const { error, debugInfo, info } = require('../../utils/console')
const { promise } = require('../../utils')
const utils = require('./utils')

const create = (options={ debug:false }) => Promise.resolve(null).then(() => {
	//////////////////////////////
	// 1. Show current project and help the user to confirm that's the right one.
	//////////////////////////////
	return utils.project.confirm(options).then(({ token, projectId }) => {
		const app = {
			id: 'v1',
			runtime: 'nodejs8',
			deployment: {	
				zip: {
					sourceUrl: 'https://storage.googleapis.com/deployment-0987654321/app.zip',
					filesCount: 2
				}
			}
		}
		return gcp.app.deploy(app, projectId, token, options).then(({ data }) => {
			const operationId = data.operationId
			console.log(info('Deployment started...'))
			return gcp.app.getOperationStatus(operationId, projectId, token, options).then(({ data }) => {
				console.log('CHECK STATUS: ', data)
				return promise.delay(5000)
					.then(() => gcp.app.getOperationStatus(operationId, projectId, token, options))
			}).then(({ data }) => {
				console.log('CHECK STATUS: ', data)
				return promise.delay(5000)
					.then(() => gcp.app.getOperationStatus(operationId, projectId, token, options))
			}).then(({ data }) => {
				console.log('CHECK STATUS: ', data)
				return promise.delay(5000)
					.then(() => gcp.app.getOperationStatus(operationId, projectId, token, options))
			}).then(({ data }) => {
				console.log('CHECK STATUS: ', data)
				return promise.delay(5000)
					.then(() => gcp.app.getOperationStatus(operationId, projectId, token, options))
			})
		})
	}).catch(e => {
		console.log(error('Deployment failed!', e.message, e.stack))
		throw e
	})
})

// { name: 'apps/neapers-92845',
//   id: 'neapers-92845',
//   authDomain: 'gmail.com',
//   locationId: 'us-central',
//   codeBucket: 'staging.neapers-92845.appspot.com',
//   servingStatus: 'SERVING',
//   defaultHostname: 'neapers-92845.appspot.com',
//   defaultBucket: 'neapers-92845.appspot.com',
//   gcrDomain: 'us.gcr.io' }

// const update = 

// git clone https://github.com/GoogleCloudPlatform/nodejs-getting-started.git $TUTORIALDIR

const options = { debug: true }
utils.project.confirm(options)
	.then(({ token, projectId }) => gcp.app.getOperationStatus('ceb1454c-cea8-44fb-bc48-8c563693f5fc', projectId, token, options))
	.then(({ data }) => {
		console.log(data)
	})

//create({ debug:true })

// const options = { debug: true }
// utils.project.confirm(options)
// 	.then(({ token, projectId }) => gcp.app.getOperationStatus('7489a7c8-5047-487a-94f7-3a2810727310', projectId, token, options))
// 	.then(({ data }) => {
// 		console.log(data)
// 	})

module.exports = create