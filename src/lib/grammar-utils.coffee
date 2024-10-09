# grammar-utils.coffee

import {
	undef, defined, notdefined, OL, LOG, keys, hasKey,
	isString, isHash, isArray, isInteger, range, inRange,
	isEmpty, nonEmpty, centered,
	assert, croak, getOptions,
	} from '@jdeighan/llutils'
import {MultiMap} from '@jdeighan/llutils/multi-map'
import {
	terminal, nonterminal,
	RuleEx, checkRule, ruleAsString,
	} from '@jdeighan/llutils/rule-ex'

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
		initRuleEx = RuleEx.get(@lRules[0], 0, 0)
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

			if debug
				LOG centered(i, 32, {char: '-'})

			for xRule from S[i].values()
				next = xRule.nextPart()
				switch next.type
					when "nonterminal"
						lNewRules = []
						lDupRules = []
						for rule from @grammar.alternatives(next.value)
							newRule = RuleEx.get(rule, i, 0)
							pre = S[i].size
							S[i].add newRule   # won't add dups
							isDup = (S[i].size == pre)
							if isDup
								lDupRules.push newRule
							else
								lNewRules.push newRule
						if debug
							yield @debugStr(xRule, lNewRules, lDupRules)
					when "terminal"
						if (next.value == str[i])
							newRule = RuleEx.get(rule, i, xRule.pos+1)
							pre = S[i].size
							S[i+1].add xRule.getInc()
							isDup = (S[i].size == pre)
							if isDup
								lDupRules.push newRule
							else
								lNewRules.push newRule
							yield @debugStr(xRule, lNewRules, lDupRules)
						else
							yield @debugStr(xRule, lNewRules)
					when undef
						{head, src} = xRule
						for xRuleFromSrc from S[src]
							hPart = xRuleFromSrc.nextPart()
							if (hPart.type == 'nonterminal') \
									&& (hPart.value == head)
								S[i].add xRule.getInc()
					else
						croak "Bad next type: #{OL(next)}"

		return

	# ..........................................................

	debugStr: (srcRule, lNewRules=[], lDupRules=[]) ->

		if defined(srcRule)
			lLines = [srcRule.asString()]
		else
			lLines = []

		for rule in lNewRules
			lLines.push "   #{rule.asString()}"
		for rule in lDupRules
			lLines.push "   #{rule.asString()} (DUP)"
		return lLines.join("\n")

# ---------------------------------------------------------------------------
#     Utility Functions
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
