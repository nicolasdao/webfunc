/**
 * Copyright (c) 2018, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const getRequiredResponseHeaders = (config={}) => {
	const headers = config.headers || {}
	const headersCollection = []
	for (let key in headers)
		headersCollection.push({ key, value: headers[key] })

	return headersCollection
}

const getAllowedOrigins = (config={}) => 
	((config.headers || {})['Access-Control-Allow-Origin'] || '')
		.split(',')
		.reduce((a, s) => { 
			if (s) a[s.trim().toLowerCase().replace(/\/$/,'')] = true 
			return a 
		}, {})

const getAllowedMethods = (config={}) => 
	((config.headers || {})['Access-Control-Allow-Methods'] || '')
		.split(',')
		.reduce((a, s) => { 
			if (s) a[s.trim().toLowerCase()] = true 
			return a 
		}, {})

const setResponseHeaders = (res, responseHeaders=[]) => responseHeaders.forEach(header => res.set(header.key, header.value))

const validateCORS = (req, res, config={}, allowedOrigins={}, allowedMethods={}) => {
	const noConfig = !config.headers
	const origin = new String(req.headers.origin).toLowerCase()
	const referer = new String(req.headers.referer).toLowerCase()
	const method = new String(req.method).toLowerCase()
	const sameOrigin = referer.indexOf(origin) == 0

	if (noConfig) {
		if (!sameOrigin) {
			res.status(403).send(`Forbidden - CORS issue. Origin '${origin}' is not allowed.`)
			return false
		}

		if (method != 'head' && method != 'get' && method != 'options' && method != 'post') {
			res.status(403).send(`Forbidden - CORS issue. Method '${method.toUpperCase()}' is not allowed.`)
			return false
		}
	}

	if (!allowedOrigins['*'] && Object.keys(allowedOrigins).length > 0 && !(origin in allowedOrigins)) {
		res.status(403).send(`Forbidden - CORS issue. Origin '${origin}' is not allowed.`)
		return false
	}

	if (Object.keys(allowedMethods).length > 0 && method != 'get' && method != 'head' && !(method in allowedMethods)) {
		res.status(403).send(`Forbidden - CORS issue. Method '${method.toUpperCase()}' is not allowed.`)
		return false
	}

	return true
}

/**
 * Create the Express-like middleware that will add headers to the response as well as check for CORS
 * compliant request.
 * @param  {Object} options.headers Headers that should be added to all responses regardless of what happens
 */
const cors = (options={}) => {
	const requiredHeaders = getRequiredResponseHeaders(options) || []
	const allowedOrigins = getAllowedOrigins(options)
	const allowedMethods = getAllowedMethods(options)
	const setHeaders = requiredHeaders.length > 0 ? res => setResponseHeaders(res, requiredHeaders) : () => null
	const corsSetUp = Object.keys(allowedOrigins).length > 0 || Object.keys(allowedMethods).length > 0
	const config = { headers: corsSetUp ? {} : null }

	return (req, res, next) => {
		setHeaders(res)
		validateCORS(req, res, config, allowedOrigins, allowedMethods)
		next()
	}
}

module.exports = {
	getRequiredResponseHeaders,
	getAllowedOrigins,
	getAllowedMethods,
	setResponseHeaders,
	validateCORS,
	cors
}