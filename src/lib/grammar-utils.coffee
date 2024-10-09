# grammar-utils.coffee

import {
	undef, defined, notdefined, OL, LOG, keys, hasKey,
	isString, isHash, isArray, isInteger, range, inRange,
	isEmpty, nonEmpty,
	assert, croak, getOptions,
	} from '@jdeighan/llutils'
import {MultiMap} from '@jdeighan/llutils/multi-map'

raisedDot = '•'

# ---------------------------------------------------------------------------
#     class Grammar
# ---------------------------------------------------------------------------

export class Grammar

	constructor: (@hAST) ->

		[@setNonTerminals, @setTerminals] = checkAST @hAST

	# ..........................................................

	isTerminal: (item) ->

		return @setTerminals.has item

	# ..........................................................

	isNonTerminal: (str) ->

		return @setNonTerminals.has str

	# ..........................................................

	root: () ->

		return @hAST.lRules[0]?.head

	# ..........................................................

	getRule: (num) ->

		assert inRange(num, @hAST.lRules.length),
			"Out of range: #{OL(num)}"
		return @hAST.lRules[num]

	# ..........................................................
	# --- yields rules

	allRules: () ->

		yield from @hAST.lRules
		return

	# ..........................................................
	# --- yields rules

	alternatives: (name) ->

		for rule in @hAST.lRules.filter((rule) -> (rule.head == name))
			yield rule
		return

	# ..........................................................

	asString: () ->

		func = (hRule) => ruleAsString(hRule)
		return @hAST.lRules.map(func).join("\n")

# ---------------------------------------------------------------------------
#     class RuleEx
# ---------------------------------------------------------------------------

export class RuleEx

	@nextID: 0
	@resetNextID: () =>
		@nextID = 0
		return
	@getNextID: () =>
		id = @nextID
		@nextID += 1
		return id

	@mm: new MultiMap(3)
	@get: (hRule, src, pos=0) =>
		obj = @mm.get([hRule, src, pos])
		if defined(obj)
			return obj
		else
			obj = new RuleEx(hRule, src, pos)
			@mm.set [hRule, src, pos], obj
			return obj

	constructor: (@hRule, @src, @pos=0) ->

		@id = RuleEx.getNextID()

		checkRule(@hRule, @id)

		# --- Copy fields from hRule to this object
		@type = @hRule.type
		@head = @hRule.head
		@lParts = @hRule.lParts

		assert isInteger(@src), "Not an int: #{OL(@src)}"
		@maxpos = @lParts.length

	nextPart: () ->

		return @lParts[@pos]

	inc: () ->

		assert (@pos+1 <= @maxpos), "Can't inc #{this}"
		@pos += 1
		return

	asString: () ->

		return "[#{@id}] #{ruleAsString(@hRule, @pos)}"

# ---------------------------------------------------------------------------

export getRuleEx = (hRule, src) =>

	return new RuleEx(hRule, src, pos=0)

# ---------------------------------------------------------------------------
#     class EarleyParser
# ---------------------------------------------------------------------------

export class EarleyParser

	constructor: (hAST) ->

		@grammar = new Grammar(hAST)
		assert @grammar instanceof Grammar, "Not a grammar"

		# --- Add a phi rule at start of grammar's rule list
		rootRule = {
			type: "rule"
			head: "Φ"
			lParts: [nonterminal(@grammar.root())]
			}
		@lRules = [ rootRule, @grammar.allRules()...]

	# ..........................................................

	asString: () ->

		return @grammar.asString()

	# ..........................................................
	# --- If debug == true, the function yields each time
	#     a new RuleEx is added or an existing RuleEx is
	#     incremented

	parse: (str, hOptions={}) ->

		debugger
		assert isString(str), "Not a string: #{OL(str)}"
		{debug, root} = getOptions hOptions, {
			debug: false
			root: @grammar.root()
			}

		# --- Set the phi rule's lParts[0],
		#     in case caller specified an alternative root
		@lRules[0].lParts[0] = nonterminal(root)

		n = str.length

		# --- S is an array of sets of RuleEx objects
		RuleEx.resetNextID()   # reset IDs for RuleEx objects
		S = []
		initRuleEx = getRuleEx(@lRules[0], 0)
		for i from range(n)
			set = new Set()
			if (i == 0)
				set.add initRuleEx
			S.push set
		if debug
			yield "START:\n" + @debugStr(undef, [initRuleEx])
		for i from range(n)
			set = S[i]
			assert [
				defined(set),
				(set instanceof Set),
				(set.size > 0),
				], "Bad set #{i}: #{OL(set)}"
			for xRule from S[i].values()
				next = xRule.nextPart()
				switch next.type
					when "nonterminal"
						lNewRules = []
						for rule from @grammar.alternatives(next.value)
							newRule = RuleEx.get(rule, i)
							pre = S[i].size
							S[i].add newRule
							isDup = (S[i].size == pre)
							if !isDup
								lNewRules.push newRule
						if debug
							yield @debugStr(xRule, lNewRules)
					when "terminal"
						if (next.value == str[i])
							S[i+1].add xRule.inc()
					when undef
						{head, src} = xRule
						for xRuleFromSrc from S[src]
							hPart = xRuleFromSrc.nextPart()
							if (hPart.type == 'nonterminal') \
									&& (hPart.value == head)
								S[i].add xRule.inc()
					else
						croak "Bad next type: #{OL(next)}"

		return

	# ..........................................................

	debugStr: (srcRule, lNewRules=[]) ->

		if defined(srcRule)
			lLines = [srcRule.asString()]
		else
			lLines = []
		if isEmpty(lNewRules)
			lLines.push "   -> NOTHING"
		else
			for rule in lNewRules
				lLines.push "   -> #{rule.asString()}"
		return lLines.join("\n")

# ---------------------------------------------------------------------------
#     Utility Functions
# ---------------------------------------------------------------------------

export ruleAsString = (hRule, pos=undef) ->

	lRHS = hRule.lParts.map(
		(hPart) =>
			switch hPart.type
				when "terminal"
					return "\"#{hPart.value}\""
				when "nonterminal"
					return "#{hPart.value}"
		)
	if defined(pos)
		lRHS.splice pos, 0, raisedDot
	rhs = lRHS.join(" ")
	return "#{hRule.head} -> #{rhs}"

# ---------------------------------------------------------------------------

export terminal = (value) ->

	assert [
		isString(value),
		(value.length == 1),
		], "Bad terminal: #{OL(value)}"
	return {
		type: 'terminal'
		value
		}

# ---------------------------------------------------------------------------

export nonterminal = (name) ->

	assert isString(name), "bad nonterminal: #{OL(name)}"
	return {
		type: 'nonterminal'
		value: name
		}

# ---------------------------------------------------------------------------
# --- returns [<set of nonterminals>, <set of terminals>]
#     croaks if RHS of a rule has an undefined nonterminal

export checkAST = (hAST) ->

	assert [
		isHash(hAST),
		(hAST.type == 'grammar'),
		hasKey(hAST, 'lRules'),
		isArray(hAST.lRules),
		], "Bad AST: #{OL(hAST)}"

	setNonTerminals = new Set()
	for hRule in hAST.lRules
		checkRule(hRule)
		setNonTerminals.add hRule.head

	setTerminals = new Set()
	for hRule,i in hAST.lRules
		for item,j in hRule.lParts
			assert [
				isHash(item),
				hasKey(item, 'type'),
				], "Bad item #{i}/#{j}: #{OL(item)}"
			if (item.type == 'terminal')
				setTerminals.add item.value
			else if (item.type == 'nonterminal')
				assert setNonTerminals.has item.value
			else
				croak "Bad item #{i}/#{j}: #{OL(item)}"
	return [setNonTerminals, setTerminals]

# ---------------------------------------------------------------------------

export checkRule = (hRule, id=1) ->

	assert [
		(hRule.type == "rule"),
		hasKey(hRule, 'head'),
		isString(hRule.head),
		(hRule.head != 'Φ') || (id == 0),
		hasKey(hRule, 'lParts'),
		isArray(hRule.lParts),
		], "Bad rule: #{OL(hRule)}"
	return

