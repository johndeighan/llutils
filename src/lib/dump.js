// dump.coffee
var hbar, ll, lr, ul, ur, vbar;

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
  Block,
  assert,
  croak,
  stripCR,
  toArray,
  toBlock,
  rpad
} from '@jdeighan/llutils';

import {
  toNICE
} from '@jdeighan/llutils/to-nice';

// ---------------------------------------------------------------------------
export var DUMP = (item, label = undef, hOptions = {}) => {
  var asArray, block, dynamic, echo, esc, format, j, k, len, len1, line, longStr, nocr, oneLine, ref, ref1, sortKeys, str, width;
  hOptions = getOptions(hOptions, {
    esc: false,
    width: 50,
    dynamic: true,
    oneLine: true,
    format: undef, // --- can be 'JSON', 'TAML', 'NICE'
    sortKeys: undef,
    echo: true,
    nocr: true,
    asArray: false
  });
  ({esc, width, dynamic, oneLine, format, sortKeys, echo, nocr, asArray} = hOptions);
  if (defined(label)) {
    label = label.replaceAll('_', ' ');
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
    if (longStr.length <= width) {
      if (echo) {
        console.log(longStr);
      }
      if (asArray) {
        return [longStr];
      } else {
        return longStr;
      }
    }
  }
  // --- Create a Block object
  block = new Block();
  if (defined(format)) {
    switch (format) {
      case 'JSON':
        block.add(JSON.stringify(item, undef, 3));
        break;
      case 'TAML':
        block.add(toTAML(item));
        break;
      case 'NICE':
        block.add(toNICE(item, {sortKeys}));
        break;
      default:
        croak(`Bad format: ${OL(format)}`);
    }
  } else {
    if (isString(item)) {
      if (esc) {
        ref = toArray(item);
        for (j = 0, len = ref.length; j < len; j++) {
          line = ref[j];
          block.add(escapeStr(line));
        }
      } else {
        ref1 = toArray(item);
        for (k = 0, len1 = ref1.length; k < len1; k++) {
          line = ref1[k];
          block.add(line);
        }
      }
    } else {
      block.add(toNICE(item));
    }
  }
  if (dynamic) {
    width = block.maxLen + 4;
  }
  if (defined(format)) {
    if (defined(label)) {
      block.prepend(centered(`${label} (as ${format})`, width, 'char=-'));
    } else {
      block.prepend(centered(`(as ${format})`, width, 'char=-'));
    }
  } else {
    if (defined(label)) {
      block.prepend(centered(label, width, 'char=-'));
    } else {
      block.prepend('-'.repeat(width));
    }
  }
  block.add('-'.repeat(width));
  if (asArray) {
    return block.lLines;
  } else {
    return block.getBlock();
  }
};

// ---------------------------------------------------------------------------
ul = '┌';

ur = '┐';

ll = '└';

lr = '┘';

vbar = '│';

hbar = '─';

// ---------------------------------------------------------------------------
export var BOX = (item, label = undef, hOptions = {}) => {
  debugger;
  var asArray, echo, i, j, lLines, lNewLines, len, line, numLines, width;
  hOptions = getOptions(hOptions, {
    echo: true,
    asArray: false,
    width: 50
  });
  ({echo, asArray, width} = hOptions);
  hOptions = Object.assign({}, hOptions, {
    echo: false,
    oneLine: false,
    asArray: true
  });
  lLines = DUMP(item, label, hOptions);
  numLines = lLines.length;
  lNewLines = (function() {
    var j, len, results;
    results = [];
    for (i = j = 0, len = lLines.length; j < len; i = ++j) {
      line = lLines[i];
      if (i === 0) {
        width = line.length;
        results.push(ul + line.substring(0, line.length - 2).replaceAll('-', hbar) + ur);
      } else if (i === numLines - 1) {
        results.push(ll + line.substring(0, line.length - 2).replaceAll('-', hbar) + lr);
      } else {
        results.push(`${vbar} ${rpad(line, width - 4)} ${vbar}`);
      }
    }
    return results;
  })();
  if (echo) {
    for (j = 0, len = lNewLines.length; j < len; j++) {
      line = lNewLines[j];
      console.log(line);
    }
  }
  if (asArray) {
    return lNewLines;
  } else {
    return toBlock(lNewLines);
  }
};

//# sourceMappingURL=dump.js.map
