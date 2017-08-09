/**
 * Copyright (c) 2017, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
const path = require('path')
const fs = require('fs')
const httpError = require('http-errors')
const functions = require('firebase-functions')

let _appconfig = null
const getAppConfig = memoize => {
	const skipMemoization = memoize == undefined ? false : !memoize
	if (!skipMemoization || _appconfig == null) {
		/*eslint-disable */
		const appconfigPath = path.join(process.cwd(), 'appconfig.json')
		/*eslint-enable */
		_appconfig = fs.existsSync(appconfigPath) ? require(appconfigPath) : undefined
	}
	return _appconfig
}

const getActiveEnv = memoize => {
	const appconfig = getAppConfig(memoize)
	const activeEnv = ((appconfig || {}).env || {}).active
	if (activeEnv) 
		return Object.assign((appconfig.env[activeEnv] || {}), { _name: activeEnv })
	else
		return null
}

let headersCollection = null
const getHeadersCollection = (headers = {}, memoize) => {
	if (!memoize || headersCollection == null) {
		headersCollection = []
		for (let key in headers)
			headersCollection.push({ key, value: headers[key] })
	}
	return headersCollection
}

let allowedOrigins = null
const getAllowedOrigins = (headers = {}, memoize) => {
	if (!memoize || allowedOrigins == null) {
		allowedOrigins = (headers['Access-Control-Allow-Origin'] || '').split(',')
			.reduce((a, s) => { 
				if (s)
					a[s.trim().toLowerCase().replace(/\/$/,'')] = true 
				return a 
			}, {})
	}
	return allowedOrigins
}  

let allowedMethods = null
const getAllowedMethods = (headers = {}, memoize) => {
	if (!memoize || allowedMethods == null) {
		allowedMethods = (headers['Access-Control-Allow-Methods'] || '').split(',')
			.reduce((a, s) => { 
				if (s)
					a[s.trim().toLowerCase()] = true 
				return a 
			}, {})
	}
	return allowedMethods
}  

const setResponseHeaders = (res, appconfig) => Promise.resolve((appconfig || getAppConfig() || {}).headers)
	.then(headers => getHeadersCollection(headers, !appconfig).reduce((response, header) => res.set(header.key, header.value), res))

const handleHttpRequest = (req, res, appconfig) => Promise.resolve(appconfig || getAppConfig() || {})
	.then(appConfig => {
		const headers = appConfig.headers
		const noConfig = !appConfig.headers && !appConfig.env
		const memoize = !appconfig
		const origins = getAllowedOrigins(headers, memoize)
		const methods = getAllowedMethods(headers, memoize)
		const origin = new String(req.headers.origin).toLowerCase()
		const referer = new String(req.headers.referer).toLowerCase()
		const method = new String(req.method).toLowerCase()
		const sameOrigin = referer.indexOf(origin) == 0

		if (noConfig) {
			if (!sameOrigin) {
				setResponseHeaders(res, appConfig)
				throw httpError(403, `Forbidden - CORS issue. Origin '${origin}' is not allowed.`)
			}
			if (method != 'head' && method != 'get' && method != 'options' && method != 'post') {
				setResponseHeaders(res, appConfig)
				throw httpError(403, `Forbidden - CORS issue. Method '${method.toUpperCase()}' is not allowed.`)
			}
		}
		// Check CORS
		
		if (!origins['*'] && Object.keys(origins).length != 0 && !(origin in origins)) {
			setResponseHeaders(res, appConfig)
			throw httpError(403, `Forbidden - CORS issue. Origin '${origin}' is not allowed.`)
		}
		if (Object.keys(methods).length != 0 && method != 'get' && method != 'head' && !(method in methods)) {
			setResponseHeaders(res, appConfig)
			throw httpError(403, `Forbidden - CORS issue. Method '${method.toUpperCase()}' is not allowed.`)
		}

		if (method == 'head' || method == 'options')
			return setResponseHeaders(res, appConfig).then(res => res.status(200).send())
	})

/**
 * Returns a function (req, res) => ... that the Google Cloud Function expects.
 * 
 * @param  {function} processHttpRequest 	Callback function (req, res) => ... This gets executed after all the headers checks.
 * @param  {object} appconfig         		Optional configuration file. If it exists, it will override the appconfig.json file.
 * @return {function}                    	(req, res) => ...
 */
//const serveHttp = (processHttpRequest, appconfig) => (req, res) => {
const serveHttp = (arg1, appconfig) => {
	let processHttpRequest = null
	const typeOfArg1 = typeof(arg1)
	
	if (arg1) { 
		if (typeOfArg1 == 'function')
			processHttpRequest = arg1
		else if (arg1.length != undefined)
			return serveHttpEndpoints(arg1, appconfig)
		else if (typeOfArg1 == 'object')
			return serveHttpEndpoints([arg1], appconfig)
		else
			throw httpError(500, 'Wrong argument exception. The first argument of method \'serveHttp\' must either be a function or an array of endpoints.')
	}
	else
		throw httpError(500, 'Wrong argument exception. The first argument of method \'serveHttp\' must either be a function or an array of endpoints.')

	const cloudFunction = (req, res) => handleHttpRequest(req, res, appconfig)
		.then(() => !res.headersSent 
			? setResponseHeaders(res, appconfig).then(res => processHttpRequest(req, res, getRequestParameters(req))) 
			: res)
		
	const firebaseHosting = (appconfig || getAppConfig() || {}).hosting == 'firebase'
	return firebaseHosting ? functions.https.onRequest(cloudFunction) : cloudFunction
}

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

const getRequestParameters = req => {
	let bodyParameters = {}
	if (req.body) {
		const bodyType = typeof(req.body)
		if (bodyType == 'object')
			bodyParameters = req.body
		else if (bodyType == 'string') {
			try {
				bodyParameters = JSON.parse(req.body)
			}
			catch(err) {
				bodyParameters = {}
				console.log(err)
			}
		}
	}
	const parameters = Object.assign((bodyParameters || {}), req.query || {})

	return parameters
}

/**
 * Returns a function (req, res) => ... that the Google Cloud Function expects.
 * 
 * @param  {array} endpoints  	e.g. [{ route: { name: '/user', params: ..., regex: ... }, method: 'GET', processHttp: (req, res, params) => ... }, ...]
 * @param  {object} appconfig 	Optional configuration file. If it exists, it will override the appconfig.json file.
 * @return {function}           (req, res) => ...
 */
const serveHttpEndpoints = (endpoints, appconfig) => {
	const cloudFunction = (req, res) => handleHttpRequest(req, res, appconfig)
		.then(() => !res.headersSent 
			? setResponseHeaders(res, appconfig).then(res => {
				if (!endpoints || !endpoints.length)
					throw new httpError(500, 'No endpoints have been defined.')

				const httpEndpoint = ((req._parsedUrl || {}).pathname || '/').toLowerCase()
				const httpMethod = req.method 
				const endpoint = httpEndpoint == '/' 
					? endpoints.filter(e => e.route.name == '/' && e.method == httpMethod)[0]
					: (endpoints.map(e => ({ endpoint: e, route: matchRoute(httpEndpoint, e.route) }))
						.filter(e => e.endpoint.route.name != '/' && e.route && e.endpoint.method == httpMethod)
						.sort((a, b) => b.route.match.length - a.route.match.length)[0] || {}).endpoint

				if (!endpoint)
					return res.send(404, `Endpoint '${httpEndpoint}' for method ${httpMethod} not found.`)

				if (!endpoint.processHttp || typeof(endpoint.processHttp) != 'function') 
					return res.send(500, `Endpoint '${httpEndpoint}' for method ${httpMethod} does not define any 'processHttp(req, res)' function.`) 

				const parameters = getRequestParameters(req)
				const requestParameters = matchRoute(httpEndpoint, endpoint.route).parameters

				return endpoint.processHttp(req, res, Object.assign(parameters, requestParameters))
			}) 
			: res)
		
	const firebaseHosting = (appconfig || getAppConfig() || {}).hosting == 'firebase'
	return firebaseHosting ? functions.https.onRequest(cloudFunction) : cloudFunction
}

const app = {
	get: (route, processHttp) => ({ route: getRouteDetails(route), method: 'GET', processHttp }),
	post: (route, processHttp) => ({ route: getRouteDetails(route), method: 'POST', processHttp }),
	put: (route, processHttp) => ({ route: getRouteDetails(route), method: 'PUT', processHttp }),
	delete: (route, processHttp) => ({ route: getRouteDetails(route), method: 'DELETE', processHttp }),
	head: (route, processHttp) => ({ route: getRouteDetails(route), method: 'HEAD', processHttp }),
	options: (route, processHttp) => ({ route: getRouteDetails(route), method: 'OPTIONS', processHttp })
}

module.exports = {
	setResponseHeaders,
	handleHttpRequest,
	serveHttp,
	getAppConfig,
	getActiveEnv,
	app,
	routing: { 
		getRouteDetails,
		matchRoute
	}
}