# ast-walker.coffee

import {
	undef, defined, notdefined, listdiff, hasKey, words,
	assert, croak, dclone, keys, OL, removeKeys,
	isString, nonEmpty, setsAreEqual,
	} from '@jdeighan/llutils'
import {DUMP} from '@jdeighan/llutils/dump'
import {extract} from '@jdeighan/llutils/data-extractor'
import {
	NodeWalker, stackMatches,
	} from '@jdeighan/llutils/node-walker'
import {EnvNodeStack} from '@jdeighan/llutils/env-stack'
import {removeExtraASTKeys} from '@jdeighan/llutils/llcoffee'

# ---------------------------------------------------------------------------

export class ASTWalker extends NodeWalker

	init: () ->

		# --- clone AST, remove extra keys
		@hAST = removeExtraASTKeys(dclone(@hAST))

		@envStack = new EnvNodeStack()

		@hImports = {}      # --- {<src>: <Set>, ...}
		@importsSet = new Set()
		@exportsSet = new Set()
		@missingSet = new Set()
		@missingFuncSet = new Set()   # missing only if never defined
		                              # at top level
		@usedSet = new Set()

		@dbgMissingSet = new Set()
		@dbgMissingFuncSet = new Set()

	# ..........................................................

	getTopLevelSymbols: () ->

		return Array.from(@envStack.topLevelSet)

	# ..........................................................

	getSymbols: (type) ->

		switch type
			when 'exports'
				return Array.from(@exportsSet.values())
			when 'imports'
				return Array.from(@importsSet.values())
			when 'detailed-imports'
				h = {}
				for lib in keys(@hImports)
					h[lib] = Array.from(@hImports[lib])
				return h
			when 'missing'
				return Array.from(@missingSet.values())
			when 'used'
				return Array.from(@usedSet.values())
			when 'unused'
				setUnused = @importsSet.difference(@usedSet)
				return Array.from(setUnused)
			when 'toplevel'
				return Array.from(@envStack.topLevelSet)
			else
				croak "getSymbols(): Bad type #{OL(type)}"
		return

	# ..........................................................

	addDefined: (name) ->

		@dbg "DEFINED: #{OL(name)}", 1
		@envStack.add name
		return

	# ..........................................................

	addUsed: (name) ->

		@usedSet.add name
		if ! @envStack.inCurEnv(name)
			@dbg "USED: #{OL(name)} - missing", 1
			@missingSet.add name
		else
			@dbg "USED: #{OL(name)}", 1
		return

	# ..........................................................

	addUsedFunc: (name) ->

		@usedSet.add name
		if ! @envStack.inCurEnv(name)
			@dbg "USED: #{OL(name)} - missing func", 1
			@missingFuncSet.add name
		else
			@dbg "USED: #{OL(name)}", 1
		return

	# ..........................................................

	addImport: (src, name) ->

		assert isString(name), "Not a string: #{OL(name)}"
		assert nonEmpty(name), "Not empty: #{OL(name)}"
		@importsSet.add name
		if hasKey(@hImports, src)
			@hImports[src].add name
		else
			@hImports[src] = new Set([name])
		@addDefined name
		return

	# ..........................................................

	addExport: (name) ->

		assert ! @exportsSet.has(name),
				"Export already declared: #{OL(name)}"
		@exportsSet.add name
		return

	# ..........................................................

	addMissing: (name) ->

		@missingSet.add name
		return

	# ..........................................................

	addMissingFunc: (name) ->

		@missingFuncSet.add name
		return

	# ..........................................................

	addMissingFunc: (name) ->

		@missingFuncSet.add name
		return

	# ..........................................................

	traceDetail: (hNode) ->

		switch hNode.type
			when 'Identifier'
				return hNode.name
			else
				return undef
		return

	# ..........................................................

	getChildKeys: (hNode) ->

		{type} = hNode
		if (type == 'AssignmentExpression')
			return ['right','left']
		else
			return super(hNode)

	# ..........................................................

	dbgChanges: (which, type) ->

		if !setsAreEqual(@dbgMissingSet, @missingSet)
			@dbg "(lMissing = #{OL([@missingSet...])})"
			@dbgMissingSet.clear()
			for item from @missingSet.values()
				@dbgMissingSet.add item

		if !setsAreEqual(@dbgMissingFuncSet, @missingFuncSet)
			@dbg "(lMissingFuncs = #{OL([@missingFuncSet...])})"
			@dbgMissingFuncSet.clear()
			for item from @missingFuncSet.values()
				@dbgMissingFuncSet.add item
		return

	# ..........................................................

	end: (hNode) ->

		{type} = hNode
		switch type

			when 'FunctionExpression', 'ArrowFunctionExpression'
				debugger
				@envStack.endEnv()

			when 'File'
				for name from @missingFuncSet
					if ! @envStack.inCurEnv(name)
						@dbg "FINALLY: #{OL(name)} still missing"
						@missingSet.add name
				@envStack.endEnv()

			when 'AssignmentExpression'
				{left, operator, right} = hNode
				if (left.type == 'Identifier') && left.declaration
					@addDefined left.name

		@dbgChanges 'END', type
		return

	# ..........................................................
	#    @level() gives you the level
	#    @lStack is stack of {key, hNode} to get parents

	visit: (hNode) ->

		super hNode
		{type} = hNode
		switch type

			when 'ImportDeclaration'
				{src, specifiers} = extract(hNode, """
					importKind="value"
					!source
						type="StringLiteral"
						value as src
					specifiers
					""")

				for h in specifiers
					assert (h.type == 'ImportSpecifier'), "Bad"
					name = h.imported.name
					@addImport src, name

			when 'ExportNamedDeclaration'
				{name} = extract(hNode, """
					exportKind="value"
					declaration
						type="AssignmentExpression"
						left.type="Identifier"
						left.name
					""")

				@addExport name

			when 'AssignmentExpression'
				{right} = hNode
				if (right.type == 'Identifier')
					@addUsed right.name

			when 'BinaryExpression'
				{left, operator, right} = hNode
				if (left.type == 'Identifier')
					@addUsed left.name
				if (right.type == 'Identifier')
					@addUsed right.name

			when 'CallExpression','NewExpression'
				debugger
				h = extract(hNode, """
					callee
						type as calleeType
						?name as calleeName
					[arguments as lArgs]
						type
						name
					""")

				{callee, calleeType, calleeName, lArgs} = h

				if (calleeType == 'Identifier')
					@addUsedFunc calleeName, true
				else if (calleeType == 'MemberExpression') \
						&& (callee.object.type == 'Identifier')
					@addUsed callee.object.name

				for {type, name} in lArgs
					if (type == 'Identifier')
						@addUsed name

			when 'FunctionExpression','ArrowFunctionExpression'
				@envStack.addEnv()
				@dbg "ADD ENV"
				{params} = hNode
				if defined(params)
					for parm in params
						if (parm.type == 'Identifier')
							@addDefined parm.name

		@dbgChanges 'VISIT', type
