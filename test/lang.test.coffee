# lang.test.coffee

import {undef} from '@jdeighan/llutils'
import {evaluate} from '@jdeighan/llutils/lang'
import * as lib2 from '@jdeighan/llutils/utest'
Object.assign(global, lib2)

# ---------------------------------------------------------------------------

symbol "simple"
succeeds () => evaluate("x=3")
succeeds () => evaluate("x=3\n")
succeeds () => evaluate("x=3\n\n")

symbol "multiple"
succeeds () => evaluate("""
	x=3
	y=4
	""")
succeeds () => evaluate("""
	x=3
	y=4\n
	""")
succeeds () => evaluate("""
	x=3
	y=4\n\n
	""")

symbol "indented"
succeeds () => evaluate("""
	if
		y=5
	""")
succeeds () => evaluate("""
	if
		y=5\n
	""")

program = """
	if
		y=5\n\n
	"""
succeeds () => evaluate(program)

succeeds () => evaluate("""
	if
		y=5\n\n\n
	""")

symbol "multi indent"
succeeds () => evaluate("""
	if
		y=5
		if
			x=3
		z=2
	""")

symbol "allow blank lines"
succeeds () => evaluate("""
	if
		y=5

		if
			x=3
		z=2
	""")
succeeds () => evaluate("""
	if

		y=5

		if

			x=3

		z=2
	""")
