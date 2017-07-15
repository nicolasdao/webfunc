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

let webconfig = null
const getWebConfig = () => {
	if (webconfig == null) {
		/*eslint-disable */
		const webconfigPath = path.join(process.cwd(), 'webconfig.json')
		/*eslint-enable */
		webconfig = fs.existsSync(webconfigPath) ? require(webconfigPath) : undefined
	}
	return webconfig
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

const setResponseHeaders = (res, webconfig) => Promise.resolve((webconfig || getWebConfig() || {}).headers)
	.then(headers => getHeadersCollection(headers, !webconfig).reduce((response, header) => res.set(header.key, header.value), res))

const handleHttpRequest = (req, res, webconfig) => Promise.resolve(webconfig || getWebConfig() || {})
	.then(webConfig => {
		const headers = webConfig.headers
		const noConfig = !webConfig.headers && !webConfig.env
		const memoize = !webconfig
		const origins = getAllowedOrigins(headers, memoize)
		const methods = getAllowedMethods(headers, memoize)
		const origin = new String(req.headers.origin).toLowerCase()
		const referer = new String(req.headers.referer).toLowerCase()
		const method = new String(req.method).toLowerCase()
		const sameOrigin = referer.indexOf(origin) == 0

		if (noConfig) {
			if (!sameOrigin) {
				setResponseHeaders(res, webConfig)
				throw httpError(403, `Forbidden - CORS issue. Origin '${origin}' is not allowed.`)
			}
			if (method != 'head' && method != 'get' && method != 'options' && method != 'post') {
				setResponseHeaders(res, webConfig)
				throw httpError(403, `Forbidden - CORS issue. Method '${method.toUpperCase()}' is not allowed.`)
			}
		}
		// Check CORS
		
		if (!origins['*'] && Object.keys(origins).length != 0 && !(origin in origins)) {
			setResponseHeaders(res, webConfig)
			throw httpError(403, `Forbidden - CORS issue. Origin '${origin}' is not allowed.`)
		}
		if (Object.keys(methods).length != 0 && method != 'get' && method != 'head' && !(method in methods)) {
			setResponseHeaders(res, webConfig)
			throw httpError(403, `Forbidden - CORS issue. Method '${method.toUpperCase()}' is not allowed.`)
		}

		if (method == 'head' || method == 'options')
			return setResponseHeaders(res, webConfig).then(res => res.status(200).send())
	})

const serveHttp = (processHttpRequest, webconfig) => (req, res) => handleHttpRequest(req, res, webconfig)
	.then(() => !res.headersSent 
		? setResponseHeaders(res, webconfig).then(res => processHttpRequest(req, res)) 
		: res)

module.exports = {
	setResponseHeaders,
	handleHttpRequest,
	serveHttp
}