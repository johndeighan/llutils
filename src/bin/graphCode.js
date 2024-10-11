#!/usr/bin/env -S node --enable-source-maps
// graphCode.coffee
var graph, lDeps, ref, ref1, ref2, relPath, x, y, z;

import pathLib from 'node:path';

import {
  undef,
  defined,
  OL,
  LOG,
  nonEmpty
} from '@jdeighan/llutils';

import {
  isFile,
  allFilesMatching,
  fileExt,
  fileStub,
  relpath
} from '@jdeighan/llutils/fs';

import {
  analyzeCoffeeFile
} from '@jdeighan/llutils/llcoffee';

import {
  analyzePeggyFile
} from '@jdeighan/llutils/peggy';

import {
  DiGraph
} from '@jdeighan/llutils/digraph';

// ---------------------------------------------------------------------------
graph = new DiGraph({
  normalize: ((relPath) => {
    return fileStub(relPath);
  }),
  filterDep: ((dep) => {
    return dep.startsWith('@jdeighan/llutils') || dep.startsWith('src/lib/');
  })
});

ref = allFilesMatching('src/lib/**/*.coffee');
for (x of ref) {
  ({relPath} = x);
  if (relPath.startsWith('test/')) {
    continue;
  }
  lDeps = analyzeCoffeeFile(relPath).lDependencies;
  graph.add(relPath, lDeps, {
    nodeType: 'lib'
  });
}

ref1 = allFilesMatching('src/bin/**/*.coffee');
for (y of ref1) {
  ({relPath} = y);
  if (relPath.startsWith('test/')) {
    continue;
  }
  lDeps = analyzeCoffeeFile(relPath).lDependencies;
  graph.add(relPath, lDeps, {
    nodeType: 'bin'
  });
}

ref2 = allFilesMatching('**/*.peggy');
for (z of ref2) {
  ({relPath} = z);
  if (relPath.startsWith('test/')) {
    continue;
  }
  lDeps = analyzePeggyFile(relPath).lDependencies;
  if (nonEmpty(lDeps)) {
    LOG(`ANALYZE: ${relPath}`);
    LOG(`   DEPS: ${OL(lDeps)}`);
  }
  graph.add(relPath, lDeps, {
    nodeType: 'peggy'
  });
}

graph.dump({
  sortKeys: true,
  maxWidth: 1
});

if (graph.hasCycle()) {
  LOG("GRAPH HAS CYCLE");
} else {
  LOG("OK");
  graph.render('./graph.svg', 'dot');
}

//# sourceMappingURL=graphCode.js.map