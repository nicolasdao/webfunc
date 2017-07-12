/**
 * Copyright (c) 2017, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
const shell = require('shelljs')

const logs = limit => {
	if (limit)
		shell.exec(`functions logs read --limit=${limit}`)
	else
		shell.exec('functions logs read')
}

module.exports = {
	logs
}