/**
 * Copyright (c) 2018, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const path = require('path')
const { file, obj }  = require('../../utils')

/**
 * [description]
 * @param  {String}  appPath 			[description]
 * @param  {String}  options.env 		[description]
 * @param  {Boolean} options.envOnly 	[description]
 * @return {[type]}         			[description]
 */
const getHosting = (appPath, options={}) => {
	const main = file.getJson(path.join(appPath, 'app.json')).then(config => ((config || {}).hosting || {}))
	const second = options.env ? file.getJson(path.join(appPath, `app.${options.env}.json`)).then(config => ((config || {}).hosting || {})) : Promise.resolve({})
	return Promise.all([main, second]).then(values => options.env && options.envOnly ? values[1] : obj.merge(...values))
}

const hostingExists = (appPath, options={}) => getHosting(appPath, obj.merge(options, { envOnly: true })).then(hosting => hosting && Object.keys(hosting).length > 0)

const saveHosting = ({ projectId, service, type }, appPath, options={}) => file.getJson(path.join(appPath, `app${options.env ? `.${options.env}` : ''}.json`))
	.then(config => {
		let updatedConfig = config || {}
		updatedConfig.hosting = { 
			name: 'google',
			projectId, 
			service: service || 'default', 
			type: type || 'standard'
		}
		return file.write(path.join(appPath, `app${options.env ? `.${options.env}` : ''}.json`), JSON.stringify(updatedConfig, null, '  '))
	})

module.exports = {
	hosting: {
		'get': getHosting,
		save: saveHosting,
		exists: hostingExists
	}
}