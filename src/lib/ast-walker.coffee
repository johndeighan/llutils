# ast-walker.coffee

import {
	undef, defined, notdefined, listdiff, hasKey,
	assert, croak, DUMP, dclone, keys, OL,
	} from '@jdeighan/llutils'
import {
	NodeWalker, stackMatches,
	} from '@jdeighan/llutils/node-walker'

# ---------------------------------------------------------------------------

export class ASTWalker extends NodeWalker

	init: () ->

		super()
		@hImports = {}    # --- {<src>: [<ident>,...], ...}
		@lExports = []
		@lUsed = []

	# ..........................................................

	addImport: (src, ident) ->

		if hasKey(@hImports, src)
			assert !@hImports[src].includes(ident),
					"Import already declared: #{OL(ident)}"
			@hImports[src].push ident
		else
			@hImports[src] = [ident]
		return

	# ..........................................................

	addExport: (ident) ->

		assert !@lExports.includes(ident),
				"Export already declared: #{OL(ident)}"
		@lExports.push ident
		return

	# ..........................................................

	addUsed: (ident) ->

		assert !@lUsed.includes(ident),
				"Used symbol already declared: #{OL(ident)}"
		@lUsed.push ident
		return

	# ..........................................................

	getNeeded: () ->

		lNeeded = dclone(@lUsed)
		for src in keys(@hImports)
			lNeeded = listdiff(lNeeded, @hImports[src])
		return lNeeded

	# ..........................................................
	#    @level() gives you the level
	#    @lStack is stack of {key, hNode} to get parents

	visit: (type, hNode) ->

		super type, hNode
		switch type
			when 'Identifier'
				assert hasKey(hNode, 'name'), "No name key: #{OL(hNode)}"
				{name} = hNode

				if @debug
					console.log "Identifier: #{OL(name)}"
					@dumpStack()

				if @stackMatches """
						imported: ImportSpecifier
						specifiers: ImportDeclaration
						"""
					src = @lStack.at(-2).hNode.source.value
					@addImport src, name

				if @stackMatches """
						right: AssignmentExpression
						declaration: ExportNamedDeclaration
						"""
					@addUsed name

				if @stackMatches """
						left: AssignmentExpression
						declaration: ExportNamedDeclaration
						"""
					@addExport name

