#!/usr/bin/env node
/**
 * Copyright (c) 2017, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
'use strict'

const program = require('commander')
/*eslint-disable */
const colors = require('colors')
/*eslint-enable */
const { askProjectQuestions } = require('./src/questions')
const { createApp } = require('./src/projectInit')
const { deploy } = require('./src/deploy')
const { logs } = require('./src/logs')

program
	.version('1.0.0')
	.command('init [dest]')
	.usage('Creates a new Google Cloud Function mini web server project.')
	.action(dest => askProjectQuestions().then(options => createApp(Object.assign(options, { dest }))))

program
	.command('deploy [env]')
	.usage('Deploys a Google Cloud Functions projects locally or to a Google Cloud Account.')
	.action(env => deploy(env))

program
	.command('logs [limit]')
	.usage('Access local logs.')
	.action(limit => logs(limit))

/*eslint-disable */
program.parse(process.argv) 
/*eslint-enable */
