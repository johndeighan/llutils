---
type: coffee
include: 'src/lib/PLL.peggy'
---

GLOBAL
	import {
		undef, defined, OL,
		assert, nonEmpty,
		} from '@jdeighan/llutils'
	import {getTracer} from '@jdeighan/llutils/peggy'

	# ---------------------------------------------------------

	export evaluate = (input, tracerType='none') =>

		tracer = getTracer(tracerType, input, {
			level: () => return level
			sep:   () => return sep
			})
		if defined(tracer)
			return peg$parse(input, {tracer})
		else
			return peg$parse(input)

# --------------------------------------------------------------------------

PER_PARSE

	level = 0
	sep = false

# --------------------------------------------------------------------------

program

	lStmts: stmt |1.., SEP| NL*

		return {
			type: 'program',
			body: lStmts
			}

stmt
	varname:identifier '=' val:int

		return {
			type: 'assign',
			varname,
			val,
			}

	'if' INDENT body: stmt|1..,SEP| UNDENT

		return {
			type: 'if',
			body
			}

identifier

	str: $ ([a-z]+) & {return (str != 'if');}

		return str

int

	$ [0-9]+

NL

	"\r" ? "\n"
