# digraph.coffee

import Graph from 'graphology'
import {
	hasCycle, topologicalSort,
	} from 'graphology-dag';

import {
	undef, defined, notdefined, isEmpty, nonEmpty,
	keys, hasKey, OL, LOG, identityFunc,
	isString, isArray, isHash,
	assert, croak, getOptions,
	} from '@jdeighan/llutils'
import {execCmd} from '@jdeighan/llutils/exec-utils'
import {fileExt, withExt, barf} from '@jdeighan/llutils/fs'

# ---------------------------------------------------------------------------

export class DiGraph

	constructor: (hOptions={}) ->

		{
			normalize: @normalize,
			filterDep: @filterDep,
			debug: @debug,
			hStyles: @hStyles
			} = getOptions hOptions, {
				normalize: identityFunc
				filterDep: ((dep) => return true)
				debug: false
				hStyles: {}
				}

		# --- convert all styles to strings
		for type in keys(@hStyles)
			style = @hStyles[type]
			if isHash(style)
				@hStyles[type] = @attrStr style

		@graph = new Graph({
			allowSelfLoops: false
			multi: false
			type: 'directed'
			})

	# ..........................................................

	attrStr: (h) ->

		lParts = keys(h).map((key) => "#{key}=#{h[key]}")
		return " [#{lParts.join(', ')}]"

	# ..........................................................
	# --- filePath is the file that should be output,
	#        e.g. "myfile.svg" or "myfile.png"
	#     the file extension is the type of image file desired

	render: (filePath, layout=undef) ->

		type = fileExt(filePath).substring(1)
		LOG "type = #{OL(type)}"
		if defined(layout)
			LOG "layout = #{OL(layout)}"
		dotPath = withExt(filePath, '.dot')
		@barfDotProgram dotPath
		if defined(layout)
			execCmd "dot -T#{type} -K#{layout} #{dotPath} > #{filePath}"
		else
			execCmd "dot -T#{type} #{dotPath} > #{filePath}"
		return

	# ..........................................................

	add: (item, lDeps=[], hAttr={}) ->
		# --- 2nd parameter may be a simple string
		#     if there's only one dependency

		node = @normalize(item, 'key')
		assert isString(node), "node not a string: #{OL(node)}"
		if isString(lDeps)
			lDeps = [lDeps]
		else
			assert isArray(lDeps), "not an array: #{OL(lDeps)}"

		@graph.mergeNode node, hAttr
		for dep in lDeps
			if @filterDep(dep)
				ndep = @normalize(dep, 'dep')
				@graph.mergeNode ndep, {nodeType: 'lib'}
				@graph.mergeEdge node, ndep

		if @debug
			@dump()
		return this    # allow chaining

	# ..........................................................

	hasCycle: () ->

		return hasCycle(@graph)

	# ..........................................................

	numNodes: () ->

		return @graph.order

	# ..........................................................

	numEdges: () ->

		return @graph.size

	# ..........................................................
	# --- callback gets (node, nodeType, lDeps)

	forEachNode: (func, hOptions={}) ->

		{sortKeys, sortDeps, noTrans} =
			getOptions hOptions, {
				sortKeys: true
				sortDeps: false
				noTrans: false   # --- else only non-transitive
				}

		lNodes = @graph.nodes()
		if sortKeys
			lNodes.sort()

		for node in lNodes
			if noTrans
				lDeps = @follows(node)
			else
				lDeps = @getOutNodes(node)
			if sortDeps
				lDeps.sort()
			func node, @graph.getNodeAttributes(node), lDeps
		return

	# ..........................................................

	dump: (hOptions={}) ->

		{maxWidth} = getOptions hOptions, {
			maxWidth: 64
			}

		LOG "DEPENDENCIES:"
		@forEachNode ((node, hAttr, lDeps) =>
			nodeType = hAttr.nodeType
			if isEmpty(lDeps)
				LOG "\t#{node}: {}"
			else
				totLen = 0
				for dep in lDeps
					totLen += dep.length
				if (totLen < maxWidth)
					LOG "\t#{node} { #{lDeps.join(', ')} }"
				else
					LOG "\t#{node} \n\t#{lDeps.join('\n\t')}\n"
			)
		return

	# ..........................................................

	getBuildOrder: (hOptions={}) ->

		{noTrans} = getOptions hOptions, {
			noTrans: false
			}

		if noTrans
			lDeps = []
			@forEachNode ((node, hAttr) =>
				nodeType = hAttr.nodeType
				lDeps.push node
				), 'notrans'
			return lDeps
		else
			# --- returns an array
			return topologicalSort(@graph).reverse()

	# ..........................................................

	dotProgram: () ->

		lLines = ["digraph {"]
		@forEachNode ((node, hAttr) =>
			{nodeType} = hAttr
			style = @hStyles[nodeType]
			if nonEmpty(style)
				lLines.push "\t\"#{node}\"#{style}"
			lFollows = @follows(node)
			if (lFollows.length == 1)
				lLines.push "\t\"#{node}\" -> \"#{lFollows[0]}\""
			else if (lFollows.length > 1)
				for node2 in lFollows
					lLines.push "\t\"#{node}\" -> \"#{node2}\""
			)
		lLines.push "\t}"
		return lLines.join("\n")

	# ..........................................................

	barfDotProgram: (filePath) ->

		assert defined(filePath), "Missing filePath"
		program = @dotProgram()
		barf program, filePath
		return

	# ..........................................................

	isLeafNode: (node) ->

		return (@graph.outDegree(node) == 0)

	# ..........................................................

	getOutNodes: (node) ->

		return @graph.mapOutEdges(node,
			(edge, attr, src, dest) =>
				return dest
				)

	# ..........................................................

	follows: (node) ->

		lFullPaths = @getFullPathsFor(node)
		setFollows = new Set()
		for lPath in lFullPaths
			setFollows.add lPath[1]
		for lPath in lFullPaths
			pos = 2
			while (pos < lPath.length)
				setFollows.delete lPath[pos]
				pos += 1
		return Array.from setFollows

	# ..........................................................

	getFullPathsFor: (node) ->

		assert @graph.hasNode(node), "Not a node: #{OL(node)}"

		lDeps = @getOutNodes(node)
		lPathList = lDeps.map((s) => [node, s])
		@extendPaths lPathList
		return lPathList

	# ..........................................................

	extendPaths: (lPathList) ->

		pos = 0
		while (pos < lPathList.length)
			lPath = lPathList[pos]
			end = lPath.at(-1)
			if @isLeafNode(end)
				pos += 1
			else
				lDeps = @getOutNodes(end)
				lExtended = lDeps.map((node) => lPath.concat([node]))
				lPathList.splice pos, 1, lExtended...
				pos += lDeps.length
		return
