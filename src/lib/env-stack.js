  // env-stack.coffee
import {
  undef,
  defined,
  notdefined,
  assert,
  croak
} from '@jdeighan/llutils';

// ---------------------------------------------------------------------------
export var EnvNode = class EnvNode {
  constructor() {
    this.definedSet = new Set();
  }

  // ..........................................................
  has(name) {
    return this.definedSet.has(name);
  }

  // ..........................................................
  addDefined(name) {
    return this.definedSet.add(name);
  }

};

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
export var EnvNodeStack = class EnvNodeStack {
  constructor() {
    this.topLevelEnv = new EnvNode();
    this.topLevelSet = this.topLevelEnv.definedSet;
    this.lEnvironments = [this.topLevelEnv];
  }

  // ..........................................................
  level() {
    return this.lEnvironments.length - 1;
  }

  // ..........................................................
  addEnv() {
    this.lEnvironments.push(new EnvNode());
  }

  // ..........................................................
  endEnv() {
    var env;
    assert(this.lEnvironments.length > 0, "No environments");
    env = this.lEnvironments.pop();
    assert(defined(env), "env not defined");
    assert(env instanceof EnvNode, "not an EnvNode");
  }

  // ..........................................................
  curenv() {
    return this.lEnvironments.at(-1);
  }

  // ..........................................................
  add(name) {
    return this.curenv().addDefined(name);
  }

  // ..........................................................
  inCurEnv(name) {
    var env, i, len, ref;
    ref = this.lEnvironments;
    for (i = 0, len = ref.length; i < len; i++) {
      env = ref[i];
      if (env.has(name)) {
        return true;
      }
    }
    return false;
  }

};

//# sourceMappingURL=env-stack.js.map
