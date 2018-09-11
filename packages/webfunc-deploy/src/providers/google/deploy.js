/**
 * Copyright (c) 2018, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const clipboardy = require('clipboardy')
const gcp = require('./gcp')
const { error, wait, success, link, bold, info, note, warn, askQuestion, question } = require('../../utils/console')
const { zipToBuffer } = require('../../utils/files')
const { identity, promise, date, obj, collection }  = require('../../utils')
const utils = require('./utils')
const projectHelper = require('./project')
const getToken = require('./getToken')
const { hosting } = require('./config')

const _createBucket = (projectId, bucketName, token, options={}) => {
	const bucketCreationDone = wait('Creating new deployment bucket')
	return gcp.bucket.create(bucketName, projectId, token, { debug: options.debug, verbose: false })
		.then(() => {
			bucketCreationDone()
			console.log(success(`Bucket successfully created (${bucketName}).`))
		})
		.catch(e => { 
			bucketCreationDone()
			try {
				const er = JSON.parse(e.message)
				if (er.code == 403 && er.message.indexOf('absent billing account') >= 0) {
					return projectHelper.enableBilling(projectId, token, options).then(({ answer }) => {
						if (answer == 'n') throw e
						return _createBucket(projectId, bucketName, token, options)
					})
				}
			} catch(_e) { (() => null)(_e) }
			throw e 
		})
}

const _selectLessValuableVersions = (nbr, versions) => nbr > 1
	? collection.sortBy(versions, v => v.createTime, 'asc').slice(0, Math.round(nbr))
	: []

const _deleteAppVersions = (projectId, nbr=10, options={}) => getToken(options).then(token => {
	return gcp.app.service.list(projectId, token, obj.merge(options, { includeVersions:true }))
		.then(({ data: services }) => {
		// 1. Finding the versions ratios per services. 
		// 	  This service ratio is used to establich how many versions per service must be deleted
			const legitSvcs = services.map(s => ({
				name: s.id,
				versions: (s.versions || []).filter(v => !v.traffic)
			})).filter(x => x.versions && x.versions.length > 0)
			const allVersionsCount = legitSvcs.reduce((count, svc) => count + svc.versions.length, 0)
			// 2. Nominating the versions to be deleted based on these rules:
			// 		1. Must not serve traffic
			// 		2. Must be as old as possible
			const svcToBeCleaned = legitSvcs.map(svc => {
				const nbrOfVersionsToDelete = svc.versions.length/allVersionsCount*nbr
				const versions = _selectLessValuableVersions(nbrOfVersionsToDelete, svc.versions)
				return { name: svc.name, versions }
			}).filter(x => x.versions.length > 0).reduce((acc, svc) => {
				acc.push(...svc.versions.map(v => ({ version: v.id, service: svc.name })))
				return acc
			}, [])

			// 3. Delete less valuable versions
			const opsCount = svcToBeCleaned.length
			return Promise.all(svcToBeCleaned.map(({ version, service }) => 
				gcp.app.service.version.delete(projectId, service, version, token, options)
					.catch(e => ({ projectId, service, version, error: e })))
			)
			// 4. Confirm that at least 1 version has been deleted
				.then(values => {
					const failuresCount = values.filter(x => x.error).length
					if (opsCount - failuresCount == 0) {
						const er = (values[0] || {}).error
						throw new Error(`Failed to delete ${opsCount} unused App Engine Service's versions to allow for new deployments.\n${er.message}\n${er.stack}`)
					} 
					const opIds = values.filter(x => x.data && x.data.operationId).map(({ data }) => data.operationId)
					return opIds.reduce((check, opId) => check.then(status => {
						return status || utils.operation.check(projectId, opId, token, null, null, options)
							.then(res => res && !res.error ? 'ok' : null)
							.catch(() => null)
					}), Promise.resolve(null))
						.then(status => {
							if (!status)
								throw new Error(`Failed to delete ${opsCount} unused App Engine Service's versions to allow for new deployments.`)
						})
				})
		})
})

const _deployApp = (bucket, zip, service, token, waitDone, options={}) => {
	waitDone = wait(`Deploying nodejs app to project ${bold(bucket.projectId)} under App Engine's service ${bold(service.name)} version ${bold(service.version)}`)
	return gcp.app.deploy({ bucket, zip }, service, token, obj.merge(options, { verbose: false })).then(({ data }) => {
		if (!data.operationId) {
			const msg = 'Unexpected response. Could not determine the operationId used to check the deployment status.'
			console.log(error(msg))
			throw new Error(msg)
		}
		return { operationId: data.operationId, waitDone }
	}).catch(e => {
		waitDone()
		try {
			const er = JSON.parse(e.message)
			const versionsThreshold = (((er.message || '').match(/Your app may not have more than(.*?)versions/) || [])[1] || '').trim()
			if (!options.noCleaning && er.code == 400 && versionsThreshold) {
				console.log(warn(`The App Engine in project ${bucket.projectId} has exceeded the maximum amount of versions allowed (${versionsThreshold}).`))
				waitDone = wait('Cleaning up your project')
				return _deleteAppVersions(bucket.projectId, 10, options).then(() => {
					waitDone()
					console.log(success('Project successfully cleaned up.'))
					console.log(info('Trying to re-deploy now'))
					return _deployApp(bucket, zip, service, token, waitDone, obj.merge(options, { noCleaning: true }))
				})
			}

		} catch(_e) { (() => null)(_e) }

		throw e
	})
}

const _testEnv = (projectPath, options={}) => options.env 
	? hosting.exists(projectPath, options).then(yes => {
		if (!options.noPrompt && !yes) {
			console.log(warn(`No ${bold(`app.${options.env}.json`)} config file found in your app.`))
			console.log(info(`We can use your app.json now and create a new app.${options.env}.json after your deployment is over.`))
			return askQuestion(question('Do you want to continue (Y/n)? ')).then(answer => {
				if (answer == 'n')
					process.exit()
				return yes
			})
		} else
			return yes
	}) 
	: Promise.resolve(true)

/**
 * [description]
 * @param  {Object}   options.appConfig 		[description]
 * @param  {Boolean}  options.ignoreAppConfig   [description]
 * @param  {String}   options.env             	[description]
 * @param  {Boolean}  options.debug             [description]
 * @param  {Boolean}  options.promote           [description]
 * @param  {String}   options.projectPath       [description]
 * @param  {String}   options.serviceName       [description]
 * @return {[type]}                     		[description]
 */
const deploy = (options={}) => Promise.resolve(null).then(() => {
	if (options.promote === undefined) 
		options.promote = true
	const projectPath = projectHelper.getFullPath(options.projectPath)
	let waitDone = () => null

	let service = { name: (options.serviceName || 'default'), version: `v${date.timestamp({ short:false })}` }

	//////////////////////////////
	// 1. Show current project and app engine details to help the user confirm that's the right one.
	//////////////////////////////
	return _testEnv(projectPath, options).then(() => hosting.get(projectPath, options)).then(appConfig => utils.project.confirm(obj.merge(options, { appConfig }))).then(({ token, projectId, locationId, service: svcName }) => {
		if (svcName && service.name != svcName)
			service.name = svcName
		const bucket = { 
			name: `webfunc-deployment-${service.version}-${identity.new()}`.toLowerCase(), 
			projectId }
		let zip = { name: 'webfunc-app.zip' }
		let deployStart
		
		console.log(info(`Deploying app ${options.env ? `(${bold(options.env)} config) `: ''}to service ${bold(service.name)} in project ${bold(projectId)} ${locationId ? `(${locationId}) ` : ''}`))

		//////////////////////////////
		// 2. Zip project 
		//////////////////////////////
		waitDone = wait('Zipping project...')
		return zipToBuffer(projectPath, options)
			.then(({ filesCount, buffer }) => {
				waitDone()
				console.log(success(`Nodejs app (${filesCount} files) successfully zipped.`))
				zip.file = buffer
				zip.filesCount = filesCount
			}).catch(e => { waitDone(); throw e })
			//////////////////////////////
			// 3. Create bucket & Check that the 'default' service exists
			//////////////////////////////
			.then(() => {
				const bucketTask = _createBucket(bucket.projectId, bucket.name, token, options).catch(e => ({ _error: e }))
				const testDefaultServiceExistsTask = service.name == 'default' 
					? Promise.resolve({ data: true })
					: gcp.app.service.get(bucket.projectId, 'default', token, { debug: options.debug, verbose: false }).catch(e => ({ _error: e }))
				return Promise.all([bucketTask, testDefaultServiceExistsTask]).then(values => {
					const e = values.find(v => v && v._error) 
					if (e)
						throw e._error
					// 3.1. There is no 'default' 
					if (!values[1].data) {
						console.log(info(`No 'default' service defined yet. Choosing the 'default' service to deploy the app rather than '${service.name}' (this is a Google Cloud Platform constraint).`))
						service.name = 'default'
					}
				})
			})
			//////////////////////////////
			// 4. Upload zip to bucket
			//////////////////////////////
			.then(() => {
				const zipSize = (zip.file.length/1024/1024).toFixed(2)
				const uploadStart = Date.now()
				waitDone = wait(`Uploading nodejs app (${zipSize}MB) to bucket`)
				return gcp.bucket.uploadZip(zip, bucket, token, options)
					.then(() => {
						waitDone()
						console.log(success(`App (${zipSize}MB) successfully uploaded to bucket in ${((Date.now() - uploadStart)/1000).toFixed(2)} seconds.`))
					})
					.catch(e => { waitDone(); throw e })
			})	
			//////////////////////////////
			// 5. Deploying project
			//////////////////////////////
			.then(() => {
				deployStart = Date.now()
				return _deployApp(bucket, zip, service, token, waitDone, options)
			})
			////////////////////////////////////
			// 6. Checking deployment status
			////////////////////////////////////
			.then(({ operationId, waitDone: done }) => {
				waitDone = done
				return utils.operation.check(
					bucket.projectId, 
					operationId, 
					token, 
					() => waitDone(), 
					(data) => {
						console.log(error('Fail to deploy. Though your project was successfully uploaded to Google Cloud Platform, an error occured during the deployment to App Engine. Details:', JSON.stringify(data, null, '  ')))
						throw new Error('Deployment failed.')
					}, 
					options)
			})
			.then(({ data }) => {
				const showVersionUrl = data && data.response && data.response.versionUrl
				console.log(success(`App successfully deployed to App Engine's service ${bold(service.name)} (version: ${service.version}) in ${((Date.now() - deployStart)/1000).toFixed(2)} seconds.`))
				if (showVersionUrl) {
					const svcUrl = options.promote 
						? data.response.versionUrl.replace(`https://${service.version}-dot-`, 'https://')
						: data.response.versionUrl
					return svcUrl
				}
				return null
			})
			////////////////////////////////////
			// 7. Migrating traffic
			////////////////////////////////////
			.then(svcUrl => {
				if (options.promote) {
					waitDone = wait('Migrating app traffic to this version')
					// 7.1. Checking which service version is currently serving all traffic.
					return gcp.app.service.get(bucket.projectId, service.name, token, options)
						.then(({ data }) => {
							if (!data || !data.split || !data.split.allocations || !Object.keys(data.split.allocations).some(key => key == service.version)) {
							// 7.1.1. The current service version is different from the newly deployed. Time to migrate traffic...
								return gcp.app.service.version.migrateAllTraffic(bucket.projectId, service.name, service.version, token, options)
									.then(({ data }) => promise.check(
										() => gcp.app.getOperationStatus(bucket.projectId, data.operationId, token, options).catch(e => {
											console.log(error(`Unable to verify deployment status. Manually check the status of your build here: ${link(`https://console.cloud.google.com/cloud-build/builds?project=${bucket.projectId}`)}`))
											throw e
										}), 
										({ data }) => {
											if (data && data.done) {
												waitDone()
												return true
											}
											else if (data && data.message) {
												console.log(error(`Fail to migrate traffic to version ${bold(service.version)}. Details:`, JSON.stringify(data, null, '  ')))
												throw new Error('Traffic migration failed.')
											} else 
												return false
										}))
							}
						// 7.1.2. The current service version is the same as the new version. That means that the new version is already serbing all the traffic.
						})
						.then(() => {
							waitDone()
							return (svcUrl ? clipboardy.write(svcUrl) : Promise.resolve(null)).then(() => {
								console.log(success('Traffic successfully migrated to new version.'))
								if (svcUrl)
									console.log(success(`App available at ${bold(link(svcUrl))} (copied to clipboard).`))
							})
						})
				} else
					(svcUrl ? clipboardy.write(svcUrl) : Promise.resolve(null)).then(() => {
						if (svcUrl)
							console.log(success(`App available at ${bold(link(svcUrl))} (copied to clipboard).`))
					})
			})
			////////////////////////////////////
			// 8. More info message
			////////////////////////////////////
			.then(() => console.log(note(`More details about this deployment in your Google Cloud Dashboard: ${link(`https://console.cloud.google.com/appengine/versions?project=${bucket.projectId}&serviceId=${service.name}`)}\n`)))
			////////////////////////////////////
			// 9. Potentially save the app.json
			////////////////////////////////////
			.then(() => _testEnv(projectPath, obj.merge(options, { noPrompt: true })))
			.then(envExists => hosting.get(projectPath, options).then(appConfig => {
				appConfig = appConfig || {}
				const appProjectId = appConfig.projectId
				const appService = appConfig.service
				const envConfigDoesNotExistYet = options.env && !envExists
				const appJson = options.env ? `app.${options.env}.json` : 'app.json'
				const updateConfig = appProjectId && !envConfigDoesNotExistYet
				// 9.1. The app.json has changed
				if (envConfigDoesNotExistYet || projectId != appProjectId || service.name != appService) {
					const introMsg = updateConfig
						? 'This deployement configuration is different from the one defined in the app.json'
						: `If you don't want to answer all those questions next time, create an ${bold(appJson)} file in your app project.`
					const actionMessage = updateConfig
						? `Do you want to update the ${bold(appJson)} with this new configuration (Y/n)?`
						: `Do you want to create an ${bold(appJson)} file (Y/n)? `
					
					console.log(info(introMsg))
					return askQuestion(question(actionMessage)).then(answer => {
						if (answer == 'n')
							return
						else {
							return hosting.save({ projectId, service: service.name, type: 'standard' }, projectPath, options)
						}
					})
				} else
					return
			}))

	}).catch(e => {
		waitDone()
		console.log(error('Deployment failed!', e.message, e.stack))
		throw e
	})
})

module.exports = deploy



