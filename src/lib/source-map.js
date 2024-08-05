// source-map.coffee
var hSourceMaps;

import {
  readFileSync
} from 'node:fs';

import {
  SourceMapGenerator,
  SourceMapConsumer
} from 'source-map-js';

import {
  undef,
  defined,
  notdefined,
  getOptions,
  OL,
  isInteger,
  isHash,
  isArray,
  assert,
  croak
} from '@jdeighan/llutils';

import {
  isFile,
  mkpath,
  parsePath,
  fileExt,
  slurp,
  barf
} from '@jdeighan/llutils/fs';

import {
  DUMP,
  BOX
} from '@jdeighan/llutils/dump';

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
  var consumer, debug, hMap, hMapped, mapFilePath, newStr, orgStr;
  // --- Valid options:
  //        debug
  // --- Can map only if:
  //        1. ext is .js
  //        2. <jsPath>.map exists

  //     returns {source, line, column, name}
  //     or undef if no map file, or unable to map
  ({debug} = getOptions(hOptions, {
    debug: false
  }));
  if (debug) {
    console.log(`DEBUGGING mapSourcePos(${line},${column})`);
    console.log(`   ${jsPath}`);
  }
  jsPath = mkpath(jsPath);
  mapFilePath = jsPath + '.map';
  if (!isFile(mapFilePath)) {
    if (debug) {
      console.log("Map file missing, returning undef");
    }
    return undef;
  }
  assert(isFile(jsPath), `no such file ${jsPath}`);
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
  consumer = new SourceMapConsumer(hMap);
  hMapped = consumer.originalPositionFor({line, column});
  // --- hMapped is {source, line, column, name}
  assert(isHash(hMapped), `not a hash: ${OL(hMapped)}`);
  if (debug) {
    orgStr = `${jsPath} ${line}:${column}`;
    newStr = `${hMapped.source} ${hMapped.line}:${hMapped.column}`;
    console.log(`${orgStr} ==> ${newStr}`);
  }
  return hMapped;
};

// ---------------------------------------------------------------------------
export var SourceMap = class SourceMap extends SourceMapGenerator {
  constructor(inFilePath, outFilePath) {
    super({
      file: outFilePath
    });
    this.inFilePath = inFilePath;
    this.outFilePath = outFilePath;
  }

  // ..........................................................
  setSource(inputFilePath) {
    this.inFilePath = inFilePath;
  }

  // ..........................................................
  getPos(desc) {
    assert(isArray(desc) || isInteger(desc), `Bad desc: ${OL(desc)}`);
    if (isArray(desc)) {
      assert(desc.length === 2, `Bad desc: ${OL(desc)}`);
      return {
        line: desc[0],
        column: desc[1]
      };
    } else {
      return {
        line: 1,
        column: desc
      };
    }
  }

  // ..........................................................
  add(srcPos, destPos, name = undef) {
    this.addMapping({
      source: this.inFilePath,
      original: this.getPos(srcPos),
      generated: this.getPos(destPos),
      name
    });
  }

  // ..........................................................
  barf() {
    var text;
    text = this.toString();
    return barf(this.toString, this.outFilePath + '.map');
  }

  // ..........................................................
  // --- useful for testing
  mapPos(pos) {
    var consumer, hMap;
    hMap = JSON.parse(this.toString());
    consumer = new SourceMapConsumer(hMap);
    return consumer.originalPositionFor(this.getPos(pos));
  }

};

//# sourceMappingURL=source-map.js.map
