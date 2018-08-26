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
const { login } = require('./src/utils/account')
const project = require('./src/utils/project')

program
	.version('1.0.0')
	.command('login [provider]')
	.usage(`Login to your Google Cloud (${cmd('webfunc login gcp')}) or AWS (${cmd('webfunc login aws')}) account. Default is 'gcp' (${cmd('webfunc login')}). `)
	.option('-d, --debug', 'Show debugging messages.')
	.action((provider='gcp', options) => {
		if (provider == 'gcp')
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
		return project.updateCurrent(options)
	})

program.parse(process.argv)