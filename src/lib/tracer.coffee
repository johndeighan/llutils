# tracer.coffee

import {
	undef, defined, pass, OL, escapeStr, keys,
	assert, isString, isArray, isEmpty, getOptions,
	} from '@jdeighan/llutils'

# ---------------------------------------------------------------------------

export class NullTracer

	trace: () ->
		return

# ---------------------------------------------------------------------------

export class DefaultTracer extends NullTracer

	constructor: (hOptions={}) ->

		super()
		hOptions = getOptions hOptions, {
			ignore: ['_']
			}
		@lIgnore = hOptions.ignore
		@level = 0

	# ..........................................................

	prefix: (type) ->
		if (type == 'rule.enter') || (type == 'match.string')
			return "│  ".repeat(@level)
		else if (type == 'fail.string')
			return "│  ".repeat(@level-1) + "x  "
		else
			count = if (@level==0) then 0 else @level-1
			return "│  ".repeat(count) + "└─>"

	# ..........................................................

	traceStr: (hInfo) ->

		{type, rule, location, result} = hInfo
		if defined(location)
			{line: s_line, column: s_col, offset: s_offset} = location.start
			{line: e_line, column: e_col, offset: e_offset} = location.end
			locStr = "#{s_line}:#{s_col}:#{s_offset}"
			endPos = e_offset
		else
			locStr = '?'
			endPos = undef
		pre = @prefix(type)

		switch type

			when 'rule.enter'
				return "#{pre}? #{rule}"

			when 'rule.fail'
				if defined(location)
					return "#{pre} NO (at #{locStr})"
				else
					return "#{pre} NO"

			when 'fail.string'
				if defined(location)
					return "#{pre} NO #{rule} (at #{locStr})"
				else
					return "#{pre} NO #{rule}"

			when 'rule.match', 'match.string'
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

			else
				return "UNKNOWN type: #{type}"
		return

	# ..........................................................

	trace: (hInfo) ->

		# --- DEBUG console.dir hInfo

		# --- ignore whitespace rule
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

export class DetailedTracer extends DefaultTracer

	constructor: (@input, @hVars={}) ->

		super()

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
#        - a string: 'peggy','default','detailed'
#        - an object with a function property named 'trace'
#        - a function

export getTracer = (tracer='default', input, hVars={}) =>

	if isEmpty(tracer) || (tracer == 'none') || (tracer == 'null')
		return new NullTracer()
	switch (typeof tracer)
		when 'undefined'
			return new NullTracer()
		when 'object'
			if hasKey(tracer, trace)
				return tracer
			else
				croak "Invalid tracer object, no 'trace' method"
		when 'function'
			return {trace: tracer}
		when 'string'
			switch tracer
				when 'default'
					return new DefaultTracer()
				when 'detailed','advanced'
					return new DetailedTracer(input, hVars)
				when 'peggy'
					return undef
				else
					return new NullTracer()

