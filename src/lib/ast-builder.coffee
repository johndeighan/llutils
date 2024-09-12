# ast-builder.coffee

import {
	undef, defined, notdefined, hasKey, keys,
	isString, isHash, isArray,
	} from '@jdeighan/llutils'

# ---------------------------------------------------------------------------
# --- hDesc describes allowed keys in a node
#        <type>:
export class ASTBuilder

	constructor: (type, hDesc) ->

		@hAst = { type }

