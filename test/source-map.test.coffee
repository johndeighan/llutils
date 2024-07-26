# source-map.test.coffee

import * as lib from '@jdeighan/llutils/source-map'
Object.assign(global, lib)
import * as lib2 from '@jdeighan/llutils/utest'
Object.assign(global, lib2)

# ---------------------------------------------------------------------------

(() =>
	org = 'func = (x) -> log "Hello, #{x}"'
	out = 'export function func(x) { console.log(`Hello, ${x}`); }'

	map = new SourceMap('temp.js')
	map.add  0, 16, 'func'
	map.add  7, 20
	map.add  8, 21, 'x'
	map.add 14, 26, 'log'
	map.add 18, 38
	map.add 19, 39
	map.add 30, 50

	equal await map.mapPos(16), {
		source: 'temp.js'
		line: 1
		column: 0
		name: 'func'
		}

	equal await map.mapPos(20), {
		source: 'temp.js'
		line: 1
		column: 7
		name: null
		}

	equal await map.mapPos(21), {
		source: 'temp.js'
		line: 1
		column: 8
		name: 'x'
		}

	equal await map.mapPos(26), {
		source: 'temp.js'
		line: 1
		column: 14
		name: 'log'
		}
	)()
