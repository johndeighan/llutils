// sveltify.coffee
var ast, blocks, contents, css, filePath, hMetaData, js, stats, vars, warnings;

import {
  defined,
  assert
} from '@jdeighan/llutils';

import {
  TextBlockList
} from '@jdeighan/llutils/text-block';

import {
  readTextFile,
  relpath
} from '@jdeighan/llutils/fs';

import {
  compile
} from 'svelte/compiler';

// ---------------------------------------------------------------------------
// Usage:   node src/bin/sveltify.js  *.svelte
filePath = process.argv[2];

// --- hMetaData will include key 'filePath'
({hMetaData, contents} = readTextFile(filePath, 'eager'));

hMetaData.filename = hMetaData.filePath;

delete hMetaData.filePath;

if (process.argv[3] === 'debug') {
  hMetaData.debug = true;
}

// --- Available options in hMetaData:
//     tag - tag name for custom element
({js, css, ast, warnings, vars, stats} = compile(contents, hMetaData));

blocks = new TextBlockList();

blocks.addBlock(relpath(filePath), contents);

blocks.addBlock('JavaScript', js.code);

console.log(blocks.asString());

//# sourceMappingURL=sveltify.js.map
