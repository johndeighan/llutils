  // grammar-utils.coffee
import {
  undef,
  defined,
  notdefined,
  OL,
  LOG,
  keys,
  hasKey,
  isString,
  isHash,
  isArray,
  isInteger,
  range,
  inRange,
  isEmpty,
  nonEmpty,
  centered,
  assert,
  croak,
  getOptions
} from '@jdeighan/llutils';

import {
  MultiMap
} from '@jdeighan/llutils/multi-map';

import {
  terminal,
  nonterminal,
  RuleEx,
  checkRule,
  ruleAsString
} from '@jdeighan/llutils/rule-ex';

// ---------------------------------------------------------------------------
//     class Grammar
// ---------------------------------------------------------------------------
export var Grammar = class Grammar {
  constructor(hAST1) {
    this.hAST = hAST1;
    [this.setNonTerminals, this.setTerminals] = checkAST(this.hAST);
  }

  // ..........................................................
  isTerminal(item) {
    return this.setTerminals.has(item);
  }

  // ..........................................................
  isNonTerminal(str) {
    return this.setNonTerminals.has(str);
  }

  // ..........................................................
  root() {
    var ref;
    return (ref = this.hAST.lRules[0]) != null ? ref.head : void 0;
  }

  // ..........................................................
  getRule(num) {
    assert(inRange(num, this.hAST.lRules.length), `Out of range: ${OL(num)}`);
    return this.hAST.lRules[num];
  }

  // ..........................................................
  // --- yields rules
  * allRules() {
    yield* this.hAST.lRules;
  }

  // ..........................................................
  // --- yields rules
  * alternatives(name) {
    var k, len, ref, rule;
    ref = this.hAST.lRules.filter(function(rule) {
      return rule.head === name;
    });
    for (k = 0, len = ref.length; k < len; k++) {
      rule = ref[k];
      yield rule;
    }
  }

  // ..........................................................
  asString() {
    var func;
    func = (hRule) => {
      return ruleAsString(hRule);
    };
    return this.hAST.lRules.map(func).join("\n");
  }

};

// ---------------------------------------------------------------------------
//     class EarleyParser
// ---------------------------------------------------------------------------
export var EarleyParser = class EarleyParser {
  constructor(hAST) {
    var rootRule;
    this.grammar = new Grammar(hAST);
    assert(this.grammar instanceof Grammar, "Not a grammar");
    // --- Add a phi rule at start of grammar's rule list
    rootRule = {
      type: "rule",
      head: "Φ",
      lParts: [nonterminal(this.grammar.root())]
    };
    this.lRules = [rootRule, ...this.grammar.allRules()];
  }

  // ..........................................................
  asString() {
    return this.grammar.asString();
  }

  // ..........................................................
  // --- If debug == true, the function yields each time
  //     a new RuleEx is added or an existing RuleEx is
  //     incremented
  * parse(str, hOptions = {}) {
    debugger;
    var S, debug, hPart, head, i, initRuleEx, isDup, lDupRules, lNewRules, n, newRule, next, pre, ref, ref1, ref2, ref3, ref4, root, rule, set, src, xRule, xRuleFromSrc;
    assert(isString(str), `Not a string: ${OL(str)}`);
    ({debug, root} = getOptions(hOptions, {
      debug: false,
      root: this.grammar.root()
    }));
    // --- Set the phi rule's lParts[0],
    //     in case caller specified an alternative root
    this.lRules[0].lParts[0] = nonterminal(root);
    n = str.length;
    // --- S is an array of sets of RuleEx objects
    RuleEx.resetNextID(); // reset IDs for RuleEx objects
    S = [];
    initRuleEx = RuleEx.get(this.lRules[0], 0, 0);
    ref = range(n);
    for (i of ref) {
      set = new Set();
      if (i === 0) {
        set.add(initRuleEx);
      }
      S.push(set);
    }
    if (debug) {
      yield "START:\n" + this.debugStr(undef, [initRuleEx]);
    }
    ref1 = range(n);
    for (i of ref1) {
      set = S[i];
      assert([defined(set), set instanceof Set, set.size > 0], `Bad set ${i}: ${OL(set)}`);
      if (debug) {
        LOG(centered(i, 32, {
          char: '-'
        }));
      }
      ref2 = S[i].values();
      for (xRule of ref2) {
        next = xRule.nextPart();
        switch (next.type) {
          case "nonterminal":
            lNewRules = [];
            lDupRules = [];
            ref3 = this.grammar.alternatives(next.value);
            for (rule of ref3) {
              newRule = RuleEx.get(rule, i, 0);
              pre = S[i].size;
              S[i].add(newRule); // won't add dups
              isDup = S[i].size === pre;
              if (isDup) {
                lDupRules.push(newRule);
              } else {
                lNewRules.push(newRule);
              }
            }
            if (debug) {
              yield this.debugStr(xRule, lNewRules, lDupRules);
            }
            break;
          case "terminal":
            if (next.value === str[i]) {
              newRule = RuleEx.get(rule, i, xRule.pos + 1);
              pre = S[i].size;
              S[i + 1].add(xRule.getInc());
              isDup = S[i].size === pre;
              if (isDup) {
                lDupRules.push(newRule);
              } else {
                lNewRules.push(newRule);
              }
              yield this.debugStr(xRule, lNewRules, lDupRules);
            } else {
              yield this.debugStr(xRule, lNewRules);
            }
            break;
          case undef:
            ({head, src} = xRule);
            ref4 = S[src];
            for (xRuleFromSrc of ref4) {
              hPart = xRuleFromSrc.nextPart();
              if ((hPart.type === 'nonterminal') && (hPart.value === head)) {
                S[i].add(xRule.getInc());
              }
            }
            break;
          default:
            croak(`Bad next type: ${OL(next)}`);
        }
      }
    }
  }

  // ..........................................................
  debugStr(srcRule, lNewRules = [], lDupRules = []) {
    var k, l, lLines, len, len1, rule;
    if (defined(srcRule)) {
      lLines = [srcRule.asString()];
    } else {
      lLines = [];
    }
    for (k = 0, len = lNewRules.length; k < len; k++) {
      rule = lNewRules[k];
      lLines.push(`   ${rule.asString()}`);
    }
    for (l = 0, len1 = lDupRules.length; l < len1; l++) {
      rule = lDupRules[l];
      lLines.push(`   ${rule.asString()} (DUP)`);
    }
    return lLines.join("\n");
  }

};

// ---------------------------------------------------------------------------
//     Utility Functions
// ---------------------------------------------------------------------------
// --- returns [<set of nonterminals>, <set of terminals>]
//     croaks if RHS of a rule has an undefined nonterminal
export var checkAST = function(hAST) {
  var hRule, i, item, j, k, l, len, len1, len2, m, ref, ref1, ref2, setNonTerminals, setTerminals;
  assert([isHash(hAST), hAST.type === 'grammar', hasKey(hAST, 'lRules'), isArray(hAST.lRules)], `Bad AST: ${OL(hAST)}`);
  setNonTerminals = new Set();
  ref = hAST.lRules;
  for (k = 0, len = ref.length; k < len; k++) {
    hRule = ref[k];
    checkRule(hRule);
    setNonTerminals.add(hRule.head);
  }
  setTerminals = new Set();
  ref1 = hAST.lRules;
  for (i = l = 0, len1 = ref1.length; l < len1; i = ++l) {
    hRule = ref1[i];
    ref2 = hRule.lParts;
    for (j = m = 0, len2 = ref2.length; m < len2; j = ++m) {
      item = ref2[j];
      assert([isHash(item), hasKey(item, 'type')], `Bad item ${i}/${j}: ${OL(item)}`);
      if (item.type === 'terminal') {
        setTerminals.add(item.value);
      } else if (item.type === 'nonterminal') {
        assert(setNonTerminals.has(item.value));
      } else {
        croak(`Bad item ${i}/${j}: ${OL(item)}`);
      }
    }
  }
  return [setNonTerminals, setTerminals];
};

//# sourceMappingURL=grammar-utils.js.map
