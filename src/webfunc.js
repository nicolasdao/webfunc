/**
 * Copyright (c) 2017, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
const path = require('path')
const fs = require('fs')
const functions = require('firebase-functions')
const { getRouteDetails, matchRoute } = require('./routing')
const { app, HttpHandler } = require('./handler')

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
				return setResponseHeaders(res, appConfig).then(res => {
					res.status(403).send(`Forbidden - CORS issue. Origin '${origin}' is not allowed.`)
					return res
				})
			}
			if (method != 'head' && method != 'get' && method != 'options' && method != 'post') {
				return setResponseHeaders(res, appConfig).then(res => {
					res.status(403).send(`Forbidden - CORS issue. Method '${method.toUpperCase()}' is not allowed.`)
					return res
				})
			}
		}
		// Check CORS
		
		if (!origins['*'] && Object.keys(origins).length != 0 && !(origin in origins)) {
			return setResponseHeaders(res, appConfig).then(res => {
				res.status(403).send(`Forbidden - CORS issue. Origin '${origin}' is not allowed.`)
				return res
			})
		}
		if (Object.keys(methods).length != 0 && method != 'get' && method != 'head' && !(method in methods)) {
			return setResponseHeaders(res, appConfig).then(res => {
				res.status(403).send(`Forbidden - CORS issue. Method '${method.toUpperCase()}' is not allowed.`)
				return res
			})
		}

		if (method == 'head' || method == 'options')
			return setResponseHeaders(res, appConfig).then(res => res.status(200).send())
	})

/**
 * Returns a function (req, res) => ... that the Google Cloud Function expects.
 * 
 * @param  {function} httpNextRequest 	Callback function (req, res) => ... This gets executed after all the headers checks.
 * @param  {object} appconfig         		Optional configuration file. If it exists, it will override the appconfig.json file.
 * @return {function}                    	(req, res) => ...
 */
//const serveHttp = (httpNextRequest, appconfig) => (req, res) => {
const serveHttp = (arg1, arg2, appconfig) => {
	const appConfigFile = getAppConfig() || {}
	const appConfigArg = appconfig || {}
	let _appconfig = null
	let route = null
	let httpNextRequest = null
	const typeOfArg1 = typeof(arg1 || undefined)
	const typeOfArg2 = typeof(arg2 || undefined)
	
	if (arg1) { 
		if (typeOfArg1 == 'string') {
			route = getRouteDetails(arg1)
			_appconfig = Object.assign(appConfigFile, appConfigArg)
			if (typeOfArg2 == 'function')
				httpNextRequest = arg2
			else
				throw new Error('Wrong argument exception. If the first argument of the \'serveHttp\' method is a route, then the second argument must be a function similar to (req, res, params) => ...')
		}
		else {
			_appconfig = Object.assign(appConfigFile, arg2 || {})
			if (typeOfArg1 == 'function') 
				httpNextRequest = arg1
			else if (arg1.length != undefined)
				return serveHttpEndpoints(arg1, _appconfig)
			else if (typeOfArg1 == 'object')
				return serveHttpEndpoints([arg1], _appconfig)
			else
				throw new Error('Wrong argument exception. If the first argument of the \'serveHttp\' method is not a route, then it must either be a function similar to (req, res, params) => ... or an array of endpoints.')
		}
	}
	else
		throw new Error('Wrong argument exception. The first argument of the \'serveHttp\' method must either be a route, a function similar to (req, res, params) => ... or an array of endpoints.')

	const cloudFunction = (req, res) => {
		let parameters = {}
		if (route) {
			const httpEndpoint = ((req._parsedUrl || {}).pathname || '/').toLowerCase()
			const r = matchRoute(httpEndpoint, route)
			if (!r) {
				return setResponseHeaders(res, _appconfig).then(res => {
					res.status(404).send(`Endpoint '${httpEndpoint}' not found.`)
					return res
				})
			}
			else
				parameters = r.parameters
		}

		return handleHttpRequest(req, res, _appconfig)
			.then(() => !res.headersSent 
				? setResponseHeaders(res, _appconfig).then(res => httpNextRequest(req, res, Object.assign(parameters, getRequestParameters(req)))) 
				: res)
	}
		
	const firebaseHosting = _appconfig.hosting == 'firebase'
	return firebaseHosting ? functions.https.onRequest(cloudFunction) : cloudFunction
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
 * @param  {array} endpoints  	e.g. [{ route: { name: '/user', params: ..., regex: ... }, method: 'GET', httpNext: (req, res, params) => ... }, ...]
 * @param  {object} appconfig 	Optional configuration file. If it exists, it will override the appconfig.json file.
 * @return {function}           (req, res) => ...
 */
const serveHttpEndpoints = (endpoints, appconfig) => {
	if (!endpoints || !endpoints.length)
		throw new Error('No endpoints have been defined.')

	const _appconfig = Object.assign(getAppConfig() || {}, appconfig || {})
	const cloudFunction = (req, res) => handleHttpRequest(req, res, _appconfig)
		.then(() => !res.headersSent 
			? setResponseHeaders(res, _appconfig).then(res => {
				const httpEndpoint = ((req._parsedUrl || {}).pathname || '/').toLowerCase()
				const httpMethod = (req.method || '').toUpperCase()
				const endpoint = httpEndpoint == '/' 
					? endpoints.filter(e => e.route.name == '/' && (e.method == httpMethod || !e.method))[0]
					: (endpoints.map(e => ({ endpoint: e, route: matchRoute(httpEndpoint, e.route) }))
						.filter(e => e.endpoint.route.name != '/' && e.route && (e.endpoint.method == httpMethod || !e.endpoint.method))
						.sort((a, b) => b.route.match.length - a.route.match.length)[0] || {}).endpoint

				if (!endpoint)
					return res.send(404, `Endpoint '${httpEndpoint}' for method ${httpMethod} not found.`)

				const httpNext = endpoint.httpNext || (() => Promise.resolve(null))
				if (typeof(httpNext) != 'function') 
					return res.send(500, `Wrong argument exception. Endpoint '${httpEndpoint}' for method ${httpMethod} defines a 'httpNext' argument that is not a function similar to '(req, res, params) => ...'.`) 

				const parameters = getRequestParameters(req)
				const requestParameters = matchRoute(httpEndpoint, endpoint.route).parameters

				return httpNext(req, res, Object.assign(parameters, requestParameters))
			}) 
			: res)
		
	const firebaseHosting = _appconfig.hosting == 'firebase'
	return firebaseHosting ? functions.https.onRequest(cloudFunction) : cloudFunction
}

module.exports = {
	setResponseHeaders,
	handleHttpRequest,
	serveHttp,
	getAppConfig,
	getActiveEnv,
	app: app(),
	HttpHandler,
	routing: { 
		getRouteDetails,
		matchRoute
	}
}