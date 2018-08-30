/**
 * Copyright (c) 2018, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
const { error, info, link, promptList, bold } = require('../../utils/console')
const getToken = require('./getToken')
const authConfig = require('../../utils/authConfig')
const gcp = require('./gcp')

const getProjects = (options={ debug:false, show:false }) => getToken({ debug: (options || {}).debug }).then(token => {
	const { debug, show } = options || {}

	if (debug)
		console.log(info('Retrieving project now...'))

	if (!token) {
		console.log(error('Failed to retrieve projects from Google Cloud Platform. Could not access OAuth token required for safe authentication.'))
		process.exit(1)
	}

	return gcp.project.list(token, options).then(({ data }) => {
		const projects = ((data || {}).projects || []).map(p => ({
			name: `${p.name} (${p.projectId})`,
			value: p.projectId,
			short: p.name				
		}))

		if (debug)
			console.log(info(`Projects successfully retrieved. Found ${projects.length} projects.`))

		if (projects.length == 0) {
			console.log(error(`The current Google Cloud Account does not have any project yet. Login to ${link('https://console.cloud.google.com/')} and create at least one project then try again.`))
			process.exit(1)
		}

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

	currentProject.name = `[${bold('CURRENT')}] ${currentProject.name}`
	return [currentProject, ...projects.filter(p => p.value != currentProjectId)]
}

const selectProject = (options={ debug:false, current: null }) => getProjects(options).then(projects => {
	const { current } = options || {}
	const choices = highlightCurrentProjects(projects, current)

	return promptList({ message: 'Select a project:', choices, separator: false})
		.catch(e => {
			console.log(error(e.message))
			console.log(error(e.stack))
			process.exit(1)
		})
})

const getCurrentProject = () => authConfig.get().then((config={}) => (config.gcp || {}).project)

const updateCurrentProject = (options={ debug:false }) => authConfig.get(options).then((config={}) => {
	const { debug } = options || {}
	
	if (debug)
		config.gcp && config.gcp.project 
			? console.log(info('Updating current project.')) 
			: console.log(info('No project was currently set up locally. Setting one up now...'))

	const currentProjectId = (config.gcp || {}).project
	return selectProject(Object.assign(options, { current: currentProjectId }))
		.then(project => {
			if (!project) {
				console.log(error('Failed to update the current Google Could Platform project.'))
				process.exit(1)
			}

			if (debug)
				console.log(info('New project successfully selected. Saving it locally now...'))

			config.gcp = Object.assign(config.gcp || {}, { project })
			return authConfig.update(config)
		})
})

module.exports = {
	getAll: getProjects,
	current: getCurrentProject,
	updateCurrent: updateCurrentProject
}




