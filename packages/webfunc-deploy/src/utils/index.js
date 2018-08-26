/**
 * Copyright (c) 2018, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
const fs = require('fs')

const fileExists = p => new Promise((onSuccess, onFailure) => fs.exists(p, exists => exists ? onSuccess(p) : onFailure(p)))

const readFile = filePath => new Promise((onSuccess, onFailure) => fs.readFile(filePath, 'utf8', (err, data) => err ? onFailure(err) : onSuccess(data)))

const writeToFile = (filePath, stringContent) => new Promise((onSuccess, onFailure) => fs.writeFile(filePath, stringContent, err => 
	err ? onFailure(err) : onSuccess()))

const delay = timeout => new Promise(onSuccess => {
	setTimeout(onSuccess, timeout)
})

const wait = (stopWaiting, timeout=300000, start) => Promise.resolve(null).then(() => {
	const now = Date.now()
	if (!start)
		start = now
	
	if ((now - start) > timeout)
		throw new Error('timeout')
	
	if (stopWaiting())
		return
	else
		return delay(2000).then(() => wait(stopWaiting, timeout, start))
})

module.exports = {
	file: {
		read: readFile,
		write: writeToFile,
		exists: fileExists
	},
	promise: {
		delay,
		wait
	}
}