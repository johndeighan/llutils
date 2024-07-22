# dump.test.coffee

import {undef, tabify} from '@jdeighan/llutils'
import * as lib from '@jdeighan/llutils/dump'
Object.assign(global, lib)
import * as lib2 from '@jdeighan/llutils/utest'
Object.assign(global, lib2)

# ---------------------------------------------------------------------------
#symbol "DUMP(item, label, hOptions)"

(() =>
	str = DUMP {
		a: 1
		b: 'def'
		c: undef
		d: (x) => return 42
		}, 'STR', '!echo'

	equal str, 'STR = {"a":1,"b":"def","c":«undef»,"d":«Function d»}'
	)()

(() =>
	str = DUMP {
		a: 1
		b: 'def'
		c: undef
		d: (x) => return 42
		}, 'STR', '!oneLine !echo'

	equal str, """
		----------------  STR  -----------------
		a: 1
		b: def
		c: .undef.
		d: .Function d.
		----------------------------------------
		"""
	)()

(() =>
	str = DUMP {
		a: 1
		b: 'def'
		c: undef
		d: (x) => return 42
		}, 'STR', '!oneLine !echo'

	equal str, """
		----------------  STR  -----------------
		a: 1
		b: def
		c: .undef.
		d: .Function d.
		----------------------------------------
		"""
	)()

(() =>
	str = DUMP {
		a: 1
		b: 'def'
		c: undef
		d: (x) => return 42
		}, 'STR', '!oneLine !echo'

	equal str, """
		----------------  STR  -----------------
		a: 1
		b: def
		c: .undef.
		d: .Function d.
		----------------------------------------
		"""
	)()

(() =>
	str = DUMP {
		a: 1
		b: [
			'def'
			'ghi'
			3
			undef
			]
		c: {
			a: 42
			b: true
			c: 'abc'
			d: undef
			}
		d: (x) => return 42
		}, 'STR', '!oneLine !echo !untabify'

	equal tabify(str), """
		----------------  STR  -----------------
		a: 1
		b:
			- def
			- ghi
			- 3
			- .undef.
		c:
			a: 42
			b: .true.
			c: abc
			d: .undef.
		d: .Function d.
		----------------------------------------
		"""
	)()

(() =>
	str = BOX {
		a: 1
		b: 'def'
		c: undef
		d: (x) => return 42
		}, 'STR', '!oneLine !echo'

	equal str, """
		┌─────────────────  STR  ──────────────────┐
		│ a: 1                                     │
		│ b: def                                   │
		│ c: .undef.                               │
		│ d: .Function d.                          │
		└──────────────────────────────────────────┘
		"""
	)()
