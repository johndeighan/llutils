  // elm-doc.test.coffee
import {
  undef,
  defined,
  notdefined,
  untabify
} from '@jdeighan/llutils';

import {
  barf
} from '@jdeighan/llutils/fs';

import * as lib from '@jdeighan/llutils/elm-doc';

Object.assign(global, lib);

import * as lib2 from '@jdeighan/llutils/utest';

Object.assign(global, lib2);

// ---------------------------------------------------------------------------
(() => {
  var block, doc;
  doc = new ElmDocument();
  doc.addModule(`---
type: module
name: Hello
lFuncDefs:
	-
		type: funcDef
		name: main
		lParms: []
		lStmts:
			-
				type: funcApply
				name: text
				lArgs: Hello, Elm!`);
  block = doc.getBlock();
  barf(untabify(block), "./test1.elm");
  return equal(block, `module Hello exposing(main)

import Element exposing(text)

main =
	text "Hello, Elm!"`);
})();

//# sourceMappingURL=elm-doc.test.js.map
