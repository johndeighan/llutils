#!/usr/bin/env node
// brew.coffee

// --- designed to be a TextPad tool
var blocks, contents, filePath, hMetaData, js, orgCode, preprocCode;

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
  brew
} from '@jdeighan/llutils/coffee';

// ---------------------------------------------------------------------------
// Usage:   node src/bin/brew.js  *.coffee
filePath = process.argv[2];

// --- hMetaData will include key 'filePath'
({hMetaData, contents} = readTextFile(filePath, 'eager'));

if (process.argv[3] === 'debug') {
  hMetaData.debug = true;
}

blocks = new TextBlockList();

blocks.addBlock(relpath(filePath), contents);

({orgCode, preprocCode, js} = brew(contents, hMetaData));

assert(orgCode === contents, "Bad org code");

if (defined(preprocCode) && (preprocCode !== orgCode)) {
  blocks.addBlock('PreProcessed', preprocCode);
}

blocks.addBlock('JavaScript', js);

console.log(blocks.asString());

//# sourceMappingURL=brew.js.map
