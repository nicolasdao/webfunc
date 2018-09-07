/**
 * Copyright (c) 2018, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
const { bold, gray, cyan, red, underline, green } = require('chalk')
const ora2 = require('ora')
const readline = require('readline')
const inquirer = require('inquirer')
const stripAnsi = require('strip-ansi')
const ansiEscapes = require('ansi-escapes')
const { exec } = require('child_process')

const eraseLines = n => ansiEscapes.eraseLines(n)

const getLength = string => {
	let biggestLength = 0
	string.split('\n').map(str => {
		str = stripAnsi(str)
		if (str.length > biggestLength) {
			biggestLength = str.length
		}
		return undefined
	})
	return biggestLength
}

const highlight = text => bold.underline(text)
const info = (...msgs) => `${gray('>')} ${msgs.join('\n')}`
const debugInfo = (...msgs) => `${green('> DEBUG')} ${msgs.join('\n')}`
const success = info
const question = info
const note = (...msgs) => gray(info(...msgs))
const cmd = text => `${gray('`')}${cyan(text)}${gray('`')}`
const link = text => underline(text)
const aborted = msg => `${red('> Aborted!')} ${msg}`
const error = (...input) => {
	let messages = input

	if (typeof input[0] === 'object') {
		const {slug, message} = input[0]
		messages = [ message ]

		if (slug) {
			messages.push(`> More details: https://webfunc/${slug}`)
		}
	}

	return `${red('> ERROR!')} ${messages.join('\n')}`
}
const warn = (...input) => {
	let messages = input

	if (typeof input[0] === 'object') {
		const {slug, message} = input[0]
		messages = [ message ]

		if (slug) {
			messages.push(`> More details: https://webfunc/${slug}`)
		}
	}

	return `${red('> WARN!')} ${messages.join('\n')}`
}

const askQuestion = question => {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	})
	return (new Promise((resolve) => rl.question(question, resolve)))
		.then(answer => {
			rl.close()
			return answer
		})
}

const promptList = ({
	message = 'the question',
	choices = [
		{
			name: 'something\ndescription\ndetails\netc',
			value: 'something unique',
			short: 'generally the first line of `name`'
		}
	],
	pageSize = 15, // Show 15 lines without scrolling (~4 credit cards)
	separator = true, // Puts a blank separator between each choice
	abort = 'end', // Wether the `abort` option will be at the `start` or the `end`,
	eraseFinalAnswer = false // If true, the line with the final answee that inquirer prints will be erased before returning
}) => {
	let biggestLength = 0

	choices = choices.map(choice => {
		if (choice.name) {
			const length = getLength(choice.name)
			if (length > biggestLength) {
				biggestLength = length
			}
			return choice
		}
		throw new Error('Invalid choice')
	})

	if (separator === true) {
		choices = choices.reduce(
			(prev, curr) => prev.concat(new inquirer.Separator(' '), curr),
			[]
		)
	}

	const abortSeparator = new inquirer.Separator('─'.repeat(biggestLength))
	const _abort = {
		name: 'Abort',
		value: undefined
	}

	if (abort === 'start') {
		const blankSep = choices.shift()
		choices.unshift(abortSeparator)
		choices.unshift(_abort)
		choices.unshift(blankSep)
	} else {
		choices.push(abortSeparator)
		choices.push(_abort)
	}

	const nonce = Date.now()
	return inquirer.prompt({
		name: nonce,
		type: 'list',
		message,
		choices,
		pageSize
	}).then(answer => {
		if (eraseFinalAnswer === true) 
			process.stdout.write(eraseLines(2))
		return answer[nonce]
	})
}

const execCommand = command => new Promise((success, failure) => {
	exec(command, { stdio: 'inherit' }, (e, stdout, stderr) => {
		if (e) {
			console.log(error(`Failed to execute command '${command}'. Details: ${e}`))
			console.log(error(stderr))
			failure()
		} else
			success()
	})
})

const wait = (msg, timeOut = 300, ora = ora2) => {
	let running = false
	let spinner
	let stopped = false

	setTimeout(() => {
		if (stopped) return
    
		spinner = ora(gray(msg))
		spinner.color = 'gray'
		spinner.start()
    
		running = true
	}, timeOut)

	const cancel = () => {
		stopped = true
		if (running) {
			spinner.stop()
			process.stderr.write(eraseLines(1))
			running = false
		}
		process.removeListener('nowExit', cancel)
	}

	process.on('nowExit', cancel)
	return cancel
}

module.exports = wait

module.exports = {
	aborted,
	askQuestion,
	bold,
	cmd,
	debugInfo: debugInfo,
	error,
	exec: execCommand,
	highlight,
	info,
	link,
	promptList,
	success,
	wait,
	question,
	warn,
	note
}