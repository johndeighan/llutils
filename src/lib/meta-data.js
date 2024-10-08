// meta-data.coffee
var hMetaDataTypes;

import {
  undef,
  defined,
  notdefined,
  isString,
  untabify,
  assert,
  fromTAML
} from '@jdeighan/llutils';

hMetaDataTypes = {
  '---': (block) => {
    var hOptions;
    hOptions = {
      skipInvalid: true
    };
    return fromTAML(`---\n${block}`);
  }
};

// ---------------------------------------------------------------------------
export var addMetaDataType = (start, converter) => {
  assert(isString(start), `Not a string: ${typeof start}`);
  assert(start.length === 3, `Bad 'start' key: ${start}`);
  assert((start[1] === start[0]) && (start[2] === start[0]), `Bad 'start' key: ${start}`);
  assert(typeof converter === 'function', "Non-function converter");
  hMetaDataTypes[start] = converter;
};

// ---------------------------------------------------------------------------
export var isMetaDataStart = (str) => {
  return defined(hMetaDataTypes[str]);
};

// ---------------------------------------------------------------------------
// --- block does NOT contain the meta data start line
export var convertMetaData = (firstLine, block) => {
  var converter;
  assert(isMetaDataStart(firstLine), "Bad meta data");
  converter = hMetaDataTypes[firstLine];
  return converter(block);
};

//# sourceMappingURL=meta-data.js.map
