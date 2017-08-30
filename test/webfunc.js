/**
 * Copyright (c) 2017, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
const { assert } = require('chai')
const httpMocks = require('node-mocks-http')
const { setResponseHeaders, serveHttp, handleHttpRequest, app, HttpHandler } = require('../src/webfunc')

const appconfig = {
	headers: {
		'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS, POST',
		'Access-Control-Allow-Headers': 'Authorization, Content-Type, Origin',
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Max-Age': '1296000'
	}
}

/*eslint-disable */
describe('webfunc', () => 
	describe('#HttpHandler: 01', () => 
		it(`Should allow to be inherited to create new custom HttpHandler.`, () => {
			/*eslint-enable */
			class HttpTest extends HttpHandler {
				constructor(options, httpNext) { super(options, httpNext) }
				process(req, res, params) {
					res.status(200).send('Hello mate')
					return super.process(req, res, params, null)
				}
			}

			app.reset()
			assert.isOk(!app.use(new HttpTest(null, () => null)), 'Should not throw an exception.')
			assert.throw(() => app.use(1), Error, 'Wrong argument exception. Object \'httpHandler\' must be an instance of \'HttpHandler\'.')
		})))

/*eslint-disable */
describe('webfunc', () => 
	describe('#HttpHandler: 02', () => 
		it(`Should support multiple HttpHandlers.`, () => {
			/*eslint-enable */

			class HttpTest extends HttpHandler {
				constructor(options, httpNext) { super(options, httpNext) }
				get id() {
					return 'testHandler'
				}
				process(req, res, params) {
					res.status(200).send(`Hello ${params.username} (account: ${params.accountId})`)
					return super.process(req, res, params, null)
				}
			}

			class HttpTest2 extends HttpHandler {
				constructor(options, httpNext) { super(options, httpNext) }
				get id() {
					return 'testHandler2'
				}
				process(req, res, params) {
					res.status(200).send(`Bye Bye ${params.username} (account: ${params.accountId})`)
					return super.process(req, res, params, null)
				}
			}

			app.reset()
			app.use(new HttpTest(null, (req, res) => {
				assert.equal(res._getData(),'Hello nicolas (account: 1234)')
			}))
			app.use(new HttpTest2(null, (req, res) => {
				assert.equal(res._getData(),'Bye Bye nicolas (account: 1234)')
			}))

			assert.isOk(app.route({
				path: '/users/{username}/account/{accountId}',
				method: null,
				/*eslint-disable */
				next: (req, res, params) => { return res },
				/*eslint-enable */
				handlerId: 'testHandler'
			}), 'Should create an object.')

			assert.throw(() => app.route({
				path: '/users/{username}/account/{accountId}',
				method: null,
				/*eslint-disable */
				next: (req, res, params) => { return res },
				/*eslint-enable */
				handlerId: 'testHandler3'
			}), Error, 'Cannot found routing method. Routing with http handler id \'testhandler3\' cannot be found. Use \'app.use(new SomeHttpHandler())\' to set up your http handler, or double-check there is no typos in the http handler id.')

		})))

/*eslint-disable */
describe('webfunc', () => 
	describe('#setResponseHeaders', () => 
		it('Should set headers.', () => {
			/*eslint-enable */
			const res = httpMocks.createResponse()
			return setResponseHeaders(res, appconfig).then(res => {
				const headers = res._getHeaders()
				assert.isOk(headers)
				assert.equal(headers['Access-Control-Allow-Methods'], 'GET, HEAD, OPTIONS, POST')
				assert.equal(headers['Access-Control-Allow-Headers'], 'Authorization, Content-Type, Origin')
				assert.equal(headers['Access-Control-Allow-Origin'], '*')
				assert.equal(headers['Access-Control-Max-Age'], '1296000')
			})
		})))

/*eslint-disable */
describe('webfunc', () => 
	describe('#handleHttpRequest: 01', () => 
		it('Should NOT fail if no CORS settings have been set up and the same origin policy if satisfied.', () => {
			/*eslint-enable */
			const req = httpMocks.createRequest({
				method: 'GET',
				headers: {
					origin: 'http://localhost:8080',
					referer: 'http://localhost:8080/helloworld/'
				}
			})
			const res = httpMocks.createResponse()
			const appconfig = {}
			return handleHttpRequest(req, res, appconfig).then(() => {
				assert.isOk(1)
			})
		})))

/*eslint-disable */
describe('webfunc', () => 
	describe('#handleHttpRequest: 02', () => 
		it('Should fail if no CORS settings have been set up and the same origin policy if NOT satisfied.', () => {
			/*eslint-enable */
			const req = httpMocks.createRequest({
				method: 'GET',
				headers: {
					origin: 'http://localhost:8080',
					referer: 'http://example.com/helloworld/'
				}
			})
			const res = httpMocks.createResponse()
			const appconfig = {}
			return handleHttpRequest(req, res, appconfig).then(({req, res}) => {
				assert.isOk(req)
				assert.equal(res.statusCode, 403)
				assert.equal(res._getData(), 'Forbidden - CORS issue. Origin \'http://localhost:8080\' is not allowed.')
			})
		})))

/*eslint-disable */
describe('webfunc', () => 
	describe('#handleHttpRequest: 03', () => 
		it('Should NOT fail if CORS settings have been set up (*) and the same origin policy if NOT satisfied.', () => {
			/*eslint-enable */
			const req = httpMocks.createRequest({
				method: 'GET',
				headers: {
					origin: 'http://localhost:8080',
					referer: 'http://example.com/helloworld/'
				}
			})
			const res = httpMocks.createResponse()
			const appconfig = {
				headers: {
					'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS, POST',
					'Access-Control-Allow-Headers': 'Authorization, Content-Type, Origin',
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Max-Age': '1296000'
				}
			}
			return handleHttpRequest(req, res, appconfig).then(() => {
				assert.equal(1,1)
			})
		})))

/*eslint-disable */
describe('webfunc', () => 
	describe('#handleHttpRequest: 04', () => 
		it('Should NOT fail if CORS settings have been set up (http://localhost:8080) and the same origin policy if NOT satisfied.', () => {
			/*eslint-enable */
			const req = httpMocks.createRequest({
				method: 'GET',
				headers: {
					origin: 'http://localhost:8080',
					referer: 'http://example.com/helloworld/'
				}
			})
			const res = httpMocks.createResponse()
			const appconfig = {
				headers: {
					'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS, POST',
					'Access-Control-Allow-Headers': 'Authorization, Content-Type, Origin',
					'Access-Control-Allow-Origin': 'http://localhost:8080',
					'Access-Control-Max-Age': '1296000'
				}
			}
			return handleHttpRequest(req, res, appconfig).then(() => {
				assert.equal(1,1)
			})
		})))

/*eslint-disable */
describe('webfunc', () => 
	describe('#handleHttpRequest: 05', () => 
		it('Should fail if CORS settings have been set up (http://boris.com) and the same origin policy if NOT satisfied.', () => {
			/*eslint-enable */
			const req = httpMocks.createRequest({
				method: 'GET',
				headers: {
					origin: 'http://localhost:8080',
					referer: 'http://example.com/helloworld/'
				}
			})
			const res = httpMocks.createResponse()
			const appconfig = {
				headers: {
					'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS, POST',
					'Access-Control-Allow-Headers': 'Authorization, Content-Type, Origin',
					'Access-Control-Allow-Origin': 'http://boris.com',
					'Access-Control-Max-Age': '1296000'
				}
			}
			return handleHttpRequest(req, res, appconfig).then(({req, res}) => {
				assert.isOk(req)
				assert.equal(res.statusCode, 403)
				assert.equal(res._getData(), 'Forbidden - CORS issue. Origin \'http://localhost:8080\' is not allowed.')
			})
		})))

/*eslint-disable */
describe('webfunc', () => 
	describe('#handleHttpRequest: 06', () => 
		it('Should NOT fail if CORS settings have been set up (http://boris.com, http://localhost:8080) and the same origin policy if NOT satisfied.', () => {
			/*eslint-enable */
			const req = httpMocks.createRequest({
				method: 'GET',
				headers: {
					origin: 'http://localhost:8080',
					referer: 'http://example.com/helloworld/'
				}
			})
			const res = httpMocks.createResponse()
			const appconfig = {
				headers: {
					'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS, POST',
					'Access-Control-Allow-Headers': 'Authorization, Content-Type, Origin',
					'Access-Control-Allow-Origin': 'http://boris.com, http://localhost:8080',
					'Access-Control-Max-Age': '1296000'
				}
			}
			return handleHttpRequest(req, res, appconfig).then(() => {
				assert.equal(1,1)
			})
		})))

/*eslint-disable */
describe('webfunc', () => 
	describe('#handleHttpRequest: 07', () => 
		it('Should fail if a POST request if sent and the CORS settings have been set up (POST not supported) and the same origin policy if NOT satisfied.', () => {
			/*eslint-enable */
			const req = httpMocks.createRequest({
				method: 'POST',
				headers: {
					origin: 'http://localhost:8080',
					referer: 'http://localhost:8080'
				}
			})
			const res = httpMocks.createResponse()
			const appconfig = {
				headers: {
					'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
					'Access-Control-Allow-Headers': 'Authorization, Content-Type, Origin',
					'Access-Control-Allow-Origin': 'http://boris.com, http://localhost:8080',
					'Access-Control-Max-Age': '1296000'
				}
			}
			return handleHttpRequest(req, res, appconfig).then(({req, res}) => {
				assert.isOk(req)
				assert.equal(res.statusCode, 403)
				assert.equal(res._getData(), 'Forbidden - CORS issue. Method \'POST\' is not allowed.')
			})
		})))

/*eslint-disable */
describe('webfunc', () => 
	describe('#handleHttpRequest: 08', () => 
		it('Should NOT fail if a PUT request if sent and the CORS settings have been set up (POST is supported) and the same origin policy if NOT satisfied.', () => {
			/*eslint-enable */
			const req = httpMocks.createRequest({
				method: 'PUT',
				headers: {
					origin: 'http://localhost:8080',
					referer: 'http://localhost:8080'
				}
			})
			const res = httpMocks.createResponse()
			const appconfig = {
				headers: {
					'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS, POST, PUT',
					'Access-Control-Allow-Headers': 'Authorization, Content-Type, Origin',
					'Access-Control-Allow-Origin': 'http://boris.com, http://localhost:8080',
					'Access-Control-Max-Age': '1296000'
				}
			}
			return handleHttpRequest(req, res, appconfig).then(() => {
				assert.equal(1,1)
			})
		})))

/*eslint-disable */
describe('webfunc', () => 
	describe('#handleHttpRequest: 09', () => 
		it('Should fail if a PUT request if sent and no CORS settings have been set up.', () => {
			/*eslint-enable */
			const req = httpMocks.createRequest({
				method: 'PUT',
				headers: {
					origin: 'http://localhost:8080',
					referer: 'http://localhost:8080'
				}
			})
			const res = httpMocks.createResponse()
			const appconfig = {}
			return handleHttpRequest(req, res, appconfig).then(({req, res}) => {
				assert.isOk(req)
				assert.equal(res.statusCode, 403)
				assert.equal(res._getData(), 'Forbidden - CORS issue. Method \'PUT\' is not allowed.')
			})
		})))

/*eslint-disable */
describe('webfunc', () => 
	describe('#serveHttp: 01', () => 
		it('Should NOT fail if no CORS settings have been set up and the same origin policy if satisfied.', () => {
			/*eslint-enable */
			const req = httpMocks.createRequest({
				method: 'GET',
				headers: {
					origin: 'http://localhost:8080',
					referer: 'http://localhost:8080/helloworld/'
				}
			})
			const res = httpMocks.createResponse()
			const appconfig = {}
			const fn = serveHttp((req, res) => {
				res.status(200).send('Hello World')
				return res
			}, appconfig)
			return fn(req, res).then(({req, res}) => {
				assert.isOk(req)
				assert.equal(res._getData(),'Hello World')
			})
		})))

/*eslint-disable */
describe('webfunc', () => 
	describe('#serveHttp: 02', () => 
		it('Should fail if no CORS settings have been set up and the same origin policy if NOT satisfied.', () => {
			/*eslint-enable */
			const req = httpMocks.createRequest({
				method: 'GET',
				headers: {
					origin: 'http://localhost:8080',
					referer: 'http://example.com/helloworld/'
				}
			})
			const res = httpMocks.createResponse()
			const appconfig = {}
			const fn = serveHttp((req, res) => {
				res.status(200).send('Hello World')
				return res
			}, appconfig)
			return fn(req, res).then(({req, res}) => {
				assert.isOk(req)
				assert.equal(res.statusCode, 403)
				assert.equal(res._getData(), 'Forbidden - CORS issue. Origin \'http://localhost:8080\' is not allowed.')
			})
		})))

/*eslint-disable */
describe('webfunc', () => 
	describe('#serveHttp: 03', () => 
		it('Should NOT fail if CORS settings have been set up (*) and the same origin policy if NOT satisfied.', () => {
			/*eslint-enable */
			const req = httpMocks.createRequest({
				method: 'GET',
				headers: {
					origin: 'http://localhost:8080',
					referer: 'http://example.com/helloworld/'
				}
			})
			const res = httpMocks.createResponse()
			const appconfig = {
				headers: {
					'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS, POST',
					'Access-Control-Allow-Headers': 'Authorization, Content-Type, Origin',
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Max-Age': '1296000'
				}
			}
			const fn = serveHttp((req, res) => {
				res.status(200).send('Hello World')
				return res
			}, appconfig)
			return fn(req, res).then(({req, res}) => {
				assert.isOk(req)
				assert.equal(res._getData(),'Hello World')
			})
		})))

/*eslint-disable */
describe('webfunc', () => 
	describe('#serveHttp: 04', () => 
		it('Should NOT fail if CORS settings have been set up (http://localhost:8080) and the same origin policy if NOT satisfied.', () => {
			/*eslint-enable */
			const req = httpMocks.createRequest({
				method: 'GET',
				headers: {
					origin: 'http://localhost:8080',
					referer: 'http://example.com/helloworld/'
				}
			})
			const res = httpMocks.createResponse()
			const appconfig = {
				headers: {
					'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS, POST',
					'Access-Control-Allow-Headers': 'Authorization, Content-Type, Origin',
					'Access-Control-Allow-Origin': 'http://localhost:8080',
					'Access-Control-Max-Age': '1296000'
				}
			}
			const fn = serveHttp((req, res) => {
				res.status(200).send('Hello World')
				return res
			}, appconfig)
			return fn(req, res).then(({req, res}) => {
				assert.isOk(req)
				assert.equal(res._getData(),'Hello World')
			})
		})))

/*eslint-disable */
describe('webfunc', () => 
	describe('#serveHttp: 05', () => 
		it('Should fail if CORS settings have been set up (http://boris.com) and the same origin policy if NOT satisfied.', () => {
			/*eslint-enable */
			const req = httpMocks.createRequest({
				method: 'GET',
				headers: {
					origin: 'http://localhost:8080',
					referer: 'http://example.com/helloworld/'
				}
			})
			const res = httpMocks.createResponse()
			const appconfig = {
				headers: {
					'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS, POST',
					'Access-Control-Allow-Headers': 'Authorization, Content-Type, Origin',
					'Access-Control-Allow-Origin': 'http://boris.com',
					'Access-Control-Max-Age': '1296000'
				}
			}
			const fn = serveHttp((req, res) => {
				res.status(200).send('Hello World')
				return res
			}, appconfig)
			return fn(req, res).then(({req, res}) => {
				assert.isOk(req)
				assert.equal(res.statusCode, 403)
				assert.equal(res._getData(), 'Forbidden - CORS issue. Origin \'http://localhost:8080\' is not allowed.')
			})
		})))

/*eslint-disable */
describe('webfunc', () => 
	describe('#serveHttp: 06', () => 
		it('Should NOT fail if CORS settings have been set up (http://boris.com, http://localhost:8080) and the same origin policy if NOT satisfied.', () => {
			/*eslint-enable */
			const req = httpMocks.createRequest({
				method: 'GET',
				headers: {
					origin: 'http://localhost:8080',
					referer: 'http://example.com/helloworld/'
				}
			})
			const res = httpMocks.createResponse()
			const appconfig = {
				headers: {
					'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS, POST',
					'Access-Control-Allow-Headers': 'Authorization, Content-Type, Origin',
					'Access-Control-Allow-Origin': 'http://boris.com, http://localhost:8080',
					'Access-Control-Max-Age': '1296000'
				}
			}
			const fn = serveHttp((req, res) => {
				res.status(200).send('Hello World')
				return res
			}, appconfig)
			return fn(req, res).then(({req, res}) => {
				assert.isOk(req)
				assert.equal(res._getData(),'Hello World')
			})
		})))

/*eslint-disable */
describe('webfunc', () => 
	describe('#serveHttp: 07', () => 
		it('Should fail if a POST request if sent and the CORS settings have been set up (POST not supported) and the same origin policy if NOT satisfied.', () => {
			/*eslint-enable */
			const req = httpMocks.createRequest({
				method: 'POST',
				headers: {
					origin: 'http://localhost:8080',
					referer: 'http://localhost:8080'
				}
			})
			const res = httpMocks.createResponse()
			const appconfig = {
				headers: {
					'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
					'Access-Control-Allow-Headers': 'Authorization, Content-Type, Origin',
					'Access-Control-Allow-Origin': 'http://boris.com, http://localhost:8080',
					'Access-Control-Max-Age': '1296000'
				}
			}
			const fn = serveHttp((req, res) => {
				res.status(200).send('Hello World')
				return res
			}, appconfig)
			return fn(req, res).then(({req, res}) => {
				assert.isOk(req)
				assert.equal(res.statusCode, 403)
				assert.equal(res._getData(), 'Forbidden - CORS issue. Method \'POST\' is not allowed.')
			})
		})))

/*eslint-disable */
describe('webfunc', () => 
	describe('#serveHttp: 08', () => 
		it('Should NOT fail if a PUT request if sent and the CORS settings have been set up (POST is supported) and the same origin policy if NOT satisfied.', () => {
			/*eslint-enable */
			const req = httpMocks.createRequest({
				method: 'PUT',
				headers: {
					origin: 'http://localhost:8080',
					referer: 'http://localhost:8080'
				}
			})
			const res = httpMocks.createResponse()
			const appconfig = {
				headers: {
					'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS, POST, PUT',
					'Access-Control-Allow-Headers': 'Authorization, Content-Type, Origin',
					'Access-Control-Allow-Origin': 'http://boris.com, http://localhost:8080',
					'Access-Control-Max-Age': '1296000'
				}
			}
			const fn = serveHttp((req, res) => {
				res.status(200).send('Hello World')
				return res
			}, appconfig)
			return fn(req, res).then(({req, res}) => {
				assert.isOk(req)
				assert.equal(res._getData(),'Hello World')
			})
		})))

/*eslint-disable */
describe('webfunc', () => 
	describe('#serveHttp: 09', () => 
		it('Should fail if a PUT request if sent and no CORS settings have been set up.', () => {
			/*eslint-enable */
			const req = httpMocks.createRequest({
				method: 'PUT',
				headers: {
					origin: 'http://localhost:8080',
					referer: 'http://localhost:8080'
				}
			})
			const res = httpMocks.createResponse()
			const appconfig = {}
			const fn = serveHttp((req, res) => {
				res.status(200).send('Hello World')
				return res
			}, appconfig)
			return fn(req, res).then(({req, res}) => {
				assert.isOk(req)
				assert.equal(res.statusCode, 403)
				assert.equal(res._getData(), 'Forbidden - CORS issue. Method \'PUT\' is not allowed.')
			})
		})))

/*eslint-disable */
describe('webfunc', () => 
	describe('#serveHttp: 10', () => 
		it(`Should contains CORS headers if they've been set up.`, () => {
			/*eslint-enable */
			const req = httpMocks.createRequest({
				method: 'GET',
				headers: {
					origin: 'http://localhost:8080',
					referer: 'http://localhost:8080'
				}
			})
			const res = httpMocks.createResponse()
			const appconfig = {
				headers: {
					'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS, POST',
					'Access-Control-Allow-Headers': 'Authorization, Content-Type, Origin',
					'Access-Control-Allow-Origin': 'http://boris.com, http://localhost:8080',
					'Access-Control-Max-Age': '1296000'
				}
			}
			const fn = serveHttp((req, res) => {
				res.status(200).send('Hello World')
				return res
			}, appconfig)
			return fn(req, res).then(({req, res}) => {
				assert.isOk(req)
				assert.equal(res._getData(),'Hello World')
				const headers = res._getHeaders()
				assert.isOk(headers)
				assert.equal(headers['Access-Control-Allow-Methods'], 'GET, HEAD, OPTIONS, POST')
				assert.equal(headers['Access-Control-Allow-Headers'], 'Authorization, Content-Type, Origin')
				assert.equal(headers['Access-Control-Allow-Origin'], 'http://boris.com, http://localhost:8080')
				assert.equal(headers['Access-Control-Max-Age'], '1296000')
			})
		})))

/*eslint-disable */
describe('webfunc', () => 
	describe('#serveHttp: 11', () => 
		it(`Should support one endpoint definition.`, () => {
			/*eslint-enable */
			const req_01 = httpMocks.createRequest({
				method: 'GET',
				headers: {
					origin: 'http://localhost:8080',
					referer: 'http://localhost:8080'
				},
				_parsedUrl: {
					pathname: '/users'
				}
			})
			const res_01 = httpMocks.createResponse()

			const appconfig = {
				headers: {
					'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS, POST',
					'Access-Control-Allow-Headers': 'Authorization, Content-Type, Origin',
					'Access-Control-Allow-Origin': 'http://boris.com, http://localhost:8080',
					'Access-Control-Max-Age': '1296000'
				}
			}

			const fn = serveHttp(app.get('/users', (req, res) => { res.status(200).send('Hello User'); return res }), appconfig)

			const result_01 = fn(req_01, res_01).then(() => {
				assert.equal(res_01._getData(),'Hello User')
				const headers = res_01._getHeaders()
				assert.isOk(headers)
				assert.equal(headers['Access-Control-Allow-Methods'], 'GET, HEAD, OPTIONS, POST')
				assert.equal(headers['Access-Control-Allow-Headers'], 'Authorization, Content-Type, Origin')
				assert.equal(headers['Access-Control-Allow-Origin'], 'http://boris.com, http://localhost:8080')
				assert.equal(headers['Access-Control-Max-Age'], '1296000')
			})

			return Promise.all([result_01])
		})))

/*eslint-disable */
describe('webfunc', () => 
	describe('#serveHttp: 12', () => 
		it(`Should support multiple endpoints definitions.`, () => {
			/*eslint-enable */
			const req_01 = httpMocks.createRequest({
				method: 'GET',
				headers: {
					origin: 'http://localhost:8080',
					referer: 'http://localhost:8080'
				},
				_parsedUrl: {
					pathname: '/users'
				}
			})
			const res_01 = httpMocks.createResponse()

			const req_02 = httpMocks.createRequest({
				method: 'GET',
				headers: {
					origin: 'http://localhost:8080',
					referer: 'http://localhost:8080'
				},
				_parsedUrl: {
					pathname: '/companies'
				}
			})
			const res_02 = httpMocks.createResponse()

			const appconfig = {
				headers: {
					'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS, POST',
					'Access-Control-Allow-Headers': 'Authorization, Content-Type, Origin',
					'Access-Control-Allow-Origin': 'http://boris.com, http://localhost:8080',
					'Access-Control-Max-Age': '1296000'
				}
			}

			const endpoints = [
				app.get('/users', (req, res) => { res.status(200).send('Hello User'); return res }),
				app.get('/companies', (req, res) => { res.status(200).send('Hello Companies'); return res })
			]

			const fn = serveHttp(endpoints, appconfig)

			const result_01 = fn(req_01, res_01).then(() => {
				assert.equal(res_01._getData(),'Hello User')
				const headers = res_01._getHeaders()
				assert.isOk(headers)
				assert.equal(headers['Access-Control-Allow-Methods'], 'GET, HEAD, OPTIONS, POST')
				assert.equal(headers['Access-Control-Allow-Headers'], 'Authorization, Content-Type, Origin')
				assert.equal(headers['Access-Control-Allow-Origin'], 'http://boris.com, http://localhost:8080')
				assert.equal(headers['Access-Control-Max-Age'], '1296000')
			})
			const result_02 = fn(req_02, res_02).then(() => {
				assert.equal(res_02._getData(),'Hello Companies')
				const headers = res_02._getHeaders()
				assert.isOk(headers)
				assert.equal(headers['Access-Control-Allow-Methods'], 'GET, HEAD, OPTIONS, POST')
				assert.equal(headers['Access-Control-Allow-Headers'], 'Authorization, Content-Type, Origin')
				assert.equal(headers['Access-Control-Allow-Origin'], 'http://boris.com, http://localhost:8080')
				assert.equal(headers['Access-Control-Max-Age'], '1296000')
			})

			return Promise.all([result_01, result_02])
		})))

/*eslint-disable */
describe('webfunc', () => 
	describe('#serveHttp: 13', () => 
		it(`Should support simple single routing with parameters and querystring.`, () => {
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
				method: 'GET',
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
				method: 'GET',
				headers: {
					origin: 'http://localhost:8080',
					referer: 'http://localhost:8080'
				},
				_parsedUrl: {
					pathname: '/'
				}
			})
			const res_03 = httpMocks.createResponse()

			const appconfig = {
				headers: {
					'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS, POST',
					'Access-Control-Allow-Headers': 'Authorization, Content-Type, Origin',
					'Access-Control-Allow-Origin': 'http://boris.com, http://localhost:8080',
					'Access-Control-Max-Age': '1296000'
				}
			}

			const fn = serveHttp('/users/{username}', (req, res, params) => res.status(200).send(`Hello ${params.username}${params.lastname ? ` ${params.lastname}` : ''}`), appconfig)

			const result_01 = fn(req_01, res_01).then(() => {
				assert.equal(res_01._getData(),'Hello nicolas')
				const headers = res_01._getHeaders()
				assert.isOk(headers)
				assert.equal(headers['Access-Control-Allow-Methods'], 'GET, HEAD, OPTIONS, POST')
				assert.equal(headers['Access-Control-Allow-Headers'], 'Authorization, Content-Type, Origin')
				assert.equal(headers['Access-Control-Allow-Origin'], 'http://boris.com, http://localhost:8080')
				assert.equal(headers['Access-Control-Max-Age'], '1296000')
			})
			const result_02 = fn(req_02, res_02).then(() => {
				assert.equal(res_02._getData(),'Hello nicolas dao')
				const headers = res_02._getHeaders()
				assert.isOk(headers)
				assert.equal(headers['Access-Control-Allow-Methods'], 'GET, HEAD, OPTIONS, POST')
				assert.equal(headers['Access-Control-Allow-Headers'], 'Authorization, Content-Type, Origin')
				assert.equal(headers['Access-Control-Allow-Origin'], 'http://boris.com, http://localhost:8080')
				assert.equal(headers['Access-Control-Max-Age'], '1296000')
			})
			const result_03 = fn(req_03, res_03).then(({req, res}) => {
				assert.isOk(req)
				assert.equal(res.statusCode, 404)
				assert.equal(res._getData(), 'Endpoint \'/\' not found.')
			})

			return Promise.all([result_01, result_02, result_03])
		})))

/*eslint-disable */
describe('webfunc', () => 
	describe('#serveHttp: 14', () => 
		it(`Should support complex routing with parameters and querystring.`, () => {
			/*eslint-enable */
			const req_01 = httpMocks.createRequest({
				method: 'GET',
				headers: {
					origin: 'http://localhost:8080',
					referer: 'http://localhost:8080'
				},
				_parsedUrl: {
					pathname: '/users/nicolas/account/1234'
				}
			})
			const res_01 = httpMocks.createResponse()

			const req_02 = httpMocks.createRequest({
				method: 'GET',
				headers: {
					origin: 'http://localhost:8080',
					referer: 'http://localhost:8080'
				},
				_parsedUrl: {
					pathname: '/company/neap'
				},
				query: { hello: 'world' }
			})
			const res_02 = httpMocks.createResponse()

			const appconfig = {
				headers: {
					'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS, POST',
					'Access-Control-Allow-Headers': 'Authorization, Content-Type, Origin',
					'Access-Control-Allow-Origin': 'http://boris.com, http://localhost:8080',
					'Access-Control-Max-Age': '1296000'
				}
			}

			const endpoints = [
				app.get('/users/{username}/account/{accountId}', (req, res, params) => { 
					res.status(200).send(`Hello ${params.username} (account: ${params.accountId})`)
					return res 
				}),
				app.get('/company/{name}', (req, res, params) => { 
					res.status(200).send(`Hello ${params.name} (Hello: ${params.hello})`)
					return res 
				})
			]

			const fn = serveHttp(endpoints, appconfig)

			const result_01 = fn(req_01, res_01).then(() => {
				assert.equal(res_01._getData(),'Hello nicolas (account: 1234)')
				const headers = res_01._getHeaders()
				assert.isOk(headers)
				assert.equal(headers['Access-Control-Allow-Methods'], 'GET, HEAD, OPTIONS, POST')
				assert.equal(headers['Access-Control-Allow-Headers'], 'Authorization, Content-Type, Origin')
				assert.equal(headers['Access-Control-Allow-Origin'], 'http://boris.com, http://localhost:8080')
				assert.equal(headers['Access-Control-Max-Age'], '1296000')
			})
			const result_02 = fn(req_02, res_02).then(() => {
				assert.equal(res_02._getData(),'Hello neap (Hello: world)')
				const headers = res_02._getHeaders()
				assert.isOk(headers)
				assert.equal(headers['Access-Control-Allow-Methods'], 'GET, HEAD, OPTIONS, POST')
				assert.equal(headers['Access-Control-Allow-Headers'], 'Authorization, Content-Type, Origin')
				assert.equal(headers['Access-Control-Allow-Origin'], 'http://boris.com, http://localhost:8080')
				assert.equal(headers['Access-Control-Max-Age'], '1296000')
			})

			return Promise.all([result_01, result_02])
		})))

/*eslint-disable */
describe('webfunc', () => 
	describe('#serveHttp: 15', () => 
		it(`Should fail at build time if bad arguments are passed to the 'serveHttp' method.`, () => {
			/*eslint-enable */
			const appconfig = {
				headers: {
					'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS, POST',
					'Access-Control-Allow-Headers': 'Authorization, Content-Type, Origin',
					'Access-Control-Allow-Origin': 'http://boris.com, http://localhost:8080',
					'Access-Control-Max-Age': '1296000'
				}
			}

			const endpoints = [
				app.get('/users/{username}/account/{accountId}', (req, res, params) => { 
					res.status(200).send(`Hello ${params.username} (account: ${params.accountId})`)
					return res 
				}),
				app.get('/company/{name}', (req, res, params) => { 
					res.status(200).send(`Hello ${params.name} (Hello: ${params.hello})`)
					return res 
				})
			]

			assert.throws(() => serveHttp('/users/{username}', endpoints, appconfig), Error, 'Wrong argument exception. If the first argument of the \'serveHttp\' method is a route, then the second argument must be a function similar to (req, res, params) => ...')
			assert.throws(() => serveHttp('/users/{username}', appconfig), Error, 'Wrong argument exception. If the first argument of the \'serveHttp\' method is a route, then the second argument must be a function similar to (req, res, params) => ...')
			assert.throws(() => serveHttp(), Error, 'Wrong argument exception. The first argument of the \'serveHttp\' method must either be a route, a function similar to (req, res, params) => ... or an array of endpoints.')
		})))

/*eslint-disable */
describe('webfunc', () => 
	describe('#serveHttp: 16', () => 
		it(`Should accept any http method with 'app.any'.`, () => {
			/*eslint-enable */
			const req_01 = httpMocks.createRequest({
				method: 'GET',
				headers: {
					origin: 'http://localhost:8080',
					referer: 'http://localhost:8080'
				},
				_parsedUrl: {
					pathname: '/users/nicolas/account/1234'
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
					pathname: '/users/nicolas/account/1234'
				}
			})
			const res_02 = httpMocks.createResponse()

			const appconfig = {
				headers: {
					'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS, POST',
					'Access-Control-Allow-Headers': 'Authorization, Content-Type, Origin',
					'Access-Control-Allow-Origin': 'http://boris.com, http://localhost:8080',
					'Access-Control-Max-Age': '1296000'
				}
			}

			const endpoints = [
				app.any('/users/{username}/account/{accountId}', (req, res, params) => { 
					res.status(200).send(`Hello ${params.username} (account: ${params.accountId})`)
					return res 
				})
			]

			const fn = serveHttp(endpoints, appconfig)

			const result_01 = fn(req_01, res_01).then(() => {
				assert.equal(res_01._getData(),'Hello nicolas (account: 1234)')
				const headers = res_01._getHeaders()
				assert.isOk(headers)
				assert.equal(headers['Access-Control-Allow-Methods'], 'GET, HEAD, OPTIONS, POST')
				assert.equal(headers['Access-Control-Allow-Headers'], 'Authorization, Content-Type, Origin')
				assert.equal(headers['Access-Control-Allow-Origin'], 'http://boris.com, http://localhost:8080')
				assert.equal(headers['Access-Control-Max-Age'], '1296000')
			})
			const result_02 = fn(req_02, res_02).then(() => {
				assert.equal(res_02._getData(),'Hello nicolas (account: 1234)')
				const headers = res_02._getHeaders()
				assert.isOk(headers)
				assert.equal(headers['Access-Control-Allow-Methods'], 'GET, HEAD, OPTIONS, POST')
				assert.equal(headers['Access-Control-Allow-Headers'], 'Authorization, Content-Type, Origin')
				assert.equal(headers['Access-Control-Allow-Origin'], 'http://boris.com, http://localhost:8080')
				assert.equal(headers['Access-Control-Max-Age'], '1296000')
			})

			return Promise.all([result_01, result_02])
		})))

/*eslint-disable */
describe('webfunc', () => 
	describe('#serveHttp: 17', () => 
		it(`Should support an alternative/more verbose version endpoint definition API based on route.`, () => {
			/*eslint-enable */
			const req_01 = httpMocks.createRequest({
				method: 'GET',
				headers: {
					origin: 'http://localhost:8080',
					referer: 'http://localhost:8080'
				},
				_parsedUrl: {
					pathname: '/users/nicolas/account/1234'
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
					pathname: '/users/nicolas/account/1234'
				}
			})
			const res_02 = httpMocks.createResponse()

			const appconfig = {
				headers: {
					'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS, POST',
					'Access-Control-Allow-Headers': 'Authorization, Content-Type, Origin',
					'Access-Control-Allow-Origin': 'http://boris.com, http://localhost:8080',
					'Access-Control-Max-Age': '1296000'
				}
			}

			const endpoints = [
				app.route({
					path: '/users/{username}/account/{accountId}',
					method: null,
					next: (req, res, params) => { 
						res.status(200).send(`Hello ${params.username} (account: ${params.accountId})`)
						return res
					}
				})
			]

			const fn = serveHttp(endpoints, appconfig)

			const result_01 = fn(req_01, res_01).then(() => {
				assert.equal(res_01._getData(),'Hello nicolas (account: 1234)')
				const headers = res_01._getHeaders()
				assert.isOk(headers)
				assert.equal(headers['Access-Control-Allow-Methods'], 'GET, HEAD, OPTIONS, POST')
				assert.equal(headers['Access-Control-Allow-Headers'], 'Authorization, Content-Type, Origin')
				assert.equal(headers['Access-Control-Allow-Origin'], 'http://boris.com, http://localhost:8080')
				assert.equal(headers['Access-Control-Max-Age'], '1296000')
			})
			const result_02 = fn(req_02, res_02).then(() => {
				assert.equal(res_02._getData(),'Hello nicolas (account: 1234)')
				const headers = res_02._getHeaders()
				assert.isOk(headers)
				assert.equal(headers['Access-Control-Allow-Methods'], 'GET, HEAD, OPTIONS, POST')
				assert.equal(headers['Access-Control-Allow-Headers'], 'Authorization, Content-Type, Origin')
				assert.equal(headers['Access-Control-Allow-Origin'], 'http://boris.com, http://localhost:8080')
				assert.equal(headers['Access-Control-Max-Age'], '1296000')
			})

			return Promise.all([result_01, result_02])
		})))

/*eslint-disable */
describe('webfunc', () => 
	describe('#serveHttp: 18', () => 
		it(`Should support custom HttpHandler`, () => {
			/*eslint-enable */
			const req_01 = httpMocks.createRequest({
				method: 'GET',
				headers: {
					origin: 'http://localhost:8080',
					referer: 'http://localhost:8080'
				},
				_parsedUrl: {
					pathname: '/users/nicolas/account/1234'
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
					pathname: '/users/nicolas/byebye/5678'
				}
			})
			const res_02 = httpMocks.createResponse()

			const appconfig = {
				headers: {
					'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS, POST',
					'Access-Control-Allow-Headers': 'Authorization, Content-Type, Origin',
					'Access-Control-Allow-Origin': 'http://boris.com, http://localhost:8080',
					'Access-Control-Max-Age': '1296000'
				}
			}

			class HttpTest extends HttpHandler {
				constructor(options, httpNext) { super(options, httpNext) }
				get id() {
					return 'testHandler'
				}
				process(req, res, params) {
					res.status(200).send(`Hello ${params.username} (account: ${params.accountId})`)
					return super.process(req, res, params)
				}
			}

			class HttpTest2 extends HttpHandler {
				constructor(options, httpNext) { super(options, httpNext) }
				get id() {
					return 'testHandler2'
				}
				process(req, res, params) {
					res.status(200).send(`Bye Bye ${params.username} (account: ${params.accountId})`)
					return super.process(req, res, params)
				}
			}

			app.reset()
			/*eslint-disable */
			app.use(new HttpTest({ hello: 'world' }, (req, res, { request, err, options }) => {
				assert.isOk(request, 'request should be defined in HttpTest')
				assert.isOk(!err, 'err should not be defined in HttpTest')
				assert.isOk(options, 'options should be defined in HttpTest')
				assert.equal(request.username, 'nicolas')
				assert.equal(request.accountId, '1234')
				assert.equal(options.hello, 'world')
				assert.equal(res._getData(),'Hello nicolas (account: 1234)')
			}))
			app.use(new HttpTest2(null, (req, res, { request, err, options }) => {
				assert.isOk(request, 'request should be defined in HttpTest2')
				assert.isOk(!err, 'err should not be defined in HttpTest2')
				assert.isOk(options, 'options should be defined in HttpTest2')
				assert.equal(request.username, 'nicolas')
				assert.equal(request.accountId, '5678')
				assert.equal(options.hello, undefined)
				assert.equal(res._getData(),'Bye Bye nicolas (account: 5678)')
			}))
			/*eslint-enable */

			const endpoints = [
				app.route({
					path: '/users/{username}/account/{accountId}',
					method: null,
					/*eslint-disable */
					next: (req, res, params) => { return res },
					/*eslint-enable */
					handlerId: 'testHandler'
				}),
				app.route({
					path: '/users/{username}/byebye/{accountId}',
					method: null,
					/*eslint-disable */
					next: (req, res, params) => { return res },
					/*eslint-enable */
					handlerId: 'testHandler2'
				})
			]

			const fn = serveHttp(endpoints, appconfig)

			const result_01 = fn(req_01, res_01).then(() => {
				assert.equal(res_01._getData(),'Hello nicolas (account: 1234)')
				const headers = res_01._getHeaders()
				assert.isOk(headers)
				assert.equal(headers['Access-Control-Allow-Methods'], 'GET, HEAD, OPTIONS, POST')
				assert.equal(headers['Access-Control-Allow-Headers'], 'Authorization, Content-Type, Origin')
				assert.equal(headers['Access-Control-Allow-Origin'], 'http://boris.com, http://localhost:8080')
				assert.equal(headers['Access-Control-Max-Age'], '1296000')
			})
			const result_02 = fn(req_02, res_02).then(() => {
				assert.equal(res_02._getData(),'Bye Bye nicolas (account: 5678)')
				const headers = res_02._getHeaders()
				assert.isOk(headers)
				assert.equal(headers['Access-Control-Allow-Methods'], 'GET, HEAD, OPTIONS, POST')
				assert.equal(headers['Access-Control-Allow-Headers'], 'Authorization, Content-Type, Origin')
				assert.equal(headers['Access-Control-Allow-Origin'], 'http://boris.com, http://localhost:8080')
				assert.equal(headers['Access-Control-Max-Age'], '1296000')
			})

			return Promise.all([result_01, result_02])
		})))

/*eslint-disable */
describe('webfunc', () => 
	describe('#serveHttp: 19', () => 
		it(`Should support chain of HttpHandlers.`, () => {
			/*eslint-enable */
			const req_01 = httpMocks.createRequest({
				method: 'GET',
				headers: {
					origin: 'http://localhost:8080',
					referer: 'http://localhost:8080'
				},
				_parsedUrl: {
					pathname: '/users/nicolas/account/1234'
				}
			})
			const res_01 = httpMocks.createResponse()

			const appconfig = {
				headers: {
					'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS, POST',
					'Access-Control-Allow-Headers': 'Authorization, Content-Type, Origin',
					'Access-Control-Allow-Origin': 'http://boris.com, http://localhost:8080',
					'Access-Control-Max-Age': '1296000'
				}
			}

			class HttpTest extends HttpHandler {
				constructor(options, httpNext) { super(options, httpNext) }
				get id() {
					return 'testHandler'
				}
				process(req, res, params) {
					res.set('Hello', 'World')
					return super.process(req, res, params)
				}
			}

			class HttpTest2 extends HttpHandler {
				constructor(options, httpNext) { super(options, httpNext) }
				get id() {
					return 'testHandler2'
				}
				process(req, res, params) {
					res.set('Firstname', 'Gimpy')
					return super.process(req, res, params)
				}
			}

			class HttpTest3 extends HttpHandler {
				constructor(options, httpNext) { super(options, httpNext) }
				get id() {
					return 'testHandler3'
				}
				process(req, res, params) {
					res.set('Lastname', 'Cool')
					return super.process(req, res, params)
				}
			}

			const h1 = new HttpTest()
			h1
				.setNextHandler(new HttpTest2())
				.setNextHandler(new HttpTest3())

			app.reset()
			app.use(h1)

			const endpoints = [
				app.route({
					path: '/users/{username}/account/{accountId}',
					method: null,
					/*eslint-disable */
					next: (req, res, params) => { return res },
					/*eslint-enable */
					handlerId: 'testHandler'
				})
			]

			const fn = serveHttp(endpoints, appconfig)

			const result_01 = fn(req_01, res_01).then(() => {
				const headers = res_01._getHeaders()
				assert.isOk(headers)
				assert.equal(headers['Firstname'], 'Gimpy')
				assert.equal(headers['Lastname'], 'Cool')
				assert.equal(headers['Hello'], 'World')
				assert.equal(headers['Access-Control-Allow-Methods'], 'GET, HEAD, OPTIONS, POST')
				assert.equal(headers['Access-Control-Allow-Headers'], 'Authorization, Content-Type, Origin')
				assert.equal(headers['Access-Control-Allow-Origin'], 'http://boris.com, http://localhost:8080')
				assert.equal(headers['Access-Control-Max-Age'], '1296000')
			})

			return Promise.all([result_01])
		})))
