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
  getArgs
} from '@jdeighan/llutils/cmd-args';

import {
  setProjType,
  promptForProjType,
  makeProjDir,
  init_git,
  make_dirs,
  init_npm,
  addDep,
  addDevDep,
  addReadMe,
  addGitIgnore,
  addNpmRc,
  typeSpecificSetup,
  write_pkg_json
} from '@jdeighan/llutils/proj-utils';

console.log("Starting make-new-project");

// ---------------------------------------------------------------------------
main = async() => {
  var clear, dirname, env_dev_installs, env_installs, i, j, lNonOptions, len, len1, pkg, ref, ref1, type;
  ({
    _: lNonOptions,
    c: clear,
    type
  } = getArgs(undef, {
    _: [1, 1],
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
  make_dirs();
  init_git();
  init_npm();
  addReadMe();
  addGitIgnore();
  addNpmRc();
  // === Install libraries specified via env vars
  env_installs = process.env.PROJECT_INSTALLS;
  if (nonEmpty(env_installs)) {
    ref = words(env_installs);
    for (i = 0, len = ref.length; i < len; i++) {
      pkg = ref[i];
      addDep(pkg);
    }
  }
  env_dev_installs = process.env.PROJECT_DEV_INSTALLS;
  if (nonEmpty(env_dev_installs)) {
    ref1 = words(env_dev_installs);
    for (j = 0, len1 = ref1.length; j < len1; j++) {
      pkg = ref1[j];
      addDevDep(pkg);
    }
  }
  addDevDep('ava');
  typeSpecificSetup();
  write_pkg_json();
  return console.log("DONE");
};

// ---------------------------------------------------------------------------
main();

//# sourceMappingURL=make-new-project.js.map
