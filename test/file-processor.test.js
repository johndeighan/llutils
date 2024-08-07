// file-processor.test.coffee
var hOptions, nCielo, nCoffee, nPeggy, nSvelte;

import {
  undef,
  isString,
  assert,
  OL
} from '@jdeighan/llutils';

import {
  deleteFilesMatching,
  slurp
} from '@jdeighan/llutils/fs';

import {
  indented
} from '@jdeighan/llutils/indent';

import {
  peggify
} from '@jdeighan/llutils/peggy';

import {
  TextBlockList
} from '@jdeighan/llutils/text-block';

import * as lib from '@jdeighan/llutils/file-processor';

Object.assign(global, lib);

import * as lib2 from '@jdeighan/llutils/utest';

Object.assign(global, lib2);

// ---------------------------------------------------------------------------
deleteFilesMatching("./test/file-processor/**/*.js");

deleteFilesMatching("./test/file-processor/**/*.map");

hOptions = {
  echo: false
};

nCoffee = procFiles("./test/file-processor/**/*.coffee", brew, '.js', hOptions);

equal(nCoffee, 3);

nPeggy = procFiles("./test/file-processor/**/*.peggy", peggify, '.js', hOptions);

equal(nPeggy, 1);

nCielo = procFiles("./test/file-processor/**/*.cielo", [cieloPreProcess, brew], '.js', hOptions);

equal(nCielo, 1);

nSvelte = procFiles("./test/file-processor/**/*.svelte", sveltify, '.js', hOptions);

equal(nCielo, 1);

// ---------------------------------------------------------------------------
//symbol "brew(code)"
succeeds(() => {
  return brew('v = 5');
});

fails(() => {
  return brew('let v = 5');
});

matches(brew('v = 5').code, `var v;

v = 5;`);

matches(brew('v = 5', {
  shebang: true
}).code, `#!/usr/bin/env node
var v;

v = 5;`);

matches(brew('v = 5', {
  shebang: 'abc'
}).code, `abc
var v;

v = 5;`);

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
  filePath = "test/file-processor/test.cielo";
  code = slurp(filePath);
  truthy(isString(code));
  blocks = new TextBlockList();
  blocks.addBlock(filePath, code);
  preprocCode = cieloPreProcess(code);
  blocks.addBlock('PreProcessed', preprocCode);
  js = brew(preprocCode).code;
  blocks.addBlock('JavaScript', js);
  return equal(blocks.asString('format=box'), `┌────  test/file-processor/test.cielo  ────┐
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
│                                          │
└──────────────────────────────────────────┘`);
})();

//# sourceMappingURL=file-processor.test.js.map
