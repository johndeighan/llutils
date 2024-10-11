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
  escapeStr,
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
  phi,
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
      head: phi,
      lParts: [nonterminal(this.grammar.root())]
    };
    this.lRules = [rootRule, ...this.grammar.allRules()];
    this.width = 40;
  }

  // ..........................................................
  asString() {
    return this.grammar.asString();
  }

  // ..........................................................
  addRule(newRule, set) {
    var pre;
    pre = set.size;
    set.add(newRule); // won't add dups
    return set.size === pre;
  }

  // ..........................................................
  parse(str, hOptions = {}) {
    var debug, iterator, next, root;
    ({debug, root} = getOptions(hOptions, {
      debug: false,
      root: this.grammar.root()
    }));
    iterator = this.parse_generator(str, hOptions);
    next = iterator.next();
    while (!next.done) {
      next = iterator.next();
    }
    return next.value;
  }

  // ..........................................................
  * expandSet(S, i, str, hOptions = {}) {
    debugger;
    var curSet, debug, head, isDup, lNewRules, newRule, next, nextSet, ref, ref1, ref2, rule, src, srcRule, type, xRule;
    ({debug} = getOptions(hOptions, {
      debug: false
    }));
    curSet = S[i];
    nextSet = S[i + 1];
    if (debug) {
      LOG(centered(i, this.width, {
        char: '-'
      }));
    }
    ref = curSet.values();
    for (xRule of ref) {
      if (debug) {
        LOG(this.ruleStr(xRule));
      }
      next = xRule.nextPart();
      type = defined(next) ? next.type : undef;
      lNewRules = []; // --- [ [rule, isDup, destSet], ... ]
      //     undef destSet means same set as src
      switch (type) {
        case "nonterminal":
          ref1 = this.grammar.alternatives(next.value);
          for (rule of ref1) {
            newRule = RuleEx.getNew(rule, i);
            isDup = this.addRule(newRule, curSet);
            lNewRules.push([newRule, isDup]);
          }
          break;
        case "terminal":
          if ((next.value === str[i]) && defined(nextSet)) {
            newRule = xRule.getInc();
            isDup = this.addRule(newRule, nextSet);
            lNewRules.push([newRule, isDup, i + 1]);
          }
          break;
        case undef:
          ({head, src} = xRule);
          ref2 = S[src];
          for (srcRule of ref2) {
            next = srcRule.nextPart();
            if (defined(next) && (next.type === 'nonterminal') && (next.value === head)) {
              newRule = srcRule.getInc();
              isDup = this.addRule(newRule, curSet);
              lNewRules.push([newRule, isDup]);
            }
          }
          break;
        default:
          croak(`Bad next type in RuleEx: ${OL(xRule)}`);
      }
      if (debug) {
        LOG(this.resultStr(lNewRules));
        yield this.resultStr(lNewRules);
      }
    }
    // --- Dump contents of curSet
    if (debug) {
      LOG(this.setStr(curSet, i));
    }
  }

  // ..........................................................
  // --- If debug == true, the function yields each time
  //     a new RuleEx is added or an existing RuleEx is
  //     incremented
  * parse_generator(str, hOptions = {}) {
    debugger;
    var S, debug, debugStr, i, k, lIndexes, len, n, ref, ref1, root, xRule;
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
    S = [];
    RuleEx.resetNextID(); // reset IDs for RuleEx objects
    ref = range(n + 1);
    for (i of ref) {
      if (i === 0) {
        S.push(new Set([RuleEx.getNew(this.lRules[0], 0, 0)]));
      } else {
        S.push(new Set());
      }
    }
    lIndexes = Array.from(range(n));
    for (k = 0, len = lIndexes.length; k < len; k++) {
      i = lIndexes[k];
      if (S[i].size === 0) {
        str = escapeStr(str, {
          offset: i - 1
        });
        throw new SyntaxError(str);
      }
      yield* this.expandSet(S, i, str, {debug});
    }
    yield* this.expandSet(S, n, str, {debug});
    if (debug) {
      LOG(this.setStr(S[n], n));
    }
    ref1 = S[n].values();
    for (xRule of ref1) {
      if (this.isFinal(xRule)) {
        return "OK";
      }
    }
    debugStr = escapeStr(str, {
      offset: n - 1
    });
    throw new SyntaxError(debugStr);
  }

  // ..........................................................
  isFinal(xRule) {
    return (xRule.head === phi) && notdefined(xRule.nextPart());
  }

  // ..........................................................
  setStr(set, i) {
    var lLines, xRule;
    // --- Get contents of a set as a string
    lLines = [
      centered(`S[${i}]`,
      this.width,
      {
        char: '-'
      })
    ];
    for (xRule of set) {
      lLines.push(xRule.asString());
    }
    return lLines.join("\n");
  }

  // ..........................................................
  ruleStr(srcRuleEx) {
    var next;
    next = srcRuleEx.nextPart();
    if (defined(next)) {
      return `${srcRuleEx.asString()} (${next.type} next)`;
    } else {
      return `${srcRuleEx.asString()} (at end)`;
    }
  }

  // ..........................................................
  resultStr(lNewRules = []) {
    var destSet, isDup, k, lLines, len, rule, status;
    lLines = [];
    for (k = 0, len = lNewRules.length; k < len; k++) {
      [rule, isDup, destSet] = lNewRules[k];
      status = isDup ? 'DUP ' : '';
      if (defined(destSet)) {
        lLines.push(`   ${status}${rule.asString()} ===> S${destSet}`);
      } else {
        lLines.push(`   ${status}${rule.asString()}`);
      }
    }
    if (isEmpty(lLines)) {
      lLines.push("   NO MATCH");
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
