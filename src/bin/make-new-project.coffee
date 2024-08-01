# make-new-project.coffee

# --- Before running, set these environment variables:
#        PROJECT_ROOT_DIR - directory where you add projects
#        PROJECT_PACKAGE_JSON - JSON string or file path
#           - should have 'author' key
#        PROJECT_INSTALLS - comma sep list of pkgs to install
#        PROJECT_DEV_INSTALLS - comma sep list of dev pkgs to install
#        PROJECT_NAME_PREFIX - e.g. '@jdeighan/' to prepend this to proj name
#
#     Usage: mnp <dirname>
#        -c - clear out any existing directory
#        -type=(website|electron|codemirror|parcel)

import {
	undef, defined, notdefined, OL, nonEmpty, assert, words,
	} from '@jdeighan/llutils'
import {getArgs} from '@jdeighan/llutils/cmd-args'
import {
	setProjType, promptForProjType, makeProjDir,
	init_git, make_dirs, init_npm,
	addDep, addDevDep, addReadMe, addGitIgnore, addNpmRc,
	typeSpecificSetup, write_pkg_json,
	} from '@jdeighan/llutils/proj-utils'
import {NodeEnv} from '@jdeighan/llutils/node-env'

console.log "Starting make-new-project"

# ---------------------------------------------------------------------------

main = () =>
	{
		_: lNonOptions,
		c: clear,
		type
		} = getArgs {
		_: {
			exactly: 1
			}
		c: 'boolean'
		type: 'string'
		}

	if defined(type)
		setProjType(type)
	else
		await promptForProjType()

	dirname = lNonOptions[0]
	makeProjDir dirname, {clear}   # also cd's to proj dir
	init_git()
	node = new NodeEnv('fix')
	node.setField 'description', "A #{type} app"
	node.addFile 'README.md'
	node.addFile '.gitignore'
	node.addFile '.npmrc'

	# === Install libraries specified via env vars

	env_installs = process.env.PROJECT_INSTALLS
	if nonEmpty(env_installs)
		for pkg in words(env_installs)
			node.addDependency pkg

	env_dev_installs = process.env.PROJECT_DEV_INSTALLS
	if nonEmpty(env_dev_installs)
		for pkg in words(env_dev_installs)
			node.addDevDependency pkg

	node.addDevDependency 'ava'

	typeSpecificSetup(node)
	node.write_pkg_json()
	console.log "DONE"

# ---------------------------------------------------------------------------

main()
