  // indent.coffee
import {
  undef,
  defined,
  notdefined,
  pass,
  rtrim,
  OL,
  blockToArray,
  arrayToBlock,
  assert,
  croak,
  countChars,
  isString,
  isArray,
  isHash,
  isInteger
} from '@jdeighan/llutils';

export var oneIndent = undef;

// ---------------------------------------------------------------------------
export var resetOneIndent = (val = undef) => {
  if (defined(val)) {
    assert((val === '\t') || val.match(/^ +$/), "Bad oneIndent");
    oneIndent = val;
  } else {
    oneIndent = undef;
  }
};

// ---------------------------------------------------------------------------
//   indentLevel - determine indent level of a string
//                 it's OK if the string is ONLY indentation
export var indentLevel = (line) => {
  var level, numSpaces, numTABs, prefix;
  assert(isString(line), `not a string: ${OL(line)}`);
  // --- This will always match, and it's greedy
  [prefix] = line.match(/^\s*/);
  if (prefix.length === 0) {
    return 0;
  }
  // --- Check if we're using TABs or spaces
  numTABs = countChars(prefix, "\t");
  numSpaces = countChars(prefix, " ");
  if ((numTABs > 0) && (numSpaces > 0)) {
    croak("Invalid mix of TABs and spaces");
  }
  // --- oneIndent must be one of:
  //        undef
  //        a single TAB character
  //        some number of space characters

      // --- Set variables oneIndent & level
  switch (oneIndent) {
    case undef:
      if (numTABs > 0) {
        level = numTABs;
        oneIndent = "\t";
      } else {
        level = 1;
        oneIndent = ' '.repeat(numSpaces);
      }
      break;
    case "\t":
      assert(numSpaces === 0, "Expecting TABs, found spaces");
      level = numTABs;
      break;
    default:
      // --- using some number of spaces
      assert(numTABs === 0, "Expecting spaces, found TABs");
      assert(numSpaces % oneIndent.length === 0, "Invalid num spaces");
      level = numSpaces / oneIndent.length;
  }
  return level;
};

// ---------------------------------------------------------------------------
//   splitLine - separate a line into [level, line]
export var splitLine = (line) => {
  var _, prefix, str;
  [_, prefix, str] = line.match(/^(\s*)(.*)$/);
  return [indentLevel(prefix), str.trim()];
};

// ---------------------------------------------------------------------------
//   indented - add indentation to each string in a block or array
//            - returns the same type as input, i.e. array or string
export var indented = (input, level = 1) => {
  var lLines, lNewLines, line, toAdd;
  assert(isInteger(level, {
    min: 0
  }), `Invalid level: ${OL(level)}`);
  if (level === 0) {
    return input;
  }
  if (notdefined(oneIndent)) {
    oneIndent = "\t";
  }
  toAdd = oneIndent.repeat(level);
  // --- input must be either a string or array of strings
  if (isArray(input)) {
    lLines = input;
  } else if (isString(input)) {
    lLines = blockToArray(input);
  } else {
    croak(`invalid input: ${OL(input)}`);
  }
  // --- NOTE: don't add indentation to empty lines
  lNewLines = [];
  lNewLines = (function() {
    var i, len, results;
    results = [];
    for (i = 0, len = lLines.length; i < len; i++) {
      line = lLines[i];
      line = rtrim(line);
      if (line === '') {
        results.push('');
      } else {
        results.push(`${toAdd}${line}`);
      }
    }
    return results;
  })();
  if (isArray(input)) {
    return lNewLines;
  } else {
    return arrayToBlock(lNewLines);
  }
};

// ---------------------------------------------------------------------------
//   undented - string with 1st line indentation removed for each line
//            - returns same type as input, i.e. either string or array
export var undented = (input) => {
  var _, lLines, lNewLines, line, nToRemove, prefix, rest, toRemove;
  // --- input must be either a string or array of strings
  if (isString(input)) {
    lLines = blockToArray(input);
  } else if (isArray(input)) {
    lLines = input;
  } else {
    croak(`invalid input: ${OL(input)}`);
  }
  // --- NOTE: leave empty lines empty
  toRemove = undef;
  nToRemove = undef;
  lNewLines = (function() {
    var i, len, results;
    results = [];
    for (i = 0, len = lLines.length; i < len; i++) {
      line = lLines[i];
      line = rtrim(line);
      if (line === '') {
        results.push('');
      } else if (notdefined(toRemove)) {
        [_, prefix, rest] = line.match(/^(\s*)(.*)$/);
        if (prefix.length === 0) {
          results.push(line);
        } else {
          toRemove = prefix;
          nToRemove = prefix.length;
          results.push(rest);
        }
      } else {
        assert(line.indexOf(toRemove) === 0, `can't remove ${OL(toRemove)} from ${OL(line)}`);
        results.push(line.substr(nToRemove));
      }
    }
    return results;
  })();
  if (isString(input)) {
    return arrayToBlock(lNewLines);
  } else {
    return lNewLines;
  }
};

//# sourceMappingURL=indent.js.map
