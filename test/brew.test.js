// brew.test.coffee
var blocks, code, filePath, js, orgCode;

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

import * as lib from '@jdeighan/llutils/coffee';

Object.assign(global, lib);

import * as lib2 from '@jdeighan/llutils/utest';

Object.assign(global, lib2);

filePath = "test/brew/test.coffee";

// ---------------------------------------------------------------------------
code = slurp(filePath);

truthy(isString(code));

blocks = new TextBlockList();

blocks.addBlock(filePath, code);

({orgCode, js} = brew(code));

truthy(orgCode === code);

blocks.addBlock('JavaScript', js);

equal(blocks.asString('format=box'), `┌────────  test/brew/test.coffee  ─────────┐
│ import {undef} from '@jdeighan/llutils'  │
│                                          │
│ hAST = {                                 │
│    type: 'program'                       │
│    name: 'John'                          │
│    }                                     │
│                                          │
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
│   type: 'program',                       │
│   name: 'John'                           │
│ };                                       │
│                                          │
│ equal(extract(hAST, \`type="program"\`), { │
│   name: 'John'                           │
│ });                                      │
└──────────────────────────────────────────┘`);

//# sourceMappingURL=brew.test.js.map
