/**
 * Copyright (c) 2018, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
const getRawBody = require('raw-body')
const path = require('path')
const httpMocks = require('node-mocks-http')
const appendQuery = require('append-query')

/*eslint-disable */
const utf8ToHex = s => s ? Buffer.from(s).toString('hex') : ''
const hexToUtf8 = h => h ? Buffer.from(h, 'hex').toString() : ''
const hexToBuf = h => h ? Buffer.from(h, 'hex') : new Buffer(0)
/*eslint-enable */

const HEX_CAR_RTN_01 = utf8ToHex('--\r\n')
const HEX_CAR_RTN_02 = utf8ToHex('\r\n')
const HEX_BOUNDARY_TRAIL = utf8ToHex('--')
const HEX_DBL_CAR_RTN = utf8ToHex('\r\n\r\n')
const HEX_REGEX_TRAIL_CAR_RTN = new RegExp(HEX_CAR_RTN_02 + '$')

const getParams = (req, debugFn) => {
	const debug = debugFn || (() => null)
	const headers = req.headers || []
	const contentType = (headers['content-type'] || headers['Content-Type'] || headers['ContentType'] || '')
	const isMultipart = contentType.match(/form-data|multipart/)
	const isXwwwFormUrlencoded = contentType.indexOf('x-www-form-urlencoded') >= 0
	debug(`- Extracting request's body (contentType: ${contentType}).`)
	const getBody = !isMultipart && req.body 
		? Promise.resolve({ encoded: false, body: req.body}) 
		: getRawBody(req)
			.then(b => ({ encoded: true, body: b}))
			.catch(() => {
				debug('- Failed to extract request\'s body. Method \'getRawBody\' failed.')
				return { encoded: true, body: null }
			})
	
	return getBody.then(bod => {
		debug('- Request\'s body extracted.')
		let bodyParameters = {}
		if (bod.body) {
			// Deal with standard encoding
			if (!isMultipart) {
				debug('- Processing a non-multipart body.')
				const body = bod.encoded ? bod.body.toString() : bod.body
				const bodyType = typeof(body)
				if (bodyType == 'object') {
					debug('- The body is a native JSON object. Simply assign it to \'req.body\'.')
					bodyParameters = Object.assign({ body: body }, body)
					req.body = body
				}
				else if (bodyType == 'string') {
					try {
						if (isXwwwFormUrlencoded) {
							debug('- The body is a x-www-form-urlencoded string. Trying to parse it to a JSON object before assigning it to \'req.body\'.')
							bodyParameters = body.split('&').filter(x => x).reduce((acc,x) => {
								const [k,v] = x.split('=')
								const key = k ? unescape(k) : null
								const value = v ? unescape(v) : ''
								if (key)
									acc[key] = value
								return acc
							}, {})
							req.body = Object.assign({}, bodyParameters)
							bodyParameters.body = body
						}
						else{
							debug('- The body seems like a string JSON. Trying to parse it to a JSON object before assigning it to \'req.body\'.')
							const parsedBody = JSON.parse(body)
							bodyParameters = Object.assign({ body: bod.body }, JSON.parse(body))
							req.body = parsedBody
						}
					}
					catch(err) {
						debug('- Failed to parse the body to a JSON object. Assigning the raw version to \'req.body\'.')
						bodyParameters = { body: bod.body }
						req.body = bod.body
					}
				}
			}
			// Deal with multipart encoding
			else {
				debug('- Processing a multipart body.')
				const bodyHex = bod.body.toString('hex')
				const boundary = '--' + (contentType.split('boundary=') || [null, ''])[1]
				const boundaryHex = utf8ToHex(boundary)

				bodyParameters = (bodyHex.split(boundaryHex) || [])
					.filter(x => x && x != HEX_CAR_RTN_01 && x != HEX_BOUNDARY_TRAIL)
					.reduce((acc, x) => {
						const [meta='', val=''] = (x.split(HEX_DBL_CAR_RTN).filter(y => y) || [null, null])
						const metadata = hexToUtf8(meta) + ' '
						const value = val.replace(HEX_REGEX_TRAIL_CAR_RTN, '')
						const name = (metadata.match(/ name="(.*?)"/) || [null, null])[1]
						const filename = (metadata.match(/ filename="(.*?)"/) || [null, null])[1]
						const mimetype = (metadata.match(/Content-Type: (.*?) /) || [null, null])[1]
						if (name)
							acc[name] = { value: mimetype ? hexToBuf(value) : hexToBuf(value).toString(), filename, mimetype }
						return acc
					}, {})

				debug('- Parsing the different fields into a JSON object before assigning it to \'req.body\'.')
				req.body = Object.assign({}, bodyParameters)
				bodyParameters.body = bod.body
			}
		}
		else
			debug('- There was no body in the request.')

		debug('- Merging the body parameters with the potential query string parameters.')
		const parameters = Object.assign((bodyParameters || {}), req.query || {})

		return parameters
	})
}

const createGCPRequestResponse = (event={}, paramsPropName) => {
	try {
		const pubsubMessage = event.data || {}
		const data = pubsubMessage.attributes || {}
		let body
		try {
			/*eslint-disable */
			body = pubsubMessage.data ? Buffer.from(pubsubMessage.data, 'base64').toString() : {}
		}
		catch(err) {}
		/*eslint-enable */

		const resource = event.resource || ''

		let req = httpMocks.createRequest({
			method: 'POST',
			headers: {
				origin: resource
			},
			_parsedUrl: {
				pathname: data.pathname && typeof(data.pathname) == 'string' ? path.posix.join('/', data.pathname) : '/'
			}
		})

		req[paramsPropName] = data
		req.body = body
		req.__event = event

		return { req, res: httpMocks.createResponse() }
	}
	catch(err) {
		console.error(err)
		throw err
	}
}

const createAWSRequestResponse = (event={}, paramsPropName) => {
	try {
		const pathname = path.posix.join('/', event.path || '/')
		let req = httpMocks.createRequest({
			method: event.httpMethod || 'GET',
			headers: event.headers || {},
			_parsedUrl: {
				pathname: pathname
			}
		})

		req[paramsPropName] = event
		req.body = event.body || {}
		req.query = event.queryStringParameters || {}
		req.url = appendQuery(pathname, req.query)
		req.__event = event

		return { req, res: httpMocks.createResponse() }
	}
	catch(err) {
		console.error(err)
		throw err
	}
}

const createAWSResponse = (res={}) => {
	try {
		return {
			statusCode: res.statusCode || 400,
			headers: res._getHeaders ? res._getHeaders() : {},
			body: res._getData ? res._getData() : ''
		}
	}
	catch(err) {
		console.error(err)
		throw err
	}
}

// statusCode: responseCode,
//         headers: {
//             "x-custom-header" : "my custom header value"
//         },
//         body: JSON.stringify(responseBody)

module.exports = {
	reqUtil: {
		getParams,
		createGCPRequestResponse,
		createAWSRequestResponse,
		createAWSResponse
	}
}