# grammar-utils.coffee

import {
	undef, defined, notdefined, OL, LOG, keys, hasKey,
	isString, isHash, isArray, isInteger, range, inRange,
	isEmpty, nonEmpty, centered, escapeStr,
	assert, croak, getOptions,
	} from '@jdeighan/llutils'
import {MultiMap} from '@jdeighan/llutils/multi-map'
import {
	terminal, nonterminal, phi,
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
			head: phi
			lParts: [nonterminal(@grammar.root())]
			}
		@lRules = [ rootRule, @grammar.allRules()...]
		@width = 40

	# ..........................................................

	asString: () ->

		return @grammar.asString()

	# ..........................................................

	addRule: (newRule, set) ->

		pre = set.size
		set.add newRule   # won't add dups
		return (set.size == pre)

	# ..........................................................

	parse: (str, hOptions={}) ->

		{debug, root} = getOptions hOptions, {
			debug: false
			root: @grammar.root()
			}
		iterator = @parse_generator str, hOptions
		next = iterator.next()
		while !next.done
			next = iterator.next()
		return next.value

	# ..........................................................

	expandSet: (S, i, str, hOptions={}) ->

		debugger
		{debug} = getOptions hOptions, {
			debug: false
			}
		curSet = S[i]
		nextSet = S[i+1]
		if debug
			LOG centered(i, @width, {char: '-'})

		for xRule from curSet.values()
			if debug
				LOG @ruleStr(xRule)
			next = xRule.nextPart()
			type = if defined(next) then next.type else undef

			lNewRules = []     # --- [ [rule, isDup, destSet], ... ]
									 #     undef destSet means same set as src
			switch type

				when "nonterminal"
					for rule from @grammar.alternatives(next.value)
						newRule = RuleEx.getNew(rule, i)
						isDup = @addRule(newRule, curSet)
						lNewRules.push [newRule, isDup]

				when "terminal"
					if (next.value == str[i]) && defined(nextSet)
						newRule = xRule.getInc()
						isDup = @addRule(newRule, nextSet)
						lNewRules.push [newRule, isDup, i+1]

				when undef
					{head, src} = xRule
					for srcRule from S[src]
						next = srcRule.nextPart()
						if defined(next) \
								&& (next.type == 'nonterminal') \
								&& (next.value == head)
							newRule = srcRule.getInc()
							isDup = @addRule(newRule, curSet)
							lNewRules.push [newRule, isDup]
				else
					croak "Bad next type in RuleEx: #{OL(xRule)}"

			if debug
				LOG @resultStr(lNewRules)
				yield @resultStr(lNewRules)

		# --- Dump contents of curSet
		if debug
			LOG @setStr(curSet, i)
		return

	# ..........................................................
	# --- If debug == true, the function yields each time
	#     a new RuleEx is added or an existing RuleEx is
	#     incremented

	parse_generator: (str, hOptions={}) ->

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
		S = []
		RuleEx.resetNextID()   # reset IDs for RuleEx objects

		for i from range(n+1)
			if (i == 0)
				S.push new Set([RuleEx.getNew(@lRules[0], 0, 0)])
			else
				S.push new Set()

		lIndexes = Array.from(range(n))
		for i in lIndexes
			if (S[i].size == 0)
				str = escapeStr(str, {offset: i-1})
				throw new SyntaxError(str)
			yield from @expandSet S, i, str, {debug}

		yield from @expandSet S, n, str, {debug}
		if debug
			LOG @setStr(S[n], n)
		for xRule from S[n].values()
			if @isFinal(xRule)
				return "OK"
		debugStr = escapeStr(str, {offset: n-1})
		throw new SyntaxError(debugStr)

	# ..........................................................

	isFinal: (xRule) ->

		return (xRule.head == phi) && notdefined(xRule.nextPart())

	# ..........................................................

	setStr: (set, i) ->

		# --- Get contents of a set as a string
		lLines = [centered("S[#{i}]", @width, {char: '-'})]
		for xRule from set
			lLines.push xRule.asString()
		return lLines.join("\n")

	# ..........................................................

	ruleStr: (srcRuleEx) ->

		next = srcRuleEx.nextPart()
		if defined(next)
			return "#{srcRuleEx.asString()} (#{next.type} next)"
		else
			return "#{srcRuleEx.asString()} (at end)"

	# ..........................................................

	resultStr: (lNewRules=[]) ->

		lLines = []
		for [rule, isDup, destSet] in lNewRules
			status = if isDup then 'DUP ' else ''
			if defined(destSet)
				lLines.push "   #{status}#{rule.asString()} ===> S#{destSet}"
			else
				lLines.push "   #{status}#{rule.asString()}"
		if isEmpty(lLines)
			lLines.push "   NO MATCH"
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
