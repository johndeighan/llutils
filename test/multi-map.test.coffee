# multi-map.test.coffee

import {
	undef, defined, notdefined, LOG,
	} from '@jdeighan/llutils'
import * as lib from '@jdeighan/llutils/multi-map'
Object.assign(global, lib)
import * as lib2 from '@jdeighan/llutils/utest'
Object.assign(global, lib2)
import {hExprAST} from './multi-map/grammars.js'

# NOTE: a rule looks like:
# 	{
# 		type: "rule"
# 		head: "E"
# 		lParts: [
# 			nonterminal "T"
# 			]
# 		},

# ---------------------------------------------------------------------------

lRules = [
	hExprAST.lRules[0],
	hExprAST.lRules[1],
	hExprAST.lRules[2],
	]

mm = new MultiMap(3)
for hRule,i in lRules
	mm.set [hRule, 0, 0], "rule#{i}"

for hRule,i in lRules
	equal mm.get([hRule, 0, 0]), "rule#{i}"
	equal mm.get([hRule, 1, 0]), undef
	equal mm.get([hRule, 0, 1]), undef

hRule = lRules[1]
mm.set [hRule, 2, 3], "rule-x"
equal mm.get([hRule, 0, 0]), "rule1"
equal mm.get([hRule, 2, 3]), "rule-x"
equal mm.get([hRule, 3, 2]), undef
equal mm.get([hRule, 0, 2]), undef
equal mm.get([hRule, 3, 0]), undef

truthy mm.has([hRule, 0, 0])
truthy mm.has([hRule, 2, 3])
falsy  mm.has([hRule, 3, 2])
falsy  mm.has([hRule, 0, 2])
falsy  mm.has([hRule, 3, 0])
