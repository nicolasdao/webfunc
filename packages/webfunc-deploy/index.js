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
const { deploy, list } = require('./src')

program
	.version('1.0.0')
	.command('login [provider]')
	.usage(`. This command logs the user to his/her Google Cloud (${cmd('webfunc login google')}) or AWS (${cmd('webfunc login aws')}) account. Default is 'google' (${cmd('webfunc login')}). `)
	.option('-d, --debug', 'Show debugging messages.')
	.action((provider='google', options) => {
		if (provider == 'google')
			return login({ debug: options.debug })
				.then(() => {
					console.log(info('Awesome! You\'re now logged in.'))
					console.log(info(`If you want to switch to another project, simply type ${cmd('webfunc switch')}.`))
					process.exit(1)
				})
	})

program
	.command('switch')
	.usage('. This command switches to another project in your current cloud account (i.e., either Google Cloud or AWS). ')
	.option('-d, --debug', 'Show debugging messages.')
	.action((options) => {
		return project.updateCurrent({ debug: options.debug }).then(() => process.exit(1))
	})

program
	.command('deploy [provider]')
	.usage('. This command deploys the targetted project to the specified cloud provider (i.e., either Google Cloud or AWS). Default provider is \'google\'')
	.option('-d, --debug', 'Show debugging messages.')
	.option('--dir <dir>', 'App\'s directory (default is current working directory).')
	.option('-c, --custom', 'Helps to override the \'hosting\' property of the app.json file.')
	.option('-e, --env <env>', 'Choose the \'hosting\' settings defined in the app.<env>.json file.')
	.action((provider='google', options) => { 
		return deploy(provider, { debug: options.debug, projectPath: options.dir, ignoreAppConfig: options.custom, env: options.env }).then(() => process.exit(1))
	})

program
	.command('list [provider]')
	.usage('List all the App Engine services currently active in your Google Cloud Platform project.')
	.option('-d, --debug', 'Show debugging messages.')
	.option('--dir <dir>', 'App\'s directory (default is current working directory).')
	.option('-g, --global', 'Choose a project from your account first before listing the services.')
	.option('-e, --env <env>', 'Choose the \'hosting\' settings defined in the app.<env>.json file.')
	.action((provider='google', options) => {
		return list(provider, { debug: options.debug, global: options.global, projectPath: options.dir, env: options.env }).then(() => process.exit(1))
	})

program.parse(process.argv)





