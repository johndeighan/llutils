  // node-walker.test.coffee
var Counter,
  boundMethodCheck = function(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new Error('Bound instance method accessed before binding'); } };

import {
  undef,
  defined,
  notdefined,
  hasKey,
  dclone,
  assert,
  words
} from '@jdeighan/llutils';

import {
  hSampleAST
} from './node-walker/SampleAST.js';

import * as lib from '@jdeighan/llutils/node-walker';

Object.assign(global, lib);

import * as lib2 from '@jdeighan/llutils/utest';

Object.assign(global, lib2);

// ---------------------------------------------------------------------------
symbol("matches(lStack, str)");

(() => {
  truthy(itemMatches({
    key: 'program',
    hNode: {
      type: 'File'
    }
  }, ['program', 'File']));
  truthy(itemMatches({
    key: 'program',
    hNode: {
      type: 'File'
    }
  }, ['', 'File']));
  truthy(itemMatches({
    key: 'program',
    hNode: {
      type: 'File'
    }
  }, ['program', '']));
  return truthy(itemMatches({
    key: 'program',
    hNode: {
      type: 'File'
    }
  }, ['', '']));
})();

// ---------------------------------------------------------------------------
symbol("stackMatches(lStack, str)");

(() => {
  var lStack;
  lStack = [
    {
      key: 'program',
      hNode: {
        type: 'File'
      }
    },
    {
      key: 'body',
      hNode: {
        type: 'Program'
      }
    },
    {
      key: 'declaration',
      hNode: {
        type: 'ExportNamedDeclaration'
      }
    },
    {
      key: 'right',
      hNode: {
        type: 'AssignmentExpression'
      }
    }
  ];
  return truthy(stackMatches(lStack, 'right'));
})();

// ---------------------------------------------------------------------------
symbol("parsePath(str)");

equal(parsePath("left:Expression"), [['left', 'Expression']]);

equal(parsePath("left: Expression"), [['left', 'Expression']]);

equal(parsePath("  left: Expression  "), [['left', 'Expression']]);

// --- parts can be separated by / or newline
equal(parsePath("left: Expression / right: Literal"), [['left', 'Expression'], ['right', 'Literal']]);

equal(parsePath(`left: Expression
right: Literal`), [['left', 'Expression'], ['right', 'Literal']]);

equal(parsePath("right:"), [['right', '']]);

equal(parsePath("right"), [['right', '']]);

// ---------------------------------------------------------------------------
symbol("NodeWalker");

// --- A counter walks an AST and
//     counts the number of nodes of each type
Counter = class Counter extends NodeWalker {
  constructor() {
    super(...arguments);
    this.get = this.get.bind(this);
  }

  init() {
    return this.hCounts = {};
  }

  visit(type, hNode) {
    if (hasKey(hNode, type)) {
      return this.hCounts[type] += 1;
    } else {
      return this.hCounts[type] = 1;
    }
  }

  get() {
    boundMethodCheck(this, Counter);
    return this.hCounts;
  }

};

// ---------------------------------------------------------------------------
(() => {
  var counter;
  counter = new Counter();
  counter.walk(hSampleAST);
  return equal(counter.get(), {
    File: 1,
    Program: 1,
    ExpressionStatement: 1,
    AssignmentExpression: 1,
    NumericLiteral: 1,
    Identifier: 1
  });
})();

(() => {
  var counter;
  counter = new Counter();
  counter.walk({
    type: 'File',
    program: {
      type: 'Program',
      body: [
        {
          type: 'ExpressionStatement'
        },
        {
          type: 'AssignmentStatement'
        },
        {
          type: 'ForStatement'
        }
      ]
    }
  });
  return equal(counter.get(), {
    File: 1,
    Program: 1,
    ExpressionStatement: 1,
    AssignmentStatement: 1,
    ForStatement: 1
  });
})();

// ---------------------------------------------------------------------------
// --- Change type of selected nodes in place
(() => {
  var Patcher, hAST, lLiterals, pat;
  lLiterals = ['NumericLiteral', 'StringLiteral'];
  Patcher = class Patcher extends NodeWalker {
    visit(type, hNode) {
      if (lLiterals.includes(type)) {
        return hNode.type = 'Literal';
      }
    }

  };
  hAST = {
    type: "File",
    program: {
      type: "Program",
      body: [
        {
          type: "ExpressionStatement",
          expression: {
            type: "AssignmentExpression",
            right: {
              type: "NumericLiteral",
              value: 42,
              left: {
                type: "Identifier",
                name: "x"
              }
            }
          }
        },
        {
          type: "ExpressionStatement",
          expression: {
            type: "AssignmentExpression",
            right: {
              type: "StringLiteral",
              value: 'abc',
              left: {
                type: "Identifier",
                name: "x"
              }
            }
          }
        }
      ]
    }
  };
  pat = new Patcher().walk(hAST);
  return equal(hAST, {
    type: "File",
    program: {
      type: "Program",
      body: [
        {
          type: "ExpressionStatement",
          expression: {
            type: "AssignmentExpression",
            right: {
              type: "Literal",
              value: 42,
              left: {
                type: "Identifier",
                name: "x"
              }
            }
          }
        },
        {
          type: "ExpressionStatement",
          expression: {
            type: "AssignmentExpression",
            right: {
              type: "Literal",
              value: 'abc',
              left: {
                type: "Identifier",
                name: "x"
              }
            }
          }
        }
      ]
    }
  });
})();

// ---------------------------------------------------------------------------
// --- Remove location information from sample AST
(() => {
  var Remover, hAST, rem;
  Remover = class Remover extends NodeWalker {
    init() {
      this.lKeys = words('loc extra range start end tokens');
    }

    visit(type, hNode) {
      var i, key, len, ref, results;
      ref = this.lKeys;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        key = ref[i];
        if (hasKey(hNode, key)) {
          results.push(delete hNode[key]);
        } else {
          results.push(void 0);
        }
      }
      return results;
    }

  };
  rem = new Remover();
  hAST = dclone(hSampleAST);
  rem.walk(hAST);
  return equal(hAST, {
    type: "File",
    program: {
      type: "Program",
      body: [
        {
          type: "ExpressionStatement",
          expression: {
            type: "AssignmentExpression",
            right: {
              type: "NumericLiteral",
              value: 42
            },
            left: {
              type: "Identifier",
              name: "x",
              declaration: true
            },
            operator: "="
          }
        }
      ],
      directives: []
    },
    comments: []
  });
})();

//# sourceMappingURL=node-walker.test.js.map
