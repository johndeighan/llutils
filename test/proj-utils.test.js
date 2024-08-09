  // proj-utils.test.coffee
import {
  undef
} from '@jdeighan/llutils';

import * as lib from '@jdeighan/llutils/proj-utils';

Object.assign(global, lib);

import * as lib2 from '@jdeighan/llutils/utest';

Object.assign(global, lib2);

// ---------------------------------------------------------------------------
succeeds(() => {
  return checkIfInstalled('node');
});

succeeds(() => {
  return checkIfInstalled('npm');
});

setProjType('parcel');

truthy(isOfType('parcel'));

truthy(isOfType('website'));

//# sourceMappingURL=proj-utils.test.js.map
