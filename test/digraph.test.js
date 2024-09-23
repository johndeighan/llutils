  // digraph.test.coffee
import {
  undef,
  defined,
  notdefined,
  assert,
  croak
} from '@jdeighan/llutils';

import * as lib from '@jdeighan/llutils/digraph';

Object.assign(global, lib);

import * as lib2 from '@jdeighan/llutils/utest';

Object.assign(global, lib2);

// ---------------------------------------------------------------------------
//symbol "DiGraph"
(() => {
  var dep;
  dep = new DiGraph();
  dep.add('a', ['b']);
  dep.add('b', ['c']);
  equal(dep.getBuildOrder().join(' '), "c b a");
  return equal(dep.dotProgram(), `digraph {
	"a" -> "b"
	"b" -> "c"
	}`);
})();

(() => {
  var dep;
  dep = new DiGraph();
  dep.add('a', ['b', 'c']);
  dep.add('b', ['d']);
  dep.add('c', ['d']);
  equal(dep.getBuildOrder().join(' '), "d c b a");
  return equal(dep.dotProgram(), `digraph {
	"a" -> "b"
	"a" -> "c"
	"b" -> "d"
	"c" -> "d"
	}`);
})();

(() => {
  var dep;
  dep = new DiGraph();
  dep.add('a', ['b', 'c']);
  dep.add('b', ['f', 'd']);
  dep.add('c', ['d', 'e']);
  dep.add('f', ['g']);
  equal(dep.getBuildOrder().join(' '), "g e d f c b a");
  return equal(dep.dotProgram(), `digraph {
	"a" -> "b"
	"a" -> "c"
	"b" -> "f"
	"b" -> "d"
	"c" -> "d"
	"c" -> "e"
	"f" -> "g"
	}`);
})();

// --- test adding additional, transitive dependencies
(() => {
  var dep;
  dep = new DiGraph();
  dep.add('a', ['b', 'c', 'e', 'f', 'g']);
  dep.add('b', ['f', 'd']);
  dep.add('c', ['d', 'e']);
  dep.add('f', ['g']);
  equal(dep.getBuildOrder().join(' '), "g e d f c b a");
  return equal(dep.dotProgram(), `digraph {
	"a" -> "b"
	"a" -> "c"
	"b" -> "f"
	"b" -> "d"
	"c" -> "d"
	"c" -> "e"
	"f" -> "g"
	}`);
})();

// --- test normalizing keys and dependencies
(() => {
  var dep;
  dep = new DiGraph({
    normalize: (s) => {
      return s.toUpperCase().repeat(2);
    }
  });
  dep.add('a', ['b', 'c', 'e', 'f', 'g']);
  dep.add('b', ['f', 'd']);
  dep.add('c', ['d', 'e']);
  dep.add('f', ['g']);
  equal(dep.getBuildOrder().join(' '), "GG EE DD FF CC BB AA");
  return equal(dep.dotProgram(), `digraph {
	"AA" -> "BB"
	"AA" -> "CC"
	"BB" -> "FF"
	"BB" -> "DD"
	"CC" -> "DD"
	"CC" -> "EE"
	"FF" -> "GG"
	}`);
})();

// --- test filtering dependencies
(() => {
  var dep;
  dep = new DiGraph({
    normalize: (s) => {
      return s.toUpperCase().repeat(2);
    },
    filterDep: (s) => {
      return s !== 'd';
    }
  });
  dep.add('a', ['b', 'c', 'e', 'f', 'g']);
  dep.add('b', ['f', 'd']);
  dep.add('c', ['d', 'e']);
  dep.add('f', ['g']);
  equal(dep.getBuildOrder().join(' '), "GG EE FF CC BB AA");
  return equal(dep.dotProgram(), `digraph {
	"AA" -> "BB"
	"AA" -> "CC"
	"BB" -> "FF"
	"CC" -> "EE"
	"FF" -> "GG"
	}`);
})();

// --- allow simple string as a dependency
(() => {
  var dep;
  dep = new DiGraph();
  dep.add('a', 'b');
  dep.add('b', 'c');
  equal(dep.getBuildOrder().join(' '), "c b a");
  return equal(dep.dotProgram(), `digraph {
	"a" -> "b"
	"b" -> "c"
	}`);
})();

// --- node types, styles
(() => {
  var dep;
  dep = new DiGraph({
    hStyles: {
      coffee: ' [color=red]',
      peggy: ' [color=blue]'
    }
  });
  dep.add('a', 'b', {
    nodeType: 'coffee'
  });
  dep.add('b', 'c', {
    nodeType: 'peggy'
  });
  equal(dep.getBuildOrder().join(' '), "c b a");
  return equal(dep.dotProgram(), `digraph {
	"a" [color=red]
	"a" -> "b"
	"b" [color=blue]
	"b" -> "c"
	}`);
})();

// --- node types, styles as hash
(() => {
  var dep;
  dep = new DiGraph({
    hStyles: {
      coffee: {
        color: 'red'
      },
      peggy: {
        color: 'blue'
      }
    }
  });
  dep.add('a', 'b', {
    nodeType: 'coffee'
  });
  dep.add('b', 'c', {
    nodeType: 'peggy'
  });
  equal(dep.getBuildOrder().join(' '), "c b a");
  return equal(dep.dotProgram(), `digraph {
	"a" [color=red]
	"a" -> "b"
	"b" [color=blue]
	"b" -> "c"
	}`);
})();

//# sourceMappingURL=digraph.test.js.map
