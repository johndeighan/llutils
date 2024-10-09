# grammar-utils.test.coffee

import {
	undef, defined, notdefined,
	} from '@jdeighan/llutils'
import * as lib from '@jdeighan/llutils/grammar-utils'
Object.assign(global, lib)
import {
	terminal, nonterminal, RuleEx,
	} from '@jdeighan/llutils/rule-ex'
import * as lib2 from '@jdeighan/llutils/utest'
Object.assign(global, lib2)

# ---------------------------------------------------------------------------

(() =>
	hAST = {
		type: "grammar"
		lRules: [
			{
				type: "rule"
				head: "E"
				lParts: [
					nonterminal "T"
					]
				},
			{
				type: "rule"
				head: "E"
				lParts: [
					nonterminal "E"
					terminal    "+"
					nonterminal "T"
					]
				},
			{
				type: "rule"
				head: "T"
				lParts: [
					nonterminal "P"
					]
				},
			{
				type: "rule"
				head: "T"
				lParts: [
					nonterminal "T"
					terminal    "*"
					nonterminal "P"
					]
				},
			{
				type: "rule"
				head: "P"
				lParts: [
					terminal "a"
					]
				},
			]
		}

	grammar = undef
	succeeds () =>
		grammar = new Grammar(hAST)
	truthy grammar.isNonTerminal 'E'
	truthy grammar.isNonTerminal 'T'
	falsy  grammar.isNonTerminal 'X'

	truthy grammar instanceof Grammar
	equal grammar.root(), "E"
	equal grammar.asString(), """
		E -> T
		E -> E "+" T
		T -> P
		T -> T "*" P
		P -> "a"
		"""
	nRules = 0
	for rule from grammar.alternatives("T")
		nRules = nRules + 1
		equal rule.head, "T"
	equal nRules, 2

	# --- T -> T * P
	rx = new RuleEx(grammar.getRule(3), 0)
	equal rx.pos, 0

	rx2 = rx3 = rx4 = rx5 = undef

	succeeds () => rx2 = rx.getInc()
	equal rx2.pos, 1

	succeeds () => rx3 = rx2.getInc()
	succeeds () => rx4 = rx3.getInc()
	equal rx4.pos, 3

	fails () => rx5 = rx4.getInc()

	parser = undef
	succeeds () => parser = new EarleyParser(hAST)
#	succeeds () => parser.parse("a+a*a")
	)()

