  // svelte.coffee
import {
  compile as compileSvelte
} from 'svelte/compiler';

import {
  undef,
  defined,
  notdefined,
  OL,
  isString,
  isFunction,
  isArray,
  isHash,
  assert,
  croak,
  keys,
  hasKey,
  nonEmpty,
  gen2block
} from '@jdeighan/llutils';

import {
  isFile,
  readTextFile
} from '@jdeighan/llutils/fs';

// ---------------------------------------------------------------------------
export var procSvelte = (code, hMetaData = {}, filePath = undef) => {
  var customElement, hResult, hSvelteOptions, str;
  hSvelteOptions = {
    filename: filePath
  };
  ({customElement} = hMetaData);
  if (isString(customElement, 'nonempty')) {
    checkCustomElemName(customElement);
    hSvelteOptions.customElement = true;
    str = `<svelte:options customElement=${OL(customElement)}/>`;
    code = str + "\n" + code;
  }
  hResult = compileSvelte(code, hSvelteOptions);
  return {
    code: hResult.js.code,
    sourceMap: undef,
    lUses: [],
    hOtherFiles: {}
  };
};

// ---------------------------------------------------------------------------
export var procSvelteFile = function(filePath, hOptions = {}) {
  var contents, hMetaData;
  assert(isFile(filePath), `No such file: ${OL(filePath)}`);
  ({hMetaData, contents} = readTextFile(filePath, 'eager'));
  return procSvelte(contents, hMetaData, filePath, hOptions);
};

// ---------------------------------------------------------------------------
export var checkCustomElemName = (name) => {
  assert(name.length > 0, `empty name: ${OL(name)}`);
  assert(name.indexOf('-') > 0, `Bad custom elem name: ${OL(name)}`);
  return true;
};

// ---------------------------------------------------------------------------

//# sourceMappingURL=svelte.js.map
