  // low-level-build.config.coffee
import {
  brew,
  cieloPreProcess,
  sveltify
} from '@jdeighan/llutils/file-processor';

import {
  peggify
} from '@jdeighan/llutils/peggy';

// ---------------------------------------------------------------------------
export var hLLBConfig = {
  'echo': true,
  '.coffee': {
    lFuncs: [brew],
    outExt: '.js'
  },
  '.cielo': {
    lFuncs: [cieloPreProcess, brew],
    outExt: '.js'
  },
  '.peggy': {
    lFuncs: [peggify],
    outExt: '.js'
  },
  '.svelte': {
    lFuncs: [sveltify],
    outExt: '.js'
  }
};

//# sourceMappingURL=low-level-build.config.js.map
