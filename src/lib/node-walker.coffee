# node-walker.coffee

import {
	undef, defined, notdefined, OL, getOptions,
	assert, croak, dclone, range, rev_range, centered, leftAligned,
	isString, isArray, isHash, isEmpty,
	hasKey, keys, untabify,
	} from '@jdeighan/llutils'
import {DUMP} from '@jdeighan/llutils/dump'
import {indented, undented} from '@jdeighan/llutils/indent'

# ---------------------------------------------------------------------------

export stackMatches = (lStack, str) =>

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

	walk: (hAST, hOptions={}) ->

		assert @isNode(hAST), "Not a node: #{OL(hAST)}"
		@hAST = hAST

		{
			trace: @trace,
			debug: @debug,
			hDumpNode: @hDumpNode,
			} = getOptions hOptions, {
				trace: false
				debug: false
				hDumpNode: {}
				}
		if @debug
			@trace = true    # always trace when debugging

		@init()   # --- init() can modify the AST

		@lStack = []   # --- Array of {key, hNode}
		@lTrace = []
		@visit @hAST
		@visitChildren @hAST
		@end @hAST
		return this    # allow chaining

	# ..........................................................

	dumpStack: () ->

		console.log centered('STACK', 40, 'char=-')
		pos = @lStack.length
		for i from range(pos)
			pos -= 1
			item = @lStack[pos]
			console.log "{key: #{leftAligned(item.key, 12)}, hNode: {type: #{item.hNode.type}}}"
		console.log '-'.repeat(40)
		return

	# ..........................................................

	stackMatches: (str) ->

		return stackMatches @lStack, str

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

	level: () ->

		return @lStack.length

	# ..........................................................

	dbg: (str, addLevel=0) ->

		if @trace
			level = @level() + addLevel
			str = '  '.repeat(level) + str
			console.log str
		return

	# ..........................................................
	# --- By default, children are visited in normal order
	#     to change, override this

	getChildKeys: (hNode) ->

		return keys(hNode)

	# ..........................................................

	visitChildren: (hNode) ->

		for key in @getChildKeys(hNode)
			value = hNode[key]
			@lStack.push {key, hNode}
			if @isNode(value)
				@visit value
				@visitChildren value
				@end value
			else if @isArrayOfNodes(value)
				for h in value
					@visit h
					@visitChildren h
					@end h
			@lStack.pop()
		return

	# ..........................................................
	# --- Override these

	init: (hAST=undef) ->
		# --- ADVICE: if you modify the AST,
		#             pass in a cloned version

		if defined(hAST)
			@hAST = hAST
		return

	# ..........................................................
	# --- override to add details to a traced node

	traceDetail: (hNode) ->

		return undef

	# ..........................................................

	visit: (hNode) ->

		{type} = hNode
		if details = @traceDetail(hNode)
			@dbg "VISIT #{@stringifyNode(hNode)} #{details}"
		else
			@dbg "VISIT #{@stringifyNode(hNode)}"
		if @hDumpNode[type]
			DUMP hNode, type
		str = @stringifyNode(hNode)
		@lTrace.push indented(str, @level())
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

		return @lTrace.join("\n")
