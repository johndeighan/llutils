// pkg-json.coffee
var getVersion;

import {
  undef,
  defined,
  notdefined,
  isEmpty,
  nonEmpty,
  hasKey,
  assert,
  croak,
  OL,
  getOptions
} from '@jdeighan/llutils';

import {
  slurpPkgJSON,
  slurpJSON,
  barfJSON,
  barfPkgJSON,
  createFile,
  touch
} from '@jdeighan/llutils/fs';

// ---------------------------------------------------------------------------
// --- 1. Read in current package.json
//     2. If option 'fix':
//        - get keys from env var PROJECT_PACKAGE_JSON
//        - overwrite keys in package.json
//        - adjust name if env var PROJECT_NAME_PREFIX is set
export var PkgJson = class PkgJson {
  constructor(hOptions = {}) {
    var fix, prefix;
    ({fix} = getOptions(hOptions, {
      fix: false
    }));
    this.hJson = slurpPkgJSON();
    if (fix) {
      this.mergeKeysFromEnv();
      prefix = process.env.PROJECT_NAME_PREFIX;
      if (nonEmpty(prefix)) {
        this.setField('name', `${prefix}${this.hJson.name}`);
      }
      this.setField('license', 'MIT');
      this.addDep('@jdeighan/llutils');
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

  // ..........................................................
  name() {
    return this.hJson.name;
  }

  // ..........................................................
  setField(name, value) {
    this.hJson[name] = value;
    console.log(`   ${name} = ${OL(value)}`);
  }

  // ..........................................................
  addScript(name, str) {
    if (!hasKey(this.hJson, 'scripts')) {
      this.hJson.scripts = {};
    }
    this.hJson.scripts[name] = str;
    console.log(`   SCRIPT ${name} = ${OL(str)}`);
  }

  // ..........................................................
  addExport(name, str) {
    if (!hasKey(this.hJson, 'exports')) {
      this.hJson.exports = {};
    }
    this.hJson.exports[name] = str;
    console.log(`   EXPORT ${name} = ${OL(str)}`);
  }

  // ..........................................................
  addBin(name, str) {
    if (!hasKey(this.hJson, 'bin')) {
      this.hJson.bin = {};
    }
    this.hJson.bin[name] = str;
    console.log(`   BIN ${name} = ${OL(str)}`);
  }

  // ..........................................................
  addDep(pkg) {
    var ref, ref1, version;
    if (!hasKey(this.hJson, 'dependencies')) {
      this.hJson.dependencies = {};
    }
    if ((ref = this.hJson) != null ? (ref1 = ref.devDependencies) != null ? ref1.pkg : void 0 : void 0) {
      delete this.hJson.devDependencies.pkg;
    }
    version = getVersion(pkg);
    this.hJson.dependencies[pkg] = version;
    console.log(`   DEP ${pkg} = ${OL(version)}`);
  }

  // ..........................................................
  addDevDep(pkg) {
    var ref, version;
    if (!hasKey(this.hJson, 'devDependencies')) {
      this.hJson.devDependencies = {};
    }
    if ((ref = this.hJson) != null ? ref.dependencies.pkg : void 0) {
      delete this.hJson.dependencies.pkg;
    }
    version = getVersion(pkg);
    this.hJson.devDependencies[pkg] = version;
    console.log(`   DEV DEP ${pkg} = ${OL(version)}`);
  }

  // ..........................................................
  isInstalled(pkg) {
    return hasKey(this.hJson.dependencies, pkg) || hasKey(this.hJson.devDependencies, pkg);
  }

  // ..........................................................
  write() {
    barfPkgJSON(this.hJson);
  }

};

// ---------------------------------------------------------------------------
getVersion = (pkg) => {
  switch (pkg) {
    case 'coffeescript':
      return "^2.7.0";
    case 'ava':
      return "^6.1.3";
    case 'svelte':
      return "^5.0.0-next.200";
    case 'gulp':
      return "^5.0.0";
    case 'parcel':
      return "^2.12.0";
    default:
      return 'latest';
  }
};

//# sourceMappingURL=pkg-json.js.map
