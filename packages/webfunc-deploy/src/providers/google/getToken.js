/**
 * Copyright (c) 2018, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const { createServer } = require('http')
const { parse: parseUrl } = require('url')
const { info, aborted, error, askQuestion, debugInfo } = require('../../utils/console')
const authConfig = require('../../utils/authConfig')
const gcp = require('./gcp')

const CLIENT_ID = '429438303487-0gh70ga2469aqrfhf134ei4ph8p24bia.apps.googleusercontent.com'
const CLIENT_SECRET = '2Uz-BIRBYlCaFTL4qvkTzJmo'
const SCOPES = [
	'https://www.googleapis.com/auth/cloud-platform',
	'https://www.googleapis.com/auth/appengine.admin'
]
const PORTS = [8085, 8086, 8087, 8088, 8089, 8090, 8091]

const saveGoogleCredentials = (creds, debug) => authConfig.get().then(config => {
	if (debug)
		console.log(debugInfo(`Saving new Google credentials locally: ${JSON.stringify(creds)}`))
	config.google = creds
	return authConfig.update(config)
})

const updateGoogleCredentials = (creds, debug) => authConfig.get().then(config => {
	config.google = Object.assign(config.google || {}, creds)
	if (debug)
		console.log(debugInfo(`Updating new Google credentials locally: ${JSON.stringify(config.google)}`))
	return authConfig.update(config)
})

let _credentialsRetrieved = false
const credentialsRetrieved = () => _credentialsRetrieved
const setCredentialsRetrieved = v => _credentialsRetrieved = v

const retrieveAndStore_GCP_Credentials = (req, res) => Promise.resolve(null).then(() => {
	const { debug } = server.options || { debug: false }
	if (debug)
		console.log(debugInfo('Response received from the Google Consent page.'))
	// #01 - Extracting the code sent from GCP via the query string.
	const { query: { error: _error, code } } = parseUrl(req.url, true)
	
	// #02 - Deal with potential errors and with diplaying a new page prompting your users to
	//       go back to their terminal.
	if (!_error && !code) {
		// the browser requesting the favicon etc
		res.end('')
		return
	}

	res.setHeader('content-type', 'text/html')
	res.end(
		'<meta charset="UTF-8">' +
		'<h2>That\'s it – you can now return to your terminal!</h2>'
	)

	if (_error) {
		// the user didn't give us permission
		console.log(aborted('No changes made.'))
		return
	}

	// #03 - Get a GCP Access Token
	if (code)
		return gcp.oAuthToken.get({
			code,
			client_id: CLIENT_ID,
			client_secret: CLIENT_SECRET,
			redirect_uri: `http://${req.headers.host}`
		}, server.options).then(({ status, data }) => {
			if (status !== 200) {
				console.log(error(`Got unexpected status code from Google: ${status}`))
				return 
			} else {
				if (debug)
					console.log(debugInfo('OAuth token receive from Google Cloud Platform. Saving it locally.'))
				const now = new Date()
				const credentials = {
					accessToken: data.access_token,
					expiresIn: data.expires_in,
					refreshToken: data.refresh_token,
					expiresAt: now.setSeconds(now.getSeconds() + data.expires_in)
				}

				return saveGoogleCredentials(credentials, debug).then(() => {
					setCredentialsRetrieved(true)
					return
				})
			}
		})
}).catch(e => {
	console.log(error('Something went wrong while processing response from the Google Cloud Platform consent page.', e.message, e.stack))
	process.exit()
})

const server = createServer(retrieveAndStore_GCP_Credentials)
const serverListen = (server, port, options={ debug:false }) => new Promise((success, failure) => {
	try {
		server.options = options
		server.on('error', e => failure(e))
		server.on('close', () => server.options = { debug:false })
		server.listen(port, success)
	} catch (e) {
		failure(e)
	}
})
const startServer = (options={ debug:false }) => {
	options.ports = options.ports || [...PORTS]
	if (options.ports.length == 0) {
		console.log(error(`Failed to start the node server responsible for receiving and processing the user's GCP consent response. The following ports are all allocated:\n    ${PORTS.join(',')}\nTry to free on of those ports so the server can run.`))
		process.exit()
	}
	const port = options.ports.shift()
	return serverListen(server, port, options)
		.then(() => port)
		.catch(() => startServer(options))
}

const CONSENT_TIMEOUT = 5 * 60 * 1000 // wait for 5 min until the user has consented
const askUserPermission = (options={ debug:false }) => askQuestion(info('We need access to your Google Cloud Platform account to proceed further. Do you want to proceed (Y/n)? '))
	.then(answer => {
		const { debug } = options
		if (answer && answer.toLowerCase().trim() == 'n') {
			console.log(error('Cannot access Google Cloud Platform.'))
			process.exit()
		} else {
			if (debug)
				console.log(debugInfo('Starting server to process response from GCP consent page...'))

			return startServer(options)
				.then(port => {
					if (debug)
						console.log(debugInfo(`Server successfully started. Listening on port ${port} and waiting for user's consent...`))

					return gcp.consent.request({
						client_id: CLIENT_ID,
						redirect_uri: `http://localhost:${port}`,
						scope: SCOPES.join(' ')
					}, credentialsRetrieved, CONSENT_TIMEOUT, options)
				})
				.then(() => authConfig.get())
				.then(creds => {
					server.close()
					return creds.google
				})
				.catch(e => {
					server.close()
					if (e.message == 'timeout') 
						console.log(error(`The process waiting for the Google Cloud Platform user to consent has timeout after ${CONSENT_TIMEOUT/60/1000} minutes. Please try again.`))
					else
						console.log(error(e.message))
					process.exit()
				})
		}
	})

const getUpToDateCreds = (creds, options={ debug:false }) => {
	const { debug } = options || {}
	if ((Date.now() + 5 * 60 * 1000) < creds.expiresAt) {
		if (debug)
			console.log(debugInfo('The OAuth token is still valid. No need to refresh it.'))
		return Promise.resolve(creds)
	} 

	if (debug)
		console.log(debugInfo('The OAuth token is not valid anymore. Refreshing it now...'))

	return gcp.oAuthToken.refresh({
		refresh_token: creds.refreshToken,
		client_id: CLIENT_ID,
		client_secret: CLIENT_SECRET
	}, options).then(({ status, data }) => {
		if (status !== 200) {
			console.log(error(`Got unexpected status code from Google: ${status}`))
			return null
		} else {
			if (debug)
				console.log(debugInfo('OAuth token successfully refreshed.'))
			const now = new Date()
			const credentials = {
				accessToken: data.access_token,
				expiresIn: data.expires_in,
				refreshToken: creds.refreshToken,
				expiresAt: now.setSeconds(now.getSeconds() + data.expires_in)
			}

			return updateGoogleCredentials(credentials, debug).then(() => credentials)
		}
	})
}

const getToken = (options = { refresh: false, debug: false }) => authConfig.get().then(config => {
	const { refresh, debug } = options || {}
	const noNeedToAskTokenPermission = !refresh && config && config.google && config.google.refreshToken 

	if (debug) {
		console.log(debugInfo('Retrieving GCP OAuth token.'))
		if (noNeedToAskTokenPermission)
			console.log(debugInfo('Token found in local storage.')) 
		else {
			if (refresh)
				console.log(debugInfo('Asking for permissiom now...')) 
			else
				console.log(debugInfo('No token found in local storage. Asking for permissiom now...')) 
		}
	}

	setCredentialsRetrieved(false)
	return (noNeedToAskTokenPermission ? Promise.resolve({ google: config.google, old: true }) : askUserPermission({ debug }).then(google => ({ google, old: false })))
		.then(({ google, old }) => old ? getUpToDateCreds(google, { debug }) : google)
		.then(google => google.accessToken)
		.catch(e => {
			console.log(error(`Failed to retrieve GCP OAuth token.\nError: ${e.message}\nStack trace: ${e.stack}`))
			process.exit()
		})
})

module.exports = getToken







