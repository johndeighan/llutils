  // create-elem.coffee
import {
  compile
} from 'svelte/compiler';

import {
  undef,
  defined,
  notdefined,
  getOptions,
  assert
} from '@jdeighan/llutils';

import {
  readTextFile,
  barf,
  fileExt,
  withExt,
  isFile
} from '@jdeighan/llutils/fs';

// ---------------------------------------------------------------------------
export var createElem = (contents, hOptions = {}) => {
  hOptions.customElement = true;
  return compile(contents, hOptions);
};

// ---------------------------------------------------------------------------
export var createElemFile = (filePath, hOptions = {}) => {
  var contents, hMetaData, js;
  hOptions = getOptions(hOptions);
  assert(fileExt(filePath) === '.svelte', "Not a svelte file");
  ({hMetaData, contents} = readTextFile(filePath, 'eager'));
  hMetaData.filename = hMetaData.filePath;
  delete hMetaData.filePath;
  Object.assign(hMetaData, hOptions);
  ({js} = createElem(contents, hMetaData));
  return barf(js.code, withExt(filePath, '.js'));
};

//# sourceMappingURL=create-elem.js.map
