// to-nice.test.coffee
var NewClass, YClass, func1, func2, h, xClass;

import {
  undef
} from '@jdeighan/llutils';

import * as lib from '@jdeighan/llutils/to-nice';

Object.assign(global, lib);

import * as lib2 from '@jdeighan/llutils/utest';

Object.assign(global, lib2);

// ---------------------------------------------------------------------------
//symbol "toNICE(obj)"
func1 = function(x) {
  return 42;
};

func2 = (x) => {
  return 42;
};

xClass = class {
  constructor(item) {
    this.item = item;
  }

  meth(x) {
    return x;
  }

};

YClass = class YClass {
  constructor(item) {
    this.item = item;
  }

  meth(x) {
    return x;
  }

};

equal(toNICE(undef), '.undef.');

equal(toNICE(null), '.null.');

equal(toNICE(true), '.true.');

equal(toNICE(false), '.false.');

equal(toNICE(0/0), '.NaN.');

equal(toNICE('abc'), 'abc');

equal(toNICE(42), '42');

equal(toNICE(3.14), '3.14');

equal(toNICE(function(x) {
  return 42;
}), '.Function.');

equal(toNICE((x) => {
  return 42;
}), '.Function.');

equal(toNICE(func1), '.Function func1.');

equal(toNICE(func2), '.Function func2.');

equal(toNICE(class {}), '.Class.');

equal(toNICE(NewClass = class NewClass {}), '.Class NewClass.');

equal(toNICE(xClass), '.Class.');

equal(toNICE(YClass), '.Class YClass.');

equal(toNICE(new String('abc')), 'abc');

equal(toNICE(new Number(42)), '42');

equal(toNICE(new Number(3.14)), '3.14');

equal(toNICE(new RegExp('^a*$')), '/^a*$/');

equal(toNICE(/^a*$/), '/^a*$/');

equal(toNICE(['a', 'b', undef, true]), `- a
- b
- .undef.
- .true.`);

equal(toNICE({
  a: 1,
  b: 2,
  c: undef,
  d: true
}), `a: 1
b: 2
c: .undef.
d: .true.`);

equal(toNICE(['a', ['b', 'c'], undef, true]), `- a
-
	- b
	- c
- .undef.
- .true.`);

equal(toNICE([
  'a',
  {
    a: 'a',
    b: 'b'
  },
  undef,
  true
]), `- a
-
	a: a
	b: b
- .undef.
- .true.`);

equal(toNICE({
  a: 1,
  b: ['c', 'd'],
  c: undef,
  d: true
}), `a: 1
b:
	- c
	- d
c: .undef.
d: .true.`);

equal(toNICE({
  a: 1,
  b: {
    c: 1,
    d: 2
  },
  c: undef,
  d: true
}), `a: 1
b:
	c: 1
	d: 2
c: .undef.
d: .true.`);

// --- Test sortKeys
h = {
  c: undef,
  a: 1,
  d: true,
  b: {
    c: 1,
    d: 2
  }
};

equal(toNICE(h, {
  sortKeys: true
}), `a: 1
b:
	c: 1
	d: 2
c: .undef.
d: .true.`);

// --- NOTE: sortKeys works for all hashes in the data structure
equal(toNICE(h, {
  sortKeys: ['d', 'c', 'b', 'a']
}), `d: .true.
c: .undef.
b:
	d: 2
	c: 1
a: 1`);

equal(toNICE(h, {
  sortKeys: ['d', 'c', 'a', 'b']
}), `d: .true.
c: .undef.
a: 1
b:
	d: 2
	c: 1`);

//# sourceMappingURL=to-nice.test.js.map
