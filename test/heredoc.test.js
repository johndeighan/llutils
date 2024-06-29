// heredoc.test.coffee
var HereDocReplacer, HereDocTester, MatrixHereDoc, UCHereDoc, UCHereDoc2, replacer, tester;

import {
  undef,
  defined,
  notdefined,
  nonEmpty,
  isString,
  OL,
  CWS,
  behead,
  blockToArray,
  assert,
  croak
} from '@jdeighan/llutils';

import {
  undented
} from '@jdeighan/llutils/indent';

import * as lib from '@jdeighan/llutils/heredoc';

Object.assign(global, lib);

import * as lib2 from '@jdeighan/llutils/utest';

Object.assign(global, lib2);

// ---------------------------------------------------------------------------
//symbol "lineToParts(line)"
equal(lineToParts('this is not a heredoc'), ['this is not a heredoc']);

equal(lineToParts('this <<< is <<< heredoc'), ['this ', '<<<', ' is ', '<<<', ' heredoc']);

equal(lineToParts('<<< is <<< heredoc'), ['', '<<<', ' is ', '<<<', ' heredoc']);

equal(lineToParts('this <<< is <<<'), ['this ', '<<<', ' is ', '<<<', '']);

equal(lineToParts('<<< is <<<'), ['', '<<<', ' is ', '<<<', '']);

equal(lineToParts('<<<'), ['', '<<<', '']);

equal(lineToParts('<<<<<<'), ['', '<<<', '', '<<<', '']);

// ---------------------------------------------------------------------------
//symbol "mapHereDoc()"
equal(mapHereDoc(`abc
def`), '"abc\\ndef"');

// ---------------------------------------------------------------------------
equal(mapHereDoc(`===
abc
def`), '"abc\\ndef"');

// ---------------------------------------------------------------------------
equal(mapHereDoc(`...
abc
def`), '"abc def"');

// ---------------------------------------------------------------------------
equal(mapHereDoc(`---
a: 1
b: 2`), '{"a":1,"b":2}');

// ---------------------------------------------------------------------------
equal(mapHereDoc(`---
- a
- b`), '["a","b"]');

// ---------------------------------------------------------------------------
//symbol "HereDocTester - a custom tester"
HereDocTester = class HereDocTester extends UnitTester {
  transformValue(block) {
    return mapHereDoc(block);
  }

};

tester = new HereDocTester();

// ------------------------------------------------------------------------
// Default heredoc type is a block
tester.equal(`this is a
block of text`, '"this is a\\nblock of text"');

// ------------------------------------------------------------------------
// Make explicit that the heredoc type is a block
tester.equal(`===
this is a
block of text`, '"this is a\\nblock of text"');

// ------------------------------------------------------------------------
// One Line block
tester.equal(`...this is a
line of text`, '"this is a line of text"');

// ------------------------------------------------------------------------
// One Line block
tester.equal(`...
this is a
line of text`, '"this is a line of text"');

// ---------------------------------------------------------------------------
//symbol "MatrixHereDoc - custom heredoc"
MatrixHereDoc = class MatrixHereDoc extends BaseHereDoc {
  map(block) {
    var lArray, line;
    // --- if block starts with a digit
    if (notdefined(block.match(/^\s*\d/s))) {
      return undef;
    }
    lArray = (function() {
      var i, len, ref, results;
      ref = blockToArray(block);
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        line = ref[i];
        results.push(line.split(/\s+/).map((str) => {
          return parseInt(str);
        }));
      }
      return results;
    }).call(this);
    return JSON.stringify(lArray);
  }

};

addHereDocType('matrix', new MatrixHereDoc());

tester.equal(`1 2 3
2 4 6`, '[[1,2,3],[2,4,6]]');

// ------------------------------------------------------------------------
//symbol "UCHereDoc = custom heredoc"
UCHereDoc = class UCHereDoc extends BaseHereDoc {
  map(block) {
    if (block.indexOf('^^^') !== 0) {
      return undef;
    }
    block = block.substring(4).toUpperCase();
    return JSON.stringify(block);
  }

};

addHereDocType('upper case', new UCHereDoc());

tester.equal(`^^^
This is a
block of text`, '"THIS IS A\\nBLOCK OF TEXT"');

// ---------------------------------------------------------------------------
//symbol "UCHereDoc1 - custom heredoc"

//     e.g. with header line ***,
//     we'll create an upper-cased single line string
UCHereDoc2 = class UCHereDoc2 extends BaseHereDoc {
  map(block) {
    var head, rest, result;
    [head, rest] = behead(block);
    if (head !== '***') {
      return undef;
    }
    block = CWS(rest.toUpperCase());
    result = JSON.stringify(block);
    return result;
  }

};

addHereDocType('upper case 2', new UCHereDoc2());

// ---------------------------------------------------------------------------
tester.equal(`***
select ID,Name
from Users`, '"SELECT ID,NAME FROM USERS"');

// ---------------------------------------------------------------------------
//symbol "TAML heredoc"
tester.equal(`---
- abc
- def`, '["abc","def"]');

// ---------------------------------------------------------------------------
// TAML-like block, but actually a block
tester.equal(`===
---
- abc
- def`, '"---\\n- abc\\n- def"');

// ---------------------------------------------------------------------------
// TAML block 2
tester.equal(`---
-
	label: Help
	url: /help
-
	label: Books
	url: /books`, '[{"label":"Help","url":"/help"},{"label":"Books","url":"/books"}]');

// ---------------------------------------------------------------------------
//symbol "HereDocReplacer - custom tester"
HereDocReplacer = class HereDocReplacer extends UnitTester {
  transformValue(block) {
    var head, lNewParts, part, rest, result;
    [head, rest] = behead(block);
    lNewParts = (function() {
      var i, len, ref, results;
      ref = lineToParts(head);
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        part = ref[i];
        if (part === '<<<') {
          results.push(mapHereDoc(undented(rest)));
        } else {
          results.push(part); // keep as is
        }
      }
      return results;
    })();
    result = lNewParts.join('');
    return result;
  }

};

replacer = new HereDocReplacer();

// ---------------------------------------------------------------------------
replacer.equal(`TopMenu lItems={<<<}
	---
	-
		label: Help
		url: /help
	-
		label: Books
		url: /books`, `TopMenu lItems={[{"label":"Help","url":"/help"},{"label":"Books","url":"/books"}]}`);

// ---------------------------------------------------------------------------
replacer.equal(`<TopMenu lItems={<<<}>
	---
	-
		label: Help
		url: /help
	-
		label: Books
		url: /books`, `<TopMenu lItems={[{"label":"Help","url":"/help"},{"label":"Books","url":"/books"}]}>`);

//# sourceMappingURL=heredoc.test.js.map
