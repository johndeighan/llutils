# cielo.test.coffee

import * as lib from '@jdeighan/llutils/cielo'
Object.assign(global, lib)
import * as lib2 from '@jdeighan/llutils/utest'
Object.assign(global, lib2)

# ---------------------------------------------------------------------------

u = new UnitTester()
u.transformValue = (str) ->
	return await execCielo(str)
u.transformFunction = (str) ->
	return () => await execCielo(str)

# ---------------------------------------------------------------------------

u.equal """
	globalThis.x = 42
	""", {x: 42}

u.equal """
	globalThis.x = "Hello World"
	x
	""", {x: "Hello World"}

u.fails "not real JS code ++"

u.fails """
	# --- must declare variables
	x = 42
	"""

u.fails """
	# --- can't redefine variables in same scope
	let x = 42
	let x = 13
	"""

u.equal """
	let x = 42
	globalThis.y = 2 * x
	""", {y: 84}

u.equal """
	const x = 42
	globalThis.y = 2 * x
	""", {y: 84}

# --- Variables declared with 'var' at the top level
#     will be treated as global variables!!!

u.equal """
	var x = 42
	globalThis.y = 2 * x
	""", {x: 42, y: 84}

u.equal """
	# --- comment ok here
	let x = 42   # --- comment ok here
	globalThis.y = 2 * x        #     comment ok here
	""", {y: 84}

u.equal """
	let x = 42
	globalThis.y = x
	__END__
	globalThis.y = 2 * x
	""", {y: 42}

# --- multi-line strings are delimited by \n with no trailing \n

u.equal """
	let str = '''
		line 1
		line 2
		'''

	globalThis.len = str.length
	""", {len: 13}

# --- HEREDOC syntax

u.equal """
	let str = <<<
		line 1
		line 2

	globalThis.len = str.length
	""", {len: 13}

# --- HEREDOC for objects

u.equal """
	globalThis.x = <<<
		---
		a: 1
		b: 2

	globalThis.y = 42
	""", {x: {a:1, b:2}, y: 42}

# --- Empty line HEREDOC terminator
#     not needed at end of file

u.equal """
	globalThis.x = <<<
		---
		a: 1
		b: 2
	""", {x: {a:1, b:2}}
