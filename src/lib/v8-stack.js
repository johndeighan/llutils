// v8-stack.coffee
import pathLib from 'node:path';

import fs from 'fs';

import {
  undef,
  defined,
  notdefined,
  isEmpty,
  nonEmpty,
  assert,
  croak,
  isInteger,
  hasKey,
  OL,
  getOptions
} from '@jdeighan/llutils';

import {
  mkpath,
  fileExt,
  withExt
} from '@jdeighan/llutils/fs';

import {
  mapSourcePos
} from '@jdeighan/llutils/source-map';

import {
  toNICE
} from '@jdeighan/llutils/to-nice';

export var internalDebugging = false;

// ---------------------------------------------------------------------------
// Stack Frames have the keys:
//    type - eval | native | constructor | method | function | script
//    filePath
//    fileName
//    ext
//    functionName
//    objTye, methodName - if type == 'method'
//    isAsync - true if an async function/method
//    line
//    column

// ---------------------------------------------------------------------------
export var nodeStr = (hNode) => {
  var column, fileName, line, type;
  ({type, fileName, line, column} = hNode);
  return `${type} at ${fileName}:${line}:${column}`;
};

// ---------------------------------------------------------------------------
// --- export only for unit tests
export var extractFileName = (filePath) => {
  var lMatches;
  if (lMatches = filePath.match(/[\/\\]([^\/\\]+)$/)) {
    return lMatches[1];
  } else {
    return filePath;
  }
};

// ---------------------------------------------------------------------------
export var getV8Stack = (hOptions = {}) => {
  var debug, e, errObj, lStackFrames, oldLimit, oldPreparer;
  // --- ignores any stack frames from this module
  //     *.js files will be mapped to *.coffee files
  //        if a source map is available
  debug = hOptions.debug || false;
  try {
    oldLimit = Error.stackTraceLimit;
    oldPreparer = Error.prepareStackTrace;
    Error.stackTraceLimit = 2e308;
    Error.prepareStackTrace = (error, lCallSites) => {
      var column, dir, ext, filePath, fileURL, functionName, hFrame, hParsed, j, lFrames, len, line, methodName, oSite, objType, pos, stub, thisVal, type;
      lFrames = [];
      debugger;
      for (j = 0, len = lCallSites.length; j < len; j++) {
        oSite = lCallSites[j];
        fileURL = oSite.getFileName();
        if (defined(fileURL)) {
          hParsed = parseFileURL(fileURL);
          filePath = hParsed.source;
        }
        if ((typeof filePath === 'string') && (filePath.length > 0)) {
          // --- Ignore any stack entries from this module
          pos = filePath.indexOf('v8-stack.js');
          if (pos >= 0) {
            if (debug) {
              console.log(`SKIP: filePath = '${filePath}'`);
            }
            continue;
          }
        }
        objType = oSite.getTypeName();
        thisVal = oSite.getThis();
        functionName = oSite.getFunctionName();
        methodName = oSite.getMethodName();
        line = oSite.getLineNumber();
        column = oSite.getColumnNumber();
        // --- Set type
        if (oSite.isEval()) {
          type = 'eval';
        } else if (oSite.isNative()) {
          type = 'native';
        } else if (oSite.isConstructor()) {
          type = 'constructor';
        } else if (defined(methodName)) {
          type = 'method';
        } else {
          type = 'function';
        }
        if (debug) {
          console.log('-'.repeat(40));
          console.log(`type = '${type}'`);
          console.log(`objType = '${objType}'`);
          console.log(`filePath = '${filePath}'`);
          console.log(`functionName = '${functionName}'`);
          console.log(`methodName = '${methodName}'`);
          console.log(`at ${line}:${column}`);
        }
        // --- Ignore this entry and any before it
        if (objType === 'ModuleJob') {
          break;
        }
        ({
          dir,
          name: stub,
          ext
        } = pathLib.parse(filePath));
        hFrame = {
          type,
          filePath,
          fileName: extractFileName(filePath),
          dir,
          stub,
          ext,
          functionName,
          line,
          column,
          isAsync: oSite.isAsync()
        };
        if (type === 'method') {
          hFrame.objType = objType;
          hFrame.methodName = methodName;
        }
        // --- If main body of a script, stop here
        if ((type === 'function') && notdefined(functionName)) {
          hFrame.type = 'script';
          delete hFrame.functionName;
          if (hFrame.ext === '.js') {
            debugger;
            mapJStoCoffee(hFrame);
          }
          lFrames.push(hFrame);
          break;
        }
        if (ext === '.js') {
          mapJStoCoffee(hFrame);
        }
        lFrames.push(hFrame);
      }
      return lFrames;
    };
    errObj = new Error();
    lStackFrames = errObj.stack;
    assert(lStackFrames.length > 0, "lStackFrames is empty!");
    // --- reset to previous values
    Error.stackTraceLimit = oldLimit;
    Error.prepareStackTrace = oldPreparer;
  } catch (error1) {
    e = error1;
    return [];
  }
  return lStackFrames;
};

// ---------------------------------------------------------------------------
// --- hFrame contains keys:
//        filePath
//        ext
//        line
//        column
export var mapJStoCoffee = (hFrame) => {
  var column, ext, filePath, hMapped, line, name, source;
  // --- Attempt to convert to original coffee file
  assert(hasKey(hFrame, 'filePath'));
  assert(hasKey(hFrame, 'fileName'));
  assert(hasKey(hFrame, 'ext'));
  assert(hasKey(hFrame, 'line'));
  assert(hasKey(hFrame, 'column'));
  ({filePath, ext, line, column} = hFrame);
  assert(ext === '.js', `ext = ${ext}`);
  hMapped = mapSourcePos(filePath, line, column);
  if (defined(hMapped)) {
    // --- successfully mapped
    ({source, line, column, name} = hMapped);
    hFrame.filePath = withExt(hFrame.filePath, '.coffee');
    hFrame.fileName = withExt(hFrame.fileName, '.coffee');
    hFrame.ext = '.coffee';
    hFrame.line = hMapped.line;
    hFrame.column = hMapped.column;
    hFrame.source = hMapped.source;
  }
};

// ---------------------------------------------------------------------------
export var parseFileURL = (url) => {
  var _, dir, ext, fileName, hParsed, lMatches, pathStr, stub;
  assert(defined(url), "url is undef in parseFileURL()");
  lMatches = url.match(/^file:\/\/(.*)$/);
  if (defined(lMatches)) {
    [_, pathStr] = lMatches;
    ({
      dir,
      base: fileName,
      name: stub,
      ext
    } = pathLib.parse(pathStr));
    if (defined(dir) && (dir.indexOf('/') === 0)) {
      dir = dir.substr(1); // --- strip leading '/'
    }
    return {
      dir,
      fileName,
      source: `${dir}/${fileName}`,
      stub,
      ext
    };
  } else {
    lMatches = url.match(/^node:internal\/(.*)$/);
    if (defined(lMatches)) {
      hParsed = {
        source: 'node'
      };
    } else {
      croak(`Invalid file url: '${url}'`);
    }
  }
  return hParsed;
};

// ---------------------------------------------------------------------------
export var getMyOutsideCaller = () => {
  var err, fileName, hNode, i, j, lStack, len;
  try {
    // --- Returned object has keys:
    //        type - eval | native | constructor | method | function
    //        functionName
    //        objType, methodName - if a method
    //        line
    //        column
    //        isAsync - if an async function
    lStack = getV8Stack();
  } catch (error1) {
    err = error1;
    console.log(`ERROR in getV8Stack(): ${err.message}`);
    return undef;
  }
  fileName = undef;
  for (i = j = 0, len = lStack.length; j < len; i = ++j) {
    hNode = lStack[i];
    if (fileName === undef) {
      fileName = hNode.fileName;
    } else if (hNode.fileName !== fileName) {
      return hNode;
    }
  }
  return undef;
};

// ---------------------------------------------------------------------------
export var getMyDirectCaller = () => {
  var err, lStack;
  try {
    // --- Returned object has keys:
    //        type - eval | native | constructor | method | function
    //        functionName
    //        objType, methodName - if a method
    //        line
    //        column
    //        isAsync - if an async function
    lStack = getV8Stack();
  } catch (error1) {
    err = error1;
    console.log(`ERROR in getV8Stack(): ${err.message}`);
    return undef;
  }
  return lStack[1];
};

// ---------------------------------------------------------------------------
export var debugV8Stack = (flag = true) => {
  internalDebugging = flag;
};

// ---------------------------------------------------------------------------
export var isFile = (filePath) => {
  var err, result;
  try {
    result = fs.lstatSync(filePath).isFile();
    return result;
  } catch (error1) {
    err = error1;
    return false;
  }
};

// ---------------------------------------------------------------------------
export var getV8StackStr = async(hOptions = {}) => {
  var hNode, lParts, lStack;
  lStack = (await getV8Stack(hOptions));
  lParts = (function() {
    var j, len, results;
    results = [];
    for (j = 0, len = lStack.length; j < len; j++) {
      hNode = lStack[j];
      results.push(nodeStr(hNode));
    }
    return results;
  })();
  return lParts.join("\n");
};

//# sourceMappingURL=v8-stack.js.map
