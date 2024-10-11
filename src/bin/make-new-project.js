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
  lValidTypes,
  promptForProjType,
  makeProjDir,
  typeSpecificSetup,
  checkIfInstalled,
  NodeEnv,
  basicSetUp
} from '@jdeighan/llutils/proj-utils';

// ---------------------------------------------------------------------------
main = async() => {
  var clear, dirname, hArgs, lNonOptions, nodeEnv, subtype, type;
  checkIfInstalled('node', 'yarn');
  hArgs = getArgs({
    _: {
      min: 0,
      max: 1,
      desc: "<dirname>"
    },
    c: {
      type: 'boolean',
      msg: 'clear out directory if it exists'
    },
    type: {
      type: 'string',
      desc: 'type of project',
      msg: lValidTypes.join('|')
    }
  });
  ({
    _: lNonOptions,
    c: clear,
    type
  } = hArgs);
  if (notdefined(type)) {
    type = (await promptForProjType());
  }
  [type, subtype] = type.split('/', 2);
  if (defined(subtype)) {
    console.log(`type = ${OL(type + '/' + subtype)}`);
  } else {
    console.log(`type = ${OL(type)}`);
  }
  dirname = lNonOptions[0] || type;
  console.log(`make-new-project ${OL(type)} in dir ${OL(dirname)}`);
  nodeEnv = basicSetUp(dirname, {clear, type, subtype});
  typeSpecificSetup(nodeEnv, type, subtype);
  nodeEnv.write_pkg_json();
  return console.log(`Please run:
	cd ../${dirname}
	yarn
	npm run dev`);
};

// ---------------------------------------------------------------------------
main();

//# sourceMappingURL=make-new-project.js.map