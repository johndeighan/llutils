---
type: coffee
include: ['src/lib/PLL.peggy', 'src/lib/token.peggy']
---

GLOBAL
	{getTracer} = await import('@jdeighan/llutils/peggy')

	# ---------------------------------------------------------

	export ulmusAST = (input, tracerType='none') =>

		debugger
		return peg$parse(input, {
			tracer: getTracer(tracerType)
			})

# --------------------------------------------------------------------------

value

	boolean

	number

	string
