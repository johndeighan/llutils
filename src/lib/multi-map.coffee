# multi-map.coffee

import {
	undef, defined, notdefined, OL, LOG, range,
	isString, isArray, isHash,
	assert, croak,
	} from '@jdeighan/llutils'

# ---------------------------------------------------------------------------

export class MultiMap

	constructor: (@numKeys) ->

		@cache = new Map()

	set: (lKeys, value) ->

		@check lKeys
		assert defined(value), "value is undef"
		curMap = @cache
		for i from range(@numKeys-1)
			obj = curMap.get lKeys[i]
			if defined(obj)
				assert (obj instanceof Map), "Not a map: #{OL(obj)}"
				curMap = obj
			else
				obj = new Map()
				curMap.set lKeys[i], obj
				curMap = obj
		curMap.set lKeys[@numKeys-1], value
		return

	get: (lKeys) ->

		@check lKeys
		curMap = @cache
		for i from range(@numKeys-1)
			obj = curMap.get lKeys[i]
			if defined(obj)
				assert (obj instanceof Map), "Not a map: #{OL(obj)}"
				curMap = obj
			else
				return undef
		return curMap.get lKeys[@numKeys-1]

	has: (lKeys) ->

		value = @get lKeys
		return defined(value)

	check: (lKeys) ->

		assert isArray(lKeys), "Not an array: #{OL(lKeys)}"
		assert (lKeys.length == @numKeys),
				"Got #{lKeys.length} keys, should be #{@numKeys}"
		assert defined(lKeys...), "Not all keys defined: #{OL(lKeys)}"
		return
