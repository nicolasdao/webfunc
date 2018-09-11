/**
 * Copyright (c) 2018, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

/* global describe */
/* global it */

const { assert } = require('chai')
const { obj } = require('../src/utils')

describe('utils', () => {
	describe('obj', () => {
		describe('#merge', () => {
			it('01 - Should create deep merged non-referenced objects.', () => {
				const a = { user: { firstName: 'Nic', lastName: 'Dao' } }
				const b = { age: 37 }
				let result = obj.merge(a, b)
				assert.isOk(result.user, 'Error - 01')
				assert.equal(result.user.firstName, 'Nic', 'Error - 02')
				assert.equal(result.user.lastName, 'Dao', 'Error - 03')
				assert.equal(result.age, 37, 'Error - 04')
				result.age++
				assert.equal(result.age, 38, 'Error - 05')
				assert.equal(b.age, 37, 'Error - 06')
			})
			it('02 - Should only update leaf properties instead of overidding parent completely.', () => {
				const a = { user: { firstName: 'Nic', lastName: 'Dao', companies: [ 'Neap', 'Quivers' ] ,parent: { mum: { name: 'Domi', age: 64 } } } }
				const b = { age: 37 }
				const c = { user: { firstName: 'Nicolas', companies: [ 'Neap' ] ,parent: { mum: { name: 'Dominique' } } } }
				let result = obj.merge(a, b, c)
				assert.isOk(result.user, 'Error - 01')
				assert.equal(result.user.firstName, 'Nicolas', 'Error - 02')
				assert.equal(result.user.lastName, 'Dao', 'Error - 03')
				assert.equal(result.age, 37, 'Error - 04')
				assert.equal(result.user.companies.length, 1, 'Error - 05')
				assert.equal(result.user.companies[0], 'Neap', 'Error - 06')
				assert.isOk(result.user.parent, 'Error - 07')
				assert.isOk(result.user.parent.mum, 'Error - 08')
				assert.equal(result.user.parent.mum.name, 'Dominique', 'Error - 09')
				assert.equal(result.user.parent.mum.age, 64, 'Error - 10')
			})
		})
	})
})