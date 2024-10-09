// grammar-utils.coffee
var raisedDot;

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
  assert,
  croak,
  getOptions
} from '@jdeighan/llutils';

import {
  MultiMap
} from '@jdeighan/llutils/multi-map';

raisedDot = '•';

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

export var RuleEx = (function() {
  // ---------------------------------------------------------------------------
  //     class RuleEx
  // ---------------------------------------------------------------------------
  class RuleEx {
    static resetNextID() {
      RuleEx.nextID = 0;
    }

    static getNextID() {
      var id;
      id = RuleEx.nextID;
      RuleEx.nextID += 1;
      return id;
    }

    static get(hRule, src, pos = 0) {
      var obj;
      obj = RuleEx.mm.get([hRule, src, pos]);
      if (defined(obj)) {
        return obj;
      } else {
        obj = new RuleEx(hRule, src, pos);
        RuleEx.mm.set([hRule, src, pos], obj);
        return obj;
      }
    }

    constructor(hRule1, src1, pos1 = 0) {
      this.hRule = hRule1;
      this.src = src1;
      this.pos = pos1;
      this.id = RuleEx.getNextID();
      checkRule(this.hRule, this.id);
      // --- Copy fields from hRule to this object
      this.type = this.hRule.type;
      this.head = this.hRule.head;
      this.lParts = this.hRule.lParts;
      assert(isInteger(this.src), `Not an int: ${OL(this.src)}`);
      this.maxpos = this.lParts.length;
    }

    nextPart() {
      return this.lParts[this.pos];
    }

    inc() {
      assert(this.pos + 1 <= this.maxpos, `Can't inc ${this}`);
      this.pos += 1;
    }

    asString() {
      return `[${this.id}] ${ruleAsString(this.hRule, this.pos)}`;
    }

  };

  RuleEx.nextID = 0;

  RuleEx.mm = new MultiMap(3);

  return RuleEx;

}).call(this);

// ---------------------------------------------------------------------------
export var getRuleEx = (hRule, src) => {
  var pos;
  return new RuleEx(hRule, src, pos = 0);
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
    var S, debug, hPart, head, i, initRuleEx, isDup, lNewRules, n, newRule, next, pre, ref, ref1, ref2, ref3, ref4, root, rule, set, src, xRule, xRuleFromSrc;
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
    initRuleEx = getRuleEx(this.lRules[0], 0);
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
      ref2 = S[i].values();
      for (xRule of ref2) {
        next = xRule.nextPart();
        switch (next.type) {
          case "nonterminal":
            lNewRules = [];
            ref3 = this.grammar.alternatives(next.value);
            for (rule of ref3) {
              newRule = RuleEx.get(rule, i);
              pre = S[i].size;
              S[i].add(newRule);
              isDup = S[i].size === pre;
              if (!isDup) {
                lNewRules.push(newRule);
              }
            }
            if (debug) {
              yield this.debugStr(xRule, lNewRules);
            }
            break;
          case "terminal":
            if (next.value === str[i]) {
              S[i + 1].add(xRule.inc());
            }
            break;
          case undef:
            ({head, src} = xRule);
            ref4 = S[src];
            for (xRuleFromSrc of ref4) {
              hPart = xRuleFromSrc.nextPart();
              if ((hPart.type === 'nonterminal') && (hPart.value === head)) {
                S[i].add(xRule.inc());
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
  debugStr(srcRule, lNewRules = []) {
    var k, lLines, len, rule;
    if (defined(srcRule)) {
      lLines = [srcRule.asString()];
    } else {
      lLines = [];
    }
    if (isEmpty(lNewRules)) {
      lLines.push("   -> NOTHING");
    } else {
      for (k = 0, len = lNewRules.length; k < len; k++) {
        rule = lNewRules[k];
        lLines.push(`   -> ${rule.asString()}`);
      }
    }
    return lLines.join("\n");
  }

};

// ---------------------------------------------------------------------------
//     Utility Functions
// ---------------------------------------------------------------------------
export var ruleAsString = function(hRule, pos = undef) {
  var lRHS, rhs;
  lRHS = hRule.lParts.map((hPart) => {
    switch (hPart.type) {
      case "terminal":
        return `\"${hPart.value}\"`;
      case "nonterminal":
        return `${hPart.value}`;
    }
  });
  if (defined(pos)) {
    lRHS.splice(pos, 0, raisedDot);
  }
  rhs = lRHS.join(" ");
  return `${hRule.head} -> ${rhs}`;
};

// ---------------------------------------------------------------------------
export var terminal = function(value) {
  assert([isString(value), value.length === 1], `Bad terminal: ${OL(value)}`);
  return {
    type: 'terminal',
    value
  };
};

// ---------------------------------------------------------------------------
export var nonterminal = function(name) {
  assert(isString(name), `bad nonterminal: ${OL(name)}`);
  return {
    type: 'nonterminal',
    value: name
  };
};

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

// ---------------------------------------------------------------------------
export var checkRule = function(hRule, id = 1) {
  assert([hRule.type === "rule", hasKey(hRule, 'head'), isString(hRule.head), (hRule.head !== 'Φ') || (id === 0), hasKey(hRule, 'lParts'), isArray(hRule.lParts)], `Bad rule: ${OL(hRule)}`);
};

//# sourceMappingURL=grammar-utils.js.map
