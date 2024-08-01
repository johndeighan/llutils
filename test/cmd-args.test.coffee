# cmd-args.test.coffee

import {undef} from '@jdeighan/llutils'
import * as lib from '@jdeighan/llutils/cmd-args'
Object.assign(global, lib)
import * as lib2 from '@jdeighan/llutils/utest'
Object.assign(global, lib2)

# ---------------------------------------------------------------------------

equal getArgs(undef, {args: '-ab -cd=why'}), {
	a: true
	b: true
	cd: 'why'
	_: []
	}

equal getArgs(undef, {args: '-ab -cd=whynot letmein'}), {
	a: true
	b: true
	cd: 'whynot'
	_: ['letmein']
	}

equal getArgs(undef, {args: '-label="some label"'}), {
	label: "some label"
	_: []
	}

equal getArgs(undef, {args: "-label='some label'"}), {
	label: "some label"
	_: []
	}

hDesc = {
	_: {
		min: 1
		max: 3
		}
	a: 'boolean'
	b: 'boolean'
	cd: 'string'
	}

equal getArgs(hDesc, {args: '-ab -cd=why letmein'}), {
	_: ['letmein']
	a: true
	b: true
	cd: 'why'
	}

equal getArgs(hDesc, {args: '-a -cd=why letmein'}), {
	_: ['letmein']
	a: true
	cd: 'why'
	}

fails () => getArgs(hDesc, {args: '-ab -cd=why'})

fails () => getArgs(hDesc, {args: '-ab -cd=why a b c d'})
