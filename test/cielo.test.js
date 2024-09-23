  // cielo.test.coffee
import {
  undef,
  defined,
  isString,
  OL,
  assert,
  croak
} from '@jdeighan/llutils';

import {
  slurp
} from '@jdeighan/llutils/fs';

import {
  TextBlockList
} from '@jdeighan/llutils/text-block';

import {
  procCoffee
} from '@jdeighan/llutils/coffee';

import * as lib from '@jdeighan/llutils/cielo';

Object.assign(global, lib);

import * as lib2 from '@jdeighan/llutils/utest';

Object.assign(global, lib2);

// ---------------------------------------------------------------------------
//    - Handles HEREDOC syntax
//    - ends file upon seeing '__END__'
// ---------------------------------------------------------------------------
//symbol "cieloPreProcess(code)"
(() => {
  var blocks, bsl, code, filePath, js, preprocCode, t;
  t = new UnitTester();
  t.transformValue = (str) => {
    assert(isString(str), `Not a string: ${OL(str)}`);
    return cieloPreProcess(str);
  };
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
  // ---------------------------------------------------------------------------
  filePath = "test/cielo/test.cielo";
  code = slurp(filePath);
  truthy(isString(code));
  blocks = new TextBlockList();
  blocks.addBlock(filePath, code);
  preprocCode = cieloPreProcess(code);
  blocks.addBlock('PreProcessed', preprocCode);
  js = procCoffee(preprocCode).code;
  blocks.addBlock('JavaScript', js);
  return equal(blocks.asString('format=box'), `┌────────  test/cielo/test.cielo  ─────────┐
│ import {undef} from '@jdeighan/llutils'  │
│                                          │
│ hAST = <<<                               │
│    ---                                   │
│    type: program                         │
│    name: John                            │
│                                          │
│ equal extract(hAST, """                  │
│    type="program"                        │
│    """), {name: 'John'}                  │
│                                          │
│ __END__                                  │
│                                          │
│ any old garbage can be here              │
│                                          │
├─────────────  PreProcessed  ─────────────┤
│ import {undef} from '@jdeighan/llutils'  │
│                                          │
│ hAST = {"type":"program","name":"John"}  │
│ equal extract(hAST, """                  │
│    type="program"                        │
│    """), {name: 'John'}                  │
│                                          │
├──────────────  JavaScript  ──────────────┤
│ var hAST;                                │
│                                          │
│ import {                                 │
│   undef                                  │
│ } from '@jdeighan/llutils';              │
│                                          │
│ hAST = {                                 │
│   "type": "program",                     │
│   "name": "John"                         │
│ };                                       │
│                                          │
│ equal(extract(hAST, \`type="program"\`), { │
│   name: 'John'                           │
│ });                                      │
└──────────────────────────────────────────┘`);
})();

//# sourceMappingURL=cielo.test.js.map
