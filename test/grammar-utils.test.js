  // grammar-utils.test.coffee
import {
  undef,
  defined,
  notdefined
} from '@jdeighan/llutils';

import * as lib from '@jdeighan/llutils/grammar-utils';

Object.assign(global, lib);

import {
  terminal,
  nonterminal,
  RuleEx
} from '@jdeighan/llutils/rule-ex';

import * as lib2 from '@jdeighan/llutils/utest';

Object.assign(global, lib2);

// ---------------------------------------------------------------------------
(() => {
  var grammar, hAST, nRules, parser, ref, rule, rx, rx2, rx3, rx4, rx5;
  hAST = {
    type: "grammar",
    lRules: [
      {
        type: "rule",
        head: "E",
        lParts: [nonterminal("T")]
      },
      {
        type: "rule",
        head: "E",
        lParts: [nonterminal("E"),
      terminal("+"),
      nonterminal("T")]
      },
      {
        type: "rule",
        head: "T",
        lParts: [nonterminal("P")]
      },
      {
        type: "rule",
        head: "T",
        lParts: [nonterminal("T"),
      terminal("*"),
      nonterminal("P")]
      },
      {
        type: "rule",
        head: "P",
        lParts: [terminal("a")]
      }
    ]
  };
  grammar = undef;
  succeeds(() => {
    return grammar = new Grammar(hAST);
  });
  truthy(grammar.isNonTerminal('E'));
  truthy(grammar.isNonTerminal('T'));
  falsy(grammar.isNonTerminal('X'));
  truthy(grammar instanceof Grammar);
  equal(grammar.root(), "E");
  equal(grammar.asString(), `E -> T
E -> E "+" T
T -> P
T -> T "*" P
P -> "a"`);
  nRules = 0;
  ref = grammar.alternatives("T");
  for (rule of ref) {
    nRules = nRules + 1;
    equal(rule.head, "T");
  }
  equal(nRules, 2);
  // --- T -> T * P
  rx = new RuleEx(grammar.getRule(3), 0);
  equal(rx.pos, 0);
  rx2 = rx3 = rx4 = rx5 = undef;
  succeeds(() => {
    return rx2 = rx.getInc();
  });
  equal(rx2.pos, 1);
  succeeds(() => {
    return rx3 = rx2.getInc();
  });
  succeeds(() => {
    return rx4 = rx3.getInc();
  });
  equal(rx4.pos, 3);
  fails(() => {
    return rx5 = rx4.getInc();
  });
  parser = undef;
  return succeeds(() => {
    return parser = new EarleyParser(hAST);
  });
})();

//	succeeds () => parser.parse("a+a*a")

//# sourceMappingURL=grammar-utils.test.js.map
