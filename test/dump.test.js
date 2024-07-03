  // dump.test.coffee
import {
  undef
} from '@jdeighan/llutils';

import * as lib from '@jdeighan/llutils/dump';

Object.assign(global, lib);

import * as lib2 from '@jdeighan/llutils/utest';

Object.assign(global, lib2);

// ---------------------------------------------------------------------------
//symbol "DUMP(item, label, hOptions)"
(() => {
  var str;
  str = DUMP({
    a: 1,
    b: 'def',
    c: undef,
    d: (x) => {
      return 42;
    }
  }, 'STR', 'width=11 !echo');
  return equal(str, `------  STR  ------
a: 1
b: def
c: .undef.
d: .Function d.
-------------------`);
})();

(() => {
  var str;
  str = DUMP({
    a: 1,
    b: ['def', 'ghi', 3, undef],
    c: {
      a: 42,
      b: true,
      c: 'abc',
      d: undef
    },
    d: (x) => {
      return 42;
    }
  }, 'STR', '!echo');
  return equal(str, `------  STR  ------
a: 1
b:
	- def
	- ghi
	- 3
	- .undef.
c:
	a: 42
	b: .true.
	c: abc
	d: .undef.
d: .Function d.
-------------------`);
})();

(() => {
  var str;
  str = BOX({
    a: 1,
    b: 'def',
    c: undef,
    d: (x) => {
      return 42;
    }
  }, 'STR', 'width=11 !echo');
  return equal(str, `┌──────  STR  ────┐
│ a: 1            │
│ b: def          │
│ c: .undef.      │
│ d: .Function d. │
└─────────────────┘`);
})();

//# sourceMappingURL=dump.test.js.map
