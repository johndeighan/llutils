// heredoc.coffee
var hHereDocs, lHereDocs;

import {
  undef,
  defined,
  notdefined,
  OL,
  CWS,
  arrayToBlock,
  assert,
  croak,
  behead,
  fromTAML,
  isString,
  isClassInstance
} from '@jdeighan/llutils';

import {
  indented,
  undented,
  splitLine
} from '@jdeighan/llutils/indent';

import {
  LineFetcher
} from '@jdeighan/llutils/fetcher';

lHereDocs = []; // checked in this order - list of type names

hHereDocs = {}; // {type: obj}


// ---------------------------------------------------------------------------
// Returns a string or undef
export var mapHereDoc = function(block) {
  var heredocObj, i, len, result, type;
  assert(isString(block), `not a string: ${OL(block)}`);
  for (i = 0, len = lHereDocs.length; i < len; i++) {
    type = lHereDocs[i];
    heredocObj = hHereDocs[type];
    result = heredocObj.map(block);
    if (defined(result)) {
      assert(isString(result), "result not a string");
      return result;
    }
  }
  result = JSON.stringify(block); // can directly replace <<<
  return result;
};

// ---------------------------------------------------------------------------
// --- fetcher is a PLLFetcher, i.e. it has methods
//        moreLines()
//        peek()
//        peekLevel()
//        fetch()
//        skip()
//        getBlock(level)
export var replaceHereDocs = (level, line, src) => {
  var block, lLines, lNewParts, lParts, part, result, str;
  assert(isString(line), "not a string");
  assert(src instanceof LineFetcher, "not a LineFetcher");
  lParts = lineToParts(line);
  lNewParts = (function() {
    var i, len, results;
    results = [];
    for (i = 0, len = lParts.length; i < len; i++) {
      part = lParts[i];
      if (part === '<<<') {
        lLines = (function() {
          var results1;
          results1 = [];
          while (src.moreLines()) {
            [level, str] = splitLine(src.fetch());
            if ((level === 0) && (str === '')) {
              break;
            }
            results1.push(indented(str, level));
          }
          return results1;
        })();
        block = undented(arrayToBlock(lLines));
        str = mapHereDoc(block);
        assert(isString(str), `Not a string: ${OL(str)}`);
        results.push(str);
      } else {
        results.push(part); // keep as is
      }
    }
    return results;
  })();
  result = lNewParts.join('');
  return result;
};

// ---------------------------------------------------------------------------
export var lineToParts = function(line) {
  var lParts, pos, start;
  // --- Always returns an odd number of parts
  //     Odd numbered parts are '<<<', Even numbered parts are not '<<<'
  lParts = [];
  pos = 0;
  while ((start = line.indexOf('<<<', pos)) !== -1) {
    lParts.push(line.substring(pos, start));
    lParts.push('<<<');
    pos = start + 3;
  }
  lParts.push(line.substring(pos));
  return lParts;
};

// ---------------------------------------------------------------------------
export var addHereDocType = function(type, obj) {
  assert(isString(type, {
    nonempty: true
  }), `type is ${OL(type)}`);
  assert(isClassInstance(obj, 'map'), `Bad input object: ${OL(obj)}`);
  assert(obj instanceof BaseHereDoc, "not a BaseHereDoc");
  assert(notdefined(hHereDocs[type]), `Heredoc type ${type} already installed`);
  lHereDocs.push(type);
  hHereDocs[type] = obj;
};

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// --- To extend,
//        define map(block) that:
//           returns undef if it's not your HEREDOC type
//           else returns a CieloScript expression
export var BaseHereDoc = class BaseHereDoc {
  map(block) {
    return undef;
  }

};

// ---------------------------------------------------------------------------
export var ExplicitBlockHereDoc = class ExplicitBlockHereDoc extends BaseHereDoc {
  // --- First line must be '==='
  //     Return value is quoted string of remaining lines
  map(block) {
    var head, rest;
    [head, rest] = behead(block);
    if (head !== '===') {
      return undef;
    }
    return JSON.stringify(rest);
  }

};

// ---------------------------------------------------------------------------
export var OneLineHereDoc = class OneLineHereDoc extends BaseHereDoc {
  // --- First line must begin with '...'
  //     Return value is single line string after '...' with
  //        runs of whitespace replaced with a single space char
  map(block) {
    var head, rest;
    [head, rest] = behead(block);
    if (head.indexOf('...') !== 0) {
      return undef;
    }
    return JSON.stringify(CWS(block.substring(3)));
  }

};

// ---------------------------------------------------------------------------
export var TAMLHereDoc = class TAMLHereDoc extends BaseHereDoc {
  // --- First line must be '---'
  map(block) {
    var head, obj, rest, result;
    [head, rest] = behead(block);
    if (head !== '---') {
      return undef;
    }
    obj = fromTAML(block);
    result = JSON.stringify(obj);
    return result;
  }

};

// ---------------------------------------------------------------------------

// --- Add the standard HEREDOC types
addHereDocType('one line', new OneLineHereDoc());

addHereDocType('block', new ExplicitBlockHereDoc());

addHereDocType('taml', new TAMLHereDoc());

//# sourceMappingURL=heredoc.js.map
