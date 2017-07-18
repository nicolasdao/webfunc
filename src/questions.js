/**
 * Copyright (c) 2017, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
const _ = require('lodash')
const shell = require('shelljs')
const path = require('path')
/*eslint-disable */
const colors = require('colors')
/*eslint-enable */
const  { askQuestion } = require('./utilities')

const emulatorNotInstalledWarningQuestion = functionsNotInstalled => functionsNotInstalled 
	? askQuestion(`
${'WARNING'.bold.italic}: ${'Google Function Emulator'.italic} seems to not be installed on your machine.

You won't be able to run this project on your local machine. 
We recommend to install it globally: ${'npm install -g @google-cloud/functions-emulator'.bold.italic}

Do you want to ignore this warning? (y/n) `.yellow)
		.then(answer => {
			if (answer == 'n')
			/*eslint-disable */
                process.exit(1)
                /*eslint-enable */
		})
	: Promise.resolve('ok')

const gcloudNotInstalledWarningQuestion = gcloudNotInstalled => gcloudNotInstalled 
	? askQuestion(
		`${`
WARNING`.bold.italic}: The ${'gcloud SDK'.italic} seems to not be installed on your machine.

You won't be able to use your terminal to deploy this project to your Google Cloud Account. 
We recommend to install it (instructions here: ${'https://cloud.google.com/sdk/downloads'.underline.italic.blue}).

Do you want to ignore this warning? (y/n) `.yellow)
		.then(answer => {
			if (answer == 'n')
			/*eslint-disable */
                process.exit(1)
                /*eslint-enable */
		})
	: Promise.resolve('ok')

const projectTypeQuestion = (options = {}) => askQuestion(`project type:
  [1] Basic HTTP
  [2] GraphQL
Choose one of the above: ([1]) `.cyan)
	.then(answer => {
		if (!answer || answer == '')
			answer = 1

		const a = _.toNumber(answer)
		if (a != 1 && a != 2) {
			console.log(`'${a}' is not a valid project type.`.red)
			projectTypeQuestion(options)
		} else {
			let templatePath = null
			switch (a) {
			case 1:
				/*eslint-disable */
				templatePath = path.join(__dirname, '../' ,'templates/simpleWebApp')
				/*eslint-enable */
				break
			case 2:
				/*eslint-disable */
				templatePath = path.join(__dirname, '../' ,'templates/graphql')
				/*eslint-enable */
				break
			}

			return Object.assign(options, { templatePath })
		}
	})

const projectNameQuestion = (options = {}) => askQuestion(`project name: ${options.dest ? `(${sanitizeDest(options.dest)}) ` : ''}`.cyan)
	.then(answer => {
		if (answer)
			return Object.assign(options, { projectName: sanitizeProjectName(answer) })
		else if (options.dest)
			return Object.assign(options, { projectName: sanitizeDest(options.dest) })
		else {
			console.log('You must choose a name!'.red)
			return projectNameQuestion()
		}
	})

const projectVersionQuestion = (options = {}) => askQuestion('project version: (1.0.0) '.cyan)
	.then(answer => Object.assign(options, { projectVersion: answer || '1.0.0' }))

const entryPointQuestion = (options = {}) => askQuestion(`Google Cloud Function entry-point (no spaces, no hyphens): (${sanitizeEntryPoint(options.projectName)}) `.cyan)
	.then(answer => Object.assign(options, { entryPoint: !answer || answer == '' ? sanitizeEntryPoint(options.projectName) : sanitizeEntryPoint(answer) }))

const googleCloudProjectQuestion = (options = {}) => askQuestion(`Google Cloud Project: (${options.projectName.toLowerCase()}) `.cyan)
	.then(answer => Object.assign(options, { googleProject: answer || options.projectName.toLowerCase() }))

const googleFunctionNameQuestion = (options = {}) => askQuestion(`Google Cloud Function name : (${sanitizeFunctionName(options.projectName)}) `.cyan)
	.then(answer => Object.assign(options, { functionName: !answer || answer == '' ? sanitizeFunctionName(options.projectName) : sanitizeFunctionName(answer) }))

const bucketQuestion = (options) => askQuestion(`Google Cloud Function bucket: (${sanitizeBucket(options.projectName)}) `.cyan)
	.then(answer => Object.assign(options, { bucket: answer ? sanitizeBucket(answer) : sanitizeBucket(options.projectName) }))

const triggerQuestion = (options = {}) => askQuestion(`Google Cloud Function trigger:
  [1] HTTP
  [2] Pub/Sub
  [3] Storage
Choose one of the above: ([1]) `.cyan)
	.then(answer => {
		if (!answer || answer == '')
			answer = 1

		const a = _.toNumber(answer)
		if (a != 1 && a != 2 && a != 3) {
			console.log(`'${a}' is not a valid trigger.`.red)
			triggerQuestion(options)
		} else {
			let trigger = null
			switch (a) {
			case 1:
				trigger = '--trigger-http'
				break
			case 2:
				trigger = '--trigger-topic'
				break
			case 3:
				trigger = '--trigger-bucket'
				break
			}

			return Object.assign(options, { trigger })
		}
	})

const askPrerequisiteQuestions = () => {
	const gcloudNotInstalled = !shell.exec('which gcloud', {silent:true}).stdout
	return gcloudNotInstalledWarningQuestion(gcloudNotInstalled)
		.then(() => {
			const functionsNotInstalled = !shell.exec('which functions', {silent:true}).stdout
			return emulatorNotInstalledWarningQuestion(functionsNotInstalled)
		})
}

const sanitizeDest = dest => dest ? dest.split(' ').map(x => x.trim().toLowerCase()).join('') : null
const sanitizeProjectName = name => name ? name.split(' ').join('-') : null
const sanitizeEntryPoint = name => name ? name.split(' ').join('') : null
const sanitizeFunctionName = name => name ? name.trim().split(' ').map(x => x.toLowerCase()).join('-') : null
const sanitizeBucket = name => name ? name.trim().split(' ').map(x => x.toLowerCase()).join('-') : null

const askProjectQuestions = dest => 
	askPrerequisiteQuestions()
		.then(() => projectTypeQuestion({ dest }))
		.then(options => projectNameQuestion(options))
		.then(options => projectVersionQuestion(options))
		.then(options => googleFunctionNameQuestion(options))
		.then(options => triggerQuestion(options))
		.then(options => entryPointQuestion(options))
		.then(options => googleCloudProjectQuestion(options))
		.then(options => bucketQuestion(options))

module.exports = {
	askProjectQuestions
}



