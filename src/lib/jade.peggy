---
type: coffee
include: ['src/lib/PLL.peggy', 'src/lib/token.peggy']
---

GLOBAL
	{getTracer} = await import('@jdeighan/llutils/peggy-utils')
	{VDOM} = await import('@jdeighan/llutils/dom')

	# ---------------------------------------------------------

	export getDOM = (input, tracerType='none') =>

		return peg$parse(input, {
			tracer: getTracer(tracerType)
			})

PER_PARSE

	VDOM.init()

# --------------------------------------------------------------------------

DOM

	ident: identifier

		return VDOM
