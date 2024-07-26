// testCode.coffee
var code, h;

import {
  OL
} from '@jdeighan/llutils';

import {
  coffeeInfo
} from '@jdeighan/llutils/coffee';

code = `func = () =>
	f(x,y)`;

h = coffeeInfo(code, 'debug');

console.log(`lMissing = ${OL(h.lMissing)}`);

//# sourceMappingURL=testCode.js.map
