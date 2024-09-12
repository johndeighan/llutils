# ulmus.test.coffee

import {undef} from '@jdeighan/llutils'
import * as lib from '@jdeighan/llutils/ulmus'
Object.assign(global, lib)
import * as lib2 from '@jdeighan/llutils/utest'
Object.assign(global, lib2)

# ---------------------------------------------------------------------------

equal ulmusAST("true"), {
	type: 'boolean'
	value: true
	}

equal ulmusAST("false"), {
	type: 'boolean'
	value: false
	}

equal ulmusAST("13"), {
	type: 'integer'
	value: 13
	}

equal ulmusAST("13.5"), {
	type: 'float'
	value: 13.5
	}

equal ulmusAST("'abc'"), {
	type: 'string'
	value: 'abc'
	}

equal ulmusAST('"abc"'), {
	type: 'string'
	value: 'abc'
	}

# equal ulmusAST """
# 	['abc','def']
# 	""", {
# 	type: 'list'
# 	subtype: 'string'
# 	value: ['abc','def']
# 	}
