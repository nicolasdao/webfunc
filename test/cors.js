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
describe('cors: #01', () => 
	it(`Should set the response's origin header to the request's origin if it matches the configured list in CORS.`, () => {
		/*eslint-enable */
		const req = httpMocks.createRequest({
			method: 'GET',
			headers: {
				origin: 'http://localhost:8080',
				referer: 'http://localhost:8080'
			}
		})
		const res = httpMocks.createResponse()
		const corsSetup = cors({
			origins: ['http://boris.com', 'http://localhost:8080'],
			methods: ['GET', 'HEAD', 'OPTIONS', 'POST'],
			allowedHeaders: ['Authorization', 'Content-Type', 'Origin'],
			maxAge: 1296000
		})

		app.reset()
		app.all(corsSetup, (req, res) => res.status(200).send('Hello World'))
		return app.handleEvent()(req, res).then(() => {
			assert.isOk(req)
			assert.equal(res._getData(),'Hello World')
			const headers = res._getHeaders()
			assert.isOk(headers)
			assert.equal(headers['Access-Control-Expose-Headers'], 'Authorization, Content-Type, Origin')
			assert.equal(headers['Access-Control-Allow-Origin'], 'http://localhost:8080')
		})
	}))

/*eslint-disable */
describe('cors: #02', () => 
	it(`Should set the response's origin header to null if the origin does not match the configured list in CORS.`, () => {
		/*eslint-enable */
		const req = httpMocks.createRequest({
			method: 'GET',
			headers: {
				origin: 'http://localhost:8080',
				referer: 'http://localhost:8080'
			}
		})
		const res = httpMocks.createResponse()
		const corsSetup = cors({
			origins: ['http://boris.com'],
			methods: ['GET', 'HEAD', 'OPTIONS', 'POST'],
			allowedHeaders: ['Authorization', 'Content-Type', 'Origin'],
			maxAge: 1296000
		})

		app.reset()
		app.all(corsSetup, (req, res) => res.status(200).send('Hello World'))
		return app.handleEvent()(req, res).then(() => {
			assert.isOk(req)
			assert.equal(res._getData(),'Hello World')
			const headers = res._getHeaders()
			assert.isOk(headers)
			assert.equal(headers['Access-Control-Expose-Headers'], 'Authorization, Content-Type, Origin')
			assert.equal(headers['Access-Control-Allow-Origin'], 'null')
		})
	}))

/*eslint-disable */
describe('cors: #03', () => 
	it(`Should set a minimum set of CORS response's headers if the request is not an OPTIONS one.`, () => {
		/*eslint-enable */
		const req = httpMocks.createRequest({
			method: 'GET',
			headers: {
				origin: 'http://localhost:8080',
				referer: 'http://localhost:8080'
			}
		})
		const res = httpMocks.createResponse()
		const corsSetup = cors({
			origins: ['http://boris.com', 'http://localhost:8080'],
			methods: ['GET', 'HEAD', 'OPTIONS', 'POST'],
			allowedHeaders: ['Authorization', 'Content-Type', 'Origin'],
			maxAge: 1296000,
			credentials: true
		})

		app.reset()
		app.all(corsSetup, (req, res) => res.status(200).send('Hello World'))
		return app.handleEvent()(req, res).then(() => {
			assert.isOk(req)
			assert.equal(res._getData(),'Hello World')
			const headers = res._getHeaders()
			assert.isOk(headers)
			assert.equal(headers['Access-Control-Expose-Headers'], 'Authorization, Content-Type, Origin')
			assert.equal(headers['Access-Control-Allow-Origin'], 'http://localhost:8080')
			assert.equal(headers['Access-Control-Allow-Credentials'], 'true')
		})
	}))

/*eslint-disable */
describe('cors: #04', () => 
	it(`Should set all CORS response's headers if CORS is setup.`, () => {
		/*eslint-enable */
		const req = httpMocks.createRequest({
			method: 'GET',
			headers: {
				origin: 'http://localhost:8080',
				referer: 'http://localhost:8080'
			}
		})
		const res = httpMocks.createResponse()
		const corsSetup = cors({
			origins: ['http://boris.com', 'http://localhost:8080'],
			methods: ['GET', 'HEAD', 'OPTIONS', 'POST'],
			allowedHeaders: ['Authorization', 'Content-Type', 'Origin'],
			maxAge: 1296000
		})

		app.reset()
		app.all(corsSetup, (req, res) => res.status(200).send('Hello World'))
		return app.handleEvent()(req, res).then(() => {
			assert.isOk(req)
			assert.equal(res._getData(),'Hello World')
			const headers = res._getHeaders()
			assert.isOk(headers)
			assert.equal(headers['Access-Control-Expose-Headers'], 'Authorization, Content-Type, Origin')
			assert.equal(headers['Access-Control-Allow-Origin'], 'http://localhost:8080')
			assert.equal(headers['Access-Control-Allow-Headers'], 'Authorization, Content-Type, Origin')
			assert.equal(headers['Access-Control-Allow-Methods'], 'GET, HEAD, OPTIONS, POST')
			assert.equal(headers['Access-Control-Max-Age'], '1296000')
		})
	}))

/*eslint-disable */
describe('cors: #05', () => 
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

		const req_01_cors = cors({
			origins: ['http://boris.com', 'http://localhost:8080'],
			methods: ['GET', 'HEAD', 'OPTIONS'],
			allowedHeaders: ['Authorization', 'Content-Type', 'Origin'],
			maxAge: 1296000
		})

		app.reset()
		app.all('/Users/:username', req_01_cors, (req, res) => res.status(200).send(`Hello ${req.params.username}${req.params.lastname ? ` ${req.params.lastname}` : ''}`))

		const result_01 = app.handleEvent()(req_01, res_01).then(() => {
			assert.equal(res_01._getData(),'Hello nicolas')
			const headers = res_01._getHeaders()
			assert.isOk(headers)
			assert.equal(headers['Access-Control-Expose-Headers'], 'Authorization, Content-Type, Origin')
			assert.equal(headers['Access-Control-Allow-Origin'], 'http://localhost:8080')
		})
		const result_02 = app.handleEvent()(req_02, res_02).then(() => {
			assert.equal(res_02.statusCode, 200)
			assert.equal(res_01._getData(),'Hello nicolas')
			const headers = res_02._getHeaders()
			assert.isOk(headers)
			assert.equal(headers['Access-Control-Expose-Headers'], 'Authorization, Content-Type, Origin')
			assert.equal(headers['Access-Control-Allow-Origin'], 'http://localhost:8080')
		})

		return Promise.all([result_01, result_02])
	}))



