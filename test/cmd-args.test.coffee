# cmd-args.test.coffee

import * as lib from '@jdeighan/llutils/cmd-args'
Object.assign(global, lib)
import * as lib2 from '@jdeighan/llutils/utest'
Object.assign(global, lib2)

# ---------------------------------------------------------------------------

equal getArgs('-ab -cd=why'), {
	a: true
	b: true
	cd: 'why'
	_: []
	}

equal getArgs('-ab -cd=whynot letmein'), {
	a: true
	b: true
	cd: 'whynot'
	_: ['letmein']
	}

equal getArgs('-label="some label"'), {
	label: "some label"
	_: []
	}

equal getArgs("-label='some label'"), {
	label: "some label"
	_: []
	}

hDesc = {
	_: [1,3]
	a: 'boolean'
	b: 'boolean'
	cd: 'string'
	}

equal getArgs('-ab -cd=why letmein', hDesc), {
	_: ['letmein']
	a: true
	b: true
	cd: 'why'
	}

equal getArgs('-a -cd=why letmein', hDesc), {
	_: ['letmein']
	a: true
	cd: 'why'
	}

fails () => getArgs('-ab -cd=why', hDesc)

fails () => getArgs('-ab -cd=why a b c d', hDesc)
