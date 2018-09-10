/**
 * Copyright (c) 2018, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
const shortid = require('shortid')

const newId = (options={}) => {
	const id = shortid.generate().replace(/-/g, 'r').replace(/_/g, '9')
	return options.short ? id.slice(0,-4) : id

}

const getDateUtc = (date) => {
	const now_utc =  Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds())
	return new Date(now_utc)
}

const addZero = nbr => ('0' + nbr).slice(-2)

const getTimestamp = (options={ short:true }) => {
	const d = getDateUtc(new Date())
	const main = `${d.getUTCFullYear()}${addZero(d.getUTCMonth()+1)}${addZero(d.getUTCDate())}`
	if (options.short)
		return main
	else 
		return `${main}-${addZero(d.getUTCHours())}${addZero(d.getUTCMinutes())}${addZero(d.getUTCSeconds())}`
}

const _objectSortBy = (obj, fn = x => x, dir='asc') => Object.keys(obj || {})
	.map(key => ({ key, value: obj[key] }))
	.sort((a,b) => {
		const vA = fn(a.value)
		const vB = fn(b.value)
		if (dir == 'asc') {
			if (vA < vB)
				return -1
			else if (vA > vB)
				return 1
			else
				return 0
		} else {
			if (vA > vB)
				return -1
			else if (vA < vB)
				return 1
			else
				return 0
		}
	}).reduce((acc,v) => {
		acc[v.key] = v.value
		return acc
	}, {})

const _arraySortBy = (arr, fn = x => x, dir='asc') => (arr || []).sort((a,b) => {
	const vA = fn(a)
	const vB = fn(b)
	if (dir == 'asc') {
		if (vA < vB)
			return -1
		else if (vA > vB)
			return 1
		else
			return 0
	} else {
		if (vA > vB)
			return -1
		else if (vA < vB)
			return 1
		else
			return 0
	}
})

const sortBy = (obj, fn = x => x, dir='asc') => Array.isArray(obj) ? _arraySortBy(obj, fn, dir) : _objectSortBy(obj, fn, dir)
const newSeed = (size=0) => Array.apply(null, Array(size))
const mergeObj = (...objs) => Object.assign(...objs.map(obj => JSON.parse(JSON.stringify(obj))))

module.exports = {
	file: require('./files'),
	promise: require('./promise'),
	identity: {
		'new': newId
	},
	date: {
		timestamp: getTimestamp
	},
	collection: {
		sortBy,
		seed: newSeed
	},
	obj: {
		merge: mergeObj
	}
}