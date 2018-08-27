/**
 * Copyright (c) 2018, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const fs = require('fs-extra')
const { join } = require('path')
const { homedir } = require('os')
const { error, exec, debugInfo, cmd } = require('./console')
const _glob = require('glob')

const TEMP_FOLDER = join(homedir(), 'temp/webfunc')

const createTempFolder = () => fs.ensureDir(TEMP_FOLDER)
	.catch(() => {
		console.log(error(`Failed to create temporary folder ${TEMP_FOLDER}.`))
		process.exit(1)
	})

const glob = (pattern, options) => new Promise((success, failure) => _glob(pattern, options, (err, files) => {
	if (err)
		failure(err)
	else
		success(files)
}))

const cloneProject = (src='', options={ debug:false }) => createTempFolder().then(() => {
	const { debug } = options || {}
	const dst = join(TEMP_FOLDER, Date.now().toString())

	if (debug)
		console.log(debugInfo(`Copying content of folder '${src}' under temporary location '${dst}'...`))

	return glob(join(src, '**/*.*'), { ignore: '**/node_modules/**' }).then(files => glob(join(src, '**/.*'), { ignore: '**/node_modules/**' }).then(dot_files => {
		const all_files = [...(files || []), ...(dot_files || [])]
		
		if (debug)
			console.log(debugInfo(`Found ${all_files.length} files under folder '${src}'. Copying them now...`))

		return Promise.all(all_files.map(f => {
			return fs.copy(f, join(dst, f.replace(src, '')))
				.then(() => null)
				.catch(e => e)
		})).then(values => {
			const errors = values.filter(v => v != null)
			if (errors.length > 0) {
				console.log(error(`Could not copy the following files to ${TEMP_FOLDER}:`), '\n', errors)
				process.exit(1)
			}

			const npmCommand = `npm install --prefix ${dst}`

			if (debug)
				console.log(debugInfo(`Files successfully copied under '${dst}'. Executing command ${cmd(npmCommand)} now...`))

			return exec(npmCommand)
				.then(() => {
					if (debug)
						console.log(debugInfo('Command successfully executed.'))
				})
				.catch(() => {
					if (debug)
						console.log(debugInfo('Command failed.'))
				})
				.then(() => dst)
		})
	}))
})

const deleteFolder = (src, options={ debug:false }) => {
	const { debug } = options || {}
	
	if (debug)
		console.log(debugInfo(`Deleting folder '${src}'...`))

	return fs.exists(src).then(result => {
		if (result)
			return fs.remove(src)
		else
			return null
	}).then(() => {
		if (debug)
			console.log(debugInfo(`Folder '${src}' successfully deleted.`))
		return null
	}).catch(e => {
		if (debug) {
			console.log(debugInfo(`Folder '${src}' could not be deleted.`))
		}
		return e
	})
}

cloneProject(process.cwd(), { debug:true })
	//.then(dst => dst ? deleteFolder(dst, { debug:true }) : null)




