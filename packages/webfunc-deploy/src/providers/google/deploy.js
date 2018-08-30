

/**
 * Copyright (c) 2018, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const gcp = require('./gcp')
const { login } = require('./account')
const getToken = require('./getToken')
const authConfig = require('../../utils/authConfig')
const { askQuestion, bold, cmd, info, error, wait, success } = require('../../utils/console')
const { zipToBuffer } = require('../../utils/files')

const deploy = (options={ debug:false }) => Promise.resolve(null).then(() => {
	//////////////////////////////
	// 1. Show current project
	//////////////////////////////
	// 1.1. Get current OAuth config file
	return authConfig.get().then((config={}) => (config.google || {})).then(config => {
		const { project: projectId, accessToken, refreshToken } = config
		// If there is no OAuth config for Google yet, then prompt the user to consent.
		if (!projectId || !accessToken || !refreshToken) {
			console.log(info('You don\'t have any Google OAuth saved yet. Requesting consent now...'))
			return login(options)
		} else // Otherwise, carry on
			return config
	}).then(config => { // 1.2. Prompt to confirm that the hosting destination is correct.
		const questionLine1 = info(`You're about to deploy a nodejs project to Google Cloud Platform project ${bold(config.project)}.`)
		const questionLine2 = info(`If that project is not the right one, then abort this deployment and run ${cmd('webfunc switch')}.`)
		const questionLine3 = info('Proceed to deployment? [y/n] ')
		return askQuestion(`${questionLine1}\n${questionLine2}\n${questionLine3}`)
			.then(answer => { if (answer == 'n') process.exit(1)})
		//////////////////////////////
		// 2. Retrieve OAuth token
		//////////////////////////////
			.then(() => getToken().then(token => ({
				token,
				projectId: config.project
			})))
	}).then(({ token, projectId }) => {
		const bucket = { name: 'webfunc_test', projectId }
		let zip = { name: `hello_${Date.now()}.zip` }
		//////////////////////////////
		// 3. Zip project 
		//////////////////////////////
		const zippingDone = wait('Rebuilding project and then zipping it...')
		return zipToBuffer(process.cwd(), options).then(zipFile => {
			zippingDone()
			console.log(success('Project rebuilt and zipped.'))
			zip.file = zipFile
		}).catch(e => { zippingDone(); throw e })
		//////////////////////////////
		// 4. Create bucket
		//////////////////////////////
			.then(() => {
				const bucketCreationDone = wait('Checking that the bucket exists (will create one if it doesn\'t)...')
				return gcp.bucket.create(bucket.name, bucket.projectId, token, options)
					.then(() => {
						bucketCreationDone()
						console.log(success('Google Cloud Bucket ready.'))
					})
					.catch(e => { bucketCreationDone(); throw e })
			})
		//////////////////////////////
		// 5. Upload zip to bucket
		//////////////////////////////
			.then(() => {
				const zipSize = (zip.file.length/1024/1024).toFixed(2)
				const start = Date.now()
				const uploadDone = wait(`Uploading zipped project (${zipSize}MB) to bucket...`)
				return gcp.bucket.uploadZip(zip, bucket, token, options)
					.then(() => {
						uploadDone()
						console.log(success(`Project (${zipSize}MB) uploaded in ${((Date.now() - start)/1000).toFixed(2)} seconds.`))
					})
					.catch(e => { uploadDone(); throw e })
			})
			.then(() => console.log('File uploaded'))
	}).catch(e => {
		console.log(error(e))
	})
})

module.exports = deploy