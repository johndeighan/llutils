// civet.test.coffee
import * as lib from '@jdeighan/llutils/civet';

Object.assign(global, lib);

import * as lib2 from '@jdeighan/llutils/utest';

Object.assign(global, lib2);

// ---------------------------------------------------------------------------
//symbol "execCivet(str)"    # --- execute civet code
equal((await execCivet('x = 42')), 42);

equal((await execCivet('x = "Hello World"')), "Hello World");

fails(async() => {
  return (await execCivet("not real JS code +"));
});

// ---------------------------------------------------------------------------
(() => {
  var u;
  u = new UnitTester();
  u.transformValue = async function(str) {
    var result;
    result = (await execCivet(str));
    return result;
  };
  return u.equal(`x = 42
2 * x`, 84);
})();

//# sourceMappingURL=civet.test.js.map
