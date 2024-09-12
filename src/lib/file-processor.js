// file-processor.coffee
var hConfig;

import {
  compile as compileCoffee
} from 'coffeescript';

import {
  compile as compileSvelte
} from 'svelte/compiler';

import {
  undef,
  defined,
  notdefined,
  getOptions,
  OL,
  isString,
  isFunction,
  isArray,
  isHash,
  assert,
  croak,
  keys,
  hasKey,
  nonEmpty,
  gen2block
} from '@jdeighan/llutils';

import {
  splitLine,
  indented
} from '@jdeighan/llutils/indent';

import {
  isProjRoot,
  isFile,
  allFiles,
  barf,
  slurp,
  fileExt,
  withExt,
  mkpath,
  relpath,
  allFilesMatching,
  readTextFile,
  newerDestFileExists
} from '@jdeighan/llutils/fs';

import {
  LineFetcher
} from '@jdeighan/llutils/fetcher';

import {
  replaceHereDocs
} from '@jdeighan/llutils/heredoc';

import {
  hLLBConfig
} from '@jdeighan/llutils/llb-config';

hConfig = hLLBConfig;

// ---------------------------------------------------------------------------
// --- processes all files with file ext in hLLBConfig
//     unprocessed, but matching files are
//        checked for files they use
export var procFiles = (pattern = "*", hOptions = {}) => {
  var contents, debug, fileFilter, force, hMetaData, hUses, lProcessed, lUses, processed, ref, relPath, x;
  ({debug, force} = getOptions(hOptions, {
    debug: false,
    force: false
  }));
  if (hConfig.force) {
    force = true;
  }
  // --- accumulate over all files
  lProcessed = [];
  hUses = {}; // --- { <file>: [<used file>, ...], ...}
  
  // --- set in filter (filter needs meta data, so save results)
  hMetaData = undef; // --- set for all matching files
  contents = undef; //     set only for files that are processed
  
  // --- fileFilter is called for every matching file, changed or not
  //     we need to check meta data for every matching file
  //     so, we update lProcessed and hUses here
  fileFilter = ({filePath}) => {
    var destFile, ext, outExt;
    ext = fileExt(filePath);
    if (!hasKey(hConfig, ext)) {
      return false;
    }
    if (force) {
      return true;
    }
    outExt = hConfig[ext].outExt;
    destFile = withExt(filePath, outExt);
    return !newerDestFileExists(filePath, destFile);
  };
  ref = allFilesMatching(pattern, {fileFilter});
  for (x of ref) {
    ({relPath} = x);
    ({processed, lUses} = procOneFile(relPath, hOptions));
    lProcessed.push(relPath);
    if (nonEmpty(lUses)) {
      hUses[relPath] = lUses;
    }
  }
  return {lProcessed, hUses};
};

// ---------------------------------------------------------------------------
// --- func must have the following signature:
//        params: (code, hMetaData, filePath)
//        return value:
//           either a string (e.g. code)
//           or a hash with keys:
//              code
//              sourceMap (optional)
//              lUses - an array, possibly empty
// ---------------------------------------------------------------------------
export var procOneFile = (filePath, hOptions = {}) => {
  var code, debug, echo, ext, func, hMetaData, hOtherFiles, i, lUses, len, logOnly, outExt, ref, relPath, result, sourceMap;
  ext = fileExt(filePath);
  [func, outExt] = extractConfig(hConfig, ext);
  if (!defined(func, outExt)) {
    return {
      processed: false,
      lUses: []
    };
  }
  assert(isFunction(func), `Bad config: ${OL(hConfig)}`);
  assert(isString(outExt) && outExt.startsWith('.'), `Bad config: ${OL(hConfig)}`);
  ({debug, logOnly, echo} = getOptions(hOptions, {
    debug: false,
    logOnly: false,
    echo: true
  }));
  relPath = relpath(filePath);
  if (echo || logOnly) {
    console.log(relPath);
  }
  if (logOnly) {
    return {
      processed: false,
      lUses: []
    };
  }
  ({
    // --- get file contents, including meta data
    hMetaData,
    contents: code
  } = readTextFile(filePath, 'eager'));
  lUses = [];
  sourceMap = undef;
  result = func(code, hMetaData, relPath);
  if (isString(result)) {
    barf(result, withExt(relPath, outExt));
  } else {
    assert(isHash(result), `result not a string or hash: ${OL(result)}`);
    ({code, hOtherFiles, sourceMap, lUses} = result);
    assert(isString(code), `code not a string: ${OL(code)}`);
    barf(code, withExt(relPath, outExt));
    if (defined(hOtherFiles)) {
      ref = keys(hOtherFiles);
      for (i = 0, len = ref.length; i < len; i++) {
        ext = ref[i];
        barf(hOtherFiles[ext], withExt(relPath, ext));
      }
    }
    // --- Write out final source map
    if (defined(sourceMap)) {
      barf(sourceMap, withExt(relPath, `${outExt}.map`));
    }
  }
  return {
    processed: true,
    lUses: lUses
  };
};

// ---------------------------------------------------------------------------
export var extractConfig = function(hConfig, ext) {
  var h;
  h = hConfig[ext];
  if (defined(h) && isHash(h)) {
    return [h.func, h.outExt];
  } else {
    return [undef, undef];
  }
};

// ---------------------------------------------------------------------------

//# sourceMappingURL=file-processor.js.map
