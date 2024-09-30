# token.test.coffee

import {BaseTracer} from '@jdeighan/llutils/peggy-utils'
import * as lib from '@jdeighan/llutils/token'
Object.assign(global, lib)
import * as lib2 from '@jdeighan/llutils/utest'
Object.assign(global, lib2)

u.transformValue = (block) =>
	return parse block, {tracer: new BaseTracer()}

# ---------------------------------------------------------------------------

equal "true", {
	type: 'boolean'
	value: true
	}

equal "false", {
	type: 'boolean'
	value: false
	}

equal "13", {
	type: 'integer'
	value: 13
	}

equal "13.5", {
	type: 'float'
	value: 13.5
	}

equal "'abc'", {
	type: 'string'
	value: 'abc'
	}

equal '"abc"', {
	type: 'string'
	value: 'abc'
	}

equal 'abc', {
	type: 'identifier'
	value: 'abc'
	}
