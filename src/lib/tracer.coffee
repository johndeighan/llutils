# tracer.coffee

import {
	undef, defined, notdefined, pass, OL, escapeStr,
	assert, croak, isString, isArray, isHash, isEmpty,
	lpad, rpad, zpad, words, keys, hasKey, getOptions,
	} from '@jdeighan/llutils'
import {TextTable} from '@jdeighan/llutils/text-table'

# ---------------------------------------------------------------------------

export class BaseTracer

	constructor: (hOptions={}) ->

		h = getOptions hOptions, {
			posType: 'linecol'
			lIgnore: ['_']
			lIgnoreSubs: []
			}
		@hOptions = h
		@posType = h.posType
		@lIgnoreSubs = h.lIgnoreSubs
		@lIgnore = h.lIgnore
		for rule in @lIgnore
			if !@lIgnoreSubs.includes(rule)
				@lIgnoreSubs.push rule
		@lStack = []     # stack of rule names

	# ..........................................................

	traceIt: (hInfo) ->

		{type, rule} = hInfo
		[category, action] = type.split('.')

		# --- NOTE: Any rule name in @lIgnore
		#           will also be in @lIgnoreSubs

		if @lIgnore.includes(rule)
			if (category == 'rule')
				return false

		if (category == 'rule') && \
				((action == 'match') || (action == 'fail'))
			for rule,i in @lStack
				if @lIgnoreSubs.includes(rule) && (i != @lStack.length - 1)
					return false
		else
			for rule in @lStack
				if @lIgnoreSubs.includes(rule)
					return false
		return true

	# ..........................................................

	destroy: () ->

		return

	# ..........................................................

	adjustStack: (hInfo) ->

		{type, rule} = hInfo
		switch type
			when 'rule.enter'
				@lStack.push rule
			when 'rule.fail', 'rule.match'
				@lStack.pop()
		return

	# ..........................................................

	trace: (hInfo) ->

		return

	# ..........................................................

	posStr: (location, posType=undef) ->

		if notdefined(posType)
			posType = @posType
		if notdefined(location) || !isHash(location)
			return rpad('unknown', 12)
		{start: s, end: e} = location
		sl = zpad(s.line)
		sc = zpad(s.column)
		so = zpad(s.offset)
		el = zpad(e.line)
		ec = zpad(e.column)
		eo = zpad(e.offset)
		if (sl == 1) && (el == 1)
			return posStr(location, 'offset')

		switch @posType
			when 'linecol'
				if (so == eo)
					return "#{sl}:#{sc}"
				else
					return "#{sl}:#{sc}-#{el}:#{ec}"
			when 'offset'
				if (so == eo)
					return "#{so}"
				else
					return "#{so}-#{eo}"
			else
				if (so == eo)
					return "#{sl}:#{sc}:#{so}"
				else
					return "#{sl}:#{sc}:#{so}-#{el}:#{ec}:#{eo}"

# ---------------------------------------------------------------------------

export class RawTracer extends BaseTracer

	trace: (hInfo) ->

		@adjustStack(hInfo)
		console.log JSON.stringify(hInfo, null, 3)

# ---------------------------------------------------------------------------

export class DebugTracer extends BaseTracer

	constructor: (hOptions={}) ->

		super(hOptions)
		@tt = new TextTable('l l l l l')
		@tt.fullsep()
		@tt.labels words('type rule result details position')
		@tt.sep()

	trace: (hInfo) ->

		@adjustStack(hInfo)
		{type, rule, result, details, location} = hInfo
		@tt.data [
			type,
			rule,
			JSON.stringify(result),
			details,
			@posStr(location)
			]
		return

	destroy: () ->

		console.log @tt.asString()

# ---------------------------------------------------------------------------

export class AdvancedTracer extends BaseTracer

	traceStr: (hInfo, level=0) ->

		{type, rule, location, result, details} = hInfo

		locStr = @posStr(location)
		startPos = location?.start?.offset
		endPos = location?.end?.offset
		[obj, action] = type.split('.')

		switch action

			when 'enter'

				assert (obj == 'rule'), "obj=#{obj}, act=#{action}"
				pre = "│  ".repeat(level)
				return "#{pre}? #{rule}"

			when 'match'

				if (obj == 'rule')
					pre = "│  ".repeat(level-1) + "└─>"
				else
					pre = "│  ".repeat(level)

				if defined(result)
					if defined(endPos)
						return "#{pre} #{OL(result)} (pos -> #{endPos})"
					else
						return "#{pre} #{OL(result)}"
				else
					if defined(endPos)
						return "#{pre} YES (pos=#{endPos})"
					else
						return "#{pre} YES"

			when 'fail'

				if (obj == 'rule')
					pre = "│  ".repeat(level-1) + "└─> FAIL"
					if defined(location)
						return " #{pre} (at #{locStr})"
					else
						return " #{pre}".trim()
				else
					pre = "│  ".repeat(level-1) + "x  "
					if defined(location)
						return "#{pre} #{obj} #{OL(details)} (at #{locStr})"
					else
						return "#{pre} #{obj}"


			else
				return "UNKNOWN type: #{type}"
		return

	# ..........................................................

	trace: (hInfo) ->

		debugger
		if @traceIt(hInfo)
			result = @traceStr(hInfo, @lStack.length)
			if isString(result)
				console.log result
			else if isArray(result)
				for str in result
					console.log str

		@adjustStack(hInfo)
		return

# ---------------------------------------------------------------------------

export class DetailedTracer extends AdvancedTracer

	constructor: (@input, hOptions={}) ->

		super(hOptions)
		@input = @hOptions.input
		@hVars = @hOptions.hVars

	# ..........................................................

	varStr: () ->

		if isEmpty(@hVars)
			return ''

		lParts = []
		for varname in keys(@hVars)
			value = @hVars[varname]()
			lParts.push "#{varname} = #{OL(value)}"
		if (lParts.length == 0)
			return ''
		else
			return ' (' + lParts.join(',') + ')'

	# ..........................................................

	traceStr: (hInfo, level) ->

		str = super hInfo
		if (hInfo.type != 'rule.fail') || isEmpty(@input)
			return str

		{type, rule, location, result} = hInfo
		if defined(location)
			{offset} = location.start
			return [
				str
				"#{escapeStr(@input, 'esc', {offset})}#{@varStr()}"
				]
		else
			return [
				str
				"#{escapeStr(@input, 'esc')}#{@varStr()}"
				]

# ---------------------------------------------------------------------------
# --- tracer can be:
#        - undef
#        - a string: 'none', 'debug', 'peggy','advanced','detailed'
#        - an object with a function property named 'trace'
#        - a function

export getTracer = (tracer='advanced', hOptions={}) =>

	hOptions = getOptions hOptions, {
		input: undef
		lIgnore: ['_']
		lIgnoreSubs: []
		hVars: {}
		}

	switch (typeof tracer)
		when 'undefined'
			return new BaseTracer(hOptions)
		when 'object'
			if defined(tracer)
				return tracer
			else
				return new BaseTracer(hOptions)
		when 'function'
			return {trace: tracer}
		when 'string'
			[tracer, option] = tracer.split('/')
			if option
				hOptions.posType = option
			switch tracer
				when 'raw'
					return new RawTracer(hOptions)
				when 'debug'
					return new DebugTracer(hOptions)
				when 'advanced'
					return new AdvancedTracer(hOptions)
				when 'detailed'
					return new DetailedTracer(hOptions)
				when 'peggy'
					return undef
				else
					return new BaseTracer(hOptions)
