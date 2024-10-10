# peggy-utils.coffee

import {
	undef, defined, notdefined, LOG, OL, keys, pass,
	lpad, rpad, zpad, words, getOptions, toBlock,
	isString, isArray, isHash, isEmpty, nonEmpty,
	assert, croak,
	} from '@jdeighan/llutils'
import {indented} from '@jdeighan/llutils/indent'
import {DUMP, BOX} from '@jdeighan/llutils/dump'
import {TextTable} from '@jdeighan/llutils/text-table'

# ---------------------------------------------------------------------------

export class ByteCodeWriter

	constructor: (hOptions={}) ->

		@lRuleNames = [];
		@hRules = {}

		# --- These are set when the AST is known
		@literals = undef
		@expectations = undef

		# --- options
		@detailed = hOptions.detailed

	# ..........................................................

	setAST: (ast) ->

		assert (ast.type == 'grammar'), "not a grammar"
		assert (ast.rules.length > 0), "no rules"
		@literals = ast.literals
		@expectations = ast.expectations
		return

	# ..........................................................

	add: (ruleName, lOpcodes) ->

		assert isString(ruleName), "not a string: #{OL(ruleName)}"
		assert isArray(lOpcodes), "not an array: #{OL(lOpcodes)}"
		assert notdefined(@hRules[ruleName]),
				"rule #{ruleName} already defined"
		@lRuleNames.push ruleName
		@hRules[ruleName] = lOpcodes
		return

	# ..........................................................

	getOpInfo: (op, pos) ->

		switch op
			when 35 then return ['PUSH_EMPTY_STRING', [],              []]
			when 5  then return ['PUSH_CUR_POS',      [],              []]
			when 1  then return ['PUSH_UNDEFINED',    [],              []]
			when 2  then return ['PUSH_NULL',         [],              []]
			when 3  then return ['PUSH_FAILED',       [],              []]
			when 4  then return ['PUSH_EMPTY_ARRAY',  [],              []]
			when 6  then return ['POP',               [],              []]
			when 7  then return ['POP_CUR_POS',       [],              []]
			when 8  then return ['POP_N',             ['/'],           []]
			when 9  then return ['NIP',               [],              []]
			when 10 then return ['APPEND',            [],              []]
			when 11 then return ['WRAP',              [''],            []]
			when 12 then return ['TEXT',              [],              []]
			when 36 then return ['PLUCK',             ['/','/','/','p'], []]
			when 13 then return ['IF',                [],              ['THEN', 'ELSE']]
			when 14 then return ['IF_ERROR',          [],              ['THEN', 'ELSE']]
			when 15 then return ['IF_NOT_ERROR',      [],              ['THEN', 'ELSE']]
			when 30 then return ['IF_LT',             [],              ['THEN', 'ELSE']]
			when 31 then return ['IF_GE',             [],              ['THEN', 'ELSE']]
			when 32 then return ['IF_LT_DYNAMIC',     [],              ['THEN', 'ELSE']]
			when 33 then return ['IF_GE_DYNAMIC',     [],              ['THEN', 'ELSE']]
			when 16 then return ['WHILE_NOT_ERROR',   [],              ['THEN']]
			when 17 then return ['MATCH_ANY',         [],              ['THEN', 'ELSE']]
			when 18 then return ['MATCH_STRING',      ['/lit'],        ['THEN', 'ELSE']]
			when 19 then return ['MATCH_STRING_IC',   ['/lit'],        ['THEN', 'ELSE']]
			when 20 then return ['MATCH_CHAR_CLASS',  ['/class'],      []]
			when 21 then return ['ACCEPT_N',          ['/num'],        []]
			when 22 then return ['ACCEPT_STRING',     ['/lit'],        []]
			when 23 then return ['FAIL',              ['/expectation'],[]]
			when 24 then return ['LOAD_SAVED_POS',    ['pos/num'],     []]
			when 25 then return ['UPDATE_SAVED_POS',  ['pos/num'],     []]
			when 26 then return ['CALL',              [],              []]
			when 27 then return ['RULE',              ['/rule'],       []]
			when 37 then return ['SOURCE_MAP_PUSH',   [],              []]
			when 38 then return ['SOURCE_MAP_POP',    [],              []]
			when 39 then return ['SOURCE_MAP_LABEL_PUSH', [],              []]
			when 40 then return ['SOURCE_MAP_LABEL_POP',  [],              []]
			else
				return ["OPCODE #{op}", [], []]

	# ..........................................................

	argStr: (arg, infoStr) ->

		if (infoStr == '/')
			return arg.toString()

		[label, type] = infoStr.split('/')

		switch type

			when 'rule'
				if (arg < @lRuleNames.length)
					result = "<#{@lRuleNames[arg]}>"
				else
					result = "<##{arg}>"

			when 'lit'
				result = "'#{@literals[arg]}'"

			when 'num','i'
				result = arg.toString()

			when 'expectation'
				hExpect = @expectations[arg]
				if defined(hExpect)
					{type, value} = hExpect
					switch type
						when 'literal'
							result = "\"#{value}\""
						when 'class'
							result = "[..]"
						when 'any'
							result = '.'
						else
							result = "Unknown expectation type: #{type}"
				else
					result = 'hExpect = undef'
			when 'block'
				if label
					result = "#{label}:#{arg}"
				else
					result = "BLOCK: #{arg}"

			when 'class'
				if label
					result = "#{label}:[#{arg}]"
				else
					result = "CLASS: #{arg}"

			else
				result = "<UNKNOWN>: #{OL(arg)}"

		if @detailed
			return "(#{arg}) #{result}"
		else
			return result

	# ..........................................................

	opStr: (lOpcodes) ->

		lLines = []
		pos = 0
		while (pos < lOpcodes.length)
			op = lOpcodes[pos]
			pos += 1

			[name, lArgInfo, lBlockInfo] = @getOpInfo(op, pos)
			numArgs = lArgInfo.length
			if (numArgs == 0)
				if @detailed
					lLines.push "(#{op}) #{name}"
				else
					lLines.push "#{name}"
			else
				lArgs = lOpcodes.slice(pos, pos + numArgs)
				pos += numArgs
				lArgDesc = lArgs.map (arg,i) => @argStr(arg, lArgInfo[i])
				if @detailed
					lLines.push "(#{op}) #{name} #{lArgDesc.join(' ')}"
				else
					lLines.push "#{name} #{lArgDesc.join(' ')}"

			blockBase = pos + lBlockInfo.length
			for label,i in lBlockInfo
				blockLen = lOpcodes[pos]
				pos += 1

				switch label
					when 'ELSE'
						if (blockLen > 0)
							lLines.push 'ELSE'
					when 'THEN'
						pass()
					else
						croak "Bad block label: #{label}"

				lSubOps = lOpcodes.slice(blockBase, blockBase + blockLen)
				lLines.push indented(@opStr(lSubOps))
				blockBase += blockLen
			pos = blockBase
		return lLines.join("\n")

	# ..........................................................

	getBlock: () ->

		lParts = []
		for ruleName in keys(@hRules)
			lParts.push "<#{ruleName}>"
			lOpcodes = @hRules[ruleName]
			block = @opStr(lOpcodes).trimEnd()
			if (block != '')
				lParts.push indented(block)
			lParts.push ''
		return lParts.join("\n").trimEnd()

# --------------------------------------------------------------------------

export class OpDumper

	constructor: (hOptions={}) ->

		{ignore} = getOptions hOptions, {
			ignore: [37, 38, 39, 40]
			}
		@lIgnore = ignore
		@level = 0
		@lLines = []

	# ..........................................................

	setStack: (stack) ->

		@stack = stack
		return

	# ..........................................................

	incLevel: () -> @level += 1
	decLevel: () -> @level -= 1

	# ..........................................................

	out: (str) ->
		@lLines.push "  ".repeat(@level) + str
		return

	# ..........................................................

	outOp: (index, op) ->

		if !@lIgnore.includes(op)
			@out "OP[#{lpad(index,2)}]: #{lpad(op,2)} #{@getName(op)}"

	# ..........................................................

	outBC: (lByteCodes) ->

		# --- For now, don't output anything
		return

		@out 'OPCODES: ' \
			+ lByteCodes \
				.filter((x) => !@lIgnore.includes(x)) \
				.map((x) => x.toString()) \
				.join(' ');
		return

	# ..........................................................

	outCode: (lLines, label) ->

		lLines = BOX toBlock(lLines), label, {
			echo: false
			asArray: true
			}
		for line in lLines
			@out line
		return

	# ..........................................................

	getBlock: () ->

		return @lLines.join("\n")

	# ..........................................................

	getName: (op) ->

		switch op
			when  0 then return 'PUSH'
			when 35 then return 'PUSH_EMPTY_STRING'
			when  1 then return 'PUSH_UNDEFINED'
			when  2 then return 'PUSH_NULL'
			when  3 then return 'PUSH_FAILED'
			when  4 then return 'PUSH_EMPTY_ARRAY'
			when  5 then return 'PUSH_CURR_POS'
			when  6 then return 'POP'
			when  7 then return 'POP_CURR_POS'
			when  8 then return 'POP_N'
			when  9 then return 'NIP'
			when 10 then return 'APPEND'
			when 11 then return 'WRAP'
			when 12 then return 'TEXT'
			when 36 then return 'PLUCK'

			# ---  Conditions and Loops

			when 13 then return 'IF'
			when 14 then return 'IF_ERROR'
			when 15 then return 'IF_NOT_ERROR'
			when 30 then return 'IF_LT'
			when 31 then return 'IF_GE'
			when 32 then return 'IF_LT_DYNAMIC'
			when 33 then return 'IF_GE_DYNAMIC'
			when 16 then return 'WHILE_NOT_ERROR'

			# ---  Matching

			when 17 then return 'MATCH_ANY'
			when 18 then return 'MATCH_STRING'
			when 19 then return 'MATCH_STRING_IC'
			when 20 then return 'MATCH_CHAR_CLASS'
			when 20 then return 'MATCH_REGEXP'
			when 21 then return 'ACCEPT_N'
			when 22 then return 'ACCEPT_STRING'
			when 23 then return 'FAIL'

			# ---  Calls

			when 24 then return 'LOAD_SAVED_POS'
			when 25 then return 'UPDATE_SAVED_POS'
			when 26 then return 'CALL'

			# ---  Rules

			when 27 then return 'RULE'
			when 41 then return 'LIBRARY_RULE'

			# ---  Failure Reporting

			when 28 then return 'SILENT_FAILS_ON'
			when 29 then return 'SILENT_FAILS_OFF'

			when 37 then return 'SOURCE_MAP_PUSH'
			when 38 then return 'SOURCE_MAP_POP'
			when 39 then return 'SOURCE_MAP_LABEL_PUSH'
			when 40 then return 'SOURCE_MAP_LABEL_POP'

			else return '<UNKNOWN>'

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
		LOG JSON.stringify(hInfo, null, 3)

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

		LOG @tt.asString()

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

		if @traceIt(hInfo)
			result = @traceStr(hInfo, @lStack.length)
			if isString(result)
				LOG result
			else if isArray(result)
				for str in result
					LOG str

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
				"#{escapeStr(@input, {offset})}#{@varStr()}"
				]
		else
			return [
				str
				"#{escapeStr(@input)}#{@varStr()}"
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
