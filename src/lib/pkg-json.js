  // pkg-json.coffee
import {
  undef,
  defined,
  notdefined,
  isEmpty,
  nonEmpty,
  getOptions,
  hasKey,
  assert,
  croak
} from '@jdeighan/llutils';

import {
  slurpJSON,
  barfJSON,
  createFile,
  touch
} from '@jdeighan/llutils/fs';

// ---------------------------------------------------------------------------
// --- 1. Read in current package.json
//     2. get keys from env var PROJECT_PACKAGE_JSON
//     3. overwrite keys in package.json with #2 keys
//     4. adjust name if env var PROJECT_NAME_PREFIX is set
export var PkgJson = class PkgJson {
  constructor(hOptions = {}) {
    var llutils, prefix;
    // ..........................................................
    this.setField = this.setField.bind(this);
    // ..........................................................
    this.addScript = this.addScript.bind(this);
    // ..........................................................
    this.addExport = this.addExport.bind(this);
    // ..........................................................
    this.addBin = this.addBin.bind(this);
    // ..........................................................
    this.addDep = this.addDep.bind(this);
    // ..........................................................
    this.addDevDep = this.addDevDep.bind(this);
    // ..........................................................
    this.isInstalled = this.isInstalled.bind(this);
    ({llutils} = getOptions(hOptions, {
      llutils: true
    }));
    this.hJson = slurpJSON('./package.json');
    this.mergeKeysFromEnv();
    prefix = process.env.PROJECT_NAME_PREFIX;
    if (nonEmpty(prefix)) {
      this.setField('name', `${prefix}${this.hJson.name}`);
    }
    if (llutils && !isInstalled('@jdeighan/llutils')) {
      addDep('@jdeighan/llutils', 'latest');
    }
  }

  // ..........................................................
  mergeKeysFromEnv() {
    var hSetKeys, pkgJson;
    pkgJson = process.env.PROJECT_PACKAGE_JSON;
    if (nonEmpty(pkgJson)) {
      // --- Can be either a JSON string or a file path
      if (pkgJson.indexOf('{') === 0) {
        hSetKeys = JSON.parse(pkgJson);
      } else {
        hSetKeys = slurpJSON(pkgJson);
      }
      Object.assign(this.hJson, hSetKeys);
    }
  }

  setField(name, value) {
    this.hJson[name] = value;
  }

  addScript(name, str) {
    if (!hasKey(hJson, 'scripts')) {
      this.hJson.scripts = {};
    }
    this.hJson.scripts[name] = str;
  }

  addExport(name, str) {
    if (!hasKey(hJson, 'exports')) {
      this.hJson.exports = {};
    }
    this.hJson.exports[name] = str;
  }

  addBin(name, str) {
    if (!hasKey(hJson, 'bin')) {
      this.hJson.bin = {};
    }
    this.hJson.bin[name] = str;
  }

  addDep(pkg, version) {
    var ref;
    if (!hasKey(hJson, 'dependencies')) {
      this.hJson.dependencies = {};
    }
    if ((ref = this.hJson) != null ? ref.devDependencies.pkg : void 0) {
      delete this.hJson.devDependencies.pkg;
    }
    this.hJson.dependencies[pkg] = version;
  }

  addDevDep(pkg, version) {
    var ref;
    if (!hasKey(hJson, 'devDependencies')) {
      this.hJson.devDependencies = {};
    }
    if ((ref = this.hJson) != null ? ref.dependencies.pkg : void 0) {
      delete this.hJson.dependencies.pkg;
    }
    this.hJson.devDependencies[pkg] = version;
  }

  isInstalled(hJson, pkg) {
    return hasKey(hJson.dependencies, pkg) || hasKey(hJson.devDependencies, pkg);
  }

};

// ---------------------------------------------------------------------------

//# sourceMappingURL=pkg-json.js.map
