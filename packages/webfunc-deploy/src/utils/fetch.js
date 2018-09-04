/**
 * Copyright (c) 2018, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
const fetch = require('node-fetch')
const { error } = require('./console')

const getData = (url, headers={}, options={ verbose:true }) => Promise.resolve(null).then(() => {
	if (options.verbose === undefined) options.verbose = true
	return fetch(url, { method: 'GET', headers })
		.then(res => res.json().then(data => ({ status: res.status, data })))
		.then(res => {
			if (res && res.data && res.data.error) {
				const e = JSON.stringify(Object.assign(res.data.error, { status: res.status }), null, '  ')
				if (options.verbose)
					console.log(error(' ', e))
				throw new Error(e)
			} else
				return res
		})
})

const postData = (url, headers={}, body, options={ verbose:true }) => Promise.resolve(null).then(() => {
	if (options.verbose === undefined) options.verbose = true
	return fetch(url, { method: 'POST', headers, body })
		.then(res => res.json().then(data => ({ status: res.status, data })))
		.then(res => {
			if (res && res.data && res.data.error) {
				const e = JSON.stringify(Object.assign(res.data.error, { status: res.status }), null, '  ')
				if (options.verbose)
					console.log(error(' ', e))
				throw new Error(e)
			} else
				return res
		})
})

const patchData = (url, headers={}, body, options={ verbose:true }) => Promise.resolve(null).then(() => {
	if (options.verbose === undefined) options.verbose = true
	return fetch(url, { method: 'PATCH', headers, body })
		.then(res => res.json().then(data => ({ status: res.status, data })))
		.then(res => {
			if (res && res.data && res.data.error) {
				const e = JSON.stringify(Object.assign(res.data.error, { status: res.status }), null, '  ')
				if (options.verbose)
					console.log(error(' ', e))
				throw new Error(e)
			} else
				return res
		})
})

module.exports = {
	'get': getData,
	post: postData,
	patch: patchData
}