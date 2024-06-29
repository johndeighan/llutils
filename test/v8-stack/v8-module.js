// v8-module.coffee
var secondFunc, thirdFunc;

import * as lib from '@jdeighan/llutils/v8-stack';

Object.assign(global, lib);

// ---------------------------------------------------------------------------
export var getBoth = function() {
  return secondFunc('both');
};

// ---------------------------------------------------------------------------
export var getDirect = function() {
  return secondFunc('direct');
};

// ---------------------------------------------------------------------------
export var getOutside = function() {
  return secondFunc('outside');
};

// ---------------------------------------------------------------------------
secondFunc = function(type) {
  return thirdFunc(type);
};

// ---------------------------------------------------------------------------
thirdFunc = function(type) {
  // --- direct caller should be 'secondFunc'
  //     outside caller should be the function that called getCaller()
  switch (type) {
    case 'both':
      return [getMyDirectCaller(), getMyOutsideCaller()];
    case 'direct':
      return getMyDirectCaller();
    case 'outside':
      return getMyOutsideCaller();
    default:
      return croak(`Unknown type: ${type}`);
  }
};

//# sourceMappingURL=v8-module.js.map
