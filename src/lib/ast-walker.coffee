# ast-walker.coffee

import {
	undef, defined, notdefined, listdiff,
	} from '@jdeighan/llutils'
import {NodeWalker} from '@jdeighan/llutils/node-walker'

# ---------------------------------------------------------------------------

export class ASTWalker extends NodeWalker

	init: () ->

		@lImports = []
		@lExports = []
		@lUsed = []

	getImports: () -> return @lImports
	getExports: () -> return @lExports
	getUsed: () -> return @lUsed
	getNeeded: () -> return listdiff(@lUsed, @lImports)

	# ..........................................................
	#    @level() gives you the level
	#    @lStack is stack of {key, hNode} to get parents

	visit: (type, hNode) ->

		super type, hNode
