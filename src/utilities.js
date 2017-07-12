/**
 * Copyright (c) 2017, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
const fs = require('fs')
const readline = require('readline')
const ncp = require('ncp').ncp
ncp.limit = 16 // nbr of concurrent process allocated to copy your files

const askQuestion = (question) => {
	const rl = readline.createInterface({
		/*eslint-disable */
		input: process.stdin,
		output: process.stdout
		/*eslint-enable */
	})
	/*eslint-disable */
	return (new Promise((resolve, reject) => rl.question(question, resolve)))
	/*eslint-enable */
		.then(answer => {
			rl.close()
			return answer
		})
}

const createDir = (dirname) => {
	if (!fs.existsSync(dirname)) {
		fs.mkdirSync(dirname)
	}
}

const copyFolderContent = (src, dest) => {
	/*eslint-disable */
	return new Promise((onSuccess, onFailure) => ncp(src, dest, onSuccess))
	/*eslint-enable */
}

module.exports = {
	askQuestion: askQuestion,
	copyFolderContent: copyFolderContent,
	createDir: createDir
}