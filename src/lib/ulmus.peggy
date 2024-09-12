---
type: coffee
include: ['src/lib/PLL.peggy', 'src/lib/token.peggy']
---

GLOBAL
	import {
		undef, defined, OL,
		assert, nonEmpty, isFunction,
		} from '@jdeighan/llutils'
	import {
		getTracer,
		} from '@jdeighan/llutils/tracer'

	# ---------------------------------------------------------

	export ulmusAST = (input, tracerType='none') =>

		debugger
		tracer = getTracer(tracerType)
		return peg$parse(input, {tracer})

# --------------------------------------------------------------------------

value

	boolean

	number

	string
