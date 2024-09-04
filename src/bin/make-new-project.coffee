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
	undef, defined, notdefined, OL, nonEmpty,
	assert, words,
	} from '@jdeighan/llutils'
import {execCmd} from '@jdeighan/llutils/exec-utils'
import {getArgs} from '@jdeighan/llutils/cmd-args'
import {
	lValidTypes, setProjType, promptForProjType, makeProjDir,
	typeSpecificSetup, checkIfInstalled, NodeEnv,
	} from '@jdeighan/llutils/proj-utils'

# ---------------------------------------------------------------------------

main = () =>
	checkIfInstalled 'node', 'yarn'
	hArgs = getArgs {
		_: {
			min: 0
			max: 1
			desc: "<dirname>"
			}
		c: {
			type: 'boolean'
			msg: 'clear out directory if it exists'
			}
		type: {
			type: 'string'
			desc: 'type of project'
			msg: lValidTypes.join('|')
			}
		}
	{_: lNonOptions, c: clear, type} = hArgs

	if notdefined(type)
		type = await promptForProjType()

	[type, subtype] = type.split('/', 2)
	setProjType(type, subtype)
	console.log "type = #{OL(type)}"
	console.log "subtype = #{OL(subtype)}"

	dirname = lNonOptions[0] || type
	console.log "make-new-project #{type} in dir #{lNonOptions[0]}"

	makeProjDir dirname, {clear}   # also cd's to proj dir

	execCmd "git init"
	execCmd "git branch -m main"
	execCmd "npm init -y"

	nodeEnv = new NodeEnv('fixPkgJson')
	nodeEnv.addDependency '@jdeighan/llutils'
	nodeEnv.addDevDependency 'concurrently'
	nodeEnv.setField 'description', "A #{type} app"
	nodeEnv.setField 'packageManager', 'yarn@1.22.22'
	nodeEnv.addFile 'README.md'
	nodeEnv.addFile '.gitignore'
	nodeEnv.addFile '.npmrc'

	# === Install libraries specified via env vars

	env_installs = process.env.PROJECT_INSTALLS
	if nonEmpty(env_installs)
		for pkg in words(env_installs)
			nodeEnv.addDependency pkg

	env_dev_installs = process.env.PROJECT_DEV_INSTALLS
	if nonEmpty(env_dev_installs)
		for pkg in words(env_dev_installs)
			nodeEnv.addDevDependency pkg

	nodeEnv.addDevDependency 'coffeescript'
	nodeEnv.addDevDependency 'ava'

	typeSpecificSetup(nodeEnv)
	nodeEnv.write_pkg_json()
	console.log """
		Please run:
			cd ../#{dirname}
			yarn
			npm run dev
		"""

# ---------------------------------------------------------------------------

main()
