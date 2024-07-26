# env-stack.coffee

import {
	undef, defined, notdefined,
	assert, croak,
	} from '@jdeighan/llutils'

# ---------------------------------------------------------------------------

export class EnvNode

	constructor: () ->

		@definedSet = new Set()

	# ..........................................................

	has: (name) ->

		return @definedSet.has(name)

	# ..........................................................

	addDefined: (name) ->

		@definedSet.add name

# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------

export class EnvNodeStack

	constructor: () ->

		@topLevelEnv = new EnvNode()
		@topLevelSet = @topLevelEnv.definedSet
		@lEnvironments = [@topLevelEnv]

	# ..........................................................

	level: () ->

		return @lEnvironments.length - 1

	# ..........................................................

	addEnv: () ->

		@lEnvironments.push(new EnvNode())
		return

	# ..........................................................

	endEnv: () ->

		assert (@lEnvironments.length > 0), "No environments"
		env = @lEnvironments.pop()
		assert defined(env), "env not defined"
		assert (env instanceof EnvNode), "not an EnvNode"
		return

	# ..........................................................

	curenv: () ->

		return @lEnvironments.at(-1)

	# ..........................................................

	add: (name) ->

		@curenv().addDefined name

	# ..........................................................

	inCurEnv: (name) ->

		for env in @lEnvironments
			if env.has(name)
				return true
		return false
