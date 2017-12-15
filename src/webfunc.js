/**
 * Copyright (c) 2017, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
const path = require('path')
const fs = require('fs')
const { getRouteDetails, matchRoute } = require('./routing')
const { app, HttpHandler } = require('./handler')
require('colors')

/*eslint-disable */
const cwdPath = f => path.join(process.cwd(), f)
const getProcess = () => process
const getProcessEnv = () => process.env || {}
/*eslint-enable */

let _appconfig = null
const getAppConfig = memoize => {
	const skipMemoization = memoize == undefined ? false : !memoize
	if (!skipMemoization || _appconfig == null) {
		const appconfigPath = cwdPath('appconfig.json')
		_appconfig = fs.existsSync(appconfigPath) ? require(appconfigPath) : undefined
		if (!_appconfig) {
			const nowconfigPath = cwdPath('now.json')
			_appconfig = fs.existsSync(nowconfigPath) ? require(nowconfigPath) : undefined
		}
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
	.then(headers => {
		if (!res.set)
			res.set = res.setHeader
		if (!res.send)
			res.send = res.end
		if (!res.status)
			res.status = code => { res.statusCode = code; return res }
		return getHeadersCollection(headers, !appconfig).reduce((response, header) => {
			res.set(header.key, header.value)
			return res 
		}, res)
	})

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
			if (!sameOrigin)
				return setResponseHeaders(res, appConfig).then(res => res.status(403).send(`Forbidden - CORS issue. Origin '${origin}' is not allowed.`))

			if (method != 'head' && method != 'get' && method != 'options' && method != 'post') 
				return setResponseHeaders(res, appConfig).then(res => res.status(403).send(`Forbidden - CORS issue. Method '${method.toUpperCase()}' is not allowed.`))
		}
		// Check CORS
		
		if (!origins['*'] && Object.keys(origins).length != 0 && !(origin in origins)) 
			return setResponseHeaders(res, appConfig).then(res => res.status(403).send(`Forbidden - CORS issue. Origin '${origin}' is not allowed.`))

		if (Object.keys(methods).length != 0 && method != 'get' && method != 'head' && !(method in methods)) 
			return setResponseHeaders(res, appConfig).then(res => res.status(403).send(`Forbidden - CORS issue. Method '${method.toUpperCase()}' is not allowed.`))

		if (method == 'head' || method == 'options')
			return setResponseHeaders(res, appConfig).then(res => res.status(200).send())
	})
	.then(() => ({ req, res }))

const getPreProcessFn = ({ preProcess }) => {
	const fn = preProcess || (() => null)
	return (req, res, ctx) => {
		try {
			return Promise.resolve(fn(req, res, ctx))
		}
		catch(err) {
			return Promise.resolve(null).then(() => { throw err }) 
		}
	}
}

const getPostProcessFn = ({ postProcess }) => {
	const fn = postProcess || (() => null)
	return (req, res, ctx) => {
		try {
			return Promise.resolve(fn(req, res, ctx))
		}
		catch(err) {
			return Promise.resolve(null).then(() => { throw err }) 
		}
	}
}

/**
 * Returns a function (req, res) => ... that the Google Cloud Function expects.
 * 
 * @param  {String|Function|Array|Object} 	arg1 	Here what it means based on its type:
 *                                               	- String: Route path (e.g. '/users/:userId/account')
 *                                               	- Function: Callback function (req, res) => ... This gets executed after all the headers checks.
 *                                               	- Array: 
 *                                               		- Array of endpoints (e.g. [app.get('/users', (req, res, params) => ...), app.post('/stories', (req, res, params) => ...)])
 *                                               		- Array of strings of routes (e.g. ['/users/:userId/account', '/users/:userId/portfolio'])
 *                                               	- Object: Endpoint (e.g. app.get('/users', (req, res, params) => ...))
 * @param  {Function|Object} 				arg2 	Here what it means based on its type:
 *                                     				- Function: Callback function (req, res) => ... This gets executed after all the headers checks.
 *                                     				- Object: appconfig. If it exists, it will override the appconfig.json file.
 * @param  {object} 						arg3 	appconfig. If it exists, it will override the appconfig.json file.
 * @return {function}                    	(req, res) => ...
 */
const serveHttp = (arg1, arg2, arg3) => {
	const appConfigFile = getAppConfig() || {}
	const appConfigArg = arg3 || {}
	let _appconfig = null
	let routes = null
	let httpNextRequest = null
	const typeOfArg1 = typeof(arg1 || undefined)
	const typeOfArg2 = typeof(arg2 || undefined)
	
	if (arg1) { 
		if (typeOfArg1 == 'string') {
			routes = getRouteDetails(arg1)
			_appconfig = Object.assign(appConfigFile, appConfigArg)
			if (typeOfArg2 == 'function')
				httpNextRequest = arg2
			else
				throw new Error('Wrong argument exception. If the first argument of the \'serveHttp\' or \'serve\' method is a route, then the second argument must be a function similar to (req, res, params) => ...')
		}
		else {
			_appconfig = Object.assign(appConfigFile, arg2 || {})
			// 1. arg1 is a function (req, res) => ...
			if (typeOfArg1 == 'function') 
				httpNextRequest = arg1
			// 2. arg1 is an Array
			else if (arg1.length != undefined && arg1.length > 0) {
				// 2.1. arg1 is an array of routes
				if (typeof(arg1[0]) == 'string') {
					routes = getRouteDetails(arg1)
					if (typeOfArg2 == 'function')
						httpNextRequest = arg2
					else
						throw new Error('Wrong argument exception. If the first argument of the \'serveHttp\' or \'serve\' method is a route, then the second argument must be a function similar to (req, res, params) => ...')
				}
				// 2.2. arg1 is an array of endpoints
				else
					return serveHttpEndpoints(arg1, _appconfig)
			}
			// 3. arg1 is an endpoint object
			else if (typeOfArg1 == 'object')
				return serveHttpEndpoints([arg1], _appconfig)
			else
				throw new Error('Wrong argument exception. If the first argument of the \'serveHttp\' or \'serve\' method is not a route, then it must either be a function similar to (req, res, params) => ... or an array of endpoints.')
		}
	}
	else
		throw new Error('Wrong argument exception. The first argument of the \'serveHttp\' or \'serve\' method must either be a route, a function similar to (req, res, params) => ... or an array of endpoints.')

	const preProcess = getPreProcessFn(_appconfig || {})
	const postProcess = getPostProcessFn(_appconfig || {})

	const cloudFunction = (req, res) => {
		const start = Date.now()
		req.__transactionId = Date.now()
		// 1. Pre process request
		return preProcess(req, res)
		// 2. Capture pre processing errors
			.catch(err => {
				console.log('dewdewdwedewdewdwedewdewdwededdewd')
				try {
					return setResponseHeaders(res, _appconfig).then(res => {
						console.log('GETTINNG THEEERRR')
						res.status(500).send(`Internal Server Error - Pre Processing error: ${err.message}`)
						return { req, res, __err: err }
					})
				}
				catch (err) {
					console.log('FUCKKKKKKKKKKKKK')
					return { req, res, __err: err }
				}
			})
		// 3. Process request
			.then((ctx={}) => {
				if (ctx && ctx.__err)
					return { req, res, __err: ctx.__err }
				else {
					let parameters = {}
					if (routes) {
						const httpEndpoint = ((req._parsedUrl || {}).pathname || '/').toLowerCase()
						const r = (routes.map(route => matchRoute(httpEndpoint, route)).filter(route => route) || [])[0]
						if (!r) {
							return setResponseHeaders(res, _appconfig).then(res => {
								res.status(404).send(`Endpoint '${httpEndpoint}' not found.`)
								return { req, res, ctx }
							})
						}
						else
							parameters = r.parameters
					}

					return handleHttpRequest(req, res, _appconfig)
						.then(() => !res.headersSent 
							? setResponseHeaders(res, _appconfig).then(res => httpNextRequest(req, res, Object.assign(parameters, getRequestParameters(req)))) 
							: res)
						.then(() => ({ req, res, ctx }))
				}
			})
		// 4. Capture processing errors
			.catch(err => {
				try {
					return setResponseHeaders(res, _appconfig).then(res => {
						res.status(500).send(`Internal Server Error: ${err.message}`)
						return { req, res, __err: err }
					})
				}
				catch (err) {
					return { req, res, __err: err }
				}
			})
		// 5. Post processing 
			.then(({ req, res, ctx }) => {
				if (!ctx)
					ctx = {}
				ctx.__ellapsedMillis = Date.now() - start
				return postProcess(req, res, ctx)
				// 6. Capture post processing errors
					.catch(err => {
						try {
							return setResponseHeaders(res, _appconfig).then(res => {
								res.status(500).send(`Internal Server Error - Post Processing error: ${err.message}`)
								return { req, res }
							})
						}
						catch (err) {
							return { req, res }
						}
					})
					.then(() => ({ req, res }))
			})
	}
		
	return cloudFunction
}

const _supportedHostings = { 'now': true, 'sh': true, 'localhost': true, 'express': true, 'gcp': true, 'aws': true }
const listen = (functionName, port) => {
	const _appconfig = getAppConfig() || {}

	const envName = !_appconfig ? 'default' : ((_appconfig.env || {}).active || 'default')
	const env = ((_appconfig || {}).env || {})[envName] || {}
	const hostingType = env.hostingType || 'localhost'
	if (!_supportedHostings[hostingType.toLowerCase()])
		throw new Error(`Unsupported hosting type '${hostingType}'`)

	const hostCategory = !hostingType || hostingType == 'localhost' || hostingType == 'now' ? 'express' : hostingType

	switch(hostCategory) {
	case 'express': {
		const expressConfig = ((_appconfig || {}).localhost || {})
		const explicitPort = (expressConfig.port || getProcessEnv().PORT) * 1
		if (!port)
			port = explicitPort || 3000
		const notLocal = hostingType != 'localhost'
		const startMessage = notLocal
			? `Ready to receive traffic${explicitPort ? ` on port ${explicitPort}` : ''}`
			: `Ready to receive traffic on ${`http://localhost:${port}`.bold.italic}`.cyan
		const secondMsg = notLocal ? '' : 'Press Ctrl+C to stop the server'.cyan
		return `
				const __express__ = require('express')
				const __server__ = __express__()
				__server__.all('*', ${functionName})
				__server__.listen(${port}, () => { console.log("${startMessage}"); ${secondMsg ? `console.log("${secondMsg}")` : ''}})
				`
	}
	case 'gcp':
		return `exports.handler = ${functionName}`
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

const getLongestRoute = (routes=[]) => routes.sort((a,b) => b.match.length - a.match.length)[0]

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

	const preProcess = getPreProcessFn(_appconfig || {})
	const postProcess = getPostProcessFn(_appconfig || {})

	const cloudFunction = (req, res) => {
		const start = Date.now()
		req.__transactionId = Date.now()
		// 1. Pre process request
		return preProcess(req, res)
		// 2. Capture pre processing errors
			.catch(err => {
				try {
					return setResponseHeaders(res, _appconfig).then(res => {
						res.status(500).send(`Internal Server Error - Pre Processing error: ${err.message}`)
						return { req, res, __err: err }
					})
				}
				catch (err) {
					return { req, res, __err: err }
				}
			})
		// 3. Process request
			.then((ctx={}) => {
				if (ctx && ctx.__err)
					return { req, res, __err: ctx.__err }
				else
					return handleHttpRequest(req, res, _appconfig)
						.then(() => !res.headersSent 
							? setResponseHeaders(res, _appconfig).then(res => {
								const httpEndpoint = ((req._parsedUrl || {}).pathname || '/').toLowerCase()
								const httpMethod = (req.method || '').toUpperCase()
								const endpoint = httpEndpoint == '/' 
									? endpoints.filter(e => e.route.some(x => x.name == '/') && (e.method == httpMethod || !e.method))
										.map(e => ({ route: e.route, winningRoute: e.route.filter(x => x.name == '/')[0], next: e.next, method: e.method }))[0]
									: (endpoints.map(e => ({ endpoint: e, route: e.route.map(r => matchRoute(httpEndpoint, r)).filter(r => r) }))
										.filter(e => e.route.length > 0 && (e.endpoint.method == httpMethod || !e.endpoint.method))
										.map(e => {
											const winningRoute = getLongestRoute(e.route)
											e.endpoint.winningRoute = winningRoute
											return { endpoint: e.endpoint, winningRoute: winningRoute }
										})
										.sort((a, b) => b.winningRoute.match.length - a.winningRoute.match.length)[0] || {}).endpoint

								if (!endpoint) 
									return res.status(404).send(`Endpoint '${httpEndpoint}' for method ${httpMethod} not found.`)
						
								const next = endpoint.next || (() => Promise.resolve(null))
								if (typeof(next) != 'function') 
									return res.status(500).send(`Wrong argument exception. Endpoint '${httpEndpoint}' for method ${httpMethod} defines a 'next' argument that is not a function similar to '(req, res, params) => ...'.`) 

								const parameters = getRequestParameters(req)

								return next(req, res, Object.assign(parameters, endpoint.winningRoute.parameters))
							}) 
							: res)
						.then(() => ({ req, res, ctx }))
			})
		// 4. Capture processing errors
			.catch(err => {
				try {
					return setResponseHeaders(res, _appconfig).then(res => {
						res.status(500).send(`Internal Server Error: ${err.message}`)
						return { req, res, __err: err }
					})
				}
				catch (err) {
					return { req, res, __err: err }
				}
			})
		// 5. Post processing request
			.then(({ req, res, ctx }) => {
				if (!ctx)
					ctx = {}
				ctx.__ellapsedMillis = Date.now() - start
				return postProcess(req, res, ctx)
				// 6. Capture post processing errors
					.catch(err => {
						try {
							return setResponseHeaders(res, _appconfig).then(res => {
								res.status(500).send(`Internal Server Error - Post Processing error: ${err.message}`)
								return { req, res }
							})
						}
						catch (err) {
							return { req, res }
						}
					})
					.then(() => ({ req, res }))
			})
	}
		
	return cloudFunction
}

const serve = serveHttp

module.exports = {
	setResponseHeaders,
	handleHttpRequest,
	serve,
	serveHttp,
	listen,
	getAppConfig,
	getActiveEnv,
	app: app(),
	HttpHandler,
	routing: { 
		getRouteDetails,
		matchRoute
	}
}