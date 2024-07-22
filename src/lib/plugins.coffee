# --- plugins.coffee

import through from 'through2'
import gutil from 'gulp-util'

import {
	undef, defined, notdefined, OL,
	} from '@jdeighan/llutils'
import {barf, withExt} from '@jdeighan/llutils/fs'
import {bless} from '@jdeighan/llutils/cielo'

# ---------------------------------------------------------------------------

export curry = (func) =>

	curried = (...lArgs) =>
		if (lArgs.length >= func.length)
			return func.apply(this, lArgs)
		else
			return (...lArgs2) =>
				return curried.apply(this, lArgs.concat(lArgs2))
	return curried

# ---------------------------------------------------------------------------

export trans = (func) =>

	transform = (file, enc, cb) =>

		if file.isNull()
			return cb(null, file)

		if file.isStream()
			err = new gutil.PluginError('trans', 'Streams not supported')
			return cb(err)

		contents = file.contents.toString('utf8')
		output = func(contents, {filePath: file.path})
		file.contents = new Buffer(output)
		cb null, file

	return through.obj(transform)

# ---------------------------------------------------------------------------

export cielo = () =>

	return curry(trans)( (code, hMetaData) =>
		{preprocCode, js, sourceMap} = bless(code)
		filePath = hMetaData.filePath
		if filePath
			barf preprocCode, withExt(filePath, '.coffee.txt')
			barf sourceMap || '', withExt(filePath, '.js.map')
		return js
		)
