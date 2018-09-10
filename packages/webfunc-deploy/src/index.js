/**
 * Copyright (c) 2018, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const { deploy: gcpDeploy, service: gcpService } = require('./providers/google/command')

const deploy = (provider='google', options={ debug:false }) => Promise.resolve(null).then(() => {
	if (provider == 'google')
		return gcpDeploy(options)
})

const list = (provider='google', options={ debug:false }) => Promise.resolve(null).then(() => {
	if (provider == 'google')
		return gcpService.list(options)
})

module.exports = {
	deploy,
	list
}