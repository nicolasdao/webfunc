/**
 * Copyright (c) 2018, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const gcp = require('./gcp')
const utils = require('./utils')
const deploy = require('./deploy')
const { bold, gray, wait } = require('../../utils/console')
const { collection } = require('../../utils')

const _adjustContentToWidth = (content, maxWidth, options={}) => {
	const { paddingLeft=0, paddingRight=0, format } = options
	const padLeft = collection.seed(paddingLeft).map(x => ' ').join('')
	const padRight = collection.seed(paddingRight).map(x => ' ').join('')
	const missingBlanksCount = maxWidth - (paddingLeft + content.length + paddingRight)
	const missingBlanks = missingBlanksCount > 0 ? collection.seed(missingBlanksCount).map(x => ' ').join('') : ''
	return padLeft + ((format && typeof(format) == 'function') ? format(content) : content) + missingBlanks + padRight
}

const _getMaxColWidth = (contents=[], options={}) => {
	const { paddingLeft= 2, paddingRight= 4, format } = options
	return Math.max(...contents.map(content => `${content}`.length)) + paddingLeft + paddingRight
}

const listServices = (options={}) => Promise.resolve(null).then(() => {
	options.selectProject = true
	// 1. Get the current project and token
	return utils.project.confirm(options)
		.then(({ token, projectId, locationId }) => {
			// 2. Get all the services and their versions for this project
			console.log(`Services for project ${bold(projectId)} (${locationId}):`)
			const loadingDone = wait(`Loading services...`)
			return gcp.app.service.list(projectId, token, { debug: options.debug, verbose: false, includeVersions: true })
			.then(res => {
				loadingDone()
				return { projectId, data: res.data }
			})
			.catch(e => {
				loadingDone()
				throw e
			})
		})
		.then(({ projectId, data }) => {
			// 3. Display the results
			const opts = { paddingLeft: 2, paddingRight: 2 }
			const deploymentPaddingLeft = 2
			const deployPaddLeft = collection.seed(deploymentPaddingLeft).map(() => ' ').join('')
			const headerOpts = Object.assign({}, opts, { format: gray })
			data = data || []
			data.forEach((service,i) => {
				// 3.1. Display service name and url
				console.log(`${`\n${i+1}. `}${bold(service.id)} - ${service.url}`)
				if (service.versions && service.versions.length > 0) {
					const versions = service.versions.map(v => ({
						'latest deploy': v.id, // e.g., 'v1'
						'traffic alloc.': `${(v.traffic * 100).toFixed(2)}%`,
						status: v.servingStatus, // e.g., 'SERVING'
						type: v.env, // e.g., 'standard' or 'flex'
						created: v.createTime,
						user: (v.createdBy || '').toLowerCase()
					})).slice(0,5)

					const deployments = Object.keys(versions[0]).map(colName => {
						const colWidth = _getMaxColWidth([colName, ...versions.map(v => v[colName])], opts)
						const header = _adjustContentToWidth(colName, colWidth, headerOpts)
						const nonFormattedhHeader = _adjustContentToWidth(colName, colWidth, Object.assign({}, headerOpts, { format: null }))
						const colItems = versions.map(v => _adjustContentToWidth(v[colName], colWidth, opts))
						return { header, nonFormattedhHeader, items: colItems }
					})

					// 3.2. Display the versions, i.e., the deployments
					// header
					const h = `${deployPaddLeft}|${deployments.map(d => d.header).join('|')}|`
					const nonFormattedH = `|${deployments.map(d => d.nonFormattedhHeader).join('|')}|`
					const u = deployPaddLeft + collection.seed(nonFormattedH.length).map(() => '=').join('')
					console.log(h) 
					console.log(u) 
					// body
					versions.forEach((v,idx) => console.log(`${deployPaddLeft}|${deployments.map(d => d.items[idx]).join('|')}|`))
					console.log(gray(`${deployPaddLeft}for more info about this service, go to https://console.cloud.google.com/appengine/versions?project=${projectId}&serviceId=${service.id}\n`))
				} else
					console.log(`${deployPaddLeft}No deployments found\n`)
			})
			return 
		})
})


module.exports = {
	service: {
		list: listServices
	},
	deploy
}