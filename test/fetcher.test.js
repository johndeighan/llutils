  // fetcher.test.coffee
import {
  undef,
  nonEmpty
} from '@jdeighan/llutils';

import * as lib from '@jdeighan/llutils/fetcher';

Object.assign(global, lib);

import * as lib2 from '@jdeighan/llutils/utest';

Object.assign(global, lib2);

// ---------------------------------------------------------------------------
(() => {
  var src;
  src = new Fetcher('');
  return falsy(src.moreLines());
})();

(() => {
  var src;
  src = new Fetcher(`abc
def`);
  truthy(src.moreLines());
  equal(src.next(), 'abc');
  equal(src.next(), 'abc');
  equal(src.get(), 'abc');
  truthy(src.moreLines());
  equal(src.get(), 'def');
  return falsy(src.moreLines());
})();

(() => {
  var src;
  src = new Fetcher(`# --- this comment should be removed
abc
# --- The following blank line should be removed

def`, {
    filterFunc: (line) => {
      return nonEmpty(line) && !line.match(/^\s*#/);
    }
  });
  truthy(src.moreLines());
  equal(src.next(), 'abc');
  equal(src.next(), 'abc');
  src.skip();
  truthy(src.moreLines());
  equal(src.get(), 'def');
  return falsy(src.moreLines());
})();

(() => {
  var src;
  src = new Fetcher(`# --- this comment should be removed
GLOBAL

	# --- global section
	hDesc = {key: 'string'}
	console.log 'DONE'

[a-z]+
	return undef`, {
    filterFunc: (line) => {
      return nonEmpty(line) && !line.match(/^\s*#/);
    }
  });
  truthy(src.moreLines());
  equal(src.next(), 'GLOBAL');
  equal(src.nextLevel(), 0);
  equal(src.get(), 'GLOBAL');
  equal(src.nextLevel(), 1);
  equal(src.getBlock(1), `hDesc = {key: 'string'}
console.log 'DONE'`);
  equal(src.nextLevel(), 0);
  equal(src.get(), '[a-z]+');
  equal(src.nextLevel(), 1);
  equal(src.getBlock(1), `return undef`);
  return falsy(src.moreLines());
})();

//# sourceMappingURL=fetcher.test.js.map
