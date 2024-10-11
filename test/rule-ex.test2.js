  // rule-ex.test.coffee
import {
  undef,
  defined,
  notdefined
} from '@jdeighan/llutils';

import * as lib from '@jdeighan/llutils/rule-ex';

Object.assign(global, lib);

import * as lib2 from '@jdeighan/llutils/utest';

Object.assign(global, lib2);

// ---------------------------------------------------------------------------
(() => {
  var hRule;
  hRule = {
    type: "rule",
    head: "E",
    lParts: [terminal("P"), nonterminal("name"), terminal("a"), nonterminal("expr")]
  };
  equal(ruleAsString(hRule), 'E -> "P" name "a" expr');
  return equal(ruleAsString(hRule, 3), 'E -> "P" name "a" • expr');
})();

//# sourceMappingURL=rule-ex.test2.js.map
