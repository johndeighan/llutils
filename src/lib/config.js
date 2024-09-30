  // config.coffee
import {
  undef,
  defined
} from '@jdeighan/llutils';

import {
  isFile,
  slurp
} from '@jdeighan/llutils/fs';

import {
  procCoffee
} from '@jdeighan/llutils/llcoffee';

import {
  procCielo
} from '@jdeighan/llutils/cielo';

import {
  procSvelte
} from '@jdeighan/llutils/svelte';

import {
  procPeggy
} from '@jdeighan/llutils/peggy';

import {
  procNearleyFile
} from '@jdeighan/llutils/nearley';

import {
  procDot
} from '@jdeighan/llutils/lldot';

// ---------------------------------------------------------------------------
// --- strFunc must be:
//        (code, hMetaData, filePath, hOptions)
//     fileFunc must be:
//        (filePath, hOptions)
//     returning
//        { code, lUses, sourceMap?, hOtherFiles? }
export var hConfig = {
  'echo': true,
  '.coffee': {
    strFunc: procCoffee,
    outExt: '.js'
  },
  '.cielo': {
    strFunc: procCielo,
    outExt: '.js'
  },
  '.peggy': {
    strFunc: procPeggy,
    outExt: '.js'
  },
  '.ne   ': {
    fileFunc: procNearleyFile,
    outExt: '.js'
  },
  '.svelte': {
    strFunc: procSvelte,
    outExt: '.js'
  },
  '.dot': {
    strFunc: procDot,
    outExt: '.png'
  }
};

// ---------------------------------------------------------------------------
export var getConfig = () => {
  var filePath;
  filePath = './low-level-config.json';
  if (isFile(filePath)) {
    return JSON.parse(slurp(filePath));
  } else {
    return hConfig;
  }
};

//# sourceMappingURL=config.js.map
