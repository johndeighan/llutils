// svelte-utils.coffee
var checkCustomElemName;

import {
  compile
} from 'svelte/compiler';

import {
  undef,
  defined,
  notdefined,
  getOptions,
  assert,
  nonEmpty,
  OL,
  isString
} from '@jdeighan/llutils';

import {
  readTextFile,
  barf,
  fileExt,
  withExt,
  isFile
} from '@jdeighan/llutils/fs';

// ---------------------------------------------------------------------------
export var sveltify = (code, hMetaData = {}) => {
  var elem, hResult, str;
  hMetaData.filename = hMetaData.filePath;
  delete hMetaData.filePath;
  elem = hMetaData.customElement;
  if (isString(elem, 'nonempty')) {
    checkCustomElemName(elem);
    hMetaData.customElement = true;
    str = `<svelte:options customElement=${OL(elem)}/>`;
    code = str + "\n" + code;
  }
  hResult = compile(code, hMetaData);
  //	console.dir hResult
  hResult.code = hResult.js.code;
  return hResult;
};

// ---------------------------------------------------------------------------
export var sveltifyFile = (filePath, hOptions = {}) => {
  var contents, hMetaData, js;
  hOptions = getOptions(hOptions);
  assert(fileExt(filePath) === '.svelte', "Not a svelte file");
  ({hMetaData, contents} = readTextFile(filePath, 'eager'));
  Object.assign(hMetaData, hOptions);
  ({js} = sveltify(contents, hMetaData));
  return barf(js.code, withExt(filePath, '.js'));
};

// ---------------------------------------------------------------------------
checkCustomElemName = (name) => {
  assert(name.length > 0, `empty name: ${OL(name)}`);
  assert(name.indexOf('-') > 0, `Bad custom elem name: ${OL(name)}`);
  return true;
};

//# sourceMappingURL=svelte-utils.js.map
