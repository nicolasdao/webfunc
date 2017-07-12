/**
 * Copyright (c) 2017, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
const shell = require('shelljs')
const fs = require('fs')
/*eslint-disable */
const colors = require('colors')
/*eslint-enable */

module.exports.deploy = env => {
	const startClock = Date.now()

	/*eslint-disable */
	const webconfigPath = path.join(process.cwd(), 'webconfig.json')
	/*eslint-enable */

	if (!fs.existsSync(webconfigPath)) {
		console.log('Missing webconfig.json file')
		/*eslint-disable */
		process.exit(1)
		/*eslint-enable */
	}
	
	const webconfig =  require(webconfigPath)

	// CONFIGURE ANY ENVIRONMENT BY ADDING A NEW CONFIG HERE.
	const config = !env
		? {
			GCPproject: '{{GCPproject}}',
			GCPbucket: '{{GCPbucket}',
			GCFname: '{{GCFname}}',
			GCFtrigger: '{{GCFtrigger}}',
			GCFmainFunc: '{{GCFmainFunc}}'
		} 
		: env == 'staging'
			? {
				GCPproject: '{{GCPproject}}',
				GCPbucket: '{{GCPbucket}',
				GCFname: '{{GCFname}}',
				GCFtrigger: '{{GCFtrigger}}',
				GCFmainFunc: '{{GCFmainFunc}}'
			} 
			: env == 'prod'
				? {
					GCPproject: '{{GCPproject}}',
					GCPbucket: '{{GCPbucket}',
					GCFname: '{{GCFname}}',
					GCFtrigger: '{{GCFtrigger}}',
					GCFmainFunc: '{{GCFmainFunc}}'
				} : (() => { 
					console.log(`${`Failed to deploy: Environment '${env}' is unknown. Please configure your 'deploy.js' for that environment.`.red}`)
					/*eslint-disable */
					process.exit(1)
					/*eslint-enable */
				})()

	if (!env) { // Local environment. Make Sure the Google function emulator is running.
		const emulatorsRunning = shell.exec('ps -ax | grep functions-emulator | wc -l', {silent:true}).stdout * 1

		if (emulatorsRunning < 3) {
			console.log('No emulator running. Time to start one!'.cyan)
			shell.exec('functions start')
		}

		console.log(`${'LOCALLY'.italic.bold} deploying entry-point ${config.GCFmainFunc.italic.bold} using trigger type ${config.GCFtrigger.italic.bold}`.cyan)
		shell.exec(`functions deploy ${config.GCFmainFunc} ${config.GCFtrigger}`)
	}
	else {
		console.log(`Deploying entry-point ${config.GCFmainFunc.italic.bold} to ${`GOOGLE CLOUD FUNCTION ${config.GCFname}`.italic.bold} located in project ${config.GCPproject.italic.bold} using trigger type ${config.GCFtrigger.italic.bold}`.cyan)
		shell.exec(`gcloud config set project ${config.GCPproject}`)
		shell.exec(`gcloud beta functions deploy ${config.GCFname} --stage-bucket ${config.GCPbucket} ${config.GCFtrigger} --entry-point ${config.GCFmainFunc}`)
	}

	console.log(`Deployment successful (${(Date.now() - startClock)/1000} sec.)`.green)
}



