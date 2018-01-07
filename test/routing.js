/**
 * Copyright (c) 2018, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
const { assert } = require('chai')
const { getRouteDetails, matchRoute } = require('../src/routing')

/*eslint-disable */
describe('routing', () => 
	describe('#getRouteDetails', () => 
		it(`Should support the express standard for routing variables, i.e. support for ':'.`, () => {
			/*eslint-enable */
			const routes = getRouteDetails('users/:username/account/:id')
			assert.equal(routes.length, 1)
			const route = routes[0]
			assert.equal(route.name, '/users/:username/account/:id/')
			assert.isOk(route.params)
			assert.equal(route.params.length, 2)
			assert.equal(route.params[0], 'username')
			assert.equal(route.params[1], 'id')
		})))

/*eslint-disable */
describe('routing', () => 
	describe('#matchRoute', () => 
		it(`Should analyse a route and extract details from it.`, () => {
			/*eslint-enable */
			const routes = getRouteDetails('users/:username/account/:id/(.*)')
			let details = matchRoute('/users/nic/account/1/blabla', routes[0])
			assert.isOk(details)
			assert.isOk(details.parameters)
			assert.equal(details.parameters.username, 'nic')
			assert.equal(details.parameters.id, '1')
			details = matchRoute('/user/nic/account/1/blabla', routes[0])
			assert.isOk(!details)
		})))