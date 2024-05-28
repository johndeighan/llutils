# cielo.test.coffee

import {undef} from '@jdeighan/llutils'
import * as lib from '@jdeighan/llutils/cielo'
Object.assign(global, lib)
import * as lib2 from '@jdeighan/llutils/utest'
Object.assign(global, lib2)

# ---------------------------------------------------------------------------
#    - Handles HEREDOC syntax
#    - ends file upon seeing '__END__'
# ---------------------------------------------------------------------------
symbol "cieloPreProcess(code)"

bsl = "\\"

equal cieloPreProcess("""
	import {undef} from '@jdeighan/llutils'

	equal fromTAML(<<<), <<<
		a: 1
		b: 2

		---
		a: 1
		b: 2

	console.log 'DONE'
	"""), """
	import {undef} from '@jdeighan/llutils'

	equal fromTAML("a: 1#{bsl}nb: 2"), {"a":1,"b":2}
	console.log 'DONE'
	"""

equal cieloPreProcess("""
	import {undef} from '@jdeighan/llutils'

	equal fromTAML(<<<), <<<
		a: 1
		b: 2

		---
		a: 1
		b: 2

	__END__
	console.log 'DONE'
	"""), """
	import {undef} from '@jdeighan/llutils'

	equal fromTAML("a: 1#{bsl}nb: 2"), {"a":1,"b":2}
	"""
