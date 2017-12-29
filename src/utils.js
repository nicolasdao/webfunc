/**
 * Copyright (c) 2017, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
const getRawBody = require('raw-body')
const path = require('path')

/*eslint-disable */
const cwdPath = f => path.join(process.cwd(), f)
const utf8ToHex = s => s ? Buffer.from(s).toString('hex') : ''
const hexToUtf8 = h => h ? Buffer.from(h, 'hex').toString() : ''
const hexToBuf = h => h ? Buffer.from(h, 'hex') : new Buffer(0)
/*eslint-enable */

const HEX_CAR_RTN_01 = utf8ToHex('--\r\n')
const HEX_CAR_RTN_02 = utf8ToHex('\r\n')
const HEX_BOUNDARY_TRAIL = utf8ToHex('--')
const HEX_DBL_CAR_RTN = utf8ToHex('\r\n\r\n')
const HEX_REGEX_TRAIL_CAR_RTN = new RegExp(HEX_CAR_RTN_02 + '$')

const getParams = req => {
	const headers = req.headers || []
	const contentType = (headers['content-type'] || headers['Content-Type'] || headers['ContentType'] || '')
	const isMultipart = contentType.match(/form-data|multipart/)
	const isXwwwFormUrlencoded = contentType.indexOf('x-www-form-urlencoded') >= 0
	const getBody = !isMultipart && req.body ? Promise.resolve({ encoded: false, body: req.body}) : getRawBody(req).then(b => ({ encoded: true, body: b}))
	return getBody.then(bod => {
		let bodyParameters = {}
		if (bod.body) {
			// Deal with standard encoding
			if (!isMultipart) {
				const body = bod.encoded ? bod.body.toString() : bod.body
				const bodyType = typeof(body)
				if (bodyType == 'object') {
					bodyParameters = Object.assign({ body: body }, body)
					req.body = body
				}
				else if (bodyType == 'string') {
					try {
						if (isXwwwFormUrlencoded) {
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
							const parsedBody = JSON.parse(body)
							bodyParameters = Object.assign({ body: bod.body }, JSON.parse(body))
							req.body = parsedBody
						}
					}
					catch(err) {
						bodyParameters = { body: bod.body }
						req.body = bod.body
					}
				}
			}
			// Deal with multipart encoding
			else {
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
							acc[name] = { value: hexToBuf(value), filename, mimetype }
						return acc
					}, {})

				req.body = Object.assign({}, bodyParameters)
				bodyParameters.body = bod.body
			}
		}

		const parameters = Object.assign((bodyParameters || {}), req.query || {})

		return parameters
	})
}

const initStartVariables = () => {
	try {
		const pkg = require(cwdPath('package.json')) || {}
		if (pkg.scripts && pkg.scripts.start) 
			(pkg.scripts.start.trim()).split(' ')
				.filter(x => x)
				.map(x => x.split('='))
				.filter(x => x.length == 2)
				.forEach(x => { 
					/*eslint-disable */
					if (x[0] != 'NODE_ENV')
						process.env[x[0]] = x[1]
					else
						process.env.WEBFUNC_ENV = x[1]						
					/*eslint-enable */
				})
		/*eslint-disable */
		if (!process.env.WEBFUNC_ENV && process.env.NODE_ENV)
			process.env.WEBFUNC_ENV = process.env.NODE_ENV
		/*eslint-enable */
	}
	catch(err) {
		console.error(err.message)
	}
}

module.exports = {
	reqUtil: {
		getParams
	},
	pkgJson: {
		initStartVariables
	}
}