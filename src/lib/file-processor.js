  // file-processor.coffee
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
  assert
} from '@jdeighan/llutils';

import {
  isProjRoot,
  isFile,
  barf,
  slurp,
  fileExt,
  withExt,
  mkpath,
  allFilesMatching,
  readTextFile,
  newerDestFileExists
} from '@jdeighan/llutils/fs';

// ---------------------------------------------------------------------------
// --- func must have the following signature:
//        params: (code, hMetaData)
//        return value:
//           either a string (e.g. code)
//           or a hash with keys:
//              code
//              sourceMap (optional)
export var procFiles = (pattern, outExt, lFuncs, hOptions = {}) => {
  var code, contents, debug, echo, f, fileFilter, force, func, hMetaData, i, j, lSourceMaps, len, len1, logOnly, numFilesProcessed, ref, relPath, result, sourceMap, x;
  // --- A file is out of date unless a file exists
  //        with outExt extension
  //        that's newer than the original file
  // --- But ignore files inside node_modules
  if (isArray(lFuncs)) {
    for (i = 0, len = lFuncs.length; i < len; i++) {
      f = lFuncs[i];
      assert(isFunction(f), `not a function: ${OL(f)}`);
    }
  } else {
    assert(isFunction(lFuncs), `not a function: ${OL(lFuncs)}`);
    lFuncs = [lFuncs];
  }
  assert(outExt.startsWith('.'), `Bad out ext: ${OL(outExt)}`);
  ({force, debug, logOnly, echo} = getOptions(hOptions, {
    force: false,
    debug: false,
    logOnly: false,
    echo: true
  }));
  fileFilter = ({filePath}) => {
    var destFile;
    if (filePath.match(/\bnode_modules\b/i)) {
      return false;
    }
    if (force) {
      return true;
    }
    destFile = withExt(filePath, outExt);
    return !newerDestFileExists(filePath, destFile);
  };
  numFilesProcessed = 0;
  ref = allFilesMatching(pattern, {fileFilter});
  for (x of ref) {
    ({relPath} = x);
    if (echo || logOnly) {
      console.log(relPath);
    }
    if (logOnly) {
      continue;
    }
    ({hMetaData, contents} = readTextFile(relPath, 'eager'));
    assert(defined(contents), "procFiles(): undef contents");
    if (debug) {
      hMetaData.debug = true;
    }
    lSourceMaps = [];
    for (j = 0, len1 = lFuncs.length; j < len1; j++) {
      func = lFuncs[j];
      result = func(contents, hMetaData);
      if (isString(result)) {
        contents = result;
        lSourceMaps = undef;
      } else {
        assert(isHash(result), `result not a string or hash: ${OL(result)}`);
        ({code, sourceMap} = result);
        assert(isString(code), `code not a string: ${OL(code)}`);
        contents = code;
        if (defined(lSourceMaps) && defined(sourceMap)) {
          lSourceMaps.push(sourceMap);
        } else {
          lSourceMaps = undef;
        }
      }
    }
    barf(contents, withExt(relPath, outExt));
    if (defined(lSourceMaps) && (lSourceMaps.length === 1)) {
      barf(lSourceMaps[0], withExt(relPath, `${outExt}.map`));
    }
    numFilesProcessed += 1;
  }
  return numFilesProcessed;
};

//# sourceMappingURL=file-processor.js.map
