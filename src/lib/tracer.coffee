# tracer.coffee

import {
	undef, defined, notdefined, pass, OL, escapeStr, keys,
	assert, isString, isArray, isHash, isEmpty, getOptions,
	lpad, rpad, zpad, words,
	} from '@jdeighan/llutils'
import {TextTable} from '@jdeighan/llutils/text-table'

# ---------------------------------------------------------------------------

export class NullTracer

	constructor: (@posType='offset') ->

	# ..........................................................

	destroy: () ->

	# ..........................................................

	trace: (hInfo) ->

	# ..........................................................

	posStr: (location) ->

		if notdefined(location) || !isHash(location)
			return rpad('unknown', 12)
		{start: s, end: e} = location
		sl = zpad(s.line)
		sc = zpad(s.column)
		so = zpad(s.offset)
		el = zpad(e.line)
		ec = zpad(e.column)
		eo = zpad(e.offset)

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

export class RawTracer extends NullTracer

	trace: (hInfo) ->

		console.log JSON.stringify(hInfo, null, 3)

# ---------------------------------------------------------------------------

export class DebugTracer extends NullTracer

	constructor: () ->

		super()
		@tt = new TextTable('l l l l l')
		@tt.fullsep()
		@tt.labels words('type rule result details position')
		@tt.sep()

	trace: (hInfo) ->

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

export class AdvancedTracer extends NullTracer

	constructor: (hOptions={}) ->

		super()
		{ignore, posType} = getOptions hOptions, {
			ignore: ['_']
			posType: 'offset'
			}
		@lIgnore = ignore
		@posType = posType
		@level = 0

	# ..........................................................

	traceStr: (hInfo) ->

		{type, rule, location, result, details} = hInfo
		locStr = @posStr(location)
		startPos = location?.start?.offset
		endPos = location?.end?.offset
		[obj, action] = type.split('.')

		switch action

			when 'enter'

				assert (obj == 'rule'), "obj=#{obj}, act=#{action}"
				pre = "│  ".repeat(@level)
				return "#{pre}? #{rule}"

			when 'match'

				if (obj == 'rule')
					count = if (@level==0) then 0 else @level-1
					pre = "│  ".repeat(count) + "└─>"
				else
					pre = "│  ".repeat(@level)

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

				pre = "│  ".repeat(@level-1) + "x  "
				if (obj == 'rule')
					if defined(location)
						return "#{pre} (at #{locStr})"
					else
						return "#{pre}".trim()
				else
					if defined(location)
						return "#{pre} #{obj} #{OL(details)} (at #{locStr})"
					else
						return "#{pre} #{obj}"


			else
				return "UNKNOWN type: #{type}"
		return

	# ..........................................................

	trace: (hInfo) ->

		# --- DEBUG console.dir hInfo

		# --- ignore some rules
		if @lIgnore.includes(hInfo.rule)
			return

		result = @traceStr(hInfo)
		if isString(result)
			console.log result
		else if isArray(result)
			for str in result
				console.log str

		switch hInfo.type
			when 'rule.enter'
				@level += 1
			when 'rule.fail','rule.match'
				@level -= 1;
		return

# ---------------------------------------------------------------------------

export class DetailedTracer extends AdvancedTracer

	constructor: (@input, hOptions={}) ->

		super(hOptions)
		{hVars} = getOptions hOptions, {
			hVars: {}
			}
		@hVars = hOptions.hVars

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

	traceStr: (hInfo) ->

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

export getTracer = (tracer='advanced', input, hVars={}) =>

	switch (typeof tracer)
		when 'undefined'
			return new NullTracer()
		when 'object'
			if hasKey(tracer, trace)
				return tracer
			else if (tracer == null)
				return new NullTracer()
			else
				croak "Invalid tracer object, no 'trace' method"
		when 'function'
			return {trace: tracer}
		when 'string'
			[tracer, option] = tracer.split('/')
			hOptions = {hVars}
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
					return new DetailedTracer(input, hOptions)
				when 'peggy'
					return undef
				else
					return new NullTracer()
