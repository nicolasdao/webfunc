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
		return gcp.app.listServiceVersions('web-api', projectId, token, options).then(({ data }) => {
			console.log(data)
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

// cp.8508563561489435884
const options = { debug: false }
utils.project.confirm(options)
	// .then(({ token, projectId }) => gcp.project.billing.isEnabled(projectId, token, options)).then(r => {
	// 	if (r)
	// 		console.log('BILLING OK')
	// 	else
	// 		console.log('BILLING KO')
	// 	return { data: {} }
	// })
	.then(({ token, projectId }) => gcp.app.service.get(projectId, 'default', token, { debug: options.debug, verbose: false }))
	// .then(({ token, projectId }) => gcp.app.getOperationStatus(projectId, '8508563561489435884', token, options))
	//.then(({ token, projectId }) => gcp.app.service.version.migrateAllTraffic('web-api', 'v8', projectId, token, options))
	//.then(({ token, projectId }) => gcp.app.domain.list(projectId, token, options))
	.then(({ data }) => {
		console.log('RESULT: ', data)
	})
	.catch(e => {
		console.log(error('Boom'), e.message, e.stack)
	})

//create({ debug:true })

// const options = { debug: true }
// utils.project.confirm(options)
// 	.then(({ token, projectId }) => gcp.app.getOperationStatus(projectId, '7489a7c8-5047-487a-94f7-3a2810727310', token, options))
// 	.then(({ data }) => {
// 		console.log(data)
// 	})

module.exports = create