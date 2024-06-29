  // indent.test.coffee
import {
  undef,
  spaces,
  tabs
} from '@jdeighan/llutils';

import * as lib from '@jdeighan/llutils/indent';

Object.assign(global, lib);

import * as lib2 from '@jdeighan/llutils/utest';

Object.assign(global, lib2);

// ---------------------------------------------------------------------------
//symbol "indentLevel(str)"
(() => {
  equal(indentLevel('abc'), 0);
  equal(indentLevel('\tabc'), 1);
  equal(indentLevel('\t\tabc'), 2);
  fails(() => {
    return indentLevel('\t abc');
  });
  equal(indentLevel('abc'), 0);
  equal(indentLevel('\tabc'), 1);
  equal(indentLevel('\t\tabc'), 2);
  return resetOneIndent();
})();

(() => {
  equal(indentLevel('      abc'), 1);
  return resetOneIndent();
})();

(() => {
  equal(indentLevel('abc'), 0);
  equal(indentLevel('   abc'), 1);
  equal(indentLevel('      abc'), 2);
  return resetOneIndent();
})();

// ---------------------------------------------------------------------------
//symbol "splitLine(line, oneIndent)"
(() => {
  equal(splitLine('abc'), [0, 'abc']);
  equal(splitLine('\t\tabc'), [2, 'abc']);
  return resetOneIndent();
})();

(() => {
  equal(splitLine('   abc'), [1, 'abc']);
  fails(() => {
    return splitLine('\t\tabc');
  });
  return resetOneIndent();
})();

// ---------------------------------------------------------------------------
//symbol "indented(input, level, oneIndent)"
(() => {
  equal(indented('abc'), '\tabc');
  equal(indented('abc', 2), '\t\tabc');
  return resetOneIndent();
})();

(() => {
  equal(indentLevel('   abc'), 1);
  equal(indented('abc', 2), spaces(6) + 'abc');
  return resetOneIndent();
})();

(() => {
  equal(indented('abc', 2), tabs(2) + 'abc');
  return resetOneIndent();
})();

// --- Test with blocks
equal(indented(`first line
\tsecond line
\t\tthird line`), `\tfirst line
\t\tsecond line
\t\t\tthird line`);

equal(indented(`first line
\tsecond line
\t\tthird line`, 2), `\t\tfirst line
\t\t\tsecond line
\t\t\t\tthird line`);

// --- Test with arrays
equal(indented(['first line', '\tsecond line', '\t\tthird line']), ['\tfirst line', '\t\tsecond line', '\t\t\tthird line']);

equal(indented(['first line', '\tsecond line', '\t\tthird line'], 2), ['\t\tfirst line', '\t\t\tsecond line', '\t\t\t\tthird line']);

// ---------------------------------------------------------------------------
//symbol "undented(input)"
equal(undented(`\t\tabc
\t\t\tdef
\t\t\t\tghi`), `abc
\tdef
\t\tghi`);

//# sourceMappingURL=indent.test.js.map
