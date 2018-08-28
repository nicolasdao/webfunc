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
const _glob = require('glob')
const archiver = require('archiver')
const { toBuffer } = require('convert-stream')
const { error, exec, debugInfo, cmd } = require('./console')

const TEMP_FOLDER = join(homedir(), 'temp/webfunc')

const createTempFolder = () => fs.ensureDir(TEMP_FOLDER)
	.catch(() => {
		console.log(error(`Failed to create temporary folder ${TEMP_FOLDER}.`))
	})

const glob = (pattern, options) => new Promise((success, failure) => _glob(pattern, options, (err, files) => {
	if (err)
		failure(err)
	else
		success(files)
}))

const cloneNodejsProject = (src='', options={ debug:false }) => createTempFolder().then(() => {
	const { debug } = options || {}
	const dst = join(TEMP_FOLDER, Date.now().toString())

	if (debug) 
		console.log(debugInfo(`Copying content of folder \n${src} \nto temporary location \n${dst}`))

	return glob(join(src, '**/*.*'), { ignore: '**/node_modules/**' }).then(files => glob(join(src, '**/.*'), { ignore: '**/node_modules/**' }).then(dot_files => {
		const all_files = [...(files || []), ...(dot_files || [])]
		
		if (debug)
			console.log(debugInfo(`Found ${all_files.length} files under folder \n${src}\nCopying them now...`))

		return Promise.all(all_files.map(f => {
			return fs.copy(f, join(dst, f.replace(src, '')))
				.then(() => null)
				.catch(e => {
					console.log(error(`Failed to clone nodejs project located under \n${src}\nto the temporary location \n${dst}\nThis procedure is usually required to zip the project before uploading it to the selected provider.`))
					throw e
				})
		})).then(values => {
			const errors = values.filter(v => v != null)
			if (errors.length > 0) {
				console.log(error(`Could not copy the following files to ${TEMP_FOLDER}:`))
				errors.forEach(err => console.log(error(err)))
				throw new Error('Failed to copy some files.')
			}

			const npmCommand = `npm install --prefix ${dst}`

			if (debug)
				console.log(debugInfo(`Files successfully copied to \n${dst}\nExecuting command \n${cmd(npmCommand)}`))

			return exec(npmCommand)
				.then(() => {
					if (debug)
						console.log(debugInfo('Command successfully executed.'))
				})
				.catch(() => {
					if (debug)
						console.log(debugInfo('Command failed.'))

					throw new Error(`Command ${npmCommand} failed.`)
				})
				.then(() => dst)
		})
	}))
})

const deleteFolder = (src, options={ debug:false }) => {
	const { debug } = options || {}
	
	if (debug)
		console.log(debugInfo(`Deleting folder ${src}`))

	return fs.exists(src).then(result => {
		if (result)
			return fs.remove(src)
		else
			return null
	}).then(() => {
		if (debug)
			console.log(debugInfo(`Folder \n${src} \nsuccessfully deleted.`))
		return null
	}).catch(e => {
		if (debug) {
			console.log(debugInfo(`Folder \n${src} \ncould not be deleted.`))
		}
		return e
	})
}

const zipFolderToBuffer = (src, options={ debug:false }) => fs.exists(src).then(result => {
	if (!result)
		throw new Error(`Failed to zip folder ${src}. This folder does not exist.`)

	const { debug } = options || {}

	if (debug) 
		console.log(debugInfo(`Starting to zip folder \n${src}.`))

	const archive = archiver('zip')
	const buffer = toBuffer(archive)

	archive.on('warning', err => {
		console.log(error('Warning while creating zip file'), err)
	})

	archive.on('error', err => {
		throw err
	})

	archive.directory(src)
	archive.finalize()
	return buffer
		.then(v => {
			if (debug) 
				console.log(debugInfo(`Folder \n${src} \nsuccessfully zipped to buffer.`))
			return v
		})
		.catch(e => {
			console.log(error(`Failed to zip folder ${src}`))
			throw e
		})
})

const zipNodejsProject = (src, options={ debug:false }) => {
	const { debug } = options || {}

	if (debug) 
		console.log(debugInfo(`Starting to zip nodejs project located under\n${src}`))

	return cloneNodejsProject(src, options)
		.then(dst => zipFolderToBuffer(dst, options).then(buffer => ({ buffer, tempFolder: dst })))
		.then(({ buffer, tempFolder }) => {
			if (debug) {
				const sizeMb = (buffer.length / 1024 / 1024).toFixed(2)
				console.log(debugInfo(`The nodejs project located under\n${src}\nhas been successfully zipped to buffer (size: ${sizeMb}MB)`))
			}

			return deleteFolder(tempFolder, options)
				.then(() => buffer)
		})
		.catch(e => {
			console.log(error(`Failed to zip nodejs project located under\n${src}`))
			throw e
		})
}

zipNodejsProject(process.cwd(), { debug:true })

//cloneNodejsProject(process.cwd(), { debug:true })
//.then(dst => dst ? deleteFolder(dst, { debug:true }) : null)




