/**
 * Copyright (c) 2017, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
/*eslint-disable */
const colors = require('colors')
/*eslint-enable */
const replace = require('replace')
const path = require('path')
const u = require('./utilities')
const createDir = u.createDir
const copyFolderContent = u.copyFolderContent

const createApp = ({ projectName, projectVersion, functionName, trigger, entryPoint, googleProject, bucket, dest, templatePath }) => {
	/*eslint-disable */
	const destination = dest ? path.join(process.cwd(), dest) : process.cwd()
	/*eslint-enable */
	createDir(destination)
	copyFolderContent(templatePath, destination)
		.then(err => {
			if (err) return console.error(err)
			else {
				const pckjson = `${destination}/package.json`
				const indexjs = `${destination}/index.js`
				const webconfig = `${destination}/webconfig.json`
				replace({
					regex: '{{projectName}}',
					replacement: projectName,
					paths: [pckjson],
					recursive: true,
					silent: true,
				})
				replace({
					regex: '{{projectVersion}}',
					replacement: projectVersion,
					paths: [pckjson],
					recursive: true,
					silent: true,
				})
				replace({
					regex: '{{entryPoint}}',
					replacement: entryPoint,
					paths: [indexjs, webconfig],
					recursive: true,
					silent: true,
				})
				replace({
					regex: '{{bucket}}',
					replacement: bucket,
					paths: [webconfig],
					recursive: true,
					silent: true,
				})
				replace({
					regex: '{{trigger}}',
					replacement: trigger,
					paths: [webconfig],
					recursive: true,
					silent: true,
				})
				replace({
					regex: '{{functionName}}',
					replacement: functionName,
					paths: [webconfig],
					recursive: true,
					silent: true,
				})
				replace({
					regex: '{{googleProject}}',
					replacement: googleProject,
					paths: [webconfig],
					recursive: true,
					silent: true,
				})

				console.log(`New Google Cloud Function project '${projectName.italic.bold}' successfully created.`.green)
				/*eslint-disable */
				process.exit(1)
				/*eslint-enable */
			}
		}) 
}

module.exports = {
	createApp
}
