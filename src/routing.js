/**
 * Copyright (c) 2017, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const getRouteDetails = route => {
	let wellFormattedRoute = (route.trim().match(/\/$/) ? route.trim() : route.trim() + '/')
	wellFormattedRoute = wellFormattedRoute.match(/^\//) ? wellFormattedRoute : '/' + wellFormattedRoute

	const variables = wellFormattedRoute.match(/{(.*?)}/g) || []
	const variableNames = variables.map(x => x.replace(/^{/, '').replace(/}$/, ''))
	const routeRegex = variables.reduce((a, v) => a.replace(v, '(.*?)'), wellFormattedRoute)
	const rx = new RegExp(routeRegex)

	return {
		name: wellFormattedRoute,
		params: variableNames,
		regex: rx
	}
}

const matchRoute = (reqPath, { params, regex }) => {
	if (!reqPath)
		return null

	let wellFormattedReqPath = (reqPath.trim().match(/\/$/) ? reqPath.trim() : reqPath.trim() + '/').toLowerCase()
	wellFormattedReqPath = wellFormattedReqPath.match(/^\//) ? wellFormattedReqPath : '/' + wellFormattedReqPath

	const match = wellFormattedReqPath.match(regex)

	if (!match)
		return null
	else {
		const beginningBit = match[0]
		if (wellFormattedReqPath.indexOf(beginningBit) != 0)
			return null
		else {
			const parameters = (params || []).reduce((a, p, idx) => {
				a[p] = match[idx + 1]
				return a
			}, {})
			return {
				match: beginningBit,
				route: reqPath,
				parameters
			}
		}
	}
}

module.exports = {
	getRouteDetails,
	matchRoute
}