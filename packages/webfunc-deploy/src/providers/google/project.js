/**
 * Copyright (c) 2018, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
const { error, info, link, promptList, bold, debugInfo, askQuestion, question, wait, success, warn } = require('../../utils/console')
const getToken = require('./getToken')
const authConfig = require('../../utils/authConfig')
const gcp = require('./gcp')
const { identity, promise } = require('../../utils')

const getProjects = (options={ debug:false, show:false }) => getToken({ debug: (options || {}).debug }).then(token => {
	const { debug, show } = options || {}

	if (debug)
		console.log(debugInfo('Retrieving project now...'))

	if (!token) {
		console.log(error('Failed to retrieve projects from Google Cloud Platform. Could not access OAuth token required for safe authentication.'))
		process.exit(1)
	}

	return gcp.project.list(token, options).then(({ data }) => {
		const projects = ((data || {}).projects || []).filter(p => p && p.lifecycleState == 'ACTIVE').map(p => ({
			name: `${p.name} (${p.projectId})`,
			value: p.projectId,
			short: p.name				
		}))

		if (debug)
			console.log(debugInfo(`Projects successfully retrieved. Found ${projects.length} projects.`))

		if (show) {
			if (projects.length == 0)
				console.log(info('No projects found in this Google Could Platform account.'))
			else
				projects.forEach(p => {
					console.log(info(p.name))
				})
		}

		return projects
	})
})

const highlightCurrentProjects = (projects=[], currentProjectId) => {
	if (projects.length == 0 || !currentProjectId)
		return projects

	let currentProject = projects.find(p => p.value == currentProjectId)
	if (!currentProject)
		return projects

	currentProject.name = `<${bold('Current')}> ${currentProject.name}`
	return [currentProject, ...projects.filter(p => p.value != currentProjectId)]
}

const selectProject = (options={ debug:false, current: null }) => getProjects(options).then(projects => {
	const { current } = options || {}
	const createLabel = `<${bold('Create new project')}>`
	const choices = [...highlightCurrentProjects(projects, current),{ name: createLabel, value: '[create]', short: createLabel }]

	return promptList({ message: 'Select a project:', choices, separator: false})
		.catch(e => {
			console.log(error(e.message))
			console.log(error(e.stack))
			process.exit(1)
		})
})

const getCurrentProject = () => authConfig.get().then((config={}) => (config.google || {}).project)

const updateCurrentProject = (options={ debug:false }) => authConfig.get(options).then((config={}) => {
	const { debug } = options || {}
	
	if (debug)
		config.google && config.google.project 
			? console.log(debugInfo('Updating current project.')) 
			: console.log(debugInfo('No project was currently set up locally. Setting one up now...'))

	const currentProjectId = (config.google || {}).project
	return selectProject(Object.assign(options, { current: currentProjectId }))
		.then(project => {
			if (!project) {
				console.log(error('Failed to update the current Google Could Platform project.'))
				process.exit(1)
			} else if (project == '[create]')
				return getToken(options).then(token => createNewProject(token, options))
			else 
				return project
		})
		.then(projectId => {
			if (debug)
				console.log(debugInfo('New project successfully selected. Saving it locally now...'))

			config.google = Object.assign(config.google || {}, { project: projectId })
			return authConfig.update(config).then(() => config.google)
		})
})

const enterProjectName = () => askQuestion(question('Enter a project name: ')).then(projectName => {
	if (!projectName) {
		console.log(info('The project name is required.'))
		return enterProjectName()
	} else
		return projectName
})

const createNewProject = (token, options={ debug:false }) => {
	if (!token) {
		console.log(error('Missing required OAuth \'token\'.'))
		throw new Error('Missing required OAuth \'token\'.')
	}
	// 1. Collect input from user
	return enterProjectName().then(projectName => {
		const projectId = `${projectName.toLowerCase().trim().replace(/\s+/g,'-')}-${identity.new()}`.toLowerCase()
		return askQuestion(question(`Are you sure you want to create a new project called ${bold(projectName)} (id: ${bold(projectId)}) (Y/n)? `)).then(answer => {
			if (answer == 'n')
				process.exit(1)
			
			if (options.debug)
				console.log(debugInfo(`Creating project ${bold(projectName)} (id: ${bold(projectId)}).`))

			// 2. Create project
			const createProjectDone = wait(`Creating project ${bold(projectName)} (id: ${bold(projectId)}). This should take a few seconds.\nIf it takes too long, check the status on your account: ${link('https://console.cloud.google.com/cloud-resource-manager?organizationId=0')}`)
			return gcp.project.create(projectName, projectId, token, options)
				.then(() => promise.check(
					() => gcp.project.get(projectId, token, Object.assign({ verbose: false }, options)).catch(e => (() => ({ data: {} }))(e)), 
					({ data }) => {
						if (data && data.name) {
							createProjectDone()
							return true
						}
						else 
							return false
					})
				)
				.then(() => {
					console.log(success('Project successfully created'))
					return projectId
				})
				.catch(e => {
					createProjectDone(e)
					throw e
				})
				// 3. Enable billing
				.then(() => {
					console.log(info(`You must enable billing before you can deploy code to ${bold(projectId)}`))
					return enableBilling(projectId, token, options)
				})
		})
	})
}

const enableBilling = (projectId, token, options) => askQuestion(question('Do you want to enable billing now (Y/n)?')).then(answer => {
	if (answer == 'n') {
		console.log(warn(`Though your project has been successfully created, you won't be able to deploy any code until billing is enabled.\nThis is a Google Cloud policy (more info at ${link('https://support.google.com/cloud/answer/6158867')}).\nTo enable billing on project ${bold(projectId)}, browse to ${link(`https://console.cloud.google.com/billing/linkedaccount?project=${projectId}&folder&organizationId`)}.`))
		return projectId
	}
	const instructionDone = wait(`You're going to be redirected to your Google Cloud Platform account in a few seconds.\nOnce you've enabled billing for project ${bold(projectId)}, come back here to finalize the process.`)
	let billingDone
	return promise.delay(8000).then(() => {
		instructionDone()
		billingDone = wait(`Waiting for confirmation that billing has been enabled for project ${bold(projectId)}`)
		return gcp.project.billing.enable(projectId, () => gcp.project.billing.isEnabled(projectId, token, options), 600000, options)
	})
		.then(() => {
			billingDone()
			console.log(success('Billing successfully enabled. You\'re ready to deploy code.'))
			return projectId
		})
		.catch(e => {
			billingDone()
			console.log(error(e.message, e.stack))
			throw e
		})
})

module.exports = {
	getAll: getProjects,
	current: getCurrentProject,
	updateCurrent: updateCurrentProject,
	create: createNewProject
}




