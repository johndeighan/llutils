  // indent.spaces.test.coffee
import {
  undef,
  spaces,
  tabs
} from '@jdeighan/llutils';

import * as lib from '@jdeighan/llutils/indent';

Object.assign(global, lib);

import * as lib2 from '@jdeighan/llutils/utest';

Object.assign(global, lib2);

// USE 3 SPACES

  // ---------------------------------------------------------------------------
//symbol "indentLevel(str)"
(() => {
  equal(indentLevel('abc'), 0);
  equal(indentLevel('   abc'), 1);
  equal(indentLevel('      abc'), 2);
  fails(() => {
    return indentLevel('\t abc');
  });
  fails(() => {
    return indentLevel(' \tabc');
  });
  return equal(indentLevel('abc'), 0);
})();

(() => {
  equal(indentLevel('abc'), 0);
  equal(indentLevel('   abc'), 1);
  return equal(indentLevel('      abc'), 2);
})();

// ---------------------------------------------------------------------------
//symbol "splitLine(line, oneIndent)"
(() => {
  equal(splitLine('abc'), [0, 'abc']);
  return equal(splitLine('      abc'), [2, 'abc']);
})();

(() => {
  equal(splitLine('   abc'), [1, 'abc']);
  // --- fails since we're now expecting spaces
  return fails(() => {
    return splitLine('\t\tabc');
  });
})();

// ---------------------------------------------------------------------------
//symbol "indented(input, level, oneIndent)"
(() => {
  equal(indented('abc'), '   abc');
  return equal(indented('abc', 2), '      abc');
})();

(() => {
  equal(indentLevel('   abc'), 1);
  return equal(indented('abc', 2), spaces(6) + 'abc');
})();

// --- Test with blocks
(() => {
  equal(indented(`first line
   second line
      third line`), `${spaces(3)}first line
      second line
         third line`);
  equal(indented(`first line
   second line
      third line`, 2), `${spaces(6)}first line
         second line
            third line`);
  // --- Test with arrays
  equal(indented(['first line', '   second line', '      third line']), ['   first line', '      second line', '         third line']);
  return equal(indented(['first line', '   second line', '      third line'], 2), ['      first line', '         second line', '            third line']);
})();

// ---------------------------------------------------------------------------
//symbol "undented(input)"
(() => {
  return equal(undented(`${spaces(6)}abc
         def
            ghi`), `abc
   def
      ghi`);
})();

//# sourceMappingURL=indent-spaces.test.js.map
