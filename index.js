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
const { askSimpleWebAppQuestions } = require('./src/questions')
const { createSimpleWebApp } = require('./src/projectInit')

program
	.version('1.0.0')
	.command('init [dest]')
	.usage('Create a new Google Cloud Function mini web server project.')
	.action(dest => askSimpleWebAppQuestions().then(options => createSimpleWebApp(Object.assign(options, { dest }))))

/*eslint-disable */
program.parse(process.argv) 
/*eslint-enable */
