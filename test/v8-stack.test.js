  // v8-stack.test.coffee
import {
  undef,
  defined,
  notdefined,
  assert,
  croak
} from '@jdeighan/llutils';

import * as lib from '@jdeighan/llutils/v8-stack';

Object.assign(global, lib);

import * as lib2 from '@jdeighan/llutils/utest';

Object.assign(global, lib2);

import {
  getBoth
} from './v8-stack/v8-module.js';

// ---------------------------------------------------------------------------
(function() {
  var func1, func2, main, stack1, stack2;
  stack1 = undef;
  stack2 = undef;
  main = function() {
    func1();
    return func2();
  };
  func1 = function() {
    return stack1 = getV8Stack();
  };
  func2 = function() {
    stack2 = getV8Stack();
  };
  main();
  like(stack1, [
    {
      functionName: 'func1'
    }
  ]);
  return like(stack2, [
    {
      functionName: 'func2'
    }
  ]);
})();

// ---------------------------------------------------------------------------
(function() {
  var caller1, caller2, func1, func2, main;
  caller1 = undef;
  caller2 = undef;
  main = function() {
    func1();
    return func2();
  };
  func1 = function() {
    return caller1 = getMyDirectCaller();
  };
  func2 = function() {
    caller2 = getMyDirectCaller();
  };
  main();
  like(caller1, {
    functionName: 'main',
    fileName: 'v8-stack.test.coffee'
  });
  return like(caller2, {
    functionName: 'main',
    fileName: 'v8-stack.test.coffee'
  });
})();

// ---------------------------------------------------------------------------
(function() {
  var func1, func2, hCaller, main;
  hCaller = undef;
  main = function() {
    func1();
    return func2();
  };
  func1 = function() {};
  func2 = function() {
    hCaller = getMyDirectCaller();
  };
  // ------------------------------------------------------------------------
  main();
  return like(hCaller, {
    type: 'function',
    functionName: 'main',
    fileName: 'v8-stack.test.coffee'
  });
})();

// ---------------------------------------------------------------------------
(function() {
  var func1, func2, lCallers1, lCallers2, main;
  lCallers1 = undef;
  lCallers2 = undef;
  main = function() {
    func1();
    return func2();
  };
  func1 = function() {
    return lCallers1 = getBoth();
  };
  func2 = function() {
    lCallers2 = getBoth();
  };
  main();
  like(lCallers1[0], {
    type: 'function',
    functionName: 'secondFunc',
    fileName: 'v8-module.coffee'
  });
  like(lCallers1[1], {
    type: 'function',
    functionName: 'func1',
    fileName: 'v8-stack.test.coffee'
  });
  like(lCallers2[0], {
    type: 'function',
    functionName: 'secondFunc',
    fileName: 'v8-module.coffee'
  });
  return like(lCallers2[1], {
    type: 'function',
    functionName: 'func2',
    fileName: 'v8-stack.test.coffee'
  });
})();

// ---------------------------------------------------------------------------
(async() => {
  var func1, func2;
  func1 = async() => {
    return (await func2());
  };
  func2 = async() => {
    var stackStr;
    stackStr = (await getV8StackStr());
    return stackStr;
  };
  return equal((await func1()), `function at v8-stack.test.coffee:146:19
function at v8-stack.test.coffee:143:15
script at v8-stack.test.coffee:149:13`);
})();

// ---------------------------------------------------------------------------
(async() => {
  var func1, func2;
  func1 = async() => {
    func2();
    return (await getV8StackStr('debug'));
  };
  func2 = () => {
    var x;
    x = 2 * 2;
    return x;
  };
  return equal((await func1()), `function at v8-stack.test.coffee:162:15
script at v8-stack.test.coffee:168:13`);
})();

//# sourceMappingURL=v8-stack.test.js.map
