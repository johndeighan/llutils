  // PLL.test.coffee
import {
  undef,
  fromTAML
} from '@jdeighan/llutils';

import {
  BaseTracer
} from '@jdeighan/llutils/peggy';

import {
  parse
} from './PLL/tree.js';

import * as lib2 from '@jdeighan/llutils/utest';

Object.assign(global, lib2);

u.transformValue = (block) => {
  return parse(block, {
    tracer: new BaseTracer()
  });
};

u.transformExpected = (block) => {
  return fromTAML(block);
};

// ---------------------------------------------------------------------------
succeeds(() => {
  return `abc`;
});

succeeds(() => {
  return `abc
def`;
});

succeeds(() => {
  return `abc
	def`;
});

succeeds(() => {
  return `abc
		def`;
});

// ---------------------------------------------------------------------------
equal(`abc`, `---
type: tree
body:
	-
		type: stmt
		ident: abc`);

equal(`abc
def`, `---
type: tree
body:
	-
		type: stmt
		ident: abc
	-
		type: stmt
		ident: def`);

equal(`abc
	def`, `---
type: tree
body:
	-
		type: stmt
		ident: abc
		children:
			-
				type: stmt
				ident: def`);

equal(`abc
	def
		ghi`, `---
type: tree
body:
	-
		type: stmt
		ident: abc
		children:
			-
				type: stmt
				ident: def
				children:
					-
						type: stmt
						ident: ghi`);

equal(`abc
		def`, `---
type: tree
body:
	-
		type: stmt
		ident: abc def`);

equal(`abc
		def
ghi`, `---
type: tree
body:
	-
		type: stmt
		ident: abc def
	-
		type: stmt
		ident: ghi`);

equal(`abc
		def
	ghi`, `---
type: tree
body:
	-
		type: stmt
		ident: abc def
		children:
			-
				type: stmt
				ident: ghi`);

// ---------------------------------------------------------------------------
// --- blank lines should be ignored
equal("\nabc", `---
type: tree
body:
	-
		type: stmt
		ident: abc`);

equal("abc\n", `---
type: tree
body:
	-
		type: stmt
		ident: abc`);

equal("\nabc\n", `---
type: tree
body:
	-
		type: stmt
		ident: abc`);

equal(`abc

def`, `---
type: tree
body:
	-
		type: stmt
		ident: abc
	-
		type: stmt
		ident: def`);

equal(`
abc

def
`, `---
type: tree
body:
	-
		type: stmt
		ident: abc
	-
		type: stmt
		ident: def`);

equal(`
abc

	def
`, `---
type: tree
body:
	-
		type: stmt
		ident: abc
		children:
			-
				type: stmt
				ident: def`);

equal(`

abc


	def


		ghi

`, `---
type: tree
body:
	-
		type: stmt
		ident: abc
		children:
			-
				type: stmt
				ident: def
				children:
					-
						type: stmt
						ident: ghi`);

equal(`
abc


		def
`, `---
type: tree
body:
	-
		type: stmt
		ident: abc def`);

equal(`
abc

		def

ghi`, `---
type: tree
body:
	-
		type: stmt
		ident: abc def
	-
		type: stmt
		ident: ghi`);

equal(`
abc

		def

	ghi
`, `---
type: tree
body:
	-
		type: stmt
		ident: abc def
		children:
			-
				type: stmt
				ident: ghi`);

//# sourceMappingURL=PLL.test.js.map
