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
  words
} from '@jdeighan/llutils';

import {
  execCmd
} from '@jdeighan/llutils/exec-utils';

import {
  getArgs
} from '@jdeighan/llutils/cmd-args';

import {
  setProjType,
  promptForProjType,
  makeProjDir,
  typeSpecificSetup,
  checkIfInstalled,
  NodeEnv
} from '@jdeighan/llutils/proj-utils';

// ---------------------------------------------------------------------------
main = async() => {
  var clear, dirname, env_dev_installs, env_installs, hArgs, i, j, lNonOptions, len, len1, node, pkg, ref, ref1, type;
  checkIfInstalled('node', 'yarn');
  hArgs = getArgs({
    _: {
      exactly: 1,
      desc: "<dirname>"
    },
    c: {
      type: 'boolean',
      msg: 'clear out directory if it exists'
    },
    type: {
      type: 'string',
      desc: 'type of project',
      msg: 'website|parcel|vite|electron|codemirror|none'
    }
  });
  ({
    _: lNonOptions,
    c: clear,
    type
  } = hArgs);
  console.log("Starting make-new-project ");
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
  node = new NodeEnv('fixPkgJson');
  node.addDependency('@jdeighan/llutils');
  node.addDevDependency('concurrently');
  node.setField('description', `A ${type} app`);
  node.setField('packageManager', 'yarn@1.22.22');
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
  node.addDevDependency('coffeescript');
  node.addDevDependency('ava');
  typeSpecificSetup(node);
  node.write_pkg_json();
  return console.log(`Please run:
   cd ../${dirname}
   yarn
   npm run dev`);
};

// ---------------------------------------------------------------------------
main();

//# sourceMappingURL=make-new-project.js.map