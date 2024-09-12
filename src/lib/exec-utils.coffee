# exec-utils.coffee

import {exec, execSync} from 'node:child_process'
import {promisify} from 'node:util'
execAsync = promisify(exec)

import {
	undef, defined, notdefined, getOptions, chomp, assert,
	} from '@jdeighan/llutils'

# ---------------------------------------------------------------------------

export execCmd = (cmdLine, hOptions={}) =>
	# --- may throw an exception

	hOptions = getOptions hOptions, {
		encoding: 'utf8'
		windowsHide: true
		}
	result = execSync(cmdLine, hOptions)
	assert defined(result), "undef return from execSync()"
	result = result.toString()
	assert defined(result), "undef return from execSync()"
	return result

# ---------------------------------------------------------------------------

export execAndLogCmd = (cmdLine, hOptions={}) =>
	# --- may throw an exception

	hOptions = getOptions hOptions, {
		encoding: 'utf8'
		windowsHide: true
		}
	result = execSync(cmdLine, hOptions).toString()
	console.log result
	return result

# ---------------------------------------------------------------------------

export execCmdAsync = (cmdLine, hOptions={}) =>
	# --- may throw an exception

	hOptions = getOptions hOptions, {
		encoding: 'utf8'
		windowsHide: true
		}
	return execAsync(cmdLine, hOptions)

# ---------------------------------------------------------------------------

export npmLogLevel = () =>

	result = execCmd('npm config get loglevel')
	return chomp(result)

