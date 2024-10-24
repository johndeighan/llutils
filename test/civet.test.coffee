# civet.test.coffee

import * as lib from '@jdeighan/llutils/civet'
Object.assign(global, lib)
import * as lib2 from '@jdeighan/llutils/utest'
Object.assign(global, lib2)

# ---------------------------------------------------------------------------

u = new UnitTester()
u.transformValue = (str) ->
	return await execCivet(str)
u.transformFunction = (str) ->
	return () => await execCivet(str)

# ---------------------------------------------------------------------------

u.equal """
	let x = 42
	42
	""", 42

u.equal """
	let x = "Hello World"
	x
	""", "Hello World"

u.fails "not real JS code ++"

u.fails """
	# --- must declare variables
	x = 42
	2 * x
	"""

u.fails """
	# --- can't redefine variables in same scope
	let x = 42
	2 * x
	let x = 13
	"""

u.equal """
	let x = 42
	2 * x
	""", 84

u.equal """
	const x = 42
	2 * x
	""", 84

u.equal """
	var x = 42
	2 * x
	""", 84

u.equal """
	# --- comment ok here
	let x = 42   # --- comment ok here
	2 * x        #     comment ok here
	""", 84

u.equal """
	let x = 42
	x
	__END__
	2 * x
	""", 42

# --- multi-line strings are delimited by \n with no trailing \n

u.equal """
	let str = '''
		line 1
		line 2
		'''

	str.length
	""", 13

# --- HEREDOC syntax

u.equal """
	let str = <<<
		line 1
		line 2

	str.length
	""", 13
