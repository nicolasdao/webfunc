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
describe('app', () => 
	describe('#handleEvent: 01', () => 
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

			app.reset()
			app.get('/users', (req, res) => res.status(200).send('Hello User'))
			return app.handleEvent()(req_01, res_01).then(() => {				
				assert.equal(res_01._getData(),'Hello User')
			})
		})))

/*eslint-disable */
describe('app', () => 
	describe('#handleEvent: 02', () => 
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

			app.reset()
			app.get('/users', (req, res) => res.status(200).send('Hello User'))
			app.get('/Companies', (req, res) => res.status(200).send('Hello Companies'))
			const result_01 = app.handleEvent()(req_01, res_01).then(() => {
				assert.equal(res_01._getData(),'Hello User')
			})

			const result_02 = app.handleEvent()(req_02, res_02).then(() => {
				assert.equal(res_02._getData(),'Hello Companies')
			})

			return Promise.all([result_01, result_02])
		})))

/*eslint-disable */
describe('app', () => 
	describe('#handleEvent: 03', () => 
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

			app.reset()
			app.all('/Users/:username', (req, res) => res.status(200).send(`Hello ${req.params.username}${req.params.lastname ? ` ${req.params.lastname}` : ''}`))
			const result_01 = app.handleEvent()(req_01, res_01).then(() => {
				assert.equal(res_01._getData(),'Hello nicolas')
			})
			const result_02 = app.handleEvent()(req_02, res_02).then(() => {
				assert.equal(res_02._getData(),'Hello nicolas dao')
			})
			const result_03 = app.handleEvent()(req_03, res_03).then(() => {
				assert.equal(res_03.statusCode, 404)
				assert.equal(res_03._getData(), 'Endpoint \'/\' for method GET not found.')
			})

			return Promise.all([result_01, result_02, result_03])
		})))

/*eslint-disable */
describe('app', () => 
	describe('#handleEvent: 04', () => 
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

			app.reset()
			app.get('/users/:username/account/:accountId', (req, res) => res.status(200).send(`Hello ${req.params.username} (account: ${req.params.accountId})`))
			app.get('/company/:name', (req, res) => res.status(200).send(`Hello ${req.params.name} (Hello: ${req.params.hello})`))
			const result_01 = app.handleEvent()(req_01, res_01).then(() => {
				assert.equal(res_01._getData(),'Hello nicolas (account: 1234)')
			})
			const result_02 = app.handleEvent()(req_02, res_02).then(() => {
				assert.equal(res_02._getData(),'Hello neap (Hello: world)')
			})

			return Promise.all([result_01, result_02])
		})))

/*eslint-disable */
describe('app', () => 
	describe('#handleEvent: 05', () => 
		it(`Should accept any http method with 'app.all'.`, () => {
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

			app.reset()
			app.all('/users/:username/account/:accountId', (req, res) => res.status(200).send(`Hello ${req.params.username} (account: ${req.params.accountId})`))
			const result_01 = app.handleEvent()(req_01, res_01).then(() => {
				assert.equal(res_01._getData(),'Hello nicolas (account: 1234)')
			})
			const result_02 = app.handleEvent()(req_02, res_02).then(() => {
				assert.equal(res_02._getData(),'Hello nicolas (account: 1234)')
			})

			return Promise.all([result_01, result_02])
		})))

/*eslint-disable */
describe('app', () => 
	describe('#handleEvent: 06', () => 
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

			const testHandler = (req, res, next) => {
				res.status(200).send(`Hello ${req.params.username} (account: ${req.params.accountId})`)
				next()
			}
			const testHandler2 = (req, res, next) => {
				res.status(200).send(`Bye Bye ${req.params.username} (account: ${req.params.accountId})`)
				next()
			}

			app.reset()
			app.all('/users/:username/account/:accountId', testHandler)
			app.all('/users/:username/byebye/:accountId', testHandler2)
			const fn = app.handleEvent()

			const result_01 = fn(req_01, res_01).then(() => {
				assert.equal(res_01._getData(),'Hello nicolas (account: 1234)')
			})
			const result_02 = fn(req_02, res_02).then(() => {
				assert.equal(res_02._getData(),'Bye Bye nicolas (account: 5678)')
			})

			return Promise.all([result_01, result_02])
		})))

/*eslint-disable */
describe('app', () => 
	describe('#handleEvent: 07', () => 
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

			const testHandler1 = (req, res, next) => { res.set('Hello', 'World'); next() }
			const testHandler2 = (req, res, next) => { res.set('Firstname', 'Gimpy'); next() }
			const testHandler3 = (req, res, next) => { res.set('Lastname', 'Cool'); next() }

			app.reset()
			app.use(testHandler1)
			app.use(testHandler2)
			app.use(testHandler3)
			app.all('/users/:username/account/:accountId')
			const fn = app.handleEvent()

			const result_01 = fn(req_01, res_01).then(() => {
				const headers = res_01._getHeaders()
				assert.isOk(headers)
				assert.equal(headers['Firstname'], 'Gimpy')
				assert.equal(headers['Lastname'], 'Cool')
				assert.equal(headers['Hello'], 'World')
			})

			return Promise.all([result_01])
		})))

/*eslint-disable */
describe('app', () => 
	describe('#handleEvent: 08', () => 
		it(`Should support any path if no path have been defined in any route.`, () => {
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

			app.reset()
			app.get('/(.*)', (req, res) => res.status(200).send('Hello User'))
			const fn = app.handleEvent()

			const result_01 = fn(req_01, res_01).then(() => {
				assert.equal(res_01._getData(),'Hello User')
			})
			const result_02 = fn(req_02, res_02).then(() => {
				assert.equal(res_02._getData(),'Hello User')
			})

			return Promise.all([result_01, result_02])
		})))

/*eslint-disable */
describe('app', () => 
	describe('#handleEvent: 09', () => 
		it(`Should support collection of routes for a single response type.`, () => {
			/*eslint-enable */
			const req_01 = httpMocks.createRequest({
				method: 'GET',
				headers: {
					origin: 'http://localhost:8080',
					referer: 'http://localhost:8080'
				},
				_parsedUrl: {
					pathname: '/users/1'
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
					pathname: '/companies/2'
				}
			})
			const res_02 = httpMocks.createResponse()

			app.reset()
			app.get(['/users/:userId', '/companies/:companyId'], (req, res) => res.status(200).send(`Hello No. ${req.params.userId || req.params.companyId}`))
			const fn = app.handleEvent()

			const result_01 = fn(req_01, res_01).then(() => {
				assert.equal(res_01._getData(),'Hello No. 1')
			})
			const result_02 = fn(req_02, res_02).then(() => {
				assert.equal(res_02._getData(),'Hello No. 2')
			})

			return Promise.all([result_01, result_02])
		})))

/*eslint-disable */
describe('app', () => 
	describe('#handleEvent: 10', () => 
		it('Should capture the body of a POST request and interpret it as a JSON in the params argument.', () => {
			/*eslint-enable */
			const req = httpMocks.createRequest({
				method: 'POST',
				headers: {
					origin: 'http://localhost:8080',
					referer: 'http://localhost:8080'
				},
				body: {
					username: 'nic',
					password: '1234'
				},
				_parsedUrl: {
					pathname: '/users/create'
				}
			})
			const res = httpMocks.createResponse()
			
			app.reset()
			app.post('users/:action', (req, res) => res.status(200).send(`Action ${req.params.action}. The secret password of ${req.params.username} is ${req.params.password}`))
			const fn = app.handleEvent()

			return fn(req, res).then(() => {
				assert.isOk(req)
				assert.equal(res.statusCode, 200)
				assert.equal(res._getData(), 'Action create. The secret password of nic is 1234')
			})
		})))

/*eslint-disable */
describe('app', () => 
	describe('#handleEvent: 11', () => 
		it(`Should not extract any parameters from the payload or the route when the 'paramsMode' property of the now.json config is set to 'none'.`, () => {
			/*eslint-enable */
			const req = httpMocks.createRequest({
				method: 'POST',
				headers: {
					origin: 'http://localhost:8080',
					referer: 'http://localhost:8080'
				},
				body: {
					username: 'nic',
					password: '1234'
				},
				_parsedUrl: {
					pathname: '/users/create'
				}
			})
			const res = httpMocks.createResponse()
			const appconfig = {
				params: { mode: 'none' }
			}

			app.reset()
			app.use(appconfig)
			app.post('users/:action', (req, res) => res.status(200).send(`Action ${req.params.action}. The secret password of ${req.params.username} is ${req.params.password}`))
			const fn = app.handleEvent()
			
			return fn(req, res).then(() => {
				assert.isOk(req)
				assert.equal(res.statusCode, 200)
				assert.equal(res._getData(), 'Action undefined. The secret password of undefined is undefined')
			})
		})))

/*eslint-disable */
describe('app', () => 
	describe('#handleEvent: 12', () => 
		it(`Should not extract any route parameters when the 'paramsMode' property of the now.json config is set to 'body'.`, () => {
			/*eslint-enable */
			const req = httpMocks.createRequest({
				method: 'POST',
				headers: {
					origin: 'http://localhost:8080',
					referer: 'http://localhost:8080'
				},
				body: {
					username: 'nic',
					password: '1234'
				},
				_parsedUrl: {
					pathname: '/users/create'
				}
			})
			const res = httpMocks.createResponse()
			const appconfig = {
				params: { mode: 'body' }
			}

			app.reset()
			app.use(appconfig)
			app.post('users/:action', (req, res) => res.status(200).send(`Action ${req.params.action}. The secret password of ${req.params.username} is ${req.params.password}`))
			const fn = app.handleEvent()
			
			return fn(req, res).then(() => {
				assert.isOk(req)
				assert.equal(res.statusCode, 200)
				assert.equal(res._getData(), 'Action undefined. The secret password of nic is 1234')
			})
		})))

/*eslint-disable */
describe('app', () => 
	describe('#handleEvent: 13', () => 
		it(`Should not extract any body parameters when the 'paramsMode' property of the now.json config is set to 'route'.`, () => {
			/*eslint-enable */
			const req = httpMocks.createRequest({
				method: 'POST',
				headers: {
					origin: 'http://localhost:8080',
					referer: 'http://localhost:8080'
				},
				body: {
					username: 'nic',
					password: '1234'
				},
				_parsedUrl: {
					pathname: '/users/create'
				}
			})
			const res = httpMocks.createResponse()
			const appconfig = {
				params: { mode: 'route' }
			}

			app.reset()
			app.use(appconfig)
			app.post('users/:action', (req, res) => res.status(200).send(`Action ${req.params.action}. The secret password of ${req.params.username} is ${req.params.password}`))
			const fn = app.handleEvent()
			
			return fn(req, res).then(() => {
				assert.isOk(req)
				assert.equal(res.statusCode, 200)
				assert.equal(res._getData(), 'Action create. The secret password of undefined is undefined')
			})
		})))

/*eslint-disable */
describe('app', () => 
	describe('#handleEvent: 14', () => 
		it(`Should add metadata '__transactionId', '__receivedTime' and '__ellapsedMillis()' to the request object.`, () => {
			/*eslint-enable */
			const req = httpMocks.createRequest({
				method: 'POST',
				headers: {
					origin: 'http://localhost:8080',
					referer: 'http://localhost:8080'
				},
				body: {
					username: 'nic',
					password: '1234'
				},
				_parsedUrl: {
					pathname: '/users/create'
				}
			})
			const res = httpMocks.createResponse()
			const appconfig = {
				params: { mode: 'route' }
			}

			app.reset()
			app.use(appconfig)
			app.post('users/:action', (req, res) => res.status(200).send(`Action ${req.params.action}. The secret password of ${req.params.username} is ${req.params.password}`))
			const fn = app.handleEvent()

			assert.isOk(!req.__transactionId, '__transactionId should not exist prior to being processed by webfunc.')
			assert.isOk(!req.__receivedTime, '__receivedTime should not exist prior to being processed by webfunc.')
			assert.isOk(!req.__ellapsedMillis, '__ellapsedMillis should not exist prior to being processed by webfunc.')
			
			return fn(req, res).then(() => {
				assert.isOk(req.__transactionId, '__transactionId should exist.')
				assert.isOk(req.__receivedTime, '__receivedTime should exist.')
				assert.isOk(req.__ellapsedMillis, '__ellapsedMillis should exist.')
				assert.isOk(req.__ellapsedMillis() >= 0, '__ellapsedMillis() should exist.')
				const t1 = req.__ellapsedMillis()
				for (let i=0;i<5000000;i++) {
					/*eslint-disable */
					let r = 0
					/*eslint-enable */
				}
				assert.isOk(req.__ellapsedMillis() - t1 > 0, '__ellapsedMillis() should grow monotonously')
			})
		})))

/*eslint-disable */
describe('app', () => 
	describe('#handleEvent: 15', () => 
		it(`Should support preEvent and postEvent handler.`, () => {
			/*eslint-enable */
			const req_01 = httpMocks.createRequest({
				method: 'GET',
				headers: {
					origin: 'http://localhost:8080',
					referer: 'http://localhost:8080'
				},
				_parsedUrl: {
					pathname: '/users/1'
				}
			})
			const res_01 = httpMocks.createResponse()

			let preEventProof, postEventProof, eventProof, counter = 0

			app.reset()
			app.preEvent = () => {
				preEventProof = ++counter
			}
			app.postEvent = () => {
				postEventProof = ++counter
			}
			app.get(['/users/:userId', '/companies/:companyId'], (req, res) => {
				eventProof = ++counter
				res.status(200).send(`Hello No. ${req.params.userId || req.params.companyId}`)
			})
			const fn = app.handleEvent()

			const result_01 = fn(req_01, res_01).then(() => {
				assert.equal(res_01._getData(),'Hello No. 1')
				assert.equal(preEventProof, 1)
				assert.equal(eventProof, 2)
				assert.equal(postEventProof, 3)
			})

			return Promise.all([result_01])
		})))

/*eslint-disable */
describe('app', () => 
	describe('#handleEvent: 16', () => 
		it(`Should support an undetermined number of middleware for a specific endpoint.`, () => {
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
					pathname: '/'
				}
			})
			const res_02 = httpMocks.createResponse()

			const testHandler = (req, res, next) => {
				if (!req.params || typeof(req.params) != 'object') 
					req.params = {}

				Object.assign(req.params, { message1: 'Hello handler 0' })
				next()
			}
			const testHandler2 = (req, res, next) => {
				if (!req.params || typeof(req.params) != 'object') 
					req.params = {}

				Object.assign(req.params, { message2: 'Hello handler 1' })
				next()
			}

			const handlers = [testHandler, testHandler2]

			app.reset()
			app.all('/users/:username/account/:accountId', testHandler, testHandler2, (req, res) => res.status(200).send(`${req.params.message1} - ${req.params.message2}`))
			app.all('/', ...handlers.concat((req, res) => res.status(200).send(`${req.params.message1} - ${req.params.message2}`)))
			const fn = app.handleEvent()

			const result_01 = fn(req_01, res_01).then(() => {
				assert.equal(res_01._getData(),'Hello handler 0 - Hello handler 1')
			})

			const result_02 = fn(req_02, res_02).then(() => {
				assert.equal(res_02._getData(),'Hello handler 0 - Hello handler 1')
			})

			return Promise.all([result_01, result_02])
		})))

/*eslint-disable */
describe('app', () => 
	describe('#handleEvent: 17', () => 
		it(`Should support custom 'params' property name (e.g. from the default req.params to your req.myOwnWhatever ).`, () => {
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
				params: {
					propName: 'myOwnWhatever'
				}
			}

			app.reset()
			app.use(appconfig)
			app.all('/Users/:username', (req, res) => res.status(200).send(`Hello ${req.myOwnWhatever.username}${req.myOwnWhatever.lastname ? ` ${req.myOwnWhatever.lastname}` : ''}`))
			const result_01 = app.handleEvent()(req_01, res_01).then(() => {
				assert.equal(res_01._getData(),'Hello nicolas')
			})
			const result_02 = app.handleEvent()(req_02, res_02).then(() => {
				assert.equal(res_02._getData(),'Hello nicolas dao')
			})
			const result_03 = app.handleEvent()(req_03, res_03).then(() => {
				assert.equal(res_03.statusCode, 404)
				assert.equal(res_03._getData(), 'Endpoint \'/\' for method GET not found.')
			})

			return Promise.all([result_01, result_02, result_03])
		})))

/*eslint-disable */
describe('app', () => 
	describe('#createGCPRequestResponse', () => 
		it(`Should convert a Google event to an HTTP request object.`, () => {
			const body = new Buffer('This is an awesome message').toString('base64')
			/*eslint-enable */
			const event = {
				data: {
					attributes: {
						pathname: 'users',
						user: {
							firstName: 'Nic',
							lastName: 'Dao'
						}
					},
					data: body
				},
				resource: 'projects/super-project/topics/hello'
			}

			app.reset()
			const { req } = app.createGCPRequestResponse(event)
			assert.equal(req.headers.origin, 'projects/super-project/topics/hello', 'The origin should be \'projects/super-project/topics/hello\'.')
			assert.equal(req.params.user.firstName, 'Nic', 'First name should be \'Nic\'.')
			assert.equal(req.params.user.lastName, 'Dao', 'Last name should be \'Dao\'.')
			assert.equal(req._parsedUrl.pathname, '/users', 'Pathname should be \'/users\'.')
			assert.equal(req.body, 'This is an awesome message', 'body should be \'This is an awesome message\'.')
		})))

/*eslint-disable */
describe('app', () => 
	describe('#createAWSRequestResponse', () => 
		it(`Should convert an AWS event to an HTTP request object.`, () => {
			/*eslint-enable */
			const event = {
				firstName: 'Nic',
				lastName: 'Dao',
				httpMethod: 'POST',
				path: 'users/tony',
				queryStringParameters: { name: 'Nico' },
				body: {
					email: 'nic@neap.co',
					pwd: '1234'
				}
			}

			app.reset()
			const { req } = app.createAWSRequestResponse(event)
			assert.equal(req.params.firstName, 'Nic')
			assert.equal(req.params.lastName, 'Dao')
			assert.equal(req.method, 'POST')
			assert.equal(req._parsedUrl.pathname, '/users/tony')
			assert.equal(req.query.name, 'Nico')
			assert.equal(req.body.email, 'nic@neap.co')
			assert.equal(req.body.pwd, '1234')
			assert.equal(req.url, '/users/tony?name=Nico')
		})))

/*eslint-disable */
describe('app', () => 
	describe('#createAWSResponse', () => 
		it(`Should convert an AWS event to a request/response object and then convert the response back to an AWS response.`, () => {
			/*eslint-enable */
			const event = {
				firstName: 'Nic',
				lastName: 'Dao'
			}

			const corsSetup = cors({
				origins: ['http://boris.com'],
				methods: ['GET', 'HEAD', 'OPTIONS', 'POST'],
				allowedHeaders: ['Authorization', 'Content-Type', 'Origin'],
				maxAge: 1296000
			})

			app.reset()
			const { req, res } = app.createAWSRequestResponse(event)
			app.all(corsSetup, (req, res) => res.status(200).send(`Hello ${req.params.firstName} ${req.params.lastName}`))
			return app.handleEvent()(req, res).then(() => {
				const awsRes = app.createAWSResponse(res)
				assert.equal(awsRes.statusCode, 200)
				assert.equal(awsRes.body,'Hello Nic Dao')
				const headers = awsRes.headers
				assert.isOk(headers)
				assert.equal(headers['Access-Control-Expose-Headers'], 'Authorization, Content-Type, Origin')
				assert.equal(headers['Access-Control-Allow-Origin'], 'null')
			})
		})))





