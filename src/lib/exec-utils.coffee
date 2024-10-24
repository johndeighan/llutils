# exec-utils.coffee

import {exec, execSync} from 'node:child_process'
import vm from 'node:vm'
import {promisify} from 'node:util'
execAsync = promisify(exec)

import {
	undef, defined, notdefined, getOptions, chomp,
	assert, croak, OL, stripCR, isEmpty,
	} from '@jdeighan/llutils'
import {slurp} from '@jdeighan/llutils/fs'

# ---------------------------------------------------------------------------

export execCmd = (cmdLine, hOptions={}) =>
	# --- may throw an exception

	hOptions.encoding = 'utf8'
	hOptions.windowsHide = true
	hOptions.timeout = 100000

	result = execSync(cmdLine, hOptions)
	assert defined(result), "undef return from execSync()"
	result = result.toString()
	assert defined(result), "undef return from toString()"
	return stripCR(result)

# ---------------------------------------------------------------------------

export execCmdY = (cmdLine, hOptions={}) =>

	hOptions.input = "y\r\n"
	return execCmd cmdLine, hOptions

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

# ---------------------------------------------------------------------------

export getScriptObj = (jsCode, hOptions={}) =>

	return new vm.Script(jsCode, hOptions)

# ---------------------------------------------------------------------------

export checkJS = (jsCode, hOptions={}) =>

	try
		script = getScriptObj(jsCode, hOptions)
		return true
	catch err
		return false

# ---------------------------------------------------------------------------

export checkJSFile = (filePath, hOptions={}) =>

	assert isFile(filePath), "No such file: #{OL(filePath)}"
	return checkJS(slurp(filePath), hOptions)

# ---------------------------------------------------------------------------
# --- returns result of last statement executed

export execJS = (jsCode, hOptions={}) =>

	script = getScriptObj(jsCode, hOptions)
	result = script.runInNewContext({}, {
		displayErrors: true
		})
	return result
