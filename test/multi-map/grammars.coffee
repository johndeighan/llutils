# grammars.coffee

import {
	nonterminal, terminal,
	} from '@jdeighan/llutils/grammar-utils'

# ---------------------------------------------------------------------------

export hExprAST = {
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
