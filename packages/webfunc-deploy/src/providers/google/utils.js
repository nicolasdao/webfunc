/**
 * Copyright (c) 2018, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const { login } = require('./account')
const getToken = require('./getToken')
const authConfig = require('../../utils/authConfig')
const { askQuestion, bold, cmd, info } = require('../../utils/console')

/**
 * [description]
 * @param  {Object} options [description]
 * @return {Object} result        
 * @return {String} result.token     	  Refreshed OAuth token
 * @return {String} result.projectId      Project id
 */
const confirmCurrentProject = (options={ debug:false }) => Promise.resolve(null).then(() => {
	//////////////////////////////
	// 1. Show current project
	//////////////////////////////
	// 1.1. Get current OAuth config file
	return authConfig.get().then((config={}) => (config.google || {})).then(config => {
		const { project: projectId, accessToken, refreshToken } = config
		// If there is no OAuth config for Google yet, then prompt the user to consent.
		if (!projectId || !accessToken || !refreshToken) {
			console.log(info('You don\'t have any Google OAuth saved yet. Requesting consent now...'))
			return login(options)
		} else // Otherwise, carry on
			return config
	}).then(config => { // 1.2. Prompt to confirm that the hosting destination is correct.
		const questionLine1 = info(`Current Google Cloud Project: ${bold(config.project)} (To change, run ${cmd('webfunc switch')})`)
		const questionLine2 = info('Is it the right project (Y/n)? ')
		return askQuestion(`${questionLine1}\n${questionLine2}`)
			.then(answer => { if (answer == 'n') process.exit(1)})
		//////////////////////////////
		// 2. Retrieve OAuth token
		//////////////////////////////
			.then(() => getToken(options).then(token => ({
				token,
				projectId: config.project
			})))
	})
})

module.exports = {
	project: {
		confirm: confirmCurrentProject
	}
}