# context-stack.coffee

import {
	undef, defined, notdefined, OL, isArray, isHash,
	assert, croak,
	} from '@jdeighan/llutils'

# ---------------------------------------------------------------------------

export class ContextStack

	constructor: (obj) ->

		@lStack = [obj]

	# ..........................................................

	current: () ->

		return @lStack.at(-1)

	# ..........................................................

	currentType: () ->

		curr = @current()
		if (curr == undef)
			return 'undef'
		else if isHash(curr)
			return 'hash'
		else if isArray(curr)
			return 'array'
		else
			croak "Bad current context: #{OL(curr)}"

	# ..........................................................

	add: (obj) ->

		@lStack.push obj
		return

	# ..........................................................

	pop: () ->

		result = @lStack.pop()
		assert (@lStack.length >= 1), "Empty context stack"
		return result
