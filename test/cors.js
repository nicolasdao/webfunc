/**
 * Copyright (c) 2018, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
const { assert } = require('chai')
const httpMocks = require('node-mocks-http')
const { app, cors } = require('../src/index')

/*eslint-disable */
describe('cors', () => 
	it('Should retrieves required response headers defined inside the config.json file.', () => {
		/*eslint-enable */
		const req_01 = httpMocks.createRequest({
			method: 'GET',
			headers: {
				origin: 'http://localhost:8080',
				referer: 'http://localhost:8080'
			},
			_parsedUrl: {
				pathname: '/users/nicolas'
			}
		})
		const res_01 = httpMocks.createResponse()

		const req_02 = httpMocks.createRequest({
			method: 'POST',
			headers: {
				origin: 'http://localhost:8080',
				referer: 'http://localhost:8080'
			},
			_parsedUrl: {
				pathname: '/users/nicolas'
			},
			query: { lastname: 'dao' }
		})
		const res_02 = httpMocks.createResponse()

		const req_03 = httpMocks.createRequest({
			method: 'POST',
			headers: {
				origin: 'http://brendan.com',
				referer: 'http://brendan.com'
			},
			_parsedUrl: {
				pathname: '/users/nicolas'
			},
			query: { lastname: 'dao' }
		})
		const res_03 = httpMocks.createResponse()

		const commonHeaders = {
			'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
			'Access-Control-Allow-Headers': 'Authorization, Content-Type, Origin',
			'Access-Control-Max-Age': '1296000'
		}

		const req_01_cors = cors({ headers: Object.assign({}, commonHeaders, {
			'Access-Control-Allow-Origin': 'http://boris.com, http://localhost:8080'
		}) })

		app.reset()
		app.all('/Users/:username', req_01_cors, (req, res) => res.status(200).send(`Hello ${req.params.username}${req.params.lastname ? ` ${req.params.lastname}` : ''}`))

		const result_01 = app.handleEvent()(req_01, res_01).then(() => {
			assert.equal(res_01._getData(),'Hello nicolas')
			const headers = res_01._getHeaders()
			assert.isOk(headers)
			assert.equal(headers['Access-Control-Allow-Methods'], 'GET, HEAD, OPTIONS')
			assert.equal(headers['Access-Control-Allow-Headers'], 'Authorization, Content-Type, Origin')
			assert.equal(headers['Access-Control-Allow-Origin'], 'http://boris.com, http://localhost:8080')
			assert.equal(headers['Access-Control-Max-Age'], '1296000')
		})
		const result_02 = app.handleEvent()(req_02, res_02).then(() => {
			assert.equal(res_02.statusCode, 403)
			assert.equal(res_02._getData(),'Forbidden - CORS issue. Method \'POST\' is not allowed.')
			const headers = res_02._getHeaders()
			assert.isOk(headers)
			assert.equal(headers['Access-Control-Allow-Methods'], 'GET, HEAD, OPTIONS')
			assert.equal(headers['Access-Control-Allow-Headers'], 'Authorization, Content-Type, Origin')
			assert.equal(headers['Access-Control-Allow-Origin'], 'http://boris.com, http://localhost:8080')
			assert.equal(headers['Access-Control-Max-Age'], '1296000')
		})
		const result_03 = app.handleEvent()(req_03, res_03).then(() => {
			assert.equal(res_03.statusCode, 403)
			assert.equal(res_03._getData(),'Forbidden - CORS issue. Origin \'http://brendan.com\' is not allowed.')
			const headers = res_03._getHeaders()
			assert.isOk(headers)
			assert.equal(headers['Access-Control-Allow-Methods'], 'GET, HEAD, OPTIONS')
			assert.equal(headers['Access-Control-Allow-Headers'], 'Authorization, Content-Type, Origin')
			assert.equal(headers['Access-Control-Allow-Origin'], 'http://boris.com, http://localhost:8080')
			assert.equal(headers['Access-Control-Max-Age'], '1296000')
		})

		return Promise.all([result_01, result_02, result_03])
	}))