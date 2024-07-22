# ast-walker.coffee

import {
	undef, defined, notdefined, listdiff, hasKey, words,
	assert, croak, dclone, keys, OL, removeKeys,
	isString, nonEmpty,
	} from '@jdeighan/llutils'
import {DUMP} from '@jdeighan/llutils/dump'
import {extract} from '@jdeighan/llutils/data-extractor'
import {
	NodeWalker, stackMatches,
	} from '@jdeighan/llutils/node-walker'

# ---------------------------------------------------------------------------

export removeExtraASTKeys = (hAST) =>

	removeKeys hAST, words(
		'loc range extra start end',
		'directives comments tokens',
		)
	return hAST

# ---------------------------------------------------------------------------

export class ASTWalker extends NodeWalker

	init: () ->

		super()

		# --- clone AST, remove extra keys
		hAST = dclone(@hAST)
		removeExtraASTKeys hAST
		@hAST = hAST

		@lEnvironments = [] # --- stack of Set objects

		@hImports = {}      # --- {<src>: <Set obj>, ...}
		@setExports = new Set()
		@setUsed = new Set()

	# ..........................................................

	pushEnv: (set) ->

		@lEnvironments.push set
		return

	# ..........................................................

	popEnv: () ->

		return @lEnvironments.pop()

	# ..........................................................

	inEnv: (name) ->

		for set in @lEnvironments
			if set.has(name)
				return true
		return false

	# ..........................................................

	addUsed: (name) ->

		if ! @inEnv(name)
			@setUsed.add(name)
		return

	# ..........................................................

	addImport: (src, name) ->

		assert isString(name), "Not a string: #{OL(name)}"
		assert nonEmpty(name), "Not empty: #{OL(name)}"
		if hasKey(@hImports, src)
			@hImports[src].add name
		else
			@hImports[src] = new Set([name])
		return

	# ..........................................................

	addExport: (name) ->

		assert ! @setExports.has(name),
				"Export already declared: #{OL(name)}"
		@setExports.add name
		return

	# ..........................................................

	getMissing: () ->

		setMissing = new Set()
		for val from @setUsed.values()
			setMissing.add val
		for src in keys(@hImports)
			for val from @hImports[src].values()
				setMissing.delete val
		return setMissing

	# ..........................................................

	analyzeExpr: (type, hNode) ->

		# --- Add all identifiers used in this expression
		switch type
			when 'AssignmentExpression'
				{left, operator, right} = hNode
				if (right.type == 'Identifier')
					@addUsed right.name
		return

	# ..........................................................

	end: (type, hNode) ->

		switch type
			when 'ArrowFunctionExpression'
				@popEnv()
		return

	# ..........................................................
	#    @level() gives you the level
	#    @lStack is stack of {key, hNode} to get parents

	visit: (type, hNode) ->

		super type, hNode
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

			when 'ExpressionStatement'
				{expression} = hNode
				@analyzeExpr expression.type, expression

			when 'BinaryExpression'
				{left, operator, right} = hNode
				if (left.type == 'Identifier')
					@addUsed left.name
				if (right.type == 'Identifier')
					@addUsed right.name

			when 'ArrowFunctionExpression'
				{params} = hNode
				set = new Set()
				if defined(params)
					for parm in params
						if (parm.type == 'Identifier')
							set.add(parm.name)
				@pushEnv set
