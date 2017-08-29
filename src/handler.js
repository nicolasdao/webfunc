/**
 * Copyright (c) 2017, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
const { getRouteDetails } = require('./routing')

let _options = new WeakMap()
let _control = new WeakMap()
let _optionsObjectFlag = new WeakMap()
class HttpHandler {
	/**
	 * Create a new HttpHandler based on custom options, and http process
	 * 
	 * @param  {Object} 	options  
	 * @param  {Function} 	control 	Optional way to dynamically control the handler. Signature: (req, res, data) => ... 
	 *                              	where data is optional, and expect this schema: { request: <Object>, err: <Object>, options: <Object> }
	 */
	constructor(options, control) {
		if (control && typeof(control) != 'function')
			throw new Error('Wrong argument exception. Argument \'control\' must be a function.')

		_options.set(this, options)
		_optionsObjectFlag.set(this, typeof(options) == 'object')
		const controlFunc = control || (() => null)
		_control.set(this, (req, res, data) => Promise.resolve(controlFunc(req, res, data)))
	}

	getOptions() {
		return _optionsObjectFlag.get(this) ? Object.assign({}, _options.get(this)) : _options.get(this)
	} 

	getControl() {
		return _control.get(this)
	}

	process(req, res, params) {
		const control = this.getControl()
		const err = null
		const data = control ? { request: params, err, options: this.getOptions() } : { request: null, err: null, options: null }
		return control(req, res, data)
			.then(() => ({ req, res, params }))
	}
}

const app = () => {
	let httpHandlers = []
	return {
		use: httpHandler => {
			if (!httpHandler)
				throw new Error('Missing required argument. The \'httpHandler\' argument must be specified in the \'use\' method.')
			if (!(httpHandler instanceof HttpHandler))
				throw new Error('Wrong argument exception. Object \'httpHandler\' must be an instance of \'HttpHandler\'.')
			
			httpHandlers.push(httpHandler)
		},
		reset: () => { httpHandlers = [] },
		get: (path, next) => ({ route: getRouteDetails(path), method: 'GET', next: next }),
		post: (path, next) => ({ route: getRouteDetails(path), method: 'POST', next: next }),
		put: (path, next) => ({ route: getRouteDetails(path), method: 'PUT', next: next }),
		delete: (path, next) => ({ route: getRouteDetails(path), method: 'DELETE', next: next }),
		head: (path, next) => ({ route: getRouteDetails(path), method: 'HEAD', next: next }),
		options: (path, next) => ({ route: getRouteDetails(path), method: 'OPTIONS', next: next }),
		any: (path, next) => ({ route: getRouteDetails(path), next: next }),
		/**
		 * Creates a new object { route: ..., method: ..., next: ... } based on some more detailed route information
		 * 
		 * @param  {Object} 	routeDetails 
		 * @param  {String} 	routeDetails.path		Optional (e.g. '/users/{username}/byebye/{accountId}')
		 * @param  {String} 	routeDetails.method 	Optional. If not set any HTTP method is allowed for that path. Values: GET, POST, PUT, DELETE, HEAD, OPTIONS 
		 * @param  {String} 	routeDetails.handlerId 	Optional. If you've added HttpHandlers (using app.use), then the request will use that handler specifically.
		 * @param  {Function} 	routeDetails.next 	Optional. What to do with the request after it has potentially gone through the HttpHandler.
		 * @return {Object}              
		 */
		route: (routeDetails) => {
			if (!routeDetails)
				throw new Error('Missing arg. \'routeDetails\' must be defined in function \'route\'.')
			if (!routeDetails.next)
				throw new Error('Missing \'next\' function. \'routeDetails.next\' must be defined in function \'route\'.')
			if (typeof(routeDetails.next) != 'function')
				throw new Error('\'next\' must be a function.')

			const method = routeDetails.method ? routeDetails.method.trim().toUpperCase() : null
			const handlerId = routeDetails.handlerId ? routeDetails.handlerId.trim().toLowerCase() : null
			const path = routeDetails.path || '/'
			const next = routeDetails.next || (() => Promise.resolve(null))
			const route = getRouteDetails(path)

			if (!handlerId)
				return { route: route, method: method, next: next }
			else {
				const httpHandler = httpHandlers.filter(s => s.id.trim().toLowerCase() == handlerId)[0]
				if (!httpHandler)
					throw new Error(`Cannot found routing method. Routing with http handler id '${handlerId}' cannot be found. Use 'app.use(new SomeHttpHandler())' to set up your http handler, or double-check there is no typos in the http handler id.`)

				return { 
					route: route, 
					method: method, 
					next: (req, res, params) => 
						Promise.resolve(httpHandler.process(req, res, params))
							.then((req, res, params) => next(req, res, params))
				}
			}
		}
	}
}

module.exports = {
	app,
	HttpHandler
}