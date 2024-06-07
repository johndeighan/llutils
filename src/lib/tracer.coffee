# tracer.coffee

import {
	undef, defined, pass, OL, escapeStr, keys,
	assert, isString, isArray,
	} from '@jdeighan/llutils'

# ---------------------------------------------------------------------------

class NullTracer

	trace: () ->
		return

class DefaultTracer extends NullTracer

	constructor: () ->

		super()
		@level = 0

	prefix: () ->
		return "│  ".repeat(@level)

	result: () ->
		count = if (@level==0) then 0 else @level-1
		return "│  ".repeat(count) + "└─>"

	# --- This allows unit testing
	traceStr: (hInfo) ->

		{type, rule, location, result} = hInfo
		if defined(location)
			{line, column, offset} = location.start
		switch type

			when 'rule.enter'
				return "#{@prefix()}? #{rule}"

			when 'rule.fail'
				if defined(location)
					return "#{@result()} NO (at #{line}:#{column}:#{offset})"
				else
					return "#{@result()} NO"

			when 'rule.match'
				if defined(result)
					return "#{@result()} #{OL(result)}"
				else
					return "#{@result()} YES"
			else
				return "UNKNOWN type: #{type}"
		return

	trace: (hInfo) ->
		# --- ignore whitespace rule
		if (hInfo.rule == '_')
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

class DetailedTracer extends DefaultTracer

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

export getTracer = (tracer, input, hVars={}) =>

	if (tracer == null)
		tracer = undef
	switch (typeof tracer)
		when 'undefined'
			return new NullTracer()
		when 'object'
			if hasKey(tracer, trace)
				return tracer
			else
				return new NullTracer()
		when 'function'
			return {trace: tracer}
		when 'string'
			switch tracer
				when 'default'
					return new DefaultTracer()
				when 'detailed'
					return new DetailedTracer(input, hVars)
				when 'peggy'
					return undef
				else
					return new NullTracer()

