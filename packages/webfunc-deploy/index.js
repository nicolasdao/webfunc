#!/usr/bin/env node

/**
 * Copyright (c) 2018, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

'use strict'

const program = require('commander')
const { cmd, info } = require('./src/utils/console')
const { login } = require('./src/providers/google/account')
const project = require('./src/providers/google/project')
const deploy = require('./src')

program
	.version('1.0.0')
	.command('login [provider]')
	.usage(`Login to your Google Cloud (${cmd('webfunc login google')}) or AWS (${cmd('webfunc login aws')}) account. Default is 'google' (${cmd('webfunc login')}). `)
	.option('-d, --debug', 'Show debugging messages.')
	.action((provider='google', options) => {
		if (provider == 'google')
			return login(options)
				.then(() => {
					console.log(info('Awesome! You\'re now logged in.'))
					console.log(info(`If you want to switch to another project, simply type ${cmd('webfunc switch')}.`))
					process.exit(1)
				})
	})

program
	.command('switch')
	.usage('Switch to another project in your current cloud account (i.e., either Google Cloud or AWS). ')
	.option('-d, --debug', 'Show debugging messages.')
	.action((options) => {
		return project.updateCurrent(options).then(() => process.exit(1))
	})

program
	.command('deploy [provider]')
	.usage('Deploy nodejs project to the specified cloud provider (i.e., either Google Cloud or AWS). Default provider is \'google\'')
	.option('-d, --debug', 'Show debugging messages.')
	.action((provider='google', options) => {
		return deploy(provider, options)
	})

program.parse(process.argv)





