// metadata.test.coffee
var block;

import * as lib from '@jdeighan/llutils/metadata';

Object.assign(global, lib);

import * as lib2 from '@jdeighan/llutils/utest';

Object.assign(global, lib2);

// ---------------------------------------------------------------------------
symbol("isMetaDataStart(str)");

truthy(isMetaDataStart('---'));

falsy(isMetaDataStart('==='));

falsy(isMetaDataStart(''));

// ---------------------------------------------------------------------------
block = `fileName: primitive-value
type: coffee
author: John Deighan
include: pll-parser`;

equal(convertMetaData('---', block), {
  fileName: 'primitive-value',
  type: 'coffee',
  author: 'John Deighan',
  include: 'pll-parser'
});

//# sourceMappingURL=metadata.test.js.map
