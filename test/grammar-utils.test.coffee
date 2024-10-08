# grammar-utils.test.coffee

import {
	undef, defined, notdefined,
	} from '@jdeighan/llutils'
import * as lib from '@jdeighan/llutils/grammar-utils'
Object.assign(global, lib)
import * as lib2 from '@jdeighan/llutils/utest'
Object.assign(global, lib2)

# ---------------------------------------------------------------------------

(() =>
	hRule = {
		type: "rule"
		head: "E"
		lParts: [
			terminal "P"
			nonterminal "name"
			terminal "a"
			nonterminal "expr"
			]
		}
	equal ruleAsString(hRule), 'E -> "P" name "a" expr'
	equal ruleAsString(hRule, 3), 'E -> "P" name "a" • expr'
	)()

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
	succeeds () => rx.inc()
	equal rx.pos, 1
	succeeds () => rx.inc()
	succeeds () => rx.inc()
	equal rx.pos, 3
	fails () => rx.inc()

	parser = undef
	succeeds () => parser = new EarleyParser(hAST)
#	succeeds () => parser.parse("a+a*a")
	)()

