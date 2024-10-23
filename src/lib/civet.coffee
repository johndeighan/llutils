# civet.coffee

import {compile} from "@danielx/civet"

import {
	undef, defined, notdefined, getOptions,
	assert, croak,
	} from '@jdeighan/llutils'
import {checkJS, execJS} from '@jdeighan/llutils/exec-utils'

# ---------------------------------------------------------------------------
# --- ASYNC!

export procCivet = (code, hMetaData={}, filePath=undef) ->

	jsCode = await compile code, {
		js: true
		parseOptions: {
			tab: 3
			implicitReturns: false
			autoConst: false
			autoLet: false
			autoVar: false
			coffeeBooleans: false
			coffeeClasses: true
			coffeeComment: true
			coffeeDiv: true
			coffeeDo: false
			coffeeEq: true
			coffeeForLoops: false
			coffeeInterpolation: true
			coffeeOf: false
			coffeePrototype: true
			}
		}
	return jsCode

# ---------------------------------------------------------------------------
# --- ASYNC!

export execCivet = (code, hMetaData={}, filePath=undef) ->

	debugger
	try
		jsCode = await procCivet(code, hMetaData, filePath)
	catch err
		croak "Bad civet code: #{code}"

	if (jsCode == 'invalid(javascript)') || ! checkJS(jsCode)
		croak "Bad JS Code: #{jsCode}"

	try
		return execJS(jsCode)
	catch err
		throw new Error("Bad JS: #{jsCode}")
