// section-map.test.coffee
var elem;

import {
  undef,
  toBlock,
  assert
} from '@jdeighan/llutils';

import {
  indented
} from '@jdeighan/llutils/indent';

import * as lib from '@jdeighan/llutils/section-map';

Object.assign(global, lib);

import * as lib2 from '@jdeighan/llutils/utest';

Object.assign(global, lib2);

// ---------------------------------------------------------------------------
elem = (tag, content) => {
  return `<${tag}>${content}</${tag}>`;
};

// ---------------------------------------------------------------------------
(function() {
  var map;
  map = new SectionMap(['html', 'script']);
  truthy(map.isEmpty());
  falsy(map.nonEmpty());
  map.section('script').add("x = 42");
  map.section('html').add("<p>para</p>");
  falsy(map.isEmpty());
  truthy(map.nonEmpty());
  return equal(map.getBlock(), `<p>para</p>
x = 42`);
})();

// ---------------------------------------------------------------------------
(function() {
  var map;
  map = new SectionMap(['startup', '# |||| =', 'code']);
  truthy(map.isEmpty());
  falsy(map.nonEmpty());
  map.section('code').add("x = 42");
  map.section('startup').add("n = 3");
  falsy(map.isEmpty());
  truthy(map.nonEmpty());
  return equal(map.getBlock(), `n = 3
# |||| =
x = 42`);
})();

// ---------------------------------------------------------------------------
// --- Test processing
(function() {
  var map, toJS;
  toJS = function(line) {
    return `${line};`;
  };
  map = new SectionMap(['html', 'script'], {
    script: toJS
  });
  map.section('script').add("x = 42");
  map.section('html').add("<p>para</p>");
  return equal(map.getBlock(undef), `<p>para</p>
x = 42;`);
})();

// ---------------------------------------------------------------------------
(function() {
  var addSpaces, hProc, map, toJS;
  toJS = function(line) {
    return `${line};`;
  };
  addSpaces = function(line) {
    return line.replace('<p>', '<p> ').replace('</p>', ' </p>');
  };
  hProc = {
    script: toJS,
    html: addSpaces
  };
  map = new SectionMap(['html', 'script'], hProc);
  map.section('script').add("x = 42");
  map.section('html').add("<p>para</p>");
  return equal(map.getBlock(undef), `<p> para </p>
x = 42;`);
})();

// ---------------------------------------------------------------------------
(function() {
  var addSpaces, hProc, map, toJS;
  toJS = function(line) {
    return `${line};`;
  };
  addSpaces = function(line) {
    return line.replace('<p>', '<p> ').replace('</p>', ' </p>');
  };
  hProc = {
    code: toJS,
    html: addSpaces,
    Script: function(block) {
      return elem('script', block);
    }
  };
  map = new SectionMap(['html', ['Script', 'code']], hProc);
  map.section('code').add("x = 42");
  map.section('html').add("<p>para</p>");
  return equal(map.getBlock(undef), `<p> para </p>
<script>x = 42;</script>`);
})();

// ---------------------------------------------------------------------------
(function() {
  var map;
  map = new SectionMap(['html', 'script']);
  map.section('script').add("x = 42");
  map.section('html').add("<p> hello </p>");
  return equal(map.getBlock(), `<p> hello </p>
x = 42`);
})();

// ---------------------------------------------------------------------------
(function() {
  var map;
  map = new SectionMap(['html', ['Script', 'startup', 'code']]);
  map.section('code').add("x = 42");
  map.section('startup').add("LOG 'starting'");
  map.section('html').add("<p> hello </p>");
  equal(map.getBlock(), `<p> hello </p>
LOG 'starting'
x = 42`);
  return equal(map.getBlock('Script'), `LOG 'starting'
x = 42`);
})();

// ---------------------------------------------------------------------------
(function() {
  var map;
  map = new SectionMap(['html', ['Script', 'startup', '\t# |||| =', 'code']]);
  map.section('startup').add('<script>');
  map.section('code').add(1, "x = 42");
  map.section('startup').add(1, "LOG 'starting'");
  map.section('html').add("<h1> title </h1>");
  map.section('startup').add(1, "y = 4*x");
  map.section('html').add("<p> hello </p>");
  map.section('code').add(1, "LOG 'Done'");
  map.section('code').add("</script>");
  equal(map.getBlock(), `<h1> title </h1>
<p> hello </p>
<script>
	LOG 'starting'
	y = 4*x
	# |||| =
	x = 42
	LOG 'Done'
</script>`);
  return equal(map.getBlock('Script'), `<script>
	LOG 'starting'
	y = 4*x
	# |||| =
	x = 42
	LOG 'Done'
</script>`);
})();

// ---------------------------------------------------------------------------
(function() {
  var hProc, map;
  hProc = {
    Script: function(block) {
      return `<script>
${indented(block)}
</script>`;
    },
    style: function(block) {
      return `<style>
${indented(block)}
</style>`;
    }
  };
  map = new SectionMap(['html', ['Script', 'startup', '# |||| =', ['NonStartup', 'imports', 'code']], 'style'], hProc);
  map.section('style').add("p {", "...color: red", "...}");
  map.section('code').add("x = 42");
  map.section('startup').add("LOG 'starting'");
  map.section('html').add("<h1> title </h1>");
  map.section('startup').add("y = 4*x");
  map.section('html').add("<p> hello </p>");
  map.section('code').add("LOG 'Done'");
  map.dump();
  equal(map.getBlock(), `<h1> title </h1>
<p> hello </p>
<script>
	LOG 'starting'
	y = 4*x
	# |||| =
	x = 42
	LOG 'Done'
</script>
<style>
	p {
	...color: red
	...}
</style>`);
  equal(map.getBlock('Script'), `<script>
	LOG 'starting'
	y = 4*x
	# |||| =
	x = 42
	LOG 'Done'
</script>`);
  equal(map.getBlock('NonStartup'), `x = 42
LOG 'Done'`);
  return equal(map.getBlock('style'), `<style>
	p {
	...color: red
	...}
</style>`);
})();

// ---------------------------------------------------------------------------
(function() {
  var MyTester, sectMap, tester;
  sectMap = new SectionMap([
    'html',
    [
      'Script', // all this gets processed by CoffeeScript
      'startup',
      '# |||| =', // we can split up the script code here
      'export',
      'import',
      'vars',
      'onmount',
      'ondestroy',
      'code'
    ],
    'style'
  ]);
  MyTester = class MyTester extends UnitTester {
    transformValue(query) {
      var lSections, ref, section;
      lSections = [];
      ref = sectMap.allSections(query);
      for (section of ref) {
        lSections.push(section.name);
      }
      return toBlock(lSections);
    }

  };
  tester = new MyTester();
  // ------------------------------------------------------------------------
  tester.equal(['export', 'import'], `export
import`);
  // ------------------------------------------------------------------------
  return tester.equal('Script', `startup
export
import
vars
onmount
ondestroy
code`);
})();

//# sourceMappingURL=section-map.test.js.map
