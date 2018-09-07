/**
 * Copyright (c) 2018, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
const opn = require('opn')
const { encode: encodeQuery, stringify: formUrlEncode } = require('querystring')
const fetch = require('../../utils/fetch')
const { info, highlight, cmd, link, debugInfo, bold, error } = require('../../utils/console')
const { promise, identity } = require('../../utils/index')

// OAUTH
const OAUTH_TOKEN_URL = () => 'https://www.googleapis.com/oauth2/v4/token'
const GCP_CONSENT_PAGE = query => `https://accounts.google.com/o/oauth2/v2/auth?${query}`
// RESOURCE MANAGER
const PROJECTS_URL = (projectId) => `https://cloudresourcemanager.googleapis.com/v1/projects${projectId ? `/${projectId}` : ''}`
// BILLING
const BILLING_PAGE = projectId => `https://console.cloud.google.com/billing/linkedaccount?project=${projectId}&folder&organizationId`
const BILLING_INFO_URL = projectId => `https://cloudbilling.googleapis.com/v1/projects/${projectId}/billingInfo`
// BUCKET
const CREATE_BUCKET_URL = projectId => `https://www.googleapis.com/storage/v1/b?project=${projectId}`
const UPLOAD_TO_BUCKET_URL = (bucketName, fileName, projectId) => `https://www.googleapis.com/upload/storage/v1/b/${encodeURIComponent(bucketName)}/o?uploadType=media&name=${encodeURIComponent(fileName)}&project=${encodeURIComponent(projectId)}`
// APP ENGINE
const APP_DETAILS_URL = projectId => `https://appengine.googleapis.com/v1/apps/${projectId}`
const CREATE_APP_URL = () => 'https://appengine.googleapis.com/v1/apps'
const APP_SERVICE_URL = (projectId, service) => `https://appengine.googleapis.com/v1/apps/${projectId}/services${service ? `/${service}` : ''}`
const APP_SERVICE_VERSION_URL = (projectId, service, version) => `${APP_SERVICE_URL(projectId, service)}/versions${version ? `/${version}` : ''}`
const DEPLOY_APP_URL = (projectId, service='default') => APP_SERVICE_VERSION_URL(projectId, service)
const OPS_STATUS_URL = (projectId, operationId) => `https://appengine.googleapis.com/v1/apps/${projectId}/operations/${operationId}`
const MIGRATE_ALL_TRAFFIC = (projectId, service='default') => `https://appengine.googleapis.com/v1/apps/${projectId}/services/${service}/?updateMask=split`
const DOMAINS_URL = (projectId) => `https://appengine.googleapis.com/v1/apps/${projectId}/domainMappings`

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////
//////											START - UTILS
//////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const showDebug = (msg, options={ debug:false }) => {
	const { debug } = options || {}
	if (debug)
		console.log(debugInfo(msg))
}

const validateRequiredParams = (params={}) => Object.keys(params).forEach(p => {
	if (!params[p])
		throw new Error(`Parameter '${p}' is required.`)
})

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////
//////											END - UTILS
//////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////
//////											START - OAUTH TOKEN APIS
//////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const getOAuthToken = ({ code, client_id, client_secret, redirect_uri }, options={ debug:false }) => Promise.resolve(null).then(() => {
	showDebug('Requesting new OAuth token from Google Cloud Platform.', options)
	validateRequiredParams({ code, client_id, client_secret, redirect_uri })
	const body = formUrlEncode({
		code,
		client_id,
		client_secret,
		redirect_uri,
		grant_type: 'authorization_code'
	})
	
	return fetch.post(OAUTH_TOKEN_URL(), {
		'content-type': 'application/x-www-form-urlencoded',
		'content-length': body.length
	}, body)
})

const refreshOAuthToken = ({ refresh_token, client_id, client_secret }, options={ debug:false }) => {
	showDebug('Requesting a refresh of existing OAuth token from Google Cloud Platform.', options)
	validateRequiredParams({ refresh_token, client_id, client_secret })
	
	const body = formUrlEncode({
		refresh_token,
		client_id,
		client_secret,
		grant_type: 'refresh_token',
	})

	return fetch.post(OAUTH_TOKEN_URL(), {
		'content-type': 'application/x-www-form-urlencoded',
		'content-length': body.length
	}, body)
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////
//////											END - OAUTH TOKEN APIS
//////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////
//////											START - CONSENT APIS
//////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const requestConsent = ({ client_id, redirect_uri, scope }, stopFn, timeout, options={ debug:false }) => Promise.resolve(null).then(() => {
	showDebug('Opening default browser on the Google Cloud Platform Consent page.', options)
	validateRequiredParams({ client_id, redirect_uri, scope })
	const query = encodeQuery({
		client_id,
		redirect_uri,
		response_type: 'code',
		scope,
		access_type: 'offline',
		prompt: 'consent'
	})

	const googleConsentScreenUrl = GCP_CONSENT_PAGE(query)

	if(process.platform === 'darwin' || process.platform === 'win32') {
		opn(googleConsentScreenUrl)
		console.log(info('A Google Accounts login window has been opened in your default browser. Please log in there and check back here afterwards.'))
	} else {
		console.log(info(
			`We'll need you to grant us access to provision your ${highlight('Google Cloud Platform')} account in order to comunicate with their API.`,
			`To provision a dedicated set of tokens for ${cmd('webfunc')}, Go to ${link(googleConsentScreenUrl)} and grant access to Webfunc.`
		))
		throw new Error(`Can't browse to consent screen from platform ${process.platform} (currently supported platforms: 'darwin', 'win32').`)
	}
})
	.then(() => promise.wait(stopFn, { timeout })) 


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////
//////											END - CONSENT APIS
//////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////
//////											START - BILLING APIS
//////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const setUpProjectBilling = (projectId, stopFn, timeout=300000, options={ debug:false }) => Promise.resolve(null).then(() => {
	validateRequiredParams({ projectId, stopFn, timeout })
	return redirectToBillingPage(projectId, options)
}).then(() => promise.wait(stopFn, { timeout, interval:10000 })) 

const redirectToBillingPage = (projectId, options={ debug:false }) => Promise.resolve(null).then(() => {
	validateRequiredParams({ projectId })
	showDebug('Opening default browser on the Google Cloud Platform project billing setup page.', options)
	const billingPage = BILLING_PAGE(projectId)

	if(process.platform === 'darwin' || process.platform === 'win32') 
		opn(billingPage)
	else {
		console.log(info(
			`We'll need you to enable billing on your ${highlight('Google Cloud Platform')} account for project ${bold(projectId)} in order to be able to deploy code on App Engine.`,
			`Go to ${link(billingPage)} to enable billing.`
		))
		throw new Error(`Can't browse to the billing page from platform ${process.platform} (currently supported platforms: 'darwin', 'win32').`)
	}

	return billingPage
})

const getProjectBillingInfo = (projectId, token, options={ debug:false }) => Promise.resolve(null).then(() => {
	validateRequiredParams({ projectId, token })
	showDebug('Requesting a project billing info from Google Cloud Platform.', options)

	return fetch.get(BILLING_INFO_URL(projectId), {
		Accept: 'application/json',
		Authorization: `Bearer ${token}`
	})
})

/**
 * This API is a hack to test whether or not billing has been enabled on a project without having to 
 * require access to the user's billing API. If the billing API fails with a '403 - The project to be billed is associated with an absent billing account.',
 * then this means the billing is not enabled.
 * @param  {[type]} projectId [description]
 * @param  {[type]} token     [description]
 * @param  {Object} options   [description]
 * @return {[type]}           [description]
 */
const testBillingEnabled = (projectId, token, options={ debug:false }) => Promise.resolve(null).then(() => {
	validateRequiredParams({ projectId, token })
	showDebug('Testing if billing is enabled by creating a dummy bucket on Google Cloud Platform.', options)

	const bucketName = `webfunc-bucket-healthcheck-${identity.new()}`.toLowerCase()
	return createBucket(bucketName, projectId, token, { debug: options.debug, verbose: false })
		.then(() => true)
		.catch(e => {
			try {
				const er = JSON.parse(e.message)
				if (er.code == 403 && (er.message || '').toLowerCase().indexOf('absent billing account') >= 0)
					return false
				else
					throw e	
			} catch(_e) { (() => {
				console.log(error(`Failed to determine whether or not billing is enabled on project ${bold(projectId)}. Go to ${link(BILLING_PAGE(projectId))} to enable billing in order to deploy code.`))
				throw e
			})(_e) }
		})
}) 

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////
//////											END - BILLING APIS
//////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////
//////											START - PROJECT APIS
//////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const getProject = (projectId, token, options={ debug:false, verbose:false }) => Promise.resolve(null).then(() => {
	const opts = Object.assign({ debug:false, verbose:false }, options)
	validateRequiredParams({ projectId, token })
	showDebug(`Requesting a project ${bold(projectId)} from Google Cloud Platform using token ${token}.`, opts)

	return fetch.get(PROJECTS_URL(projectId), {
		Accept: 'application/json',
		Authorization: `Bearer ${token}`
	}, { verbose: opts.verbose })
		.catch(e => {
			try {
				const er = JSON.parse(e.message)
				if (er.code == 403 || er.code == 404)
					return { status: er.code, data: null, message: er.message }
				else
					throw e
			} catch(_e) {(() => {
				throw e
			})(_e)}
		})
		.then(res => {
			const r = res || {}
			showDebug(`Response received:\nStatus: ${r.status}\nData: ${r.data}`, opts)
			return res
		})
})

const listProjects = (token, options={ debug:false,  }) => Promise.resolve(null).then(() => {
	showDebug('Requesting a list of all projects from Google Cloud Platform.', options)
	validateRequiredParams({ token })

	return fetch.get(PROJECTS_URL(), {
		Accept: 'application/json',
		Authorization: `Bearer ${token}`
	})
})

const createProject = (name, projectId, token, options={ debug:false }) => Promise.resolve(null).then(() => {
	validateRequiredParams({ name, projectId, token })
	showDebug(`Creating a new project on Google Cloud Platform called ${bold(name)} (id: ${bold(projectId)}).`, options)

	return fetch.post(PROJECTS_URL(), {
		Accept: 'application/json',
		Authorization: `Bearer ${token}`
	}, JSON.stringify({
		name,
		projectId
	})).then(res => {
		if (res.data && res.data.name)
			res.data.operationId = res.data.name.split('/').slice(-1)[0]
		return res
	})
})

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////
//////											END - PROJECT APIS
//////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////
//////											START - BUCKET APIS
//////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const createBucket = (name, projectId, token, options={ debug:false, verbose:true }) => Promise.resolve(null).then(() => {
	const opts = Object.assign({ debug:false, verbose:true }, options)
	validateRequiredParams({ name, token })
	showDebug(`Creating a new bucket called ${bold(name)} in Google Cloud Platform's project ${bold(projectId)}.`, opts)

	return fetch.post(CREATE_BUCKET_URL(projectId), {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${token}`
	}, JSON.stringify({ name }), opts)
		.then(res => {
			if (res && res.status == 409)
				showDebug(`Bucket ${bold(name)} already exists.`, opts)
			return res
		})
})

const uploadZipFileToBucket = (zip, bucket, token, options={ debug:false }) => Promise.resolve(null).then(() => {
	const { name: zipName, file: zipFile  } = zip || {}
	const { name: bucketName, projectId } = bucket || {}
	validateRequiredParams({ zipName, zipFile, bucketName, projectId, token })
	showDebug(`Uploading a new zip file to Google Cloud Platform's project ${bold(bucket.projectId)} in bucket ${bold(bucket.name)}.`, options)

	return fetch.post(UPLOAD_TO_BUCKET_URL(bucket.name, zip.name, bucket.projectId), {
		'Content-Type': 'application/zip',
		'Content-Length': zip.file.length,
		Authorization: `Bearer ${token}`
	}, zip.file)
})

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////
//////											END - BUCKET APIS
//////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////
//////											START - APP ENGINE APIS
//////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const validateAppRegions = (regionId='') => getAppRegions().then(regions => {
	if (regions.some(({ id }) => regionId == id))
		return
	else
		throw new Error(`Region ${bold(regionId)} is not supported by Google App Engine.`)
})

const getAppRegions = () => Promise.resolve([
	{ id: 'northamerica-northeast1', label: 'northamerica-northeast1 (Montréal)' },
	{ id: 'us-central', label: 'us-central (Iowa)' },
	{ id: 'us-west2', label: 'us-west2 (Los Angeles)' },
	{ id: 'us-east1', label: 'us-east1 (South Carolina)' },
	{ id: 'us-east4', label: 'us-east4 (Northern Virginia)' },
	{ id: 'southamerica-east1', label: 'southamerica-east1 (São Paulo) *' },
	{ id: 'europe-west', label: 'europe-west (Belgium)' },
	{ id: 'europe-west2', label: 'europe-west2 (London)' },
	{ id: 'europe-west3', label: 'europe-west3 (Frankfurt)' },
	{ id: 'asia-northeast1', label: 'asia-northeast1 (Tokyo)' },
	{ id: 'asia-south1', label: 'asia-south1 (Mumbai)' },
	{ id: 'australia-southeast1', label: 'australia-southeast1 (Sydney)' }
])

const getAppDetails = (projectId, token, options={ debug:false }) => Promise.resolve(null).then(() => {
	validateRequiredParams({ projectId, token })
	showDebug(`Getting the ${bold(projectId)}'s App Engine details from Google Cloud Platform.`, options)

	return fetch.get(APP_DETAILS_URL(projectId), {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${token}`
	}, { verbose: false }).catch(e => {
		try {
			const er = JSON.parse(e.message)
			if (er.code == 404)
				return { status: 404, data: null }
			/*eslint-disable */
		} catch(err) {
			/*eslint-enable */
			throw e
		}
	})
})

// Doc: https://cloud.google.com/appengine/docs/admin-api/creating-an-application
const createApp = (projectId, regionId, token, options={ debug:false }) => validateAppRegions(regionId).then(() => {
	validateRequiredParams({ projectId, regionId, token })
	showDebug(`Creating a new App Engine in Google Cloud Platform's project ${bold(projectId)}.`, options)

	return fetch.post(CREATE_APP_URL(), {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${token}`
	},
	JSON.stringify({ 
		id: projectId,
		locationId: regionId
	})).then(res => {
		if (res.data && res.data.name)
			res.data.operationId = res.data.name.split('/').slice(-1)[0]
		return res
	})
})

const deployApp = (source, service, token, options={ debug:false }) => Promise.resolve(null).then(() => {
	const { bucket, zip } = source || {}
	const { name:serviceName='default' , version } = service || {}
	validateRequiredParams({ bucketName: bucket.name, projectId: bucket.projectId, zipName: zip.name, zipFilesCount: zip.filesCount, version, token })

	const appJson = {
		id: version,
		runtime: 'nodejs8',
		deployment: {
			zip: {
				sourceUrl: `https://storage.googleapis.com/${bucket.name}/${zip.name}`,
				filesCount: zip.filesCount
			}
		}
	}

	showDebug(`Deploying service to Google Cloud Platform's project ${bold(bucket.projectId)}.\n${JSON.stringify(appJson, null, ' ')}`, options)

	return fetch.post(DEPLOY_APP_URL(bucket.projectId, serviceName), {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${token}`
	},
	JSON.stringify(appJson)).then(res => {
		if (res.data && res.data.name)
			res.data.operationId = res.data.name.split('/').slice(-1)[0]
		return res
	})
})

const checkOperationStatus = (projectId, operationId, token, options={ debug:false }) => Promise.resolve(null).then(() => {
	validateRequiredParams({ operationId, projectId, token })
	showDebug(`Requesting operation status from Google Cloud Platform's project ${bold(projectId)}.`, options)

	return fetch.get(OPS_STATUS_URL(projectId, operationId), {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${token}`
	}, { verbose: false }).catch(e => {
		let err 
		try {
			err = JSON.parse(e.message)
		} catch(er) { err = e }

		if (err.status == 200) 
			return { status: 200, data: err }
		else
			throw e
	})
})

const listServices = (projectId, token, options={ debug:false }) => Promise.resolve(null).then(() => {
	validateRequiredParams({ projectId, token })
	showDebug(`Requesting list of services from Google Cloud Platform's App Engine ${bold(projectId)}.`, options)

	return fetch.get(APP_SERVICE_URL(projectId), {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${token}`
	})
})

// https://cloud.google.com/appengine/docs/admin-api/reference/rest/v1/apps.services.versions/list
const listServiceVersions = (projectId, service, token, options={ debug:false }) => Promise.resolve(null).then(() => {
	validateRequiredParams({ service, projectId, token })
	showDebug(`Requesting list of all version for service ${bold(service)} Google Cloud Platform's App Engine ${bold(projectId)}.`, options)

	return fetch.get(APP_SERVICE_VERSION_URL(projectId, service) + '?pageSize=2000', {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${token}`
	})
})

const getServiceVersion = (projectId, service, version, token, options={ debug:false }) => Promise.resolve(null).then(() => {
	validateRequiredParams({ service, projectId, version, token })
	showDebug(`Requesting version ${bold(version)} from service ${bold(service)} for Google Cloud Platform's App Engine ${bold(projectId)}.`, options)

	return fetch.get(APP_SERVICE_VERSION_URL(projectId, service, version), {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${token}`
	})
})

const getService = (projectId, service, token, options={ debug:false }) => Promise.resolve(null).then(() => {
	validateRequiredParams({ service, projectId, token })
	showDebug(`Requesting service ${bold(service)} for Google Cloud Platform's App Engine ${bold(projectId)}.`, options)

	return fetch.get(APP_SERVICE_URL(projectId, service), {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${token}`
	}, { verbose: false })
		.catch(e => {
			try {
				const er = JSON.parse(e.message)
				if (er.code == 403 || er.code == 404)
					return { status: er.code, data: null, message: er.message }
				else
					throw e
			} catch(_e) {(() => {
				throw e
			})(_e)}
		})
		.then(res => {
			const r = res || {}
			showDebug(`Response received:\nStatus: ${r.status}\nData: ${r.data}`, options)
			return res
		})
})

// https://cloud.google.com/appengine/docs/admin-api/reference/rest/v1/apps.domainMappings/list
const listDomains = (projectId, token, options={ debug:false }) => Promise.resolve(null).then(() => {
	validateRequiredParams({ projectId, token })
	showDebug(`Requesting all the domains for Google Cloud Platform's project ${bold(projectId)}.`, options)

	return fetch.get(DOMAINS_URL(projectId), {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${token}`
	})
})

const migrateAllTraffic = (projectId, service, version, token, options={ debug:false }) => Promise.resolve(null).then(() => {
	validateRequiredParams({ service, version, projectId, token })
	showDebug(`Requesting operation status from Google Cloud Platform's project ${bold(projectId)}.`, options)

	let allocations = {}
	allocations[version] = 1

	return fetch.patch(MIGRATE_ALL_TRAFFIC(projectId, service), {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${token}`
	}, JSON.stringify({ split: { allocations } })).then(res => {
		if (res.data && res.data.name)
			res.data.operationId = res.data.name.split('/').slice(-1)[0]
		return res
	})
})

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////
//////											END - APP ENGINE APIS
//////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = {
	oAuthToken: {
		'get': getOAuthToken,
		refresh: refreshOAuthToken
	},
	consent: {
		request: requestConsent
	},
	project: {
		'get': getProject,
		list: listProjects, 
		create: createProject,
		billing: {
			'get': getProjectBillingInfo,
			goToSetupPage: redirectToBillingPage,
			isEnabled: testBillingEnabled,
			enable: setUpProjectBilling
		}
	},
	bucket: {
		create: createBucket,
		uploadZip: uploadZipFileToBucket
	},
	app: {
		'get': getAppDetails,
		create: createApp,
		getRegions: getAppRegions,
		deploy: deployApp,
		getOperationStatus: checkOperationStatus,
		service: {
			'get': getService,
			version: {
				list: listServiceVersions,
				migrateAllTraffic: migrateAllTraffic,
				'get': getServiceVersion
			},
			list: listServices
		},
		domain: {
			list: listDomains
		}
	}
}

