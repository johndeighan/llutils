---
type: coffee
include: src/lib/PLL.peggy
---
GLOBAL

	import {
		undef, defined, notdefined, range,
		getOptions, OL, hasKey, keys, isClassInstance,
		isEmpty, isString, isArray, isHash, isFunction,
		} from '@jdeighan/llutils'
	import {getTracer} from '@jdeighan/llutils/peggy-utils'
	import {ContextStack} from '@jdeighan/llutils/context-stack'
	import {DUMP, BOX, setMinWidth} from '@jdeighan/llutils/dump'

	contextStack = undef
	debug = false
	warnOnly = false
	dbg = (str) => if debug then console.log str
	setMinWidth 40

	# -----------------------------------------------------------------------

	export extract = (obj, desc, hOptions={}) =>

		debugger
		hOptions = getOptions hOptions, {
			tracer: 'none'
			debug: false
			lIgnoreSubs: []
			}
		hOptions.lIgnoreSubs.push 'INDENT','SEP','UNDENT'
		dbg "DEBUG ON"
		assert isHash(obj) || isClassInstance(),
				"Not a hash or class instance: #{OL(obj)}"
		assert isString(desc), "Not a string: #{OL(desc)}"
		contextStack = new ContextStack(obj)
		tracer = getTracer(hOptions.tracer, hOptions)
		return peg$parse(desc, {tracer})

	# -----------------------------------------------------------------------

	class ExtractError extends Error

		constructor: (message) ->
			super message
			@name = "ExtractError"

	# -----------------------------------------------------------------------
	# --- Apply selectors to context() to get an object

	getObj = (obj, lSelectors) =>

		assert isHash(obj), "getObj: Not a hash: #{OL(obj)}"
		for ident in lSelectors  # --- there's at least 1 selector
			obj = obj[ident]
			if notdefined(obj)
				return undef

		return obj

	# -----------------------------------------------------------------------

	croak = (errmsg) =>

		if warnOnly
			console.log "ERROR: #{errmsg}"
		else
			# throw new ExtractError(errmsg)
			throw new Error(errmsg)
		return

	# -----------------------------------------------------------------------

	assert = (cond, errmsg) =>

		if ! cond
			if warnOnly
				console.log "ERROR: #{errmsg}"
			else
				throw new ExtractError(errmsg)
		return

	# -----------------------------------------------------------------------

	check = (obj, expect) =>

		assert defined(obj), "obj is undef"
		if defined(expect)
			assert (obj == expect),
					"Expected #{OL(expect)}, found #{OL(obj)}"
		return

	# -----------------------------------------------------------------------
	# --- Duplicates throw exception

	mergeKeys = (hObj, ...lMore) =>

		assert isHash(hObj), "merge into non-hash: #{OL(hObj)}"
		for h in lMore
			if isEmpty(h)
				continue
			assert isHash(h), "Not a hash: #{OL(h)}"
			for key in keys(h)
				assert isString(key), "Not a string: #{OL(key)}"
				assert !hasKey(hObj, key), "key #{OL(key)} already in hObj"
				hObj[key] = h[key]
		return hObj

# ===========================================================================
# --- Always returns a hash

data

	lDesc: desc |1.., SEP| "\n"*

		return mergeKeys({}, ...lDesc)

desc

	result: expr
			DO { contextStack.add(result[1]) }
			hData: ( INDENT @data UNDENT) ?
			DO { contextStack.pop() }

		return mergeKeys(hData || {}, result[0])

	result: listexpr
			DO { contextStack.add(result[1]) }
			hData: ( INDENT @data UNDENT) ?
			DO { contextStack.pop() }

		return mergeKeys(hData || {}, result[0])

expr

	dontSave: "!"?
			optional: (_ "?")?
			_ lSelectors: ident|1.., "."|
			expect: (_ "=" _ @string)?
			as: (_ "as" _ @ident)?

		# --- Returns [ <hash to merge>, <context to set> ]

		assert ! (expect && as), "Can't use 'as' with expected value"

		# --- set name
		#     later, if obj not found, but is optional
		#        set dontSave to true
		name = as || lSelectors.at(-1)

		curr = contextStack.current()
		if (curr == undef)
			return [{}, undef, name]

		if isArray(curr)
			lItems = []
			for item in curr
				obj = getObj(item, lSelectors)
				if defined(obj)
					check obj, expect
					lItems.push obj
			return [{[name]: lItems}, lItems, name]
		else
			obj = getObj(curr, lSelectors)
			if defined(obj)
				check obj, expect
				if expect || dontSave
					return [{}, obj, name]
				else
					return [{[name]: obj}, obj, name]
			else
				if optional || dontSave
					[{}, obj, name]
				else
					croak "Non-optional missing key #{OL(name)}"

listexpr

	'[' result: expr ']'

		[hData, lItems, name] = result
		hData[name] = lItems
		return [{[name]: lItems}, undef]

ident

	str: $ ([A-Za-z_][A-Za-z0-9_]*)

		return str

string

	'"' lChars:[^"]* '"'

		return lChars.join('')

_

	" "*
