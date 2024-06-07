// lang.test.coffee
var program;

import {
  undef
} from '@jdeighan/llutils';

import {
  evaluate
} from '@jdeighan/llutils/lang';

import * as lib2 from '@jdeighan/llutils/utest';

Object.assign(global, lib2);

// ---------------------------------------------------------------------------
symbol("simple");

succeeds(() => {
  return evaluate("x=3");
});

succeeds(() => {
  return evaluate("x=3\n");
});

succeeds(() => {
  return evaluate("x=3\n\n");
});

symbol("multiple");

succeeds(() => {
  return evaluate(`x=3
y=4`);
});

succeeds(() => {
  return evaluate(`x=3
y=4\n`);
});

succeeds(() => {
  return evaluate(`x=3
y=4\n\n`);
});

symbol("indented");

succeeds(() => {
  return evaluate(`if
	y=5`);
});

succeeds(() => {
  return evaluate(`if
	y=5\n`);
});

program = `if
	y=5\n\n`;

succeeds(() => {
  return evaluate(program);
});

succeeds(() => {
  return evaluate(`if
	y=5\n\n\n`);
});

symbol("multi indent");

succeeds(() => {
  return evaluate(`if
	y=5
	if
		x=3
	z=2`);
});

symbol("allow blank lines");

succeeds(() => {
  return evaluate(`if
	y=5

	if
		x=3
	z=2`);
});

succeeds(() => {
  return evaluate(`if

	y=5

	if

		x=3

	z=2`);
});

//# sourceMappingURL=lang.test.js.map
