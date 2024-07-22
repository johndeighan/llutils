# --- gulpfile.coffee

import {src, dest, series, parallel} from 'gulp'
import rename from 'gulp-rename'
import {exec} from 'child_process'

import {trans, cielo} from "@jdeighan/llutils/plugins"
import {peggify as peg} from '@jdeighan/llutils/peggy'

# ---------------------------------------------------------------------------

export clean = (cb) =>
	exec('rm -f test/*.js')
	exec('rm -f test/*.map')
	exec('rm -f src/*.js')
	exec('rm -f src/*.map')
	exec('rm -f src/lib/*.js')
	exec('rm -f src/lib/*.map')
	exec('rm -f src/bin/*.js')
	exec('rm -f src/bin/*.map')
	cb()

export capitalize = (cb) =>
	return src("**/*.coffee") \
		.pipe(trans((str) => return str.toUpperCase())) \
		.pipe(rename({extname: '.coffee.txt'})) \
		.pipe(dest('allCaps'))

export bless = (cb) =>
	return src("**/*.cielo") \
		.pipe(cielo()) \
		.pipe(rename({extname: '.js'})) \
		.pipe(dest('.'))

export peggify = (cb) =>
	return src("**/*.{peggy,pegjs}") \
		.pipe(rename({extname: '.js'})) \
		.pipe(dest('.'))
	cb()

export build = (cb) =>
	clean(cb)
	exec('coffee -cmb --no-header .')
	cb()
