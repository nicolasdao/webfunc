/**
 * Copyright (c) 2018, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const getToken = require('./getToken')
const project = require('./project')

const login = (options={ debug:false }) => getToken(Object.assign({}, options || {}, { refresh: true, origin: 'login' }))
	.then(() => project.updateCurrent(options))

module.exports = {
	login
}