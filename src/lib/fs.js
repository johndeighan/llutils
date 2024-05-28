// fs.coffee
import pathLib from 'node:path';

import urlLib from 'url';

import fs from 'fs';

import {
  globSync as glob
} from 'glob';

import NReadLines from 'n-readlines';

import {
  undef,
  defined,
  notdefined,
  words,
  isString,
  OL,
  assert,
  croak,
  arrayToBlock,
  getOptions
} from '@jdeighan/llutils';

import {
  isMetaDataStart,
  convertMetaData
} from '@jdeighan/llutils/metadata';

export var lStatFields = words('dev ino mode nlink uid gid rdev size blksize blocks', 'atimeMs mtimeMs ctimeMs birthtimeMs', 'atime mtime ctime birthtime');

// ---------------------------------------------------------------------------
export var isProjRoot = (dir = '.', hOptions = {}) => {
  var dirPath, filePath, i, j, lExpectedDirs, lExpectedFiles, len, len1, name, strict;
  ({strict} = getOptions(hOptions, {
    strict: false
  }));
  filePath = `${dir}/package.json`;
  if (!isFile(filePath)) {
    return false;
  }
  if (!strict) {
    return true;
  }
  lExpectedFiles = ['package-lock.json', 'README.md', '.gitignore'];
  for (i = 0, len = lExpectedFiles.length; i < len; i++) {
    name = lExpectedFiles[i];
    filePath = `${dir}/${name}`;
    if (!isFile(filePath)) {
      return false;
    }
  }
  lExpectedDirs = ['node_modules', '.git', 'src', 'src/lib', 'src/bin', 'test'];
  for (j = 0, len1 = lExpectedDirs.length; j < len1; j++) {
    name = lExpectedDirs[j];
    dirPath = `${dir}/${name}`;
    if (!isDir(dirPath)) {
      return false;
    }
  }
  return true;
};

// ---------------------------------------------------------------------------
// All file/directory operations should operate from memory
//    and can therefore be synchronous
// Relies on the fact that modern OS's keep directory
//    information in memory
// ---------------------------------------------------------------------------
//     convert \ to /
// --- convert "C:..." to "c:..."
export var normalize = (path) => {
  path = path.replaceAll('\\', '/');
  if (path.charAt(1) === ':') {
    return path.charAt(0).toLowerCase() + path.substring(1);
  } else {
    return path;
  }
};

// ---------------------------------------------------------------------------
// --- Should be called like: myself(import.meta.url)
//     returns full path of current file
export var myself = (url) => {
  var path;
  path = urlLib.fileURLToPath(url);
  return normalize(path);
};

// ---------------------------------------------------------------------------
export var mkpath = (...lParts) => {
  var fullPath;
  fullPath = pathLib.resolve(...lParts);
  return normalize(fullPath);
};

// ---------------------------------------------------------------------------
export var relpath = (...lParts) => {
  var fullPath;
  fullPath = pathLib.resolve(...lParts);
  return normalize(pathLib.relative('', fullPath));
};

// ---------------------------------------------------------------------------
export var fileDir = (filePath) => {
  var h;
  h = pathLib.parse(filePath);
  return h.dir;
};

// ---------------------------------------------------------------------------
// --- returned hash has keys:

//  dev: 2114,
//  ino: 48064969,
//  mode: 33188,
//  nlink: 1,
//  uid: 85,
//  gid: 100,
//  rdev: 0,
//  size: 527,
//  blksize: 4096,
//  blocks: 8,
//  atimeMs: 1318289051000.1,
//  mtimeMs: 1318289051000.1,
//  ctimeMs: 1318289051000.1,
//  birthtimeMs: 1318289051000.1,
//  atime: Mon, 10 Oct 2011 23:24:11 GMT,
//  mtime: Mon, 10 Oct 2011 23:24:11 GMT,
//  ctime: Mon, 10 Oct 2011 23:24:11 GMT,
//  birthtime: Mon, 10 Oct 2011 23:24:11 GMT
export var getFileStats = (path) => {
  return fs.lstatSync(path);
};

// ---------------------------------------------------------------------------
export var isDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    return false;
  }
  try {
    return getFileStats(dirPath).isDirectory();
  } catch (error) {
    return false;
  }
};

// ---------------------------------------------------------------------------
export var clearDir = (dirPath) => {
  var ent, err, hOptions, i, len, ref;
  try {
    hOptions = {
      withFileTypes: true,
      recursive: true
    };
    ref = fs.readdirSync(dirPath, hOptions);
    for (i = 0, len = ref.length; i < len; i++) {
      ent = ref[i];
      if (ent.isFile()) {
        fs.rmSync(mkpath(ent.path, ent.name));
      }
    }
  } catch (error) {
    err = error;
  }
};

// ---------------------------------------------------------------------------
export var mkDir = (dirPath, hOptions = {}) => {
  var err;
  try {
    fs.mkdirSync(dirPath);
    return true;
  } catch (error) {
    err = error;
    if (err.code === 'EEXIST') {
      if (hOptions.clear) {
        clearDir(dirPath);
      }
      return false;
    } else {
      throw err;
    }
  }
};

// ---------------------------------------------------------------------------
export var touch = (filePath) => {
  var fd;
  fd = fs.openSync(filePath, 'a');
  fs.closeSync(fd);
};

// ---------------------------------------------------------------------------
export var isFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return false;
  }
  try {
    return getFileStats(filePath).isFile();
  } catch (error) {
    return false;
  }
};

// ---------------------------------------------------------------------------
// --- returns one of:
//        'missing'  - does not exist
//        'dir'      - is a directory
//        'file'     - is a file
//        'unknown'  - exists, but not a file or directory
export var pathType = (fullPath) => {
  assert(isString(fullPath), "not a string");
  if (fs.existsSync(fullPath)) {
    if (isFile(fullPath)) {
      return 'file';
    } else if (isDir(fullPath)) {
      return 'dir';
    } else {
      return 'unknown';
    }
  } else {
    return 'missing';
  }
};

// ---------------------------------------------------------------------------
export var parsePath = (path) => {
  var base, dir, ext, hFile, lMatches, name, purpose, root, type;
  // --- NOTE: path may be a file URL, e.g. import.meta.url
  //           path may be a relative path
  assert(isString(path), `path is type ${typeof path}`);
  if (path.match(/^file\:\/\//)) {
    path = normalize(urlLib.fileURLToPath(path));
  } else {
    // --- handles relative paths
    path = normalize(pathLib.resolve(path));
  }
  type = pathType(path);
  ({root, dir, base, name, ext} = pathLib.parse(path));
  if (lMatches = name.match(/\.([A-Za-z_]+)$/)) {
    purpose = lMatches[1];
  } else {
    purpose = undef;
  }
  hFile = {
    path,
    filePath: path,
    type,
    root,
    dir,
    base,
    fileName: base, // my preferred name
    name, // use this for directory name
    stub: name, // my preferred name
    ext,
    purpose
  };
  if (isFile(path)) {
    Object.assign(hFile, getFileStats(path));
  }
  return hFile;
};

// ---------------------------------------------------------------------------
export var parentDir = (path) => {
  var hParsed;
  hParsed = parsePath(path);
  return hParsed.dir;
};

// ---------------------------------------------------------------------------
export var parallelPath = (path, name = "temp") => {
  var _, dir, fileName, fullPath, lMatches, subpath;
  fullPath = mkpath(path); // make full path with '/' as separator
  ({dir, fileName} = parsePath(fullPath));
  if ((lMatches = dir.match(/^(.*)\/[^\/]+$/))) { // separator
    // final dir name
    [_, subpath] = lMatches;
    return `${subpath}/${name}/${fileName}`;
  } else {
    return croak(`Can't get parallelPath for '${path}'`);
  }
};

// ---------------------------------------------------------------------------
export var subPath = (path, name = "temp") => {
  var dir, fileName, fullPath;
  fullPath = mkpath(path); // make full path with '/' as separator
  ({dir, fileName} = parsePath(fullPath));
  return `${dir}/${name}/${fileName}`;
};

// ---------------------------------------------------------------------------
//   slurp - read a file into a string
export var slurp = (filePath, hOptions) => {
  var block;
  assert(isString(filePath, 'nonEmpty'), "empty path");
  filePath = mkpath(filePath);
  assert(isFile(filePath), `Not a file: ${OL(filePath)}`);
  block = fs.readFileSync(filePath, 'utf8').toString().replaceAll('\r', '');
  return block;
};

// ---------------------------------------------------------------------------
//   barf - write a string to a file
//          will ensure that all necessary directories exist
export var barf = (text, filePath) => {
  mkDirsForFile(filePath);
  fs.writeFileSync(filePath, text);
};

// ---------------------------------------------------------------------------
export var pathSubDirs = (filePath) => {
  var dir, root;
  ({root, dir} = pathLib.parse(filePath));
  return {
    root,
    lParts: dir.slice(root.length).split(/[\\\/]/)
  };
};

// ---------------------------------------------------------------------------
export var mkDirsForFile = (filePath) => {
  var dir, i, lParts, len, part, root;
  ({root, lParts} = pathSubDirs(filePath));
  dir = root;
  for (i = 0, len = lParts.length; i < len; i++) {
    part = lParts[i];
    dir += `/${part}`;
    if (!isDir(dir)) {
      mkDir(dir);
    }
  }
};

// ---------------------------------------------------------------------------
// --- yield hFile with keys:
//        path, filePath
//        type
//        root
//        dir
//        base, fileName
//        name, stub
//        ext
//        purpose
//     ...plus stat fields
export var globFiles = function*(pattern = '*', hGlobOptions = {}) {
  var base, dir, ent, ext, filePath, hFile, i, j, key, lMatches, len, len1, name, purpose, ref, root, type;
  hGlobOptions = getOptions(hGlobOptions, {
    withFileTypes: true,
    stat: true
  });
  ref = glob(pattern, hGlobOptions);
  for (i = 0, len = ref.length; i < len; i++) {
    ent = ref[i];
    filePath = mkpath(ent.fullpath());
    ({root, dir, base, name, ext} = pathLib.parse(filePath));
    if (lMatches = name.match(/\.([A-Za-z_]+)$/)) {
      purpose = lMatches[1];
    } else {
      purpose = undef;
    }
    if (ent.isDirectory()) {
      type = 'dir';
    } else if (ent.isFile()) {
      type = 'file';
    } else {
      type = 'unknown';
    }
    hFile = {
      filePath,
      path: filePath,
      relPath: relpath(filePath),
      type,
      root,
      dir,
      base,
      fileName: base,
      name,
      stub: name,
      ext,
      purpose
    };
    for (j = 0, len1 = lStatFields.length; j < len1; j++) {
      key = lStatFields[j];
      hFile[key] = ent[key];
    }
    yield hFile;
  }
};

// ---------------------------------------------------------------------------
export var allFilesMatching = function*(pattern = '*', hOptions = {}) {
  var fileFilter, h, hGlobOptions, ref;
  // --- yields hFile with keys:
  //        path, filePath,
  //        type, root, dir, base, fileName,
  //        name, stub, ext, purpose
  //        (if eager) hMetaData, lLines
  // --- Valid options:
  //        hGlobOptions - options to pass to glob
  //        fileFilter - return path iff fileFilter(filePath) returns true
  //        eager - read the file and add keys hMetaData, lLines
  // --- Valid glob options:
  //        ignore - glob pattern for files to ignore
  //        dot - include dot files/directories (default: false)
  //        cwd - change working directory
  ({hGlobOptions, fileFilter} = getOptions(hOptions, {
    hGlobOptions: {
      ignore: "node_modules"
    },
    fileFilter: (h) => {
      var path;
      ({
        filePath: path
      } = h);
      return isFile(path) && !path.match(/\bnode_modules\b/i);
    }
  }));
  ref = globFiles(pattern, hGlobOptions);
  for (h of ref) {
    if (fileFilter(h)) {
      yield h;
    }
  }
};

// ---------------------------------------------------------------------------
export var allLinesIn = function*(filePath, filterFunc = undef) {
  var buffer, nReader, result;
  assert(isFile(filePath), `No such file: ${OL(filePath)}`);
  nReader = new NReadLines(filePath);
  while (true) {
    buffer = nReader.next();
    if (buffer === false) {
      return;
    }
    result = buffer.toString().replaceAll('\r', '');
    yield result;
  }
};

// ---------------------------------------------------------------------------
export var fileExt = (filePath) => {
  var lMatches;
  if (lMatches = filePath.match(/\.[^\.]+$/)) {
    return lMatches[0];
  } else {
    return '';
  }
};

// ---------------------------------------------------------------------------
export var withExt = (filePath, newExt) => {
  var _, lMatches, pre;
  if (newExt.indexOf('.') !== 0) {
    newExt = '.' + newExt;
  }
  if (lMatches = filePath.match(/^(.*)\.[^\.]+$/)) {
    [_, pre] = lMatches;
    return pre + newExt;
  }
  throw new Error(`Bad path: '${filePath}'`);
};

// ---------------------------------------------------------------------------
export var newerDestFilesExist = (srcPath, ...lDestPaths) => {
  var destModTime, destPath, i, len, srcModTime;
  for (i = 0, len = lDestPaths.length; i < len; i++) {
    destPath = lDestPaths[i];
    if (!fs.existsSync(destPath)) {
      return false;
    }
    srcModTime = fs.statSync(srcPath).mtimeMs;
    destModTime = fs.statSync(destPath).mtimeMs;
    if (destModTime < srcModTime) {
      return false;
    }
  }
  return true;
};

// ---------------------------------------------------------------------------
export var readTextFile = (filePath) => {
  var block, firstLine, getLine, hMetaData, lMetaLines, line, nReader;
  // --- returns {hMetaData, reader, nLines}
  assert(isFile(filePath), `No such file: ${filePath}`);
  nReader = new NReadLines(filePath);
  getLine = () => {
    var buffer;
    buffer = nReader.next();
    if (buffer === false) {
      nReader = undef; // prevent further reads
      return undef;
    }
    return buffer.toString().replaceAll('\r', '');
  };
  // --- we need to get the first line to check if
  //     there's metadata. But if there is not,
  //     we need to return it by the reader
  firstLine = getLine();
  if (notdefined(firstLine)) {
    return {
      hMetaData: {},
      reader: function() {
        return undef;
      },
      nLines: 0
    };
  }
  lMetaLines = undef;
  hMetaData = {};
  // --- Get metadata if present
  if (isMetaDataStart(firstLine)) {
    lMetaLines = [];
    line = getLine();
    while (line && (line !== firstLine)) {
      lMetaLines.push(line);
      line = getLine();
    }
    block = arrayToBlock(lMetaLines);
    hMetaData = convertMetaData(firstLine, block);
  }
  return {
    hMetaData,
    reader: function*() {
      if (notdefined(lMetaLines)) {
        yield firstLine;
      }
      line = getLine();
      while (defined(line)) {
        yield line;
        line = getLine();
      }
    },
    nLines: defined(lMetaLines) ? lMetaLines.length + 2 : 0
  };
};

// ---------------------------------------------------------------------------
//    Get path to parent directory of a directory
export var getParentDir = (dir) => {
  var hParts;
  hParts = pathLib.parse(dir);
  if (hParts.dir === hParts.root) {
    return undef;
  }
  return mkpath(pathLib.resolve(dir, '..'));
};

// ---------------------------------------------------------------------------
//    Get all subdirectories of a directory
//       don't return hidden or system subdirectories
//    Return value is just a name, not full paths
export var getSubDirs = (dir) => {
  var doInclude, hOptions;
  assert(isDir(dir), `not a directory: ${OL(dir)}`);
  doInclude = function(d) {
    var dirName;
    if (!d.isDirectory()) {
      return false;
    }
    dirName = d.name;
    if (dir === '$Recycle.Bin' || dir === '$WinREAgent') {
      return false;
    }
    if (dirName.indexOf('.') === 0) {
      return false;
    }
    return true;
  };
  hOptions = {
    withFileTypes: true,
    recursive: false
  };
  return fs.readdirSync(dir, hOptions).filter(doInclude).map(function(d) {
    return d.name;
  }).sort();
};

// ---------------------------------------------------------------------------
// searches downward. Returns a single path or undef
export var pathTo = (fileName, hOptions = {}) => {
  var dir, filePath, i, len, ref, subdir;
  ({dir} = getOptions(hOptions, {
    dir: undef
  }));
  if (defined(dir)) {
    assert(isDir(dir), `Not a directory: ${OL(dir)}`);
  } else {
    dir = process.cwd();
  }
  // --- first check if the file is in dir
  filePath = mkpath(dir, fileName);
  if (isFile(filePath)) {
    return filePath;
  }
  ref = getSubDirs(dir);
  // --- Search all directories in this directory
  //     getSubDirs() returns dirs sorted alphabetically
  for (i = 0, len = ref.length; i < len; i++) {
    subdir = ref[i];
    filePath = pathTo(fileName, {
      dir: mkpath(dir, subdir)
    });
    if (defined(filePath)) {
      return filePath;
    }
  }
  return undef;
};

// ---------------------------------------------------------------------------
// searches upward. Yields multiple files
export var allPathsTo = function*(fileName, hOptions = {}) {
  var dir, filePath;
  ({dir} = getOptions(hOptions, {
    dir: undef
  }));
  if (defined(dir)) {
    assert(isDir(dir), `Not a directory: ${OL(dir)}`);
  } else {
    dir = process.cwd();
  }
  // --- first check if the file is in dir
  filePath = mkpath(dir, fileName);
  if (isFile(filePath)) {
    yield filePath;
  }
  while (defined(dir = getParentDir(dir))) {
    filePath = mkpath(dir, fileName);
    if (isFile(filePath)) {
      yield filePath;
    }
  }
};

//# sourceMappingURL=fs.js.map
