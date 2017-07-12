/**
 * Copyright (c) 2017, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
const _ = require('lodash')
const shell = require('shelljs')
/*eslint-disable */
const colors = require('colors')
/*eslint-enable */
const  { askQuestion } = require('./utilities')

const preQ1 = functionsNotInstalled => functionsNotInstalled 
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

const preQ2 = gcloudNotInstalled => gcloudNotInstalled 
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

const projectNameQuestion = () => askQuestion(`
project name: `.cyan)
	.then(answer => {
		if (answer)
			return { projectName: answer }
		else {
			console.log('You must choose a name!'.red)
			return projectNameQuestion()
		}
	})

const projectVersionQuestion = options => askQuestion('project version: (1.0.0) '.cyan)
	.then(answer => Object.assign(options, { projectVersion: answer || '1.0.0' }))

const entryPointQuestion = options => askQuestion(`Google Cloud Function entry-point (no spaces, no hyphens): (${options.projectName.replace(' ', '').replace('-', '')}) `.cyan)
	.then(answer => Object.assign(options, { entryPoint: !answer || answer == '' ? options.projectName.replace(' ', '').replace('-', '') : answer }))

const googleCloudProjectQuestion = options => askQuestion('Google Cloud Project(no spaces): '.cyan)
	.then(answer => {
		if (!answer || answer == '') {
			console.log('You must define a Google Cloud Project!'.red)
			return googleCloudProjectQuestion(options)
		}
		else
			return Object.assign(options, { googleProject: answer })
	})

const googleFunctionNameQuestion = options => askQuestion(`Google Cloud Function name : (${options.projectName.toLowerCase().split(' ').join('-')}) `.cyan)
	.then(answer => Object.assign(options, { functionName: !answer || answer == '' ? options.projectName.toLowerCase().split(' ').join('-') : answer }))

const bucketQuestion = (options) => askQuestion('Google Cloud Function bucket(no spaces): '.cyan)
	.then(answer => {
		if (answer)
			return Object.assign(options, { bucket: answer.toLowerCase().split(' ').join('') })
		else {
			console.log('You must define a bucket!'.red)
			return bucketQuestion(options)
		}
	})

const triggerQuestion = options => askQuestion(`Google Cloud Function trigger:
  [1] HTTP
  [2] Pub/Sub
  [3] Storage
Choose one of the above: ([1]): `.cyan)
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
	const functionsNotInstalled = !shell.exec('which functions', {silent:true}).stdout
	return preQ1(functionsNotInstalled)
		.then(() => {
			const gcloudNotInstalled = !shell.exec('which gcloud', {silent:true}).stdout
			return preQ2(gcloudNotInstalled)
		})
}

const askSimpleWebAppQuestions = () => 
	askPrerequisiteQuestions()
		.then(() => projectNameQuestion())
		.then(options => projectVersionQuestion(options))
		.then(options => googleFunctionNameQuestion(options))
		.then(options => triggerQuestion(options))
		.then(options => entryPointQuestion(options))
		.then(options => googleCloudProjectQuestion(options))
		.then(options => bucketQuestion(options))

module.exports = {
	askSimpleWebAppQuestions
}



