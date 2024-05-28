# node-walker.coffee

import {
	undef, defined, notdefined, OL, getOptions, LOG,
	assert, croak, dclone,
	isString, isArray, isHash,
	hasKey, keys,
	} from '@jdeighan/llutils'
import {indented, undented} from '@jdeighan/llutils/indent'

# ---------------------------------------------------------------------------
# --- anything named 'item'
#     can always be a node or array of nodes

export class NodeWalker

	constructor: (hOptions={}) ->

		{debug: @debug} = getOptions hOptions, {
			debug: false
			}

		# --- Array of {key, hNode}
		@lStack = []

	# ..........................................................

	level: () ->

		return @lStack.length

	# ..........................................................

	isNode: (item) ->

		return isHash(item) && hasKey(item, 'type')

	# ..........................................................

	isArrayOfNodes: (item) ->

		if ! isArray(item)
			return false
		for x in item
			if !@isNode(x)
				return false
		return true

	# ..........................................................

	dbg: (str) ->

		if @debug
			LOG indented(str, @level())
		return

	# ..........................................................

	walk: (hAST) ->

		assert @isNode(hAST), "Not a node: #{OL(hAST)}"
		@init()
		@visit hAST
		@visitChildren hAST
		@end hAST
		return this    # allow chaining

	# ..........................................................

	visitChildren: (hNode) ->

		for own key,value of hNode
			@lStack.push {key, hNode}
			if @isNode(value)
				@visit value
				@visitChildren value
				@end value
			else if @isArrayOfNodes(value)
				for hNode in value
					@visit hNode
					@visitChildren hNode
					@end hNode
			@lStack.pop()
		return

	# ..........................................................
	# --- Override these

	init: () ->

		@lLines = []
		return

	# ..........................................................

	visit: (hNode) ->

		@dbg indented("VISIT #{hNode.type}")
		@lLines.push indented(@stringify(hNode), @level())
		return

	# ..........................................................

	stringify: (hNode) ->

		if (@lStack.length == 0)
			return hNode.type
		else
			{key} = @lStack.at(-1)
			return "#{key}: #{hNode.type}"

	# ..........................................................

	end: (hNode) ->

		@dbg indented("END   #{hNode.type}")
		return

	# ..........................................................

	getTrace: () ->

		return @lLines.join("\n")
