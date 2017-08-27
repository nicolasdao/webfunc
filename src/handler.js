/**
 * Copyright (c) 2017, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
const { getRouteDetails } = require('./routing')

let _options = new WeakMap()
let _httpNext = new WeakMap()
let _optionsObjectFlag = new WeakMap()
class HttpHandler {
	constructor(options, httpNext) {
		if (httpNext && typeof(httpNext) != 'function')
			throw new Error('Wrong argument exception. Argument \'httpNext\' must be a function.')

		_options.set(this, options)
		_optionsObjectFlag.set(this, typeof(options) == 'object')
		_httpNext.set(this, httpNext)
	}

	getOptions() {
		return _optionsObjectFlag.get(this) ? Object.assign({}, _options.get(this)) : _options.get(this)
	} 

	getHttpNext() {
		return _httpNext.get(this)
	}

	httpNext(req, res, params) {
		const httpHandle = this.getHttpNext() || (() => null)
		const err = null
		return Promise.resolve(httpHandle(req, res, params, err))
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
		get: (path, httpNext) => ({ route: getRouteDetails(path), method: 'GET', httpNext: httpNext }),
		post: (path, httpNext) => ({ route: getRouteDetails(path), method: 'POST', httpNext: httpNext }),
		put: (path, httpNext) => ({ route: getRouteDetails(path), method: 'PUT', httpNext: httpNext }),
		delete: (path, httpNext) => ({ route: getRouteDetails(path), method: 'DELETE', httpNext: httpNext }),
		head: (path, httpNext) => ({ route: getRouteDetails(path), method: 'HEAD', httpNext: httpNext }),
		options: (path, httpNext) => ({ route: getRouteDetails(path), method: 'OPTIONS', httpNext: httpNext }),
		any: (path, httpNext) => ({ route: getRouteDetails(path), httpNext: httpNext }),
		/**
		 * Creates a new object { route: ..., method: ..., httpNext: ... } based on some more detailed route information
		 * 
		 * @param  {Object} 	routeDetails 
		 * @param  {String} 	routeDetails.path		Optional (e.g. '/users/{username}/byebye/{accountId}')
		 * @param  {String} 	routeDetails.method 	Optional. If not set any HTTP method is allowed for that path. Values: GET, POST, PUT, DELETE, HEAD, OPTIONS 
		 * @param  {String} 	routeDetails.handlerId 	Optional. If you've added HttpHandlers (using app.use), then the request will use that handler specifically.
		 * @param  {Function} 	routeDetails.httpNext 	Optional. What to do with the request after it has potentially gone through the HttpHandler.
		 * @return {Object}              
		 */
		route: (routeDetails) => {
			if (!routeDetails)
				throw new Error('Missing arg. \'routeDetails\' must be defined in function \'route\'.')
			if (!routeDetails.httpNext)
				throw new Error('Missing \'httpNext\' function. \'routeDetails.httpNext\' must be defined in function \'route\'.')
			if (typeof(routeDetails.httpNext) != 'function')
				throw new Error('\'httpNext\' must be a function.')

			const method = routeDetails.method ? routeDetails.method.trim().toUpperCase() : null
			const handlerId = routeDetails.handlerId ? routeDetails.handlerId.trim().toLowerCase() : null
			const path = routeDetails.path || '/'
			const httpNext = routeDetails.httpNext || (() => Promise.resolve(null))
			const route = getRouteDetails(path)

			if (!handlerId)
				return { route: route, method: method, httpNext: httpNext }
			else {
				const httpHandler = httpHandlers.filter(s => s.id.trim().toLowerCase() == handlerId)[0]
				if (!httpHandler)
					throw new Error(`Cannot found routing method. Routing with http handler id '${handlerId}' cannot be found. Use 'app.use(new SomeHttpHandler())' to set up your http handler, or double-check there is no typos in the http handler id.`)

				return { 
					route: route, 
					method: method, 
					httpNext: (req, res, params) => 
						Promise.resolve(httpHandler.httpNext(req, res, params))
							.then((req, res, params) => httpNext(req, res, params))
				}
			}
		}
	}
}

module.exports = {
	app,
	HttpHandler
}