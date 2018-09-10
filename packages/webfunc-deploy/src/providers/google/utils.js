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
const { promise, collection, obj } = require('../../utils')
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

const _confirmAppEngineIsReady = (projectId, token, options={}) => {
	const appConfig = options.ignoreAppConfig ? {} : (options.appConfig || {})
	const appProjectId = appConfig.projectId
	const appService = appConfig.service || 'default'
	//const appType = appConfig.type || 'standard'

	if (appProjectId) options.selectProject = true

	return gcp.app.getRegions()
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
		.then(({ token, projectId, regions, projectStatusDone }) => {
		
			if (appProjectId) projectId = appProjectId

			return gcp.project.get(projectId, token, options).then(res => {
				const { data } = res || {}
				projectStatusDone()
				return (!data || data.lifecycleState != 'ACTIVE'
					? (() => {
						options.selectProject = false
						console.log(warn(`Project ${bold(projectId)} not found. It is either inactive or you don't have access to it.`))
						const choices = [
							{ name: 'Choose another project', value: 'project' },
							{ name: 'Choose another account', value: 'account' }
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
			})
		})
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
				{ name: 'Yes', value: 'yes' },
				{ name: 'No (choose another service)', value: 'switchService' },
				{ name: 'No (choose another project)', value: 'switchProject' },
				{ name: 'No (choose another account)', value: 'switchAccount' }
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
						.then(tkn => updateCurrentProject(options).then(({ project: newProjectId }) => _confirmAppEngineIsReady(newProjectId, tkn, obj.merge(options, { ignoreAppConfig: true }))))
				else
					return { token, projectId, locationId, service: appService }
			})
		})
}

const _chooseServiceName = () => askQuestion(question('Enter service name: ')).then(answer => {
	if (!answer || answer.length < 3 || !answer.match(/^[a-z0-9\-_]+$/)) {
		console.log(info('A service name must be at least 3 characters long and it can only contain lowercase alphanumerics, \'-\' and \'_\'.'))
		return _chooseServiceName()
	} else 
		return answer
})

const _chooseService = (projectId, options={}) => getToken(options).then(token => {
	const loadingSvcDone = wait('Loading services')
	return gcp.app.service.list(projectId, token, options).then(res => ({ loadingSvcDone, data: res.data })).catch(e => { loadingSvcDone(); throw e })
}).then(({ loadingSvcDone, data }) => {
	loadingSvcDone()
	const currentService = options.serviceName || 'default'
	if (!data || data.length == 0) {
		console.log(info('The \'default\' service is required to be created first. Once it is created, creating other services will be allowed.'))
		return askQuestion(question('Do you want to continue using the \'default\' service (Y/n)? ')).then(answer => {
			if (answer == 'n')
				process.exit(1)
			else
				return 'default'
		})
	} else {
		const choices = [
			...collection.sortBy(data.map(d => {
				const isCurrent = d.id == currentService
				const n = isCurrent ? `<${bold('Current')}> ${d.id}` : `${d.id}`
				return { name: n, value: `${d.id}`, idx: isCurrent ? 0 : 1 }
			}), x => x.idx, 'asc'),
			{ name: `<${bold('Create new service')}>`, value: 'create new' }]

		return promptList({ message: 'Choose one of the following options:', choices, separator: false}).then(answer => {
			if (answer == 'create new')
				return _chooseServiceName()
			else
				return answer
		})
	}
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




