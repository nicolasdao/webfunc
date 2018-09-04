/**
 * Copyright (c) 2018, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const { login } = require('./account')
const getToken = require('./getToken')
const authConfig = require('../../utils/authConfig')
const { askQuestion, bold, cmd, info, question, promptList, wait, success, error, link, warn } = require('../../utils/console')
const { promise } = require('../../utils')
const gcp = require('./gcp')

/**
 * [description]
 * @param  {Object} options [description]
 * @return {Object} result        
 * @return {String} result.token     	  Refreshed OAuth token
 * @return {String} result.projectId      Project id
 */
const confirmCurrentProject = (options={ debug:false }) => Promise.resolve(null).then(() => {
	//////////////////////////////
	// 1. Show current project
	//////////////////////////////
	// 1.1. Get current OAuth config file
	return authConfig.get().then((config={}) => (config.google || {}))
		.then(config => {
			const { project: projectId, accessToken, refreshToken } = config
			// If there is no OAuth config for Google yet, then prompt the user to consent.
			if (!projectId || !accessToken || !refreshToken) {
				console.log(info('You don\'t have any Google OAuth saved yet. Requesting consent now...'))
				return login(options)
			} else // Otherwise, carry on
				return config
		})
		////////////////////////////////////////////
		// 2. Make sure the OAuth token is valid.
		////////////////////////////////////////////
		.then(({ project: projectId }) => getToken(options).then(token => ({ token, projectId })))
		////////////////////////////////////////////
		// 3. Make sure the App Engine exists.
		////////////////////////////////////////////
		.then(({ token, projectId }) => gcp.app.getRegions().then(regions => {
			const appEngineStatusDone = wait('Checking App Engine status.')
			return { token, projectId, regions, appEngineStatusDone }
		}))
		.then(({ token, projectId, regions, appEngineStatusDone }) => gcp.app.get(projectId, token, options).then(({ data }) => {
			appEngineStatusDone()
			const locationId = data && data.locationId ? data.locationId : null
			if (locationId)
				// 3.1. The App Engine exists, so move on.
				return { token, projectId, locationId: regions.find(({ id }) => id == locationId).label }
			else {
				// 3.2. The App Engine does not exist, so ask the user if one needs to be created now.
				const q1 = info(`No App Engine defined in current project ${bold(projectId)}`)
				const q2 = question('Create one now (Y/n)? ')
				return askQuestion(`${q1}\n${q2}`).then(answer => {
					if (answer == 'n')
						return { token, projectId, locationId: null }
					// 3.2.1. Choose region
					const choices = regions.map(({ id, label }) => ({
						name: label,
						value: id,
						short: id				
					}))

					// 3.2.2. Create App Engine
					return promptList({ message: 'Select a region (WARNING: This cannot be undone!):', choices, separator: false})
						.catch(e => {
							console.log(error(e.message))
							console.log(error(e.stack))
							process.exit(1)
						}).then(answer => {
							if (!answer) 
								process.exit(1)

							const appEngDone = wait(`Creating a new App Engine (region: ${bold(answer)}) in project ${bold(projectId)}`)
							return gcp.app.create(projectId, answer, token, options)
								.then(({ data: { operationId } }) => promise.check(
									() => gcp.app.getOperationStatus(projectId, operationId, token, options).catch(e => {
										console.log(error(`Unable to verify deployment status. Manually check the status of your build here: ${link(`https://console.cloud.google.com/cloud-build/builds?project=${projectId}`)}`))
										throw e
									}), 
									({ data }) => {
										if (data && data.done) {
											appEngDone()
											return true
										}
										else if (data && data.message) {
											console.log(error('Fail to create App Engine. Details:', JSON.stringify(data, null, '  ')))
											process.exit(1)
										} else 
											return false
									})
								)
								.catch(e => {
									console.log(error('Fail to create App Engine.', e.message, e.stack))
									throw e
								})
								.then(() => {
									console.log(success(`App Engine (region: ${bold(answer)}) successfully created in project ${bold(projectId)}.`))
									return { token, projectId, locationId: regions.find(({ id }) => id == answer).label }
								})
						})
				})
			}
		}))
		.then(({ token, projectId, locationId }) => { // 1.2. Prompt to confirm that the hosting destination is correct.
			const q0 = warn(`There is no App Engine for project ${bold(projectId)}. Attempting to deploy will fail.`)
			const q1 = info(`Current Google App Engine: Project ${bold(projectId)} - Region ${bold(locationId)}`)
			const q2 = info(`To change project, run ${cmd('webfunc switch')}. To use another account, run ${cmd('webfunc login')}`)
			const q3 = question('Do you want to proceed (Y/n)? ')
			return askQuestion(`${locationId ? q1 : q0}\n${q2}\n${q3}`).then(answer => (answer == 'n') ? process.exit(1) : { token, projectId })
		})
})

module.exports = {
	project: {
		confirm: confirmCurrentProject
	}
}