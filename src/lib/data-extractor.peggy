---
type: coffee
include: src/lib/PLL.peggy
---
GLOBAL

	import {
		undef, defined, notdefined,
		getOptions, OL, hasKey, keys,
		isEmpty, isString, isHash, isFunction,
		} from '@jdeighan/llutils'
	import {DUMP} from '@jdeighan/llutils/dump'
	import {getTracer} from '@jdeighan/llutils/tracer'
	import {Context} from '@jdeighan/llutils/context'

	context = undef

	# -----------------------------------------------------------------------

	class ExtractError extends Error

		constructor: (message) ->
			super message
			@name = "ExtractError"

	# -----------------------------------------------------------------------
	# --- Apply selectors to context() to get an object

	getObj = (lSelectors, optional) =>

		obj = context.current()
		for ident in lSelectors  # --- there's at least 1 selector
			obj = obj[ident]
			if notdefined(obj)
				if optional
					return undef
				else
					croak "Missing key #{OL(ident)}"
		return obj

	# -----------------------------------------------------------------------

	croak = (errmsg) =>

		throw new ExtractError(errmsg)
		return

	# -----------------------------------------------------------------------

	assert = (cond, errmsg) =>

		if ! cond
			throw new ExtractError(errmsg)
		return

	# -----------------------------------------------------------------------
	# --- Duplicates throw exception

	mergeKeys = (hObj, ...lMore) =>

		assert isHash(hObj), "hObj not a hash: #{OL(hObj)}"
		for h in lMore
			if isEmpty(h)
				continue
			assert isHash(h), "Not a hash: #{OL(h)}"
			for key in keys(h)
				assert !hasKey(hObj, key), "key #{key} already in hObj"
				hObj[key] = h[key]
		return hObj

	# -----------------------------------------------------------------------

	export extract = (obj, desc, hOptions={}) =>

		debugger
		{tracer} = getOptions hOptions, {
			tracer: 'none'
			}
		assert isHash(obj), "Not a hash: #{OL(obj)}"
		assert isString(desc), "Not a string: #{OL(desc)}"
		context = new Context(obj)
		return peg$parse(desc, {tracer: getTracer(tracer, desc)})

# ===========================================================================

data

	lDesc: desc |1.., SEP| "\n"*

		return mergeKeys({}, ...lDesc)

desc

	result: expr
			DO { context.add(result[1]) }
			h: ( INDENT @data UNDENT) ?
			DO { context.pop() }

		return mergeKeys result[0] || {}, h

	'[' _ result: expr _ ']'
			DO { context.add(result[1]) }
			h: ( INDENT @data UNDENT) ?
			DO { context.pop() }

		return mergeKeys result[0], h

expr

	lParen: "("?
			optional: ("?" _)?
			_ lSelectors: ident|1.., "."|
			expect: (_ "=" _ @string)?
			as: (_ "as" _ @ident)?
			rParen: ")"?

		# --- Returns [ <hash to merge>, <context to set> ]

		# --- Returns [{}, undef] if key not found, but was optional
		#                            or current context is undef
		#     Returns [{}, obj]   if obj shouldn't be stored
		#                            but is context for subexpressions
		#     Returns [{name: obj}, obj]    if obj should be stored under name

		assert ! (expect && as), "Can't use 'as' with expected value"

		if context.isUndef()
			return [{}, undef]

		name = as || lSelectors.at(-1)

		# --- set store - if false, don't store
		if defined(lParen, rParen)
			store = false
		else
			assert notdefined(lParen, rParen), 'Mismatched parens'
			store = notdefined(expect)

		obj = getObj(lSelectors, optional)
		if notdefined(obj)
			return [undef, undef]

		# --- We now have a name, obj pair

		# --- If there's an expected value (always a string),
		#     obj must exist and be that string

		if defined(expect)
			assert (obj == expect), "Expected #{OL(expect)}, found #{OL(obj)}"
			return [{}, undef]

		return [
			if store then {[name]: obj} else {},
			if isHash(obj) then obj else undef
			]

ident

	str: $ ([A-Za-z_][A-Za-z0-9_]*)

		return str

string

	'"' lChars:[^"]* '"'

		return lChars.join('')

_

	" "*
