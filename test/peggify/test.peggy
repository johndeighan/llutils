---
type: coffee
---
GLOBAL
	import {undef} from '@jdeighan/llutils'

# ========================================

data
	lDesc: desc |1.., ','|
		result = mergeKeys({}, ...lDesc)

desc
	lSelectors: ident |1.., "."|
		obj = getObj({}, lSelectors)

ident
	str: $ ([A-Za-z_][A-Za-z0-9_]*)
		return str
