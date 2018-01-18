/**
 * Copyright (c) 2018, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
const vary = require('vary')

/**
 * Create the Express-like middleware that will add headers to the response as well as check for CORS
 * compliant request.
 * @param  {Object} options.headers Headers that should be added to all responses regardless of what happens
 */
const cors = ({ allowedHeaders, origins, methods, credentials, maxAge }) => {
	const originList = (origins || ['*']).map(x => x.toLowerCase().trim())
	const allOriginsAllowed = originList.some(x => x == '*')
	const addOriginToVary = !allOriginsAllowed && originList.length > 0
	let headers = {
		'Access-Control-Allow-Methods' : (methods || ['GET','HEAD','PUT','PATCH','POST','DELETE']).map(x => x.toUpperCase()).join(', '),
		'Access-Control-Allow-Origin': allOriginsAllowed ? '*' : originList.join(', ')
		//'Access-Control-Request-Headers': '',
		//'Access-Control-Expose-Headers': '',
	}
	if (credentials !== undefined)
		headers['Access-Control-Allow-Credentials'] = credentials ? true : false
	if (maxAge)
		headers['Access-Control-Max-Age'] = maxAge
	if (allowedHeaders && allowedHeaders.length > 0)
		headers['Access-Control-Allow-Headers'] = (allowedHeaders || []).join(', ')

	return (req, res, next) => {
		const requestOrigin = ((req.headers || {}).origin || '').trim()
		const requestAllowed = allOriginsAllowed || originList.some(x => x == requestOrigin)
		const creds = headers['Access-Control-Allow-Credentials']
		const _allowedHeaders = headers['Access-Control-Allow-Headers']
		const _maxAge = headers['Access-Control-Max-Age']

		// 1. For all requests, set Origin
		res.set('Access-Control-Allow-Origin', requestAllowed ? requestOrigin : null)
		// 2. For all requests, set Credential boolean if it was defined.
		if (creds)
			res.set('Access-Control-Allow-Credentials', creds)
		// 3. For all requests, set Expose-Headers if it was defined.
		if (_allowedHeaders)
			res.set('Access-Control-Expose-Headers', _allowedHeaders)

		// 4. For OPTIONS requests, add more headers
		const method = req.method && req.method.toUpperCase && req.method.toUpperCase()
		if (method == 'OPTIONS') {
			// 4.1. For OPTIONS requests, set Methods
			res.set('Access-Control-Allow-Methods', headers['Access-Control-Allow-Methods'])
			// 4.2. For OPTIONS requests, set Allow-Headers if it was defined.
			if (_allowedHeaders)
				res.set('Access-Control-Allow-Headers', _allowedHeaders)
			// 4.3. For OPTIONS requests, set Max-Age if it was defined.
			if (_maxAge)
				res.set('Access-Control-Max-Age', _maxAge)
		}

		if (addOriginToVary && res.headers)
			vary(res, 'Origin')

		next()
	}
}

module.exports = { cors }