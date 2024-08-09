// node-env.coffee
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
  touch,
  slurp,
  barf
} from '@jdeighan/llutils/fs';

// ---------------------------------------------------------------------------
// --- 1. Read in current package.json
//     2. If option 'fix':
//        - get keys from env var PROJECT_PACKAGE_JSON
//        - overwrite keys in package.json
//        - adjust name if env var PROJECT_NAME_PREFIX is set
export var NodeEnv = class NodeEnv {
  constructor(hOptions = {}) {
    var fixPkgJson, prefix;
    ({fixPkgJson} = getOptions(hOptions, {
      fixPkgJson: false
    }));
    this.hJson = slurpPkgJSON();
    if (fixPkgJson) {
      this.mergeKeysFromEnv();
      prefix = process.env.PROJECT_NAME_PREFIX;
      if (nonEmpty(prefix) && !this.hJson.name.startsWith(prefix)) {
        this.setField('name', `${prefix}${this.hJson.name}`);
      }
      this.setField('license', 'MIT');
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
  getField(name) {
    return this.hJson[name];
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
  addUserBin(name) {
    barf(`# --- ${name}.coffee

`, `./src/bin/${name}.coffee`);
    if (!hasKey(this.hJson, 'bin')) {
      this.hJson.bin = {};
    }
    this.hJson.bin[name] = `./src/bin/${name}.js`;
    console.log(`   ADD BIN ${name}`);
  }

  // ..........................................................
  addUserLib(name) {
    barf(`# --- ${name}.coffee

`, `./src/lib/${name}.coffee`);
    // --- Add a unit test
    barf(`# --- ${name}.test.offee

import * as lib from './${name}'
Object.assign(global, lib)
import * as lib2 from '@jdeighan/llutils/utest'
Object.assign(global, lib2)

equal 2+2, 4`, `./test/${name}.test.coffee`);
    this.addExport(`./${name}`, `./src/lib/${name}.js`);
    if (!hasKey(this.hJson, 'bin')) {
      this.hJson.bin = {};
    }
    this.hJson.bin[name] = `./src/bin/${name}.js`;
    console.log(`   ADD BIN ${name}`);
  }

  // ..........................................................
  addUserElement(name) {
    barf(`<!-- ${name}.svelte -->
<svelte:options customElement="${name}" />
<p>A new element</p>
`, `./src/elements/${name}.svelte`);
    this.addExport(`./${name}`, `./src/elements/${name}.js`);
    console.log(`   ADD ELEMENT ${name}`);
  }

  // ..........................................................
  hasDep(pkg) {
    if (hasKey(this.hJson, 'dependencies')) {
      return hasKey(this.hJson.dependencies, pkg);
    } else {
      return false;
    }
  }

  // ..........................................................
  hasDevDep(pkg) {
    if (hasKey(this.hJson, 'devDependencies')) {
      return hasKey(this.hJson.devDependencies, pkg);
    } else {
      return false;
    }
  }

  // ..........................................................
  removeDep(pkg) {
    if (this.hasDep(pkg)) {
      delete this.hJson.dependencies[pkg];
    }
    if (this.hasDevDep(pkg)) {
      delete this.hJson.devDependencies[pkg];
    }
  }

  // ..........................................................
  addDependency(pkg) {
    var version;
    if (!hasKey(this.hJson, 'dependencies')) {
      this.hJson.dependencies = {};
    }
    this.removeDep(pkg);
    version = getVersion(pkg);
    this.hJson.dependencies[pkg] = version;
    console.log(`   DEP ${pkg} = ${OL(version)}`);
  }

  // ..........................................................
  addDevDependency(pkg) {
    var version;
    if (!hasKey(this.hJson, 'devDependencies')) {
      this.hJson.devDependencies = {};
    }
    this.removeDep(pkg);
    version = getVersion(pkg);
    this.hJson.devDependencies[pkg] = version;
    console.log(`   DEV DEP ${pkg} = ${OL(version)}`);
  }

  // ..........................................................
  isInstalled(pkg) {
    return hasKey(this.hJson.dependencies, pkg) || hasKey(this.hJson.devDependencies, pkg);
  }

  // ..........................................................
  write_pkg_json() {
    this.addExport("./package.json", "./package.json");
    barfPkgJSON(this.hJson);
  }

  // ..........................................................
  addFile(fileName, contents = undef) {
    console.log(`Creating standard file ${OL(fileName)}`);
    switch (fileName) {
      case 'README.md':
        barf(contents || `README.md file
==============

`, "./README.md");
        break;
      case '.gitignore':
        barf(contents || `logs/
node_modules/
typings/
*.tsbuildinfo
.npmrc
/build
/public
/dist

# dotenv environment variables file
.env
.env.test

test/temp*.*
/.svelte-kit`, "./.gitignore");
        break;
      case '.npmrc':
        barf(contents || `engine-strict=true
# --- loglevel can be silent or warn
loglevel=silent`, "./.npmrc");
        break;
      default:
        croak(`addFile ${OL(fileName)} not implemented`);
    }
  }

};

// ---------------------------------------------------------------------------
getVersion = (pkg) => {
  switch (pkg) {
    case 'coffeescript':
      return "^2.7.0";
    case 'concurrently':
      return "^8.2.2";
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

//# sourceMappingURL=node-env.js.map
