#!/usr/bin/env node
// make-new-project.coffee

// --- Before running, set these environment variables:
//        PROJECT_ROOT_DIR - directory where you add projects
//        PROJECT_PACKAGE_JSON - JSON string or file path
//           - should have 'author' key
//        PROJECT_INSTALLS - comma sep list of pkgs to install
//        PROJECT_DEV_INSTALLS - comma sep list of dev pkgs to install
//        PROJECT_NAME_PREFIX - e.g. '@jdeighan/' to prepend this to proj name

//     Usage: mnp <dirname>
//        -c - clear out any existing directory
//        -type=(website|electron|codemirror|parcel)
var main;

import {
  undef,
  defined,
  notdefined,
  OL,
  nonEmpty,
  assert,
  words,
  execCmd
} from '@jdeighan/llutils';

import {
  getArgs
} from '@jdeighan/llutils/cmd-args';

import {
  setProjType,
  promptForProjType,
  makeProjDir,
  typeSpecificSetup,
  checkInstall
} from '@jdeighan/llutils/proj-utils';

import {
  NodeEnv
} from '@jdeighan/llutils/node-env';

console.log("Starting make-new-project");

// ---------------------------------------------------------------------------
main = async() => {
  var clear, dirname, env_dev_installs, env_installs, i, j, lNonOptions, len, len1, node, pkg, ref, ref1, type;
  checkInstall('node');
  checkInstall('pnpm');
  ({
    _: lNonOptions,
    c: clear,
    type
  } = getArgs({
    _: {
      exactly: 1
    },
    c: 'boolean',
    type: 'string'
  }));
  if (defined(type)) {
    setProjType(type);
  } else {
    await promptForProjType();
  }
  dirname = lNonOptions[0];
  makeProjDir(dirname, {clear}); // also cd's to proj dir
  execCmd("git init");
  execCmd("git branch -m main");
  execCmd("npm init -y");
  node = new NodeEnv('fix');
  node.setField('description', `A ${type} app`);
  node.addFile('README.md');
  node.addFile('.gitignore');
  node.addFile('.npmrc');
  // === Install libraries specified via env vars
  env_installs = process.env.PROJECT_INSTALLS;
  if (nonEmpty(env_installs)) {
    ref = words(env_installs);
    for (i = 0, len = ref.length; i < len; i++) {
      pkg = ref[i];
      node.addDependency(pkg);
    }
  }
  env_dev_installs = process.env.PROJECT_DEV_INSTALLS;
  if (nonEmpty(env_dev_installs)) {
    ref1 = words(env_dev_installs);
    for (j = 0, len1 = ref1.length; j < len1; j++) {
      pkg = ref1[j];
      node.addDevDependency(pkg);
    }
  }
  node.addDevDependency('ava');
  typeSpecificSetup(node);
  node.write_pkg_json();
  return console.log(`Please run:
   cd ../${dirname}
   pnpm install
   parcel`);
};

// ---------------------------------------------------------------------------
main();

//# sourceMappingURL=make-new-project.js.map
