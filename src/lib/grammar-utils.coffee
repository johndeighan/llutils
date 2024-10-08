# grammar-utils.coffee

import {
	undef, defined, notdefined, OL, LOG, keys, hasKey,
	isString, isHash, isArray, isInteger, range, inRange,
	assert, croak, getOptions,
	} from '@jdeighan/llutils'

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

		for rule in @hAST.lRules
			if rule.head == name
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

	constructor: (@hRule, @src) ->

		checkRule(@hRule)

		# --- Copy fields from hRule to this object
		@type = @hRule.type
		@head = @hRule.head
		@lParts = @hRule.lParts
		@pos = 0

		assert isInteger(@src), "Not an int: #{OL(@src)}"
		@maxpos = @lParts.length

	nextPart: () ->

		return @lParts[@pos]

	inc: () ->

		assert (@pos+1 <= @maxpos), "Can't inc #{this}"
		@pos += 1
		return

	asString: () ->

		return ruleAsString(@hRule, @pos)

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
	# --- If debug == true, the function yields each time
	#     a new RuleEx is added or an existing RuleEx is
	#     incremented

	parse: (str, hOptions={}) ->

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
		S = []
		initRuleEx = new RuleEx(@lRules[0], 0)
		for i in range(n)
			if (i == 0)
				S.push new Set(initRuleEx)
			else
				S.push new Set()
		if debug
			yield initRuleEx.asString()
		for i in range(n)
			set = S[i]
			assert [
				defined(set),
				(set instanceof Set),
				(set.size > 0),
				], "Bad set #{i}: #{OL(set)}"
			for xRule from S[i].values()
				{head} = xRule
				next = xRule.nextPart()
				switch next.type
					when "nonterminal"
						for rule from grammar.alternatives(head)
							S[i].add new RuleEx(rule, i)
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

export checkRule = (hRule) ->

	assert [
		(hRule.type == "rule"),
		hasKey(hRule, 'head'),
		isString(hRule.head),
		(hRule.head != 'Φ'),
		hasKey(hRule, 'lParts'),
		isArray(hRule.lParts),
		], "Bad rule: #{OL(hRule)}"
	return

