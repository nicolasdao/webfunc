/**
 * Copyright (c) 2018, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
const fs = require('fs')
const shortid = require('shortid')
const path = require('path')
const { getRouteDetails, matchRoute } = require('./routing')
const { reqUtil } = require('./utils')
const { cors } = require('./cors')
require('colors')

/*eslint-disable */
const cwdPath = f => path.join(process.cwd(), f)
/*eslint-enable */

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////// 							START - INITIALIZE APP 							  ////////////////////////

// This will get the configuration from the 'now.json' to configure the app
const CONFIGPATH = cwdPath('now.json')
const HOSTINGS = { 'now': true, 'sh': true, 'localhost': true, 'express': true, 'gcp': true, 'aws': true }
const PARAMSMODE = { 'all': true, 'body': true, 'route': true, 'none': true }
const getAppConfig = () => fs.existsSync(CONFIGPATH) ? require(CONFIGPATH) : {}

let _config = getAppConfig() // Object
let _onSend = null // Supposed to be a function similar to (req, res) => ...
let _onStatus = null // Supposed to be a function similar to (req, res) => ...
let _onHeaders = null // Supposed to be a function similar to (req, res) => ...
let _onReceived = null // Supposed to be a function similar to (req, res) => ...
let _preEvent = () => Promise.resolve(null)
let _postEvent = () => Promise.resolve(null)

//////////////////////// 							END - INITIALIZE APP 							  ////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const getActiveEnv = () => ((_config || {}).environment || {}).active || 'default'
const getEnv = () => ((_config || {}).environment || {})[getActiveEnv()] || {}
const getHostingType = () => getEnv().hostingType || 'localhost'

/**
 * Converts a function similar to (req, res) => ... or (req, res, next) => ... to a promise similar to (req, res) => ...
 * 
 * @param  {Function} fn 	(req, res) => ... or (req, res, next) => ...
 * @return {Promise}     	(req, res) => ...
 */
const fnToPromise = fn => (req, res) => new Promise((onSuccess, onFailure) => {
	try {
		if (fn.length < 3)
			Promise.resolve(fn(req, res))
				.then(() => onSuccess())
				.catch(err => {
					onFailure(err)
				})
		else
			fn(req, res, onSuccess)
	}
	catch(err) {
		onFailure(err)
	}
})

const executeHandlers = (req, res, handlers=[]) => 
	handlers.reduce(
		(acc, handler) => acc.then(() => !res.headersSent ? handler(req, res) : null), 
		Promise.resolve(null))

const resetConfig = (config={}) => {
	_config = config
}

let _handlers = []
let _endpoints = []
const app = {
	use: handlerOrConfig => {
		if (!handlerOrConfig)
			throw new Error('Missing required argument. The \'use\' function requires one argument.')
		const inputType = typeof(handlerOrConfig)
		if (inputType == 'function')
			_handlers.push(fnToPromise(handlerOrConfig))
		else if (inputType == 'object')
			resetConfig(Object.assign(_config, handlerOrConfig))
		else
			throw new Error('Wrong argument exception. The input of the \'use\' function must either be a handler function (e.g. (req, res, next) => ...) or a config object.')
	},
	reset: () => {
		_handlers = []
		_endpoints = []
		resetConfig(getAppConfig())
		_preEvent = () => Promise.resolve(null)
		_postEvent = () => Promise.resolve(null)
		_onStatus = null
		_onSend = null
		_onHeaders = null
		_onReceived = null
	},
	get: (...args) => createEndpoint(args, 'GET'),
	post: (...args) => createEndpoint(args, 'POST'),
	put: (...args) => createEndpoint(args, 'PUT'),
	delete: (...args) => createEndpoint(args, 'DELETE'),
	head: (...args) => createEndpoint(args, 'HEAD'),
	options: (...args) => createEndpoint(args, 'OPTIONS'),
	all: (...args) => createEndpoint(args, null),
	on: (eventName, fn) => {
		if (!fn || typeof(fn) != 'function')
			throw new Error('Wrong argument exception. The second argument of the \'on\' method must exist and must be a function.')
		switch (eventName) {
		case 'send':
			_onSend = fn
			return 
		case 'status':
			_onStatus = fn
			return 	
		case 'headers':
			_onHeaders = fn
			return 	
		case 'received':
			_onReceived = fn
			return 	
		default:
			throw new Error(`Wrong argument exception. Value '${eventName}'' of the 'eventName' argument of the 'on' method is not supported.`)
		} 
	},
	get preEvent() {
		return _preEvent || (() => Promise.resolve(null))
	},
	set preEvent(fn) {
		if (!fn)
			_preEvent = () => Promise.resolve(null)
		else {
			if (typeof(fn) != 'function')
				throw new Error('Wrong argument exception. A \'preEvent\' must be a function')
			_preEvent = (req, res) => Promise.resolve(null).then(() => fn(req, res))
		}
	},
	get postEvent() {
		return _postEvent || (() => Promise.resolve(null))
	},
	set postEvent(fn) {
		if (!fn)
			_postEvent = () => Promise.resolve(null)
		else {
			if (typeof(fn) != 'function')
				throw new Error('Wrong argument exception. A \'preEvent\' must be a function')
			_postEvent = (req, res) => Promise.resolve(null).then(() => fn(req, res))
		}
	},
	handleEvent: () => (req, res) => processEvent(req, res, _config, _endpoints, _handlers, _preEvent, _postEvent),
	listen: (appName, port) => {
		const input = createListenArity(appName, port, 3000)
		const hostingType = getHostingType()
		if (!HOSTINGS[hostingType.toLowerCase()])
			throw new Error(`Unsupported hosting type '${hostingType}'`)

		let hostCategory = !hostingType || hostingType == 'localhost' || hostingType == 'now' ? 'express' : hostingType
		const notLocal = hostingType != 'localhost'
		const startMessage = notLocal
			? `Ready to receive traffic${!notLocal ? ` on port ${input.port}` : ''}`
			: `Ready to receive traffic on ${`http://localhost:${input.port}`.bold.italic}`.cyan
		const secondMsg = notLocal ? '' : 'Press Ctrl+C to stop the server'.cyan

		// Determine what GCP category is setup
		if (hostCategory == 'gcp') {
			const activeEnv = getEnv()
			if (activeEnv.gcp && activeEnv.gcp.trigger && activeEnv.gcp.trigger.type && activeEnv.gcp.trigger.type != 'https')
				hostCategory = 'gcp_event'
		}

		// Normal Express Server Setup
		if (!input.appName) {
			const __express__ = require('express')
			const __server__ = __express__()
			__server__.all('*', (req, res) => processEvent(req, res, _config, _endpoints, _handlers, _preEvent, _postEvent))
			__server__.listen(input.port, () => { 
				console.log(startMessage)
				if (secondMsg)
					console.log(secondMsg)
			})
		}
		// Universal Serverless Setup
		else {
			switch(hostCategory) {
			case 'express': 
				return `
					const __express__ = require('express')
					const __server__ = __express__()
					__server__.all('*', ${input.appName}.handleEvent())
					__server__.listen(${input.port}, () => { console.log("${startMessage}"); ${secondMsg ? `console.log("${secondMsg}")` : ''}})
					`
			case 'gcp':
				return `exports.handler = ${input.appName}.handleEvent()`
			case 'gcp_event':
				return `
					exports.handler = (event, next) => {	
						const { req, res } = ${input.appName}.createGCPRequestResponse(event)
						${input.appName}.handleEvent()(req, res).then(() => next())
					}`
			case 'aws':
				return `
					exports.handler = (event, context, next) => {	
						const { req, res } = ${input.appName}.createAWSRequestResponse(event)
						${input.appName}.handleEvent()(req, res)
						.then(() => {
							const awsRes = ${input.appName}.createAWSResponse(res)
							next(null, awsRes)
						})
						.catch(err => {
							next(err, null)
						})
					}`
			default:
				throw new Error(`Unsupported hosting type '${hostCategory}'`)
			}
		}
	},
	createGCPRequestResponse: event => reqUtil.createGCPRequestResponse(event, ((_config || {}).params || {}).propName || 'params'),
	createAWSRequestResponse: event => reqUtil.createAWSRequestResponse(event, ((_config || {}).params || {}).propName || 'params'),
	createAWSResponse: reqUtil.createAWSResponse
}

/**
 * Gets the signature of the app.listen method. Supported arities are:
 * - (appName, port)
 * - (appName)
 * - (port)
 * - ()
 *
 * where:
 * - appName	is a string representing the app server (most likely 'app')
 * - port 		is a number describing the port where the server is listening 
 * 				to if the hosting platform is express. For FaaS, this variable 
 * 				is irrelevant.
 * 
 * @param  {String|Number} 	arg1 		Could either be appName or port
 * @param  {Number} 		arg2 		Could only be port
 * @param  {Number} 		defaultPort 
 * @return {Object}      	{ appName: ..., port: ... }
 */
const createListenArity = (arg1, arg2, defaultPort=3000) => {
	// Case 1: 2 Arguments 
	if (arg1 != undefined && arg2 != undefined) {
		if (typeof(arg1) != 'string')
			throw new Error('Wrong argument exception. When 2 arguments are passed to \'listen\', the first one must be a string.')
		if (typeof(arg2) != 'number')
			throw new Error('Wrong argument exception. When 2 arguments are passed to \'listen\', the second one must be a number.')
		return { appName: arg1, port: arg2 }
	}
	// Case 2: 1 Argument
	else if (arg1 != undefined) {
		const arg1Type = typeof(arg1)
		if (arg1Type == 'string')
			return { appName: arg1, port: defaultPort }
		else if (arg1Type == 'number')
			return { appName: null, port: arg1 }
		else
			throw new Error('Wrong argument exception. When a single argument is passed to \'listen\', it must either be a string or a number.')
	}
	else
		return { appName: null, port: defaultPort }
}

/**
 * Gets the signature for method 'createEndpoint'. Supported arities are:
 * - (path, handler, next)
 * - (path, next)
 * - (handler, next)
 * - (next)
 *
 * where:
 * - path 		is either a string or an array of strings.
 * - handler 	is a function similar to (req, res, next, params) => ... 
 * 				where next is a function, and params is an object containing all the 
 * 				req parameters from the both the query string and the body.
 * - next 		is a function similar to (req, res, params) => ...
 * 				where params is an object containing all the 
 * 				req parameters from the both the query string and the body.
 * 				
 * @param  {String|Array|Function} 	arg1 	Required argument that can either be 'path', 'handler' or 'next'
 * @param  {Function} 				arg2 	Optional argument that can either be handler' or 'next'
 * @param  {Function} 				arg3 	Optional argument 'next'
 * @return {Object}      					{ path:..., handler:..., next:... }
 */

/**
 * Creates an endpoint
 * @param  {String|[String]}   	path    Requires. Path or path array.
 * @param  {Function}   		handler Optinonal. Middleware handler function similar to (req, res, next, params) => ...
 * @param  {Function} 			next    Request/Response processing function similar to (req, res, params) => ...
 * @param  {String}   			verb    Http verb
 */
const createEndpoint = (args, verb) => {
	const httpVerb = `HTTP ${verb || 'ALL'}`
	if (!args || !args.length)
		throw new Error(`Missing required argument. Impossible to create an ${httpVerb} endpoint without any argument. Pass at least one function similar to (req, res) => ...`)

	const firstArgument = args[0]
	const firstArgType = typeof(firstArgument)
	const firstArgIsArray = firstArgType == 'object' && firstArgument.length != undefined
	// Case 1 - Single arguments. It must be a function
	if (args.length == 1) {
		if (firstArgType != 'function' && firstArgType != 'string' && !firstArgIsArray)
			throw new Error(`Wrong argument exception. When only one argument is passed to an ${httpVerb} endpoint, then that argument must be either be a string (endpoint path), an array of strings (collection of endpoint path) or a function similar to (req, res) => ...`)

		if (firstArgIsArray && firstArgument.some(x => typeof(x) != 'string'))
			throw new Error(`Wrong argument exception. When the first argument passed to create an ${httpVerb} endpoint is an array, that array must be made of string only.`)

		_endpoints.push({ 
			routes: getRouteDetails(firstArgType == 'function' ? '/' : firstArgument), 
			method: verb, 
			execute: (req, res) => executeHandlers(req, res, [fnToPromise(firstArgType != 'string' ? firstArgument : () => null)])
		})
	}
	// Case 2 - Two or more arguments. Unless the first argument is a path ('string'), then they should all be functions
	else {
		const firstArgType = typeof(firstArgument)
		const firstArgIsArray = firstArgType == 'object' && firstArgument.length != undefined
		let p, handlerFns, idxOffset
		if (firstArgType == 'string' || firstArgIsArray) {
			[p, ...handlerFns] = args
			idxOffset = 2

			if (firstArgIsArray && firstArgument.some(x => typeof(x) != 'string'))
				throw new Error(`Wrong argument exception. When the first argument passed to create an ${httpVerb} endpoint is an array, that array must be made of string only.`)
		}
		else {
			p = '/'
			handlerFns = args
			idxOffset = 1
		}

		const lastHandlerIdx = handlerFns.length - 1
		const handlers = handlerFns.map((h,idx) => {
			if (typeof(h) != 'function')
				throw new Error(`Wrong argument exception. The ${idx + idxOffset}th argument passed to the ${httpVerb} endpoint must be a function.`)

			if (h.length < 3 && idx < lastHandlerIdx)
				throw new Error(`Wrong argument exception. The ${idx + idxOffset}th argument passed to the ${httpVerb} endpoint is considered a middleware (as it is not the last argument) and must therefore be a 3 arguments function similar to (req, res, next) => ...`)

			return fnToPromise(h)
		})

		_endpoints.push({ 
			routes: getRouteDetails(p), 
			method: verb, 
			execute: (req, res) => executeHandlers(req, res, handlers)
		})
	}
}

const getLongestRoute = (routes=[]) => routes.sort((a,b) => b.match.length - a.match.length)[0]

const matchEndpoint = (pathname, httpMethod, endpoints=[]) => (
	endpoints.map(e => ({ endpoint: e, routes: e.routes.map(r => matchRoute(pathname, r)).filter(r => r) }))
		.filter(e => e.routes.length > 0 && (e.endpoint.method == httpMethod || !e.endpoint.method))
		.map(e => {
			const winningRoute = getLongestRoute(e.routes)
			e.endpoint.winningRoute = winningRoute
			return { endpoint: e.endpoint, winningRoute: winningRoute }
		})
		.sort((a, b) => b.winningRoute.match.length - a.winningRoute.match.length)[0] || {}
).endpoint

const debug = (config={}, ...args) => {
	if (config.debug)
		console.log(...args)
}
const processEvent = (req, res, config={}, endpoints=[], handlers=[], preEvent, postEvent) => Promise.resolve(null).then(() => {
	debug(config, '- Adding new properties and functionalities on both the \'req\' and \'res\' objects.')
	// 0. Adding new properties and functionalities on both the 'req' and 'res' objects.
	req.__receivedTime = Date.now()
	req.__transactionId = shortid.generate().replace(/-/g, 'r').replace(/_/g, '9')
	req.__ellapsedMillis = () => Date.now() - req.__receivedTime
	extendResponse(req, res)

	if (_onReceived) {
		debug(config, '- Executing the \'on.received\' handler.')
		_onReceived(req, res)
	}

	let { propName:paramsPropName='params', mode:paramsMode=null } = config.params || {}
	// Ensure backward compatibility with version 0.12.1-alpha.0
	if (config.paramsMode && !paramsMode)
		paramsMode = config.paramsMode

	if (!req[paramsPropName] || typeof(req[paramsPropName]) != 'object')
		req[paramsPropName] = {}

	if (!preEvent)
		preEvent = () => Promise.resolve(null)
	if (!postEvent)
		postEvent = () => Promise.resolve(null)

	let _preEventErr, _processErr

	debug(config, '- Start pre-processing the request.')
	// 1. Run pre-event processing
	return preEvent(req, res)
		.catch(err => {
			console.error('Error in pre-event processing')
			console.error(err)
			try { res.status(500).send(`Internal Server Error - Pre Processing error: ${err.message}`) } catch(e) { console.error(e.message) } 
			_preEventErr = err
		})
		// 2. Run the main request/response processing 
		.then(() => {
			debug(config, '- Start processing the request.')
			if (!res.headersSent && !_preEventErr) {
				// 3.1. Stop if this is a HEAD or OPTIONS request
				const method = new String(req.method || 'GET').toLowerCase()
				if (method == 'head') 
					return res.status(200).send()

				// 3.2. Validate the request and make sure that there is an endpoint for it.
				const pathname = ((req._parsedUrl || {}).pathname || '/').toLowerCase()
				const httpMethod = (method || '').toUpperCase()

				debug(config, `- Looking for an endpoint with '${httpMethod}' method matching the '${pathname}' pathname.`)
				const endpoint = matchEndpoint(pathname, httpMethod, endpoints)

				if (!endpoint) {
					debug(config, '- Could not find any endpoint that matched that request.')
					return res.status(404).send(`Endpoint '${pathname}' for method ${httpMethod} not found.`)
				}
				else
					debug(config, '- Endpoint found.')

				// 3.3. Extract all params from that request, including both the url route params and the payload params.
				const validParamsMode = PARAMSMODE[paramsMode] ? paramsMode : 'all'
				const paramts = validParamsMode == 'all' || validParamsMode == 'route' ? Object.assign({}, endpoint.winningRoute.parameters) : {}
				debug(config, `- Extracting paramaters from the request object (mode: ${validParamsMode}).`)
				const getParams = validParamsMode == 'all' || validParamsMode == 'body' 
					? reqUtil.getParams(req, (...args) => debug(config, ...args)) 
					: Promise.resolve({})
				return getParams.then(parameters => Object.assign(parameters, paramts))
					.then(parameters => {
						debug(config, `- Adding all the extracted parameters to the req.${paramsPropName} property.`)
						// 3.4. Add all paramaters to the request object
						Object.assign(req[paramsPropName], parameters || {})
						// 3.5. Process all global handlers
						debug(config, '- Execute all handlers.')
						return executeHandlers(req, res, handlers)
							// 3.6. Process the endpoint
							.then(() => {
								debug(config, '- Execute main function.')
								return !res.headersSent && endpoint.execute(req, res)
							})
					})
			}
			else if (res.headersSent)
				debug(config, '- The request pre-processing already yielded a response. Main process aborted.')
			else 
				debug(config, '- The request pre-processing yielded an error. Main process aborted.')
		})
		.catch(err => {
			console.error('Error in request/response processing')
			console.error(err)
			if (!_preEventErr)
				try { res.status(500).send(`Internal Server Error - Processing error: ${err.message}`) } catch(e) { console.error(e.message) } 
			_processErr = err
		})
		// 5. Run the final post-event processing
		.then(() => postEvent(req, res))
		.catch(err => {
			console.error('Error in post-event processing')
			console.error(err)
			if (!_preEventErr && !_processErr)
				try { res.status(500).send(`Internal Server Error - Post Processing error: ${err.message}`) } catch(e) { console.error(e.message) } 
		})
})

/**
 * The response object, depending on the hosting platform is express or a FaaS, will or will not support certain APIs.
 * This method makes sure all APIs are available
 * @param  {Object} res Response object
 */
const extendResponse = (req, res) => {
	if (!res.set)
		res.set = res.setHeader
	if (!res.send)
		res.send = (a,b,c,d,e,f,g) => {
			res.end(a,b,c,d,e,f,g)
			if (res.headersSent == undefined)
				res.headersSent = true
		}

	if (!res.status)
		res.status = code => { res.statusCode = code; return res }

	// The 'bind' trick is necessary to fix the 'Cannot read property 'req' of undefined' issue
	// https://stackoverflow.com/questions/41801723/express-js-cannot-read-property-req-of-undefined
	if (_onSend) {
		const oldFn = res.send.bind(res)
		res.send = (...args) => {
			_onSend(req, res, ...args)
			return oldFn(...args)
		}
	}
	if (_onStatus) {
		const oldFn = res.status.bind(res)
		res.status = (...args) => {
			_onStatus(req, res, ...args)
			oldFn(...args)
			return res
		}
	}

	if (_onHeaders) {
		const oldFn = res.set.bind(res)
		res.set = (...args) => {
			_onHeaders(req, res, ...args)
			return oldFn(...args)
		}
	}
}

module.exports = {
	app,
	cors,
	get appConfig() { return getEnv() }
}

