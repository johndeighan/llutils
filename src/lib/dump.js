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
  escapeBlock,
  toBlock,
  assert,
  croak
} from '@jdeighan/llutils';

import {
  toNICE
} from '@jdeighan/llutils/to-nice';

// ---------------------------------------------------------------------------
export var DUMP = (item, label = 'RESULT', hOptions = undef) => {
  var echo, esc, format, lLines, oneLine, output, sortKeys, str, width;
  ({esc, width, oneLine, format, sortKeys, echo} = getOptions(hOptions, {
    esc: false,
    width: 50,
    oneLine: true,
    format: undef, // --- can be 'JSON', 'TAML', 'NICE'
    sortKeys: undef,
    echo: true
  }));
  label = label.replace('_', ' ');
  // --- define an output() function
  lLines = [];
  output = (str) => {
    lLines.push(str);
    if (echo) {
      return log(str);
    }
  };
  if (oneLine) {
    str = OL(item, {esc});
    if (str.length <= width) {
      output(`${label} = ${str}`);
      return toBlock(lLines);
    }
  }
  if (defined(format)) {
    output(centered(`${label} (as ${format})`, width, 'char=-'));
  } else {
    output(centered(label, width, 'char=-'));
  }
  if (defined(format)) {
    switch (format) {
      case 'JSON':
        output(JSON.stringify(item, undef, 3));
        break;
      case 'TAML':
        output(toTAML(item));
        break;
      case 'NICE':
        output(toNICE(item, sortKeys));
        break;
      default:
        croak(`Bad format: ${OL(format)}`);
    }
  } else if (isString(item)) {
    if (esc) {
      output(escapeBlock(item));
    } else {
      output(item);
    }
  } else {
    output(toNICE(item));
  }
  output('-'.repeat(width));
  return toBlock(lLines);
};

//# sourceMappingURL=dump.js.map
