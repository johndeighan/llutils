# install-utils.coffee

import {
	undef, defined, notdefined, OL, execCmd, getOptions,
	} from '@jdeighan/llutils'
import {BOX} from '@jdeighan/llutils/dump'

# ---------------------------------------------------------------------------

export lInstalled = []

# ---------------------------------------------------------------------------

export isInstalled = (pkg) =>

	return lInstalled.includes(pkg)

# ---------------------------------------------------------------------------

export notInstalled = (pkg) =>

	return ! lInstalled.includes(pkg)

# ---------------------------------------------------------------------------

export installPkg = (pkg, hOptions={}) =>

	if isInstalled(pkg)
		console.log "Attempted duplicate install of #{pkg}!"
		return

	{dev, version} = getOptions hOptions, {
		dev: true
		version: undef
		}
	if dev
		cmd = "npm install -D #{pkg}"
	else
		cmd = "npm install #{pkg}"
	if defined(version)
		cmd += " #{version}"
	console.log "CMD: #{OL(cmd)}"
	try
		execCmd cmd
		lInstalled.push pkg
	catch err
		console.log "ERROR: #{err.message}"
		console.log err
	return
