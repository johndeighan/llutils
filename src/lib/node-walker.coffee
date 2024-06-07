# node-walker.coffee

import {
	undef, defined, notdefined, OL, getOptions, LOG,
	assert, croak, dclone, range, rev_range, centered, leftAligned,
	isString, isArray, isHash, isEmpty,
	hasKey, keys,
	} from '@jdeighan/llutils'
import {DUMP} from '@jdeighan/llutils/dump'
import {indented, undented} from '@jdeighan/llutils/indent'

# ---------------------------------------------------------------------------

export stackMatches = (lStack, str) =>

	debugger
	lPath = parsePath(str)
	if (lStack.length < lPath.length)
		return false
	pos = lStack.length
	for i from range(lPath.length)
		pos -= 1
		item = lStack[pos]
		if !itemMatches(item, lPath[i])
			return false
	return true

# ---------------------------------------------------------------------------

export parsePath = (str) =>

	assert isString(str), "Not a string: #{OL(str)}"
	splitter = (substr) =>
		[key, type] = substr.split(':')
		if isEmpty(key) then key = ''
		if isEmpty(type) then type = ''
		return [key.trim(), type.trim()]
	re = /[\r\n\/]+/
	return str.split(re).map(splitter)

# ---------------------------------------------------------------------------

export itemMatches = (hStackItem, [key, type]) ->

	if key && (hStackItem.key != key.trim())
		return false
	if type && (hStackItem.hNode.type != type.trim())
		return false
	return true

# ---------------------------------------------------------------------------
# --- anything named 'item'
#     can always be a node or array of nodes

export class NodeWalker

	constructor: (hOptions={}) ->

		{debug, hDumpNode} = getOptions hOptions, {
			debug: false
			hDumpNode: {}
			}
		@debug = debug
		@hDumpNode = hDumpNode

		# --- Array of {key, hNode}
		@lStack = []

	# ..........................................................

	dumpStack: () ->

		console.log centered('STACK', 40, 'char=-')
		pos = @lStack.length
		for i from range(pos)
			pos -= 1
			item = @lStack[pos]
			# console.log "#{item.key}: #{item.hNode.type}"
			console.log "{key: #{leftAligned(item.key, 12)}, hNode: {type: #{item.hNode.type}}}"
		console.log '-'.repeat(40)
		return

	# ..........................................................

	stackMatches: (str) ->

		return stackMatches @lStack, str

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
		@hAST = hAST
		@init()
		@visit @hAST.type, @hAST
		@visitChildren @hAST
		@end @hAST
		return this    # allow chaining

	# ..........................................................

	visitChildren: (hNode) ->

		lKeys = keys(hNode)
		for key in lKeys
			value = hNode[key]
			@lStack.push {key, hNode}
			if @isNode(value)
				@visit value.type, value
				@visitChildren value
				@end value
			else if @isArrayOfNodes(value)
				for h in value
					@visit h.type, h
					@visitChildren h
					@end h
			@lStack.pop()
		return

	# ..........................................................
	# --- Override these

	init: () ->
		# --- ADVICE: if you modify @hAST, clone it first

		@lLines = []
		return

	# ..........................................................

	visit: (type, hNode) ->

		@dbg indented("VISIT #{type}")
		if @hDumpNode[type]
			DUMP hNode, type
		str = @stringifyNode(hNode)
		@lLines.push indented(str, @level())
		return

	# ..........................................................

	stringifyNode: (hNode) ->

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
