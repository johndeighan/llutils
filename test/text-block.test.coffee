# text-block.test.coffee

import * as lib from '@jdeighan/llutils/text-block'
Object.assign(global, lib)
import * as lib2 from '@jdeighan/llutils/utest'
Object.assign(global, lib2)

# ---------------------------------------------------------------------------
#symbol new TextBlock()

(() =>
	block = new TextBlock()
	block.append 'abc'
	block.append """
		defg
		--
		??
		"""
	block.prepend 'xyz'

	equal block.maxLen, 4
	equal block.getLines(), [
		'xyz'
		'abc'
		'defg'
		'--'
		'??'
		]
	equal block.getBlock(), """
		xyz
		abc
		defg
		--
		??
		"""
	)()

# ---------------------------------------------------------------------------
#symbol new TextBlockList()

(() =>
	blocks = new TextBlockList()

	blocks.addBlock 'coffee', """
		import {undef} from '@jdeighan/llutils'
		meaning = 42
		__END__
		console.log 'DONE'
		"""

	blocks.addBlock 'js', """
		import {undef} from '@jdeighan/llutils;'
		let meaning = 42;
		"""

	equal blocks.maxLabelLen, 6
	equal blocks.maxLen, 40

	equal blocks.asString('minWidth=0'), """
		---------------  coffee  ---------------
		import {undef} from '@jdeighan/llutils'
		meaning = 42
		__END__
		console.log 'DONE'
		-----------------  js  -----------------
		import {undef} from '@jdeighan/llutils;'
		let meaning = 42;
		----------------------------------------
		"""

	equal blocks.asString('format=box minWidth=0'), """
		┌────────────────  coffee  ────────────────┐
		│ import {undef} from '@jdeighan/llutils'  │
		│ meaning = 42                             │
		│ __END__                                  │
		│ console.log 'DONE'                       │
		├──────────────────  js  ──────────────────┤
		│ import {undef} from '@jdeighan/llutils;' │
		│ let meaning = 42;                        │
		└──────────────────────────────────────────┘
		"""
)()
