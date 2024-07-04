# context.coffee

import {
	undef, defined, notdefined, OL, isArray, isHash,
	assert, croak,
	} from '@jdeighan/llutils'

# ---------------------------------------------------------------------------

export class Context

	constructor: (obj) ->

		@lStack = [obj]

	# ..........................................................

	current: () ->

		return @lStack.at(-1)

	# ..........................................................

	isArray: () ->

		return isArray(@current())

	# ..........................................................

	isHash: () ->

		return isHash(@current())

	# ..........................................................

	isUndef: () ->

		return notdefined(@current())

	# ..........................................................

	add: (obj) ->

		@lStack.push obj
		return

	# ..........................................................

	pop: () ->

		result = @lStack.pop()
		assert (@lStack.length >= 1), "Empty context stack"
		return result
