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
const { askQuestion, bold, info, question, promptList, wait, success, error, link, warn, debugInfo } = require('../../utils/console')
const { promise } = require('../../utils')
const gcp = require('./gcp')
const { updateCurrent: updateCurrentProject } = require('./project')

/**
 * [description]
 * @param  {Object} options [description]
 * @return {Object} result        
 * @return {String} result.token     	  Refreshed OAuth token
 * @return {String} result.projectId      Project id
 */
const confirmCurrentProject = (options={ debug:false, selectProject: false }) => Promise.resolve(null).then(() => {
	if (options.debug === undefined) options.debug = false
	if (options.selectProject === undefined) options.selectProject = false
	//////////////////////////////
	// 1. Show current project
	//////////////////////////////
	return authConfig.get().then((config={}) => (config.google || {}))
		.then(config => {
			const { project: projectId, accessToken, refreshToken } = config
			// 1.1. If there is no OAuth config for Google yet, then prompt the user to consent.
			if (!accessToken || !refreshToken) {
				console.log(info('You don\'t have any Google OAuth saved yet. Requesting consent now...'))
				return login(options)
			// 1.2. If there is no projectId, select one.
			} else if (!projectId) {
				return updateCurrentProject(options)
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
		.then(({ token, projectId }) => _confirmAppEngineIsReady(projectId, token, options))
})

const _confirmAppEngineIsReady = (projectId, token, options={}) => gcp.app.getRegions()
////////////////////////////////////////////
// 1. Get regions
////////////////////////////////////////////
	.then(regions => {
		if (options.debug)
			console.log(debugInfo(`Testing Project ${bold(projectId)} still active.`))
		const projectStatusDone = wait('Checking Google Cloud Project status.')
		return { token, projectId, regions, projectStatusDone }
	})
////////////////////////////////////////////////
// 2. Testing that the project is still active
////////////////////////////////////////////////
	.then(({ token, projectId, regions, projectStatusDone }) => gcp.project.get(projectId, token, options).then(res => {
		const { data } = res || {}
		projectStatusDone()
		return (!data || data.lifecycleState != 'ACTIVE'
			? (() => {
				console.log(warn(`Your current project ${bold(projectId)} is not active anymore.`))
				const choices = [
					{ name: 'Choose another project', value: 'project', short: 'Choose another project' },
					{ name: 'Choose another account', value: 'account', short: 'Choose another account' }
				]
				return promptList({ message: 'Choose one of the following options:', choices, separator: false}).then(answer => {
					if (!answer)
						process.exit(1)
					return getToken(answer == 'account' ? { debug: options.debug, refresh: true, origin: 'Testing project active' } : { debug: options.debug, refresh: false, origin: 'Testing project active' })
						.then(tkn => updateCurrentProject(options).then(({ project: newProjectId }) => ({ projectId: newProjectId, token: tkn })))
				})
			})() 
			: Promise.resolve({ projectId, token}))
			.then(({ projectId, token }) => {
				if (options.debug)
					console.log(debugInfo(`Testing App Engine for Project ${bold(projectId)} exists.`))
				const appEngineStatusDone = wait('Checking App Engine status.')
				return { token, projectId, regions, appEngineStatusDone }
			})
	}))
////////////////////////////////////////////
// 3. Tesing the App Engine exists
////////////////////////////////////////////
	.then(({ token, projectId, regions, appEngineStatusDone }) => gcp.app.get(projectId, token, options).then(res => {
		const { data } = res || {}
		appEngineStatusDone()
		const locationId = data && data.locationId ? data.locationId : null
		if (locationId)
		// 3.1. The App Engine exists, so move on.
			return { token, projectId, locationId: regions.find(({ id }) => id == locationId).label }
		else {
			// 3.2. The App Engine does not exist, so ask the user if one needs to be created now.
			const q1 = info(`No App Engine defined in current project ${bold(projectId)} yet`)
			const q2 = question('Do you want to create one now (Y/n)? ')
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
////////////////////////////////////////////
// 4. Prompt user to confirm
////////////////////////////////////////////
	.then(({ token, projectId, locationId }) => { // 1.2. Prompt to confirm that the hosting destination is correct.
		const choices = [
			{ name: 'Yes', value: 'yes', short: 'Yes' },
			{ name: 'No (choose another service)', value: 'switchService', short: 'No. Choose another service' },
			{ name: 'No (choose another project)', value: 'switchProject', short: 'No. Choose another project' },
			{ name: 'No (choose another account)', value: 'switchAccount', short: 'No (choose another account)' }
		]

		const ask = !options.selectProject
			? (() => {
				if (locationId)
					console.log(info(`Current settings: Project ${bold(projectId)} (${locationId}) ${bold('default')} service`))
				else
					console.log(warn(`There is no App Engine for project ${bold(projectId)}. Attempting to deploy will fail.`))

				return promptList({ message: 'Do you want to continue?', choices, separator: false})
			})()
			: Promise.resolve('yes')

		return ask.then(answer => {
			if (!answer)
				process.exit(1)
			else if (answer == 'switchService') {
				return _chooseService(projectId, options).then(service => ({ token, projectId, locationId, service }))
			} else if (answer == 'switchProject' || answer == 'switchAccount')
				return getToken(answer == 'switchAccount' ? { debug: options.debug, refresh: true, origin: 'Prompt to confirm' } : { debug: options.debug, refresh: false, origin: 'Prompt to confirm' })
					.then(tkn => updateCurrentProject(options).then(({ project: newProjectId }) => _confirmAppEngineIsReady(newProjectId, tkn, options)))
			else
				return { token, projectId, locationId }
		})
	})

const _chooseService = (projectId, options={}) => Promise.resolve(null).then(() => {
	return (() => 'web-api')({ projectId, options })
})

const checkOperation = (projectId, operationId, token, onSuccess, onFailure, options) => promise.check(
	() => gcp.app.getOperationStatus(projectId, operationId, token, options).catch(e => {
		console.log(error(`Unable to check operation status. To manually check that status, go to ${link(`https://console.cloud.google.com/cloud-build/builds?project=${projectId}`)}`))
		throw e
	}), 
	({ data }) => {
		if (data && data.done) {
			if (onSuccess) onSuccess(data)
			return { message: 'done' }
		}
		else if (data && data.message) {
			if (onFailure) onFailure(data)
			return { error: data }
		} else 
			return false
	})

module.exports = {
	project: {
		confirm: confirmCurrentProject
	},
	operation: {
		check: checkOperation
	}
}




