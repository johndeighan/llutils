# section.test.coffee

import {undef, toBlock, assert} from '@jdeighan/llutils'
import {indented} from '@jdeighan/llutils/indent'
import * as lib from '@jdeighan/llutils/section'
Object.assign(global, lib)
import * as lib2 from '@jdeighan/llutils/utest'
Object.assign(global, lib2)

# ---------------------------------------------------------------------------

html = new Section 'html', (block) ->
	return toBlock(['<div>', indented(block), '</div>'])

truthy html.isEmpty()
falsy  html.nonEmpty()

html.add '<h1>title</h1>'
falsy  html.isEmpty()
truthy html.nonEmpty()

html.add '<p>para</p>'
falsy  html.isEmpty()
truthy html.nonEmpty()

equal html.getBlock(), """
	<div>
		<h1>title</h1>
		<p>para</p>
	</div>
	"""

# ---------------------------------------------------------------------------

toJS = (block) -> return "#{block};"
script = new Section 'script', toJS
script.add "x = 42"
equal script.getBlock(), "x = 42;"
