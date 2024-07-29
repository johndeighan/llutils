// cielo.test.coffee
var bsl, t;

import {
  undef,
  assert,
  OL,
  isString
} from '@jdeighan/llutils';

import * as lib from '@jdeighan/llutils/cielo';

Object.assign(global, lib);

import * as lib2 from '@jdeighan/llutils/utest';

Object.assign(global, lib2);

t = new UnitTester();

t.transformValue = (str) => {
  assert(isString(str), `Not a string: ${OL(str)}`);
  return cieloPreProcess(str);
};

// ---------------------------------------------------------------------------
//    - Handles HEREDOC syntax
//    - ends file upon seeing '__END__'
// ---------------------------------------------------------------------------
//symbol "cieloPreProcess(code)"
bsl = "\\";

t.equal(`import {undef} from '@jdeighan/llutils'

equal fromTAML(<<<), <<<
	a: 1
	b: 2

	---
	a: 1
	b: 2

console.log 'DONE'`, `import {undef} from '@jdeighan/llutils'

equal fromTAML("a: 1${bsl}nb: 2"), {"a":1,"b":2}
console.log 'DONE'`);

t.equal(`import {undef} from '@jdeighan/llutils'

equal fromTAML(<<<), <<<
	a: 1
	b: 2

	---
	a: 1
	b: 2

__END__
console.log 'DONE'`, `import {undef} from '@jdeighan/llutils'

equal fromTAML("a: 1${bsl}nb: 2"), {"a":1,"b":2}`);

//# sourceMappingURL=cielo.test.js.map
