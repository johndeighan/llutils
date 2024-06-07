// source-map.coffee
var hSourceMaps;

import {
  readFileSync
} from 'node:fs';

import {
  SourceMapConsumer
} from 'source-map';

import {
  undef,
  defined,
  getOptions,
  isInteger,
  isHash,
  assert
} from '@jdeighan/llutils';

import {
  isFile,
  mkpath,
  parsePath,
  fileExt
} from '@jdeighan/llutils/fs';

// --- cache to hold previously fetched file contents
hSourceMaps = {}; // --- { filepath => hMap, ... }


// ---------------------------------------------------------------------------
export var getMap = (mapFilePath) => {
  var rawMap;
  // --- returns a hash

  // --- get from cache if available
  if (hSourceMaps.hasOwnProperty(mapFilePath)) {
    return hSourceMaps[mapFilePath];
  } else {
    rawMap = readFileSync(mapFilePath, 'utf8');
    return hSourceMaps[mapFilePath] = JSON.parse(rawMap);
  }
};

// ---------------------------------------------------------------------------
// --- Valid keys:

//   - version: Which version of the source map spec this map is following.
//   - sources: An array of URLs to the original source files.
//   - names: An array of identifiers which can be referrenced by individual mappings.
//   - sourceRoot: Optional. The URL root from which all sources are relative.
//   - sourcesContent: Optional. An array of contents of the original source files.
//   - mappings: A string of base64 VLQs which contain the actual mappings.
//   - file: Optional. The generated file this source map is associated with.
export var dumpMap = (hMap) => {
  var hJson;
  hJson = {
    version: hMap.version,
    sources: hMap.sources,
    names: hMap.names,
    sourceRoot: hMap.sourceRoot,
    sourcesContent: defined(hMap.sourcesContent),
    mappings: defined(hMap.mappings),
    file: hMap.file
  };
  console.log(JSON.stringify(hJson, null, 3));
};

// ---------------------------------------------------------------------------
export var mapLineNum = (jsPath, line, column = 0, hOptions = {}) => {
  var debug, err, hMapped;
  ({debug} = getOptions(hOptions, {
    debug: false
  }));
  if (debug) {
    console.log(`DEBUGGING mapLineNum(${line},${column})`);
    console.log(`   ${jsPath}`);
  }
  assert(isInteger(line), `line ${line} not an integer`);
  try {
    hMapped = mapSourcePos(jsPath, line, column, {debug});
    return hMapped.line;
  } catch (error) {
    err = error;
    if (debug) {
      console.log("mapSourcePos failed, returning original line");
      console.log(err.message);
    }
    return line;
  }
};

// ---------------------------------------------------------------------------
export var mapSourcePos = (jsPath, line, column, hOptions = {}) => {
  var debug, hMap, hMapped, mapFilePath, name, smc, source;
  // --- Valid options:
  //        debug
  // --- Can map only if:
  //        1. ext is .js
  //        2. <jsPath>.map exists

  //     returns {source, line, column, name}
  //     will return original jsPath, line and column
  //        if no map file, or unable to map
  ({debug} = getOptions(hOptions, {
    debug: false
  }));
  if (debug) {
    console.log(`DEBUGGING mapSourcePos(${line},${column})`);
    console.log(`   ${jsPath}`);
  }
  jsPath = mkpath(jsPath);
  mapFilePath = jsPath + '.map';
  assert(isFile(jsPath), `no such file ${jsPath}`);
  assert(isFile(mapFilePath), `no such file ${mapFilePath}`);
  assert(fileExt(jsPath) === '.js', "Not a JS file");
  assert(isInteger(line, {
    min: 0
  }), `line ${line} not an integer`);
  assert(isInteger(column, {
    min: 0
  }), `column ${column} not an integer`);
  // --- get from cache if available
  hMap = getMap(mapFilePath);
  assert(defined(hMap), "getMap() returned undef");
  if (debug) {
    dumpMap(hMap);
  }
  smc = new SourceMapConsumer(hMap);
  if (debug) {
    console.log(smc.sources);
  }
  // --- hMapped is {source, line, column, name}
  hMapped = smc.originalPositionFor({line, column});
  if (debug) {
    console.log(hMapped);
  }
  assert(isHash(hMapped), `originalPositionFor(${line},${column}) returned non-hash`);
  ({source, line, column, name} = hMapped);
  assert(isInteger(line), `originalPositionFor(${line},${column}) returned line = ${line}`);
  return hMapped;
};

//# sourceMappingURL=source-map.js.map
