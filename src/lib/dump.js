  // dump.coffee
import {
  undef,
  defined,
  notdefined,
  getOptions,
  OL,
  log,
  centered,
  toTAML,
  isString,
  isEmpty,
  escapeBlock,
  assert,
  croak,
  stripCR,
  toArray,
  toBlock,
  rpad
} from '@jdeighan/llutils';

import {
  TextBlock,
  TextBlockList
} from '@jdeighan/llutils/text-block';

import {
  toNICE
} from '@jdeighan/llutils/to-nice';

export var defValue = '.undef.';

export var setDefValue = (str) => {
  defValue = str;
};

export var defLabel = 'VALUE';

export var setDefLabel = (str) => {
  defLabel = str;
};

export var minWidth = undef;

export var setMinWidth = (w) => {
  return minWidth = w;
};

// ---------------------------------------------------------------------------
export var DUMP = (item, label = undef, hOptions = {}) => {
  var asArray, blocks, box, debug, echo, esc, format, hOpt, longStr, maxWidth, nocr, oneLine, sortKeys, str;
  if (isString(item) && isEmpty(item)) {
    item = defValue;
  }
  if (defined(label)) {
    assert(isString(label), `not a string: ${OL(label)}`);
    label = label.replaceAll('_', ' ');
  } else {
    label = defLabel;
  }
  hOptions = getOptions(hOptions, {
    esc: false,
    oneLine: true,
    minWidth: 40,
    maxWidth: 78,
    box: false,
    format: 'NICE', // --- can be 'JSON', 'TAML', 'NICE'
    sortKeys: true,
    echo: true,
    nocr: true,
    asArray: false,
    debug: false
  });
  ({esc, oneLine, minWidth, maxWidth, box, format, sortKeys, echo, nocr, asArray, debug} = hOptions);
  if (debug) {
    console.dir({esc, oneLine, minWidth, maxWidth, box, format, sortKeys, echo, nocr, asArray, debug});
  }
  if (oneLine) {
    if (nocr && isString(item)) {
      item = stripCR(item);
    }
    str = OL(item, {esc});
    if (defined(label)) {
      longStr = `${label} = ${str}`;
    } else {
      longStr = str;
    }
    if (longStr.length <= maxWidth) {
      if (echo) {
        console.log(longStr);
      }
      if (asArray) {
        return [longStr];
      } else {
        return longStr;
      }
    } else if (debug) {
      console.log("Doesn't fit on one line");
    }
  }
  switch (format) {
    case 'JSON':
      item = JSONstringify(item, undef, 3);
      break;
    case 'TAML':
      item = toTAML(item);
      break;
    case 'NICE':
      item = toNICE(item, {sortKeys});
  }
  if (!isString(item)) {
    item = toNICE(item, {sortKeys});
  }
  // --- Create a TextBlockList object
  blocks = new TextBlockList({esc});
  blocks.addBlock(label, item);
  hOpt = {minWidth};
  if (box) {
    hOpt.format = 'box';
  }
  if (echo) {
    console.log(blocks.asString(hOpt));
  }
  if (asArray) {
    return blocks.asArray(hOpt);
  } else {
    return blocks.asString(hOpt);
  }
};

// ---------------------------------------------------------------------------
export var BOX = (item, label = undef, hOptions = {}) => {
  hOptions = getOptions(hOptions, {
    box: true,
    oneLine: false // never oneLine when boxing
  });
  return DUMP(item, label, hOptions);
};

//# sourceMappingURL=dump.js.map
