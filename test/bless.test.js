// brew.test.coffee
var blocks, code, filePath, js, orgCode, preprocCode;

import {
  undef,
  isString
} from '@jdeighan/llutils';

import {
  slurp
} from '@jdeighan/llutils/fs';

import {
  TextBlockList
} from '@jdeighan/llutils/text-block';

import * as lib from '@jdeighan/llutils/cielo';

Object.assign(global, lib);

import * as lib2 from '@jdeighan/llutils/utest';

Object.assign(global, lib2);

filePath = "test/bless/test.cielo";

// ---------------------------------------------------------------------------
code = slurp(filePath);

truthy(isString(code));

blocks = new TextBlockList();

blocks.addBlock(filePath, code);

({orgCode, preprocCode, js} = bless(code));

truthy(orgCode === code);

blocks.addBlock('PreProcessed', preprocCode);

blocks.addBlock('JavaScript', js);

equal(blocks.asString('format=box'), `┌────────  test/bless/test.cielo  ─────────┐
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

//# sourceMappingURL=bless.test.js.map
