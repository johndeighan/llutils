// testFile.coffee
var filePath, h, stub;

import {
  OL,
  ML
} from '@jdeighan/llutils';

import {
  slurp
} from '@jdeighan/llutils/fs';

import {
  coffeeInfo
} from '@jdeighan/llutils/coffee';

stub = 'cielo';

filePath = `test/coffee/${stub}.coffee`;

h = coffeeInfo(slurp(filePath));

console.log(`lMissing = ${ML(h.lMissing)}`);

//# sourceMappingURL=testFile.js.map
