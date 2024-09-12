  // low-level-build.config.coffee
import {
  undef,
  defined
} from '@jdeighan/llutils';

import {
  procCoffee
} from '@jdeighan/llutils/coffee';

import {
  procCielo
} from '@jdeighan/llutils/cielo';

import {
  procSvelte
} from '@jdeighan/llutils/svelte';

import {
  procPeggy
} from '@jdeighan/llutils/peggy';

// ---------------------------------------------------------------------------
// --- func must be:
//        (code, hMetaData, filePath)
//     returning code or
//        { code, lUses, sourceMap, hOtherFiles }
export var hLLBConfig = {
  'echo': true,
  '.coffee': {
    func: procCoffee,
    outExt: '.js'
  },
  '.cielo': {
    func: procCielo,
    outExt: '.js'
  },
  '.peggy': {
    func: procPeggy,
    outExt: '.js'
  },
  '.svelte': {
    func: procSvelte,
    outExt: '.js'
  }
};

//# sourceMappingURL=low-level-build.config.js.map
