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

// --- clear value of oneIndent before each test
u.afterEachTest = function() {
  resetOneIndent();
};

// ---------------------------------------------------------------------------
//symbol indentLevel(str)
equal(indentLevel('abc'), 0);

equal(indentLevel('\tabc'), 1);

equal(indentLevel('\t\tabc'), 2);

equal(indentLevel('      abc'), 1);

fails(() => {
  return indentLevel('\t abc');
});

equal(indentLevel('abc'), 0);

equal(indentLevel('\tabc'), 1);

equal(indentLevel('\t\tabc'), 2);

// --- we don't want resetOneIndent() called
//     for the subtests, just for succeeds
succeeds(() => {
  equal(indentLevel('abc'), 0);
  equal(indentLevel('   abc'), 1);
  return equal(indentLevel('      abc'), 2);
});

// ---------------------------------------------------------------------------
//symbol splitLine(line, oneIndent)
equal(splitLine('abc'), [0, 'abc']);

equal(splitLine('\t\tabc'), [2, 'abc']);

// --- we don't want resetOneIndent() called
//     for the subtests, just for succeeds
succeeds(() => {
  equal(splitLine('   abc'), [1, 'abc']);
  return fails(() => {
    return splitLine('\t\tabc');
  });
});

// ---------------------------------------------------------------------------
//symbol indented(input, level, oneIndent)
equal(indented('abc'), '\tabc');

equal(indented('abc', 2), '\t\tabc');

succeeds(() => {
  equal(indentLevel('   abc'), 1);
  return equal(indented('abc', 2), spaces(6) + 'abc');
});

equal(indented('abc', 2), tabs(2) + 'abc');

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
//symbol undented(input)
equal(undented(`\t\tabc
\t\t\tdef
\t\t\t\tghi`), `abc
\tdef
\t\tghi`);

//# sourceMappingURL=indent.test.js.map
