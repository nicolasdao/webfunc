/**
 * Copyright (c) 2018, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
const { join } = require('path')
const { homedir } = require('os')
const { file } = require('./index')
const { info, error } = require('./console')

const CONFIGFILE = join(homedir(), '.webfunc.json')

const getAuthConfig = (options={ debug:false }) => Promise.resolve(null).then(() => {
	const { debug } = options || {}
	if (debug)
		console.log(info('Retrieving GCP config file stored in local storage.'))

	return file.exists(CONFIGFILE).then(() => file.read(CONFIGFILE)).then(c => {
		if (debug)
			console.log(info('Found a GCP config file stored locally.'))
		try {
			if (c) {
				const config = JSON.parse(c) || {}
				return config
			} else
				return {}
		} catch(e) {
			console.log(error(e.message))
			console.log(error(e.stack))
			return {}
		}
	}).catch(() => {
		if (debug)
			console.log(info('No GCP config file has been stored locally yet.'))
		return {}
	})
})

const updateAuthConfig = config => file.write(CONFIGFILE, JSON.stringify(config || {}, null, '\t'))

module.exports = {
	'get': getAuthConfig,
	update: updateAuthConfig
}