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

const serveHttp = (processHttpRequest, appconfig) => (req, res) => handleHttpRequest(req, res, appconfig)
	.then(() => !res.headersSent 
		? setResponseHeaders(res, appconfig).then(res => processHttpRequest(req, res)) 
		: res)

module.exports = {
	setResponseHeaders,
	handleHttpRequest,
	serveHttp,
	getAppConfig,
	getActiveEnv
}