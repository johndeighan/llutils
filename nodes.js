  // `nodes.coffee` contains all of the node classes for the syntax tree. Most
  // nodes are created as the result of actions in the [grammar](grammar.html),
  // but some are created by other nodes as a method of code generation. To convert
  // the syntax tree into a string of JavaScript code, call `compile()` on the root.
var Access, Arr, Assign, AwaitReturn, Base, Block, BooleanLiteral, Call, Catch, Class, ClassProperty, ClassPrototypeProperty, Code, CodeFragment, ComputedPropertyName, DefaultLiteral, Directive, DynamicImport, DynamicImportCall, Elision, EmptyInterpolation, ExecutableClassBody, Existence, Expansion, ExportAllDeclaration, ExportDeclaration, ExportDefaultDeclaration, ExportNamedDeclaration, ExportSpecifier, ExportSpecifierList, Extends, For, FuncDirectiveReturn, FuncGlyph, HEREGEX_OMIT, HereComment, HoistTarget, IdentifierLiteral, If, ImportClause, ImportDeclaration, ImportDefaultSpecifier, ImportNamespaceSpecifier, ImportSpecifier, ImportSpecifierList, In, Index, InfinityLiteral, Interpolation, JSXAttribute, JSXAttributes, JSXElement, JSXEmptyExpression, JSXExpressionContainer, JSXIdentifier, JSXNamespacedName, JSXTag, JSXText, JS_FORBIDDEN, LEADING_BLANK_LINE, LEVEL_ACCESS, LEVEL_COND, LEVEL_LIST, LEVEL_OP, LEVEL_PAREN, LEVEL_TOP, LineComment, Literal, MetaProperty, ModuleDeclaration, ModuleSpecifier, ModuleSpecifierList, NEGATE, NO, NaNLiteral, NullLiteral, NumberLiteral, Obj, ObjectProperty, Op, Param, Parens, PassthroughLiteral, PropertyName, Range, RegexLiteral, RegexWithInterpolations, Return, Root, SIMPLENUM, SIMPLE_STRING_OMIT, STRING_OMIT, Scope, Sequence, Slice, Splat, StatementLiteral, StringLiteral, StringWithInterpolations, Super, SuperCall, Switch, SwitchCase, SwitchWhen, TAB, THIS, TRAILING_BLANK_LINE, TaggedTemplateCall, TemplateElement, ThisLiteral, Throw, Try, UTILITIES, UndefinedLiteral, Value, While, YES, YieldReturn, addDataToNode, astAsBlockIfNeeded, attachCommentsToNode, compact, del, emptyExpressionLocationData, ends, extend, extractSameLineLocationDataFirst, extractSameLineLocationDataLast, flatten, fragmentsToText, greater, hasLineComments, indentInitial, isAstLocGreater, isFunction, isLiteralArguments, isLiteralThis, isLocationDataEndGreater, isLocationDataStartGreater, isNumber, isPlainObject, isUnassignable, jisonLocationDataToAstLocationData, lesser, locationDataToString, makeDelimitedLiteral, merge, mergeAstLocationData, mergeLocationData, moveComments, multident, parseNumber, replaceUnicodeCodePointEscapes, shouldCacheOrIsAssignable, sniffDirectives, some, starts, throwSyntaxError, unfoldSoak, unshiftAfterComments, utility, zeroWidthLocationDataFromEndLocation,
  indexOf = [].indexOf,
  splice = [].splice,
  slice1 = [].slice;

Error.stackTraceLimit = 2e308;

({Scope} = require('./scope'));

({isUnassignable, JS_FORBIDDEN} = require('./lexer'));

// Import the helpers we plan to use.
({compact, flatten, extend, merge, del, starts, ends, some, addDataToNode, attachCommentsToNode, locationDataToString, throwSyntaxError, replaceUnicodeCodePointEscapes, isFunction, isPlainObject, isNumber, parseNumber} = require('./helpers'));

// Functions required by parser.
exports.extend = extend;

exports.addDataToNode = addDataToNode;

// Constant functions for nodes that don’t need customization.
YES = function() {
  return true;
};

NO = function() {
  return false;
};

THIS = function() {
  return this;
};

NEGATE = function() {
  this.negated = !this.negated;
  return this;
};

//### CodeFragment

// The various nodes defined below all compile to a collection of **CodeFragment** objects.
// A CodeFragments is a block of generated code, and the location in the source file where the code
// came from. CodeFragments can be assembled together into working code just by catting together
// all the CodeFragments' `code` snippets, in order.
exports.CodeFragment = CodeFragment = class CodeFragment {
  constructor(parent, code) {
    var ref1;
    this.code = `${code}`;
    this.type = (parent != null ? (ref1 = parent.constructor) != null ? ref1.name : void 0 : void 0) || 'unknown';
    this.locationData = parent != null ? parent.locationData : void 0;
    this.comments = parent != null ? parent.comments : void 0;
  }

  toString() {
    // This is only intended for debugging.
    return `${this.code}${this.locationData ? ": " + locationDataToString(this.locationData) : ''}`;
  }

};

// Convert an array of CodeFragments into a string.
fragmentsToText = function(fragments) {
  var fragment;
  return ((function() {
    var j, len1, results1;
    results1 = [];
    for (j = 0, len1 = fragments.length; j < len1; j++) {
      fragment = fragments[j];
      results1.push(fragment.code);
    }
    return results1;
  })()).join('');
};

//### Base

// The **Base** is the abstract base class for all nodes in the syntax tree.
// Each subclass implements the `compileNode` method, which performs the
// code generation for that node. To compile a node to JavaScript,
// call `compile` on it, which wraps `compileNode` in some generic extra smarts,
// to know when the generated code needs to be wrapped up in a closure.
// An options hash is passed and cloned throughout, containing information about
// the environment from higher in the tree (such as if a returned value is
// being requested by the surrounding function), information about the current
// scope, and indentation level.
exports.Base = Base = (function() {
  class Base {
    compile(o, lvl) {
      return fragmentsToText(this.compileToFragments(o, lvl));
    }

    // Occasionally a node is compiled multiple times, for example to get the name
    // of a variable to add to scope tracking. When we know that a “premature”
    // compilation won’t result in comments being output, set those comments aside
    // so that they’re preserved for a later `compile` call that will result in
    // the comments being included in the output.
    compileWithoutComments(o, lvl, method = 'compile') {
      var fragments, unwrapped;
      if (this.comments) {
        this.ignoreTheseCommentsTemporarily = this.comments;
        delete this.comments;
      }
      unwrapped = this.unwrapAll();
      if (unwrapped.comments) {
        unwrapped.ignoreTheseCommentsTemporarily = unwrapped.comments;
        delete unwrapped.comments;
      }
      fragments = this[method](o, lvl);
      if (this.ignoreTheseCommentsTemporarily) {
        this.comments = this.ignoreTheseCommentsTemporarily;
        delete this.ignoreTheseCommentsTemporarily;
      }
      if (unwrapped.ignoreTheseCommentsTemporarily) {
        unwrapped.comments = unwrapped.ignoreTheseCommentsTemporarily;
        delete unwrapped.ignoreTheseCommentsTemporarily;
      }
      return fragments;
    }

    compileNodeWithoutComments(o, lvl) {
      return this.compileWithoutComments(o, lvl, 'compileNode');
    }

    // Common logic for determining whether to wrap this node in a closure before
    // compiling it, or to compile directly. We need to wrap if this node is a
    // *statement*, and it's not a *pureStatement*, and we're not at
    // the top level of a block (which would be unnecessary), and we haven't
    // already been asked to return the result (because statements know how to
    // return results).
    compileToFragments(o, lvl) {
      var fragments, node;
      o = extend({}, o);
      if (lvl) {
        o.level = lvl;
      }
      node = this.unfoldSoak(o) || this;
      node.tab = o.indent;
      fragments = o.level === LEVEL_TOP || !node.isStatement(o) ? node.compileNode(o) : node.compileClosure(o);
      this.compileCommentFragments(o, node, fragments);
      return fragments;
    }

    compileToFragmentsWithoutComments(o, lvl) {
      return this.compileWithoutComments(o, lvl, 'compileToFragments');
    }

    // Statements converted into expressions via closure-wrapping share a scope
    // object with their parent closure, to preserve the expected lexical scope.
    compileClosure(o) {
      var args, argumentsNode, func, meth, parts, ref1, ref2;
      this.checkForPureStatementInExpression();
      o.sharedScope = true;
      func = new Code([], Block.wrap([this]));
      args = [];
      if (this.contains((function(node) {
        return node instanceof SuperCall;
      }))) {
        func.bound = true;
      } else if ((argumentsNode = this.contains(isLiteralArguments)) || this.contains(isLiteralThis)) {
        args = [new ThisLiteral()];
        if (argumentsNode) {
          meth = 'apply';
          args.push(new IdentifierLiteral('arguments'));
        } else {
          meth = 'call';
        }
        func = new Value(func, [new Access(new PropertyName(meth))]);
      }
      parts = (new Call(func, args)).compileNode(o);
      switch (false) {
        case !(func.isGenerator || ((ref1 = func.base) != null ? ref1.isGenerator : void 0)):
          parts.unshift(this.makeCode("(yield* "));
          parts.push(this.makeCode(")"));
          break;
        case !(func.isAsync || ((ref2 = func.base) != null ? ref2.isAsync : void 0)):
          parts.unshift(this.makeCode("(await "));
          parts.push(this.makeCode(")"));
      }
      return parts;
    }

    compileCommentFragments(o, node, fragments) {
      var base1, base2, comment, commentFragment, j, len1, ref1, unshiftCommentFragment;
      if (!node.comments) {
        return fragments;
      }
      // This is where comments, that are attached to nodes as a `comments`
      // property, become `CodeFragment`s. “Inline block comments,” e.g.
      // `/* */`-delimited comments that are interspersed within code on a line,
      // are added to the current `fragments` stream. All other fragments are
      // attached as properties to the nearest preceding or following fragment,
      // to remain stowaways until they get properly output in `compileComments`
      // later on.
      unshiftCommentFragment = function(commentFragment) {
        var precedingFragment;
        if (commentFragment.unshift) {
          // Find the first non-comment fragment and insert `commentFragment`
          // before it.
          return unshiftAfterComments(fragments, commentFragment);
        } else {
          if (fragments.length !== 0) {
            precedingFragment = fragments[fragments.length - 1];
            if (commentFragment.newLine && precedingFragment.code !== '' && !/\n\s*$/.test(precedingFragment.code)) {
              commentFragment.code = `\n${commentFragment.code}`;
            }
          }
          return fragments.push(commentFragment);
        }
      };
      ref1 = node.comments;
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        comment = ref1[j];
        if (!(indexOf.call(this.compiledComments, comment) < 0)) {
          continue;
        }
        this.compiledComments.push(comment); // Don’t output this comment twice.
        // For block/here comments, denoted by `###`, that are inline comments
        // like `1 + ### comment ### 2`, create fragments and insert them into
        // the fragments array.
        // Otherwise attach comment fragments to their closest fragment for now,
        // so they can be inserted into the output later after all the newlines
        // have been added.
        if (comment.here) { // Block comment, delimited by `###`.
          commentFragment = new HereComment(comment).compileNode(o); // Line comment, delimited by `#`.
        } else {
          commentFragment = new LineComment(comment).compileNode(o);
        }
        if ((commentFragment.isHereComment && !commentFragment.newLine) || node.includeCommentFragments()) {
          // Inline block comments, like `1 + /* comment */ 2`, or a node whose
          // `compileToFragments` method has logic for outputting comments.
          unshiftCommentFragment(commentFragment);
        } else {
          if (fragments.length === 0) {
            fragments.push(this.makeCode(''));
          }
          if (commentFragment.unshift) {
            if ((base1 = fragments[0]).precedingComments == null) {
              base1.precedingComments = [];
            }
            fragments[0].precedingComments.push(commentFragment);
          } else {
            if ((base2 = fragments[fragments.length - 1]).followingComments == null) {
              base2.followingComments = [];
            }
            fragments[fragments.length - 1].followingComments.push(commentFragment);
          }
        }
      }
      return fragments;
    }

    // If the code generation wishes to use the result of a complex expression
    // in multiple places, ensure that the expression is only ever evaluated once,
    // by assigning it to a temporary variable. Pass a level to precompile.

    // If `level` is passed, then returns `[val, ref]`, where `val` is the compiled value, and `ref`
    // is the compiled reference. If `level` is not passed, this returns `[val, ref]` where
    // the two values are raw nodes which have not been compiled.
    cache(o, level, shouldCache) {
      var complex, ref, sub;
      complex = shouldCache != null ? shouldCache(this) : this.shouldCache();
      if (complex) {
        ref = new IdentifierLiteral(o.scope.freeVariable('ref'));
        sub = new Assign(ref, this);
        if (level) {
          return [sub.compileToFragments(o, level), [this.makeCode(ref.value)]];
        } else {
          return [sub, ref];
        }
      } else {
        ref = level ? this.compileToFragments(o, level) : this;
        return [ref, ref];
      }
    }

    // Occasionally it may be useful to make an expression behave as if it was 'hoisted', whereby the
    // result of the expression is available before its location in the source, but the expression's
    // variable scope corresponds to the source position. This is used extensively to deal with executable
    // class bodies in classes.

    // Calling this method mutates the node, proxying the `compileNode` and `compileToFragments`
    // methods to store their result for later replacing the `target` node, which is returned by the
    // call.
    hoist() {
      var compileNode, compileToFragments, target;
      this.hoisted = true;
      target = new HoistTarget(this);
      compileNode = this.compileNode;
      compileToFragments = this.compileToFragments;
      this.compileNode = function(o) {
        return target.update(compileNode, o);
      };
      this.compileToFragments = function(o) {
        return target.update(compileToFragments, o);
      };
      return target;
    }

    cacheToCodeFragments(cacheValues) {
      return [fragmentsToText(cacheValues[0]), fragmentsToText(cacheValues[1])];
    }

    // Construct a node that returns the current node’s result.
    // Note that this is overridden for smarter behavior for
    // many statement nodes (e.g. `If`, `For`).
    makeReturn(results, mark) {
      var node;
      if (mark) {
        // Mark this node as implicitly returned, so that it can be part of the
        // node metadata returned in the AST.
        this.canBeReturned = true;
        return;
      }
      node = this.unwrapAll();
      if (results) {
        return new Call(new Literal(`${results}.push`), [node]);
      } else {
        return new Return(node);
      }
    }

    // Does this node, or any of its children, contain a node of a certain kind?
    // Recursively traverses down the *children* nodes and returns the first one
    // that verifies `pred`. Otherwise return undefined. `contains` does not cross
    // scope boundaries.
    contains(pred) {
      var node;
      node = void 0;
      this.traverseChildren(false, function(n) {
        if (pred(n)) {
          node = n;
          return false;
        }
      });
      return node;
    }

    // Pull out the last node of a node list.
    lastNode(list) {
      if (list.length === 0) {
        return null;
      } else {
        return list[list.length - 1];
      }
    }

    // Debugging representation of the node, for inspecting the parse tree.
    // This is what `coffee --nodes` prints out.
    toString(idt = '', name = this.constructor.name) {
      var tree;
      tree = '\n' + idt + name;
      if (this.soak) {
        tree += '?';
      }
      this.eachChild(function(node) {
        return tree += node.toString(idt + TAB);
      });
      return tree;
    }

    checkForPureStatementInExpression() {
      var jumpNode;
      if (jumpNode = this.jumps()) {
        return jumpNode.error('cannot use a pure statement in an expression');
      }
    }

    // Plain JavaScript object representation of the node, that can be serialized
    // as JSON. This is what the `ast` option in the Node API returns.
    // We try to follow the [Babel AST spec](https://github.com/babel/babel/blob/master/packages/babel-parser/ast/spec.md)
    // as closely as possible, for improved interoperability with other tools.
    // **WARNING: DO NOT OVERRIDE THIS METHOD IN CHILD CLASSES.**
    // Only override the component `ast*` methods as needed.
    ast(o, level) {
      var astNode;
      // Merge `level` into `o` and perform other universal checks.
      o = this.astInitialize(o, level);
      // Create serializable representation of this node.
      astNode = this.astNode(o);
      // Mark AST nodes that correspond to expressions that (implicitly) return.
      // We can’t do this as part of `astNode` because we need to assemble child
      // nodes first before marking the parent being returned.
      if ((this.astNode != null) && this.canBeReturned) {
        Object.assign(astNode, {
          returns: true
        });
      }
      return astNode;
    }

    astInitialize(o, level) {
      o = Object.assign({}, o);
      if (level != null) {
        o.level = level;
      }
      if (o.level > LEVEL_TOP) {
        this.checkForPureStatementInExpression();
      }
      if (this.isStatement(o) && o.level !== LEVEL_TOP && (o.scope != null)) {
        // `@makeReturn` must be called before `astProperties`, because the latter may call
        // `.ast()` for child nodes and those nodes would need the return logic from `makeReturn`
        // already executed by then.
        this.makeReturn(null, true);
      }
      return o;
    }

    astNode(o) {
      // Every abstract syntax tree node object has four categories of properties:
      // - type, stored in the `type` field and a string like `NumberLiteral`.
      // - location data, stored in the `loc`, `start`, `end` and `range` fields.
      // - properties specific to this node, like `parsedValue`.
      // - properties that are themselves child nodes, like `body`.
      // These fields are all intermixed in the Babel spec; `type` and `start` and
      // `parsedValue` are all top level fields in the AST node object. We have
      // separate methods for returning each category, that we merge together here.
      return Object.assign({}, {
        type: this.astType(o)
      }, this.astProperties(o), this.astLocationData());
    }

    // By default, a node class has no specific properties.
    astProperties() {
      return {};
    }

    // By default, a node class’s AST `type` is its class name.
    astType() {
      return this.constructor.name;
    }

    // The AST location data is a rearranged version of our Jison location data,
    // mutated into the structure that the Babel spec uses.
    astLocationData() {
      return jisonLocationDataToAstLocationData(this.locationData);
    }

    // Determines whether an AST node needs an `ExpressionStatement` wrapper.
    // Typically matches our `isStatement()` logic but this allows overriding.
    isStatementAst(o) {
      return this.isStatement(o);
    }

    // Passes each child to a function, breaking when the function returns `false`.
    eachChild(func) {
      var attr, child, j, k, len1, len2, ref1, ref2;
      if (!this.children) {
        return this;
      }
      ref1 = this.children;
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        attr = ref1[j];
        if (this[attr]) {
          ref2 = flatten([this[attr]]);
          for (k = 0, len2 = ref2.length; k < len2; k++) {
            child = ref2[k];
            if (func(child) === false) {
              return this;
            }
          }
        }
      }
      return this;
    }

    traverseChildren(crossScope, func) {
      return this.eachChild(function(child) {
        var recur;
        recur = func(child);
        if (recur !== false) {
          return child.traverseChildren(crossScope, func);
        }
      });
    }

    // `replaceInContext` will traverse children looking for a node for which `match` returns
    // true. Once found, the matching node will be replaced by the result of calling `replacement`.
    replaceInContext(match, replacement) {
      var attr, child, children, i, j, k, len1, len2, ref1, ref2;
      if (!this.children) {
        return false;
      }
      ref1 = this.children;
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        attr = ref1[j];
        if (children = this[attr]) {
          if (Array.isArray(children)) {
            for (i = k = 0, len2 = children.length; k < len2; i = ++k) {
              child = children[i];
              if (match(child)) {
                splice.apply(children, [i, i - i + 1].concat(ref2 = replacement(child, this))), ref2;
                return true;
              } else {
                if (child.replaceInContext(match, replacement)) {
                  return true;
                }
              }
            }
          } else if (match(children)) {
            this[attr] = replacement(children, this);
            return true;
          } else {
            if (children.replaceInContext(match, replacement)) {
              return true;
            }
          }
        }
      }
    }

    invert() {
      return new Op('!', this);
    }

    unwrapAll() {
      var node;
      node = this;
      while (node !== (node = node.unwrap())) {
        continue;
      }
      return node;
    }

    // For this node and all descendents, set the location data to `locationData`
    // if the location data is not already set.
    updateLocationDataIfMissing(locationData, force) {
      if (force) {
        this.forceUpdateLocation = true;
      }
      if (this.locationData && !this.forceUpdateLocation) {
        return this;
      }
      delete this.forceUpdateLocation;
      this.locationData = locationData;
      return this.eachChild(function(child) {
        return child.updateLocationDataIfMissing(locationData);
      });
    }

    // Add location data from another node
    withLocationDataFrom({locationData}) {
      return this.updateLocationDataIfMissing(locationData);
    }

    // Add location data and comments from another node
    withLocationDataAndCommentsFrom(node) {
      var comments;
      this.withLocationDataFrom(node);
      ({comments} = node);
      if (comments != null ? comments.length : void 0) {
        this.comments = comments;
      }
      return this;
    }

    // Throw a SyntaxError associated with this node’s location.
    error(message) {
      return throwSyntaxError(message, this.locationData);
    }

    makeCode(code) {
      return new CodeFragment(this, code);
    }

    wrapInParentheses(fragments) {
      return [this.makeCode('('), ...fragments, this.makeCode(')')];
    }

    wrapInBraces(fragments) {
      return [this.makeCode('{'), ...fragments, this.makeCode('}')];
    }

    // `fragmentsList` is an array of arrays of fragments. Each array in fragmentsList will be
    // concatenated together, with `joinStr` added in between each, to produce a final flat array
    // of fragments.
    joinFragmentArrays(fragmentsList, joinStr) {
      var answer, fragments, i, j, len1;
      answer = [];
      for (i = j = 0, len1 = fragmentsList.length; j < len1; i = ++j) {
        fragments = fragmentsList[i];
        if (i) {
          answer.push(this.makeCode(joinStr));
        }
        answer = answer.concat(fragments);
      }
      return answer;
    }

  };

  // Default implementations of the common node properties and methods. Nodes
  // will override these with custom logic, if needed.

  // `children` are the properties to recurse into when tree walking. The
  // `children` list *is* the structure of the AST. The `parent` pointer, and
  // the pointer to the `children` are how you can traverse the tree.
  Base.prototype.children = [];

  // `isStatement` has to do with “everything is an expression”. A few things
  // can’t be expressions, such as `break`. Things that `isStatement` returns
  // `true` for are things that can’t be used as expressions. There are some
  // error messages that come from `nodes.coffee` due to statements ending up
  // in expression position.
  Base.prototype.isStatement = NO;

  // Track comments that have been compiled into fragments, to avoid outputting
  // them twice.
  Base.prototype.compiledComments = [];

  // `includeCommentFragments` lets `compileCommentFragments` know whether this node
  // has special awareness of how to handle comments within its output.
  Base.prototype.includeCommentFragments = NO;

  // `jumps` tells you if an expression, or an internal part of an expression,
  // has a flow control construct (like `break`, `continue`, or `return`)
  // that jumps out of the normal flow of control and can’t be used as a value.
  // (Note that `throw` is not considered a flow control construct.)
  // This is important because flow control in the middle of an expression
  // makes no sense; we have to disallow it.
  Base.prototype.jumps = NO;

  // If `node.shouldCache() is false`, it is safe to use `node` more than once.
  // Otherwise you need to store the value of `node` in a variable and output
  // that variable several times instead. Kind of like this: `5` need not be
  // cached. `returnFive()`, however, could have side effects as a result of
  // evaluating it more than once, and therefore we need to cache it. The
  // parameter is named `shouldCache` rather than `mustCache` because there are
  // also cases where we might not need to cache but where we want to, for
  // example a long expression that may well be idempotent but we want to cache
  // for brevity.
  Base.prototype.shouldCache = YES;

  Base.prototype.isChainable = NO;

  Base.prototype.isAssignable = NO;

  Base.prototype.isNumber = NO;

  Base.prototype.unwrap = THIS;

  Base.prototype.unfoldSoak = NO;

  // Is this node used to assign a certain variable?
  Base.prototype.assigns = NO;

  return Base;

}).call(this);

//### HoistTarget

// A **HoistTargetNode** represents the output location in the node tree for a hoisted node.
// See Base#hoist.
exports.HoistTarget = HoistTarget = class HoistTarget extends Base {
  // Expands hoisted fragments in the given array
  static expand(fragments) {
    var fragment, i, j, ref1;
    for (i = j = fragments.length - 1; j >= 0; i = j += -1) {
      fragment = fragments[i];
      if (fragment.fragments) {
        splice.apply(fragments, [i, i - i + 1].concat(ref1 = this.expand(fragment.fragments))), ref1;
      }
    }
    return fragments;
  }

  constructor(source1) {
    super();
    this.source = source1;
    // Holds presentational options to apply when the source node is compiled.
    this.options = {};
    // Placeholder fragments to be replaced by the source node’s compilation.
    this.targetFragments = {
      fragments: []
    };
  }

  isStatement(o) {
    return this.source.isStatement(o);
  }

  // Update the target fragments with the result of compiling the source.
  // Calls the given compile function with the node and options (overriden with the target
  // presentational options).
  update(compile, o) {
    return this.targetFragments.fragments = compile.call(this.source, merge(o, this.options));
  }

  // Copies the target indent and level, and returns the placeholder fragments
  compileToFragments(o, level) {
    this.options.indent = o.indent;
    this.options.level = level != null ? level : o.level;
    return [this.targetFragments];
  }

  compileNode(o) {
    return this.compileToFragments(o);
  }

  compileClosure(o) {
    return this.compileToFragments(o);
  }

};

//### Root

// The root node of the node tree
exports.Root = Root = (function() {
  class Root extends Base {
    constructor(body1) {
      super();
      this.body = body1;
      this.isAsync = (new Code([], this.body)).isAsync;
    }

    // Wrap everything in a safety closure, unless requested not to. It would be
    // better not to generate them in the first place, but for now, clean up
    // obvious double-parentheses.
    compileNode(o) {
      var fragments, functionKeyword;
      o.indent = o.bare ? '' : TAB;
      o.level = LEVEL_TOP;
      o.compiling = true;
      this.initializeScope(o);
      fragments = this.body.compileRoot(o);
      if (o.bare) {
        return fragments;
      }
      functionKeyword = `${this.isAsync ? 'async ' : ''}function`;
      return [].concat(this.makeCode(`(${functionKeyword}() {\n`), fragments, this.makeCode("\n}).call(this);\n"));
    }

    initializeScope(o) {
      var j, len1, name, ref1, ref2, results1;
      o.scope = new Scope(null, this.body, null, (ref1 = o.referencedVars) != null ? ref1 : []);
      ref2 = o.locals || [];
      results1 = [];
      for (j = 0, len1 = ref2.length; j < len1; j++) {
        name = ref2[j];
        // Mark given local variables in the root scope as parameters so they don’t
        // end up being declared on the root block.
        results1.push(o.scope.parameter(name));
      }
      return results1;
    }

    commentsAst() {
      var comment, commentToken, j, len1, ref1, results1;
      if (this.allComments == null) {
        this.allComments = (function() {
          var j, len1, ref1, ref2, results1;
          ref2 = (ref1 = this.allCommentTokens) != null ? ref1 : [];
          results1 = [];
          for (j = 0, len1 = ref2.length; j < len1; j++) {
            commentToken = ref2[j];
            if (!commentToken.heregex) {
              if (commentToken.here) {
                results1.push(new HereComment(commentToken));
              } else {
                results1.push(new LineComment(commentToken));
              }
            }
          }
          return results1;
        }).call(this);
      }
      ref1 = this.allComments;
      results1 = [];
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        comment = ref1[j];
        results1.push(comment.ast());
      }
      return results1;
    }

    astNode(o) {
      o.level = LEVEL_TOP;
      this.initializeScope(o);
      return super.astNode(o);
    }

    astType() {
      return 'File';
    }

    astProperties(o) {
      this.body.isRootBlock = true;
      return {
        program: Object.assign(this.body.ast(o), this.astLocationData()),
        comments: this.commentsAst()
      };
    }

  };

  Root.prototype.children = ['body'];

  return Root;

}).call(this);

//### Block

// The block is the list of expressions that forms the body of an
// indented block of code -- the implementation of a function, a clause in an
// `if`, `switch`, or `try`, and so on...
exports.Block = Block = (function() {
  class Block extends Base {
    constructor(nodes) {
      super();
      this.expressions = compact(flatten(nodes || []));
    }

    // Tack an expression on to the end of this expression list.
    push(node) {
      this.expressions.push(node);
      return this;
    }

    // Remove and return the last expression of this expression list.
    pop() {
      return this.expressions.pop();
    }

    // Add an expression at the beginning of this expression list.
    unshift(node) {
      this.expressions.unshift(node);
      return this;
    }

    // If this Block consists of just a single node, unwrap it by pulling
    // it back out.
    unwrap() {
      if (this.expressions.length === 1) {
        return this.expressions[0];
      } else {
        return this;
      }
    }

    // Is this an empty block of code?
    isEmpty() {
      return !this.expressions.length;
    }

    isStatement(o) {
      var exp, j, len1, ref1;
      ref1 = this.expressions;
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        exp = ref1[j];
        if (exp.isStatement(o)) {
          return true;
        }
      }
      return false;
    }

    jumps(o) {
      var exp, j, jumpNode, len1, ref1;
      ref1 = this.expressions;
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        exp = ref1[j];
        if (jumpNode = exp.jumps(o)) {
          return jumpNode;
        }
      }
    }

    // A Block node does not return its entire body, rather it
    // ensures that the final expression is returned.
    makeReturn(results, mark) {
      var expr, expressions, last, lastExp, len, penult, ref1, ref2;
      len = this.expressions.length;
      ref1 = this.expressions, [lastExp] = slice1.call(ref1, -1);
      lastExp = (lastExp != null ? lastExp.unwrap() : void 0) || false;
      // We also need to check that we’re not returning a JSX tag if there’s an
      // adjacent one at the same level; JSX doesn’t allow that.
      if (lastExp && lastExp instanceof Parens && lastExp.body.expressions.length > 1) {
        ({
          body: {expressions}
        } = lastExp);
        [penult, last] = slice1.call(expressions, -2);
        penult = penult.unwrap();
        last = last.unwrap();
        if (penult instanceof JSXElement && last instanceof JSXElement) {
          expressions[expressions.length - 1].error('Adjacent JSX elements must be wrapped in an enclosing tag');
        }
      }
      if (mark) {
        if ((ref2 = this.expressions[len - 1]) != null) {
          ref2.makeReturn(results, mark);
        }
        return;
      }
      while (len--) {
        expr = this.expressions[len];
        this.expressions[len] = expr.makeReturn(results);
        if (expr instanceof Return && !expr.expression) {
          this.expressions.splice(len, 1);
        }
        break;
      }
      return this;
    }

    compile(o, lvl) {
      if (!o.scope) {
        return new Root(this).withLocationDataFrom(this).compile(o, lvl);
      }
      return super.compile(o, lvl);
    }

    // Compile all expressions within the **Block** body. If we need to return
    // the result, and it’s an expression, simply return it. If it’s a statement,
    // ask the statement to do so.
    compileNode(o) {
      var answer, compiledNodes, fragments, index, j, lastFragment, len1, node, ref1, top;
      this.tab = o.indent;
      top = o.level === LEVEL_TOP;
      compiledNodes = [];
      ref1 = this.expressions;
      for (index = j = 0, len1 = ref1.length; j < len1; index = ++j) {
        node = ref1[index];
        if (node.hoisted) {
          // This is a hoisted expression.
          // We want to compile this and ignore the result.
          node.compileToFragments(o);
          continue;
        }
        node = node.unfoldSoak(o) || node;
        if (node instanceof Block) {
          // This is a nested block. We don’t do anything special here like
          // enclose it in a new scope; we just compile the statements in this
          // block along with our own.
          compiledNodes.push(node.compileNode(o));
        } else if (top) {
          node.front = true;
          fragments = node.compileToFragments(o);
          if (!node.isStatement(o)) {
            fragments = indentInitial(fragments, this);
            [lastFragment] = slice1.call(fragments, -1);
            if (!(lastFragment.code === '' || lastFragment.isComment)) {
              fragments.push(this.makeCode(';'));
            }
          }
          compiledNodes.push(fragments);
        } else {
          compiledNodes.push(node.compileToFragments(o, LEVEL_LIST));
        }
      }
      if (top) {
        if (this.spaced) {
          return [].concat(this.joinFragmentArrays(compiledNodes, '\n\n'), this.makeCode('\n'));
        } else {
          return this.joinFragmentArrays(compiledNodes, '\n');
        }
      }
      if (compiledNodes.length) {
        answer = this.joinFragmentArrays(compiledNodes, ', ');
      } else {
        answer = [this.makeCode('void 0')];
      }
      if (compiledNodes.length > 1 && o.level >= LEVEL_LIST) {
        return this.wrapInParentheses(answer);
      } else {
        return answer;
      }
    }

    compileRoot(o) {
      var fragments;
      this.spaced = true;
      fragments = this.compileWithDeclarations(o);
      HoistTarget.expand(fragments);
      return this.compileComments(fragments);
    }

    // Compile the expressions body for the contents of a function, with
    // declarations of all inner variables pushed up to the top.
    compileWithDeclarations(o) {
      var assigns, declaredVariable, declaredVariables, declaredVariablesIndex, declars, exp, fragments, i, j, k, len1, len2, post, ref1, rest, scope, spaced;
      fragments = [];
      post = [];
      ref1 = this.expressions;
      for (i = j = 0, len1 = ref1.length; j < len1; i = ++j) {
        exp = ref1[i];
        exp = exp.unwrap();
        if (!(exp instanceof Literal)) {
          break;
        }
      }
      o = merge(o, {
        level: LEVEL_TOP
      });
      if (i) {
        rest = this.expressions.splice(i, 9e9);
        [spaced, this.spaced] = [this.spaced, false];
        [fragments, this.spaced] = [this.compileNode(o), spaced];
        this.expressions = rest;
      }
      post = this.compileNode(o);
      ({scope} = o);
      if (scope.expressions === this) {
        declars = o.scope.hasDeclarations();
        assigns = scope.hasAssignments;
        if (declars || assigns) {
          if (i) {
            fragments.push(this.makeCode('\n'));
          }
          fragments.push(this.makeCode(`${this.tab}var `));
          if (declars) {
            declaredVariables = scope.declaredVariables();
            for (declaredVariablesIndex = k = 0, len2 = declaredVariables.length; k < len2; declaredVariablesIndex = ++k) {
              declaredVariable = declaredVariables[declaredVariablesIndex];
              fragments.push(this.makeCode(declaredVariable));
              if (Object.prototype.hasOwnProperty.call(o.scope.comments, declaredVariable)) {
                fragments.push(...o.scope.comments[declaredVariable]);
              }
              if (declaredVariablesIndex !== declaredVariables.length - 1) {
                fragments.push(this.makeCode(', '));
              }
            }
          }
          if (assigns) {
            if (declars) {
              fragments.push(this.makeCode(`,\n${this.tab + TAB}`));
            }
            fragments.push(this.makeCode(scope.assignedVariables().join(`,\n${this.tab + TAB}`)));
          }
          fragments.push(this.makeCode(`;\n${this.spaced ? '\n' : ''}`));
        } else if (fragments.length && post.length) {
          fragments.push(this.makeCode("\n"));
        }
      }
      return fragments.concat(post);
    }

    compileComments(fragments) {
      var code, commentFragment, fragment, fragmentIndent, fragmentIndex, indent, j, k, l, len1, len2, len3, newLineIndex, onNextLine, p, pastFragment, pastFragmentIndex, q, ref1, ref2, ref3, ref4, trail, upcomingFragment, upcomingFragmentIndex;
      for (fragmentIndex = j = 0, len1 = fragments.length; j < len1; fragmentIndex = ++j) {
        fragment = fragments[fragmentIndex];
        // Insert comments into the output at the next or previous newline.
        // If there are no newlines at which to place comments, create them.
        if (fragment.precedingComments) {
          // Determine the indentation level of the fragment that we are about
          // to insert comments before, and use that indentation level for our
          // inserted comments. At this point, the fragments’ `code` property
          // is the generated output JavaScript, and CoffeeScript always
          // generates output indented by two spaces; so all we need to do is
          // search for a `code` property that begins with at least two spaces.
          fragmentIndent = '';
          ref1 = fragments.slice(0, (fragmentIndex + 1));
          for (k = ref1.length - 1; k >= 0; k += -1) {
            pastFragment = ref1[k];
            indent = /^ {2,}/m.exec(pastFragment.code);
            if (indent) {
              fragmentIndent = indent[0];
              break;
            } else if (indexOf.call(pastFragment.code, '\n') >= 0) {
              break;
            }
          }
          code = `\n${fragmentIndent}` + ((function() {
            var l, len2, ref2, results1;
            ref2 = fragment.precedingComments;
            results1 = [];
            for (l = 0, len2 = ref2.length; l < len2; l++) {
              commentFragment = ref2[l];
              if (commentFragment.isHereComment && commentFragment.multiline) {
                results1.push(multident(commentFragment.code, fragmentIndent, false));
              } else {
                results1.push(commentFragment.code);
              }
            }
            return results1;
          })()).join(`\n${fragmentIndent}`).replace(/^(\s*)$/gm, '');
          ref2 = fragments.slice(0, (fragmentIndex + 1));
          for (pastFragmentIndex = l = ref2.length - 1; l >= 0; pastFragmentIndex = l += -1) {
            pastFragment = ref2[pastFragmentIndex];
            newLineIndex = pastFragment.code.lastIndexOf('\n');
            if (newLineIndex === -1) {
              // Keep searching previous fragments until we can’t go back any
              // further, either because there are no fragments left or we’ve
              // discovered that we’re in a code block that is interpolated
              // inside a string.
              if (pastFragmentIndex === 0) {
                pastFragment.code = '\n' + pastFragment.code;
                newLineIndex = 0;
              } else if (pastFragment.isStringWithInterpolations && pastFragment.code === '{') {
                code = code.slice(1) + '\n'; // Move newline to end.
                newLineIndex = 1;
              } else {
                continue;
              }
            }
            delete fragment.precedingComments;
            pastFragment.code = pastFragment.code.slice(0, newLineIndex) + code + pastFragment.code.slice(newLineIndex);
            break;
          }
        }
        // Yes, this is awfully similar to the previous `if` block, but if you
        // look closely you’ll find lots of tiny differences that make this
        // confusing if it were abstracted into a function that both blocks share.
        if (fragment.followingComments) {
          // Does the first trailing comment follow at the end of a line of code,
          // like `; // Comment`, or does it start a new line after a line of code?
          trail = fragment.followingComments[0].trail;
          fragmentIndent = '';
          // Find the indent of the next line of code, if we have any non-trailing
          // comments to output. We need to first find the next newline, as these
          // comments will be output after that; and then the indent of the line
          // that follows the next newline.
          if (!(trail && fragment.followingComments.length === 1)) {
            onNextLine = false;
            ref3 = fragments.slice(fragmentIndex);
            for (p = 0, len2 = ref3.length; p < len2; p++) {
              upcomingFragment = ref3[p];
              if (!onNextLine) {
                if (indexOf.call(upcomingFragment.code, '\n') >= 0) {
                  onNextLine = true;
                } else {
                  continue;
                }
              } else {
                indent = /^ {2,}/m.exec(upcomingFragment.code);
                if (indent) {
                  fragmentIndent = indent[0];
                  break;
                } else if (indexOf.call(upcomingFragment.code, '\n') >= 0) {
                  break;
                }
              }
            }
          }
          // Is this comment following the indent inserted by bare mode?
          // If so, there’s no need to indent this further.
          code = fragmentIndex === 1 && /^\s+$/.test(fragments[0].code) ? '' : trail ? ' ' : `\n${fragmentIndent}`;
          // Assemble properly indented comments.
          code += ((function() {
            var len3, q, ref4, results1;
            ref4 = fragment.followingComments;
            results1 = [];
            for (q = 0, len3 = ref4.length; q < len3; q++) {
              commentFragment = ref4[q];
              if (commentFragment.isHereComment && commentFragment.multiline) {
                results1.push(multident(commentFragment.code, fragmentIndent, false));
              } else {
                results1.push(commentFragment.code);
              }
            }
            return results1;
          })()).join(`\n${fragmentIndent}`).replace(/^(\s*)$/gm, '');
          ref4 = fragments.slice(fragmentIndex);
          for (upcomingFragmentIndex = q = 0, len3 = ref4.length; q < len3; upcomingFragmentIndex = ++q) {
            upcomingFragment = ref4[upcomingFragmentIndex];
            newLineIndex = upcomingFragment.code.indexOf('\n');
            if (newLineIndex === -1) {
              // Keep searching upcoming fragments until we can’t go any
              // further, either because there are no fragments left or we’ve
              // discovered that we’re in a code block that is interpolated
              // inside a string.
              if (upcomingFragmentIndex === fragments.length - 1) {
                upcomingFragment.code = upcomingFragment.code + '\n';
                newLineIndex = upcomingFragment.code.length;
              } else if (upcomingFragment.isStringWithInterpolations && upcomingFragment.code === '}') {
                code = `${code}\n`;
                newLineIndex = 0;
              } else {
                continue;
              }
            }
            delete fragment.followingComments;
            if (upcomingFragment.code === '\n') {
              // Avoid inserting extra blank lines.
              code = code.replace(/^\n/, '');
            }
            upcomingFragment.code = upcomingFragment.code.slice(0, newLineIndex) + code + upcomingFragment.code.slice(newLineIndex);
            break;
          }
        }
      }
      return fragments;
    }

    // Wrap up the given nodes as a **Block**, unless it already happens
    // to be one.
    static wrap(nodes) {
      if (nodes.length === 1 && nodes[0] instanceof Block) {
        return nodes[0];
      }
      return new Block(nodes);
    }

    astNode(o) {
      if (((o.level != null) && o.level !== LEVEL_TOP) && this.expressions.length) {
        return (new Sequence(this.expressions).withLocationDataFrom(this)).ast(o);
      }
      return super.astNode(o);
    }

    astType() {
      if (this.isRootBlock) {
        return 'Program';
      } else if (this.isClassBody) {
        return 'ClassBody';
      } else {
        return 'BlockStatement';
      }
    }

    astProperties(o) {
      var body, checkForDirectives, directives, expression, expressionAst, j, len1, ref1;
      checkForDirectives = del(o, 'checkForDirectives');
      if (this.isRootBlock || checkForDirectives) {
        sniffDirectives(this.expressions, {
          notFinalExpression: checkForDirectives
        });
      }
      directives = [];
      body = [];
      ref1 = this.expressions;
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        expression = ref1[j];
        expressionAst = expression.ast(o);
        // Ignore generated PassthroughLiteral
        if (expressionAst == null) {
          continue;
        } else if (expression instanceof Directive) {
          directives.push(expressionAst);
        // If an expression is a statement, it can be added to the body as is.
        } else if (expression.isStatementAst(o)) {
          body.push(expressionAst);
        } else {
          // Otherwise, we need to wrap it in an `ExpressionStatement` AST node.
          body.push(Object.assign({
            type: 'ExpressionStatement',
            expression: expressionAst
          }, expression.astLocationData()));
        }
      }
      // For now, we’re not including `sourceType` on the `Program` AST node.
      // Its value could be either `'script'` or `'module'`, and there’s no way
      // for CoffeeScript to always know which it should be. The presence of an
      // `import` or `export` statement in source code would imply that it should
      // be a `module`, but a project may consist of mostly such files and also
      // an outlier file that lacks `import` or `export` but is still imported
      // into the project and therefore expects to be treated as a `module`.
      // Determining the value of `sourceType` is essentially the same challenge
      // posed by determining the parse goal of a JavaScript file, also `module`
      // or `script`, and so if Node figures out a way to do so for `.js` files
      // then CoffeeScript can copy Node’s algorithm.

        // sourceType: 'module'
      return {body, directives};
    }

    astLocationData() {
      if (this.isRootBlock && (this.locationData == null)) {
        return;
      }
      return super.astLocationData();
    }

  };

  Block.prototype.children = ['expressions'];

  return Block;

}).call(this);

// A directive e.g. 'use strict'.
// Currently only used during AST generation.
exports.Directive = Directive = class Directive extends Base {
  constructor(value1) {
    super();
    this.value = value1;
  }

  astProperties(o) {
    return {
      value: Object.assign({}, this.value.ast(o), {
        type: 'DirectiveLiteral'
      })
    };
  }

};

//### Literal

// `Literal` is a base class for static values that can be passed through
// directly into JavaScript without translation, such as: strings, numbers,
// `true`, `false`, `null`...
exports.Literal = Literal = (function() {
  class Literal extends Base {
    constructor(value1) {
      super();
      this.value = value1;
    }

    assigns(name) {
      return name === this.value;
    }

    compileNode(o) {
      return [this.makeCode(this.value)];
    }

    astProperties() {
      return {
        value: this.value
      };
    }

    toString() {
      // This is only intended for debugging.
      return ` ${this.isStatement() ? super.toString() : this.constructor.name}: ${this.value}`;
    }

  };

  Literal.prototype.shouldCache = NO;

  return Literal;

}).call(this);

exports.NumberLiteral = NumberLiteral = class NumberLiteral extends Literal {
  constructor(value1, {parsedValue} = {}) {
    super();
    this.value = value1;
    this.parsedValue = parsedValue;
    if (this.parsedValue == null) {
      if (isNumber(this.value)) {
        this.parsedValue = this.value;
        this.value = `${this.value}`;
      } else {
        this.parsedValue = parseNumber(this.value);
      }
    }
  }

  isBigInt() {
    return /n$/.test(this.value);
  }

  astType() {
    if (this.isBigInt()) {
      return 'BigIntLiteral';
    } else {
      return 'NumericLiteral';
    }
  }

  astProperties() {
    return {
      value: this.isBigInt() ? this.parsedValue.toString() : this.parsedValue,
      extra: {
        rawValue: this.isBigInt() ? this.parsedValue.toString() : this.parsedValue,
        raw: this.value
      }
    };
  }

};

exports.InfinityLiteral = InfinityLiteral = class InfinityLiteral extends NumberLiteral {
  constructor(value1, {originalValue: originalValue = 'Infinity'} = {}) {
    super();
    this.value = value1;
    this.originalValue = originalValue;
  }

  compileNode() {
    return [this.makeCode('2e308')];
  }

  astNode(o) {
    if (this.originalValue !== 'Infinity') {
      return new NumberLiteral(this.value).withLocationDataFrom(this).ast(o);
    }
    return super.astNode(o);
  }

  astType() {
    return 'Identifier';
  }

  astProperties() {
    return {
      name: 'Infinity',
      declaration: false
    };
  }

};

exports.NaNLiteral = NaNLiteral = class NaNLiteral extends NumberLiteral {
  constructor() {
    super('NaN');
  }

  compileNode(o) {
    var code;
    code = [this.makeCode('0/0')];
    if (o.level >= LEVEL_OP) {
      return this.wrapInParentheses(code);
    } else {
      return code;
    }
  }

  astType() {
    return 'Identifier';
  }

  astProperties() {
    return {
      name: 'NaN',
      declaration: false
    };
  }

};

exports.StringLiteral = StringLiteral = class StringLiteral extends Literal {
  constructor(originalValue, {
      quote,
      initialChunk,
      finalChunk,
      indent: indent1,
      double: double1,
      heregex: heregex1
    } = {}) {
    var heredoc, indentRegex, val;
    super('');
    this.originalValue = originalValue;
    this.quote = quote;
    this.initialChunk = initialChunk;
    this.finalChunk = finalChunk;
    this.indent = indent1;
    this.double = double1;
    this.heregex = heregex1;
    if (this.quote === '///') {
      this.quote = null;
    }
    this.fromSourceString = this.quote != null;
    if (this.quote == null) {
      this.quote = '"';
    }
    heredoc = this.isFromHeredoc();
    val = this.originalValue;
    if (this.heregex) {
      val = val.replace(HEREGEX_OMIT, '$1$2');
      val = replaceUnicodeCodePointEscapes(val, {
        flags: this.heregex.flags
      });
    } else {
      val = val.replace(STRING_OMIT, '$1');
      val = !this.fromSourceString ? val : heredoc ? (this.indent ? indentRegex = RegExp(`\\n${this.indent}`, "g") : void 0, indentRegex ? val = val.replace(indentRegex, '\n') : void 0, this.initialChunk ? val = val.replace(LEADING_BLANK_LINE, '') : void 0, this.finalChunk ? val = val.replace(TRAILING_BLANK_LINE, '') : void 0, val) : val.replace(SIMPLE_STRING_OMIT, (match, offset) => {
        if ((this.initialChunk && offset === 0) || (this.finalChunk && offset + match.length === val.length)) {
          return '';
        } else {
          return ' ';
        }
      });
    }
    this.delimiter = this.quote.charAt(0);
    this.value = makeDelimitedLiteral(val, {delimiter: this.delimiter, double: this.double});
    this.unquotedValueForTemplateLiteral = makeDelimitedLiteral(val, {
      delimiter: '`',
      double: this.double,
      escapeNewlines: false,
      includeDelimiters: false,
      convertTrailingNullEscapes: true
    });
    this.unquotedValueForJSX = makeDelimitedLiteral(val, {
      double: this.double,
      escapeNewlines: false,
      includeDelimiters: false,
      escapeDelimiter: false
    });
  }

  compileNode(o) {
    if (this.shouldGenerateTemplateLiteral()) {
      return StringWithInterpolations.fromStringLiteral(this).compileNode(o);
    }
    if (this.jsx) {
      return [this.makeCode(this.unquotedValueForJSX)];
    }
    return super.compileNode(o);
  }

  // `StringLiteral`s can represent either entire literal strings
  // or pieces of text inside of e.g. an interpolated string.
  // When parsed as the former but needing to be treated as the latter
  // (e.g. the string part of a tagged template literal), this will return
  // a copy of the `StringLiteral` with the quotes trimmed from its location
  // data (like it would have if parsed as part of an interpolated string).
  withoutQuotesInLocationData() {
    var copy, endsWithNewline, locationData;
    endsWithNewline = this.originalValue.slice(-1) === '\n';
    locationData = Object.assign({}, this.locationData);
    locationData.first_column += this.quote.length;
    if (endsWithNewline) {
      locationData.last_line -= 1;
      locationData.last_column = locationData.last_line === locationData.first_line ? locationData.first_column + this.originalValue.length - '\n'.length : this.originalValue.slice(0, -1).length - '\n'.length - this.originalValue.slice(0, -1).lastIndexOf('\n');
    } else {
      locationData.last_column -= this.quote.length;
    }
    locationData.last_column_exclusive -= this.quote.length;
    locationData.range = [locationData.range[0] + this.quote.length, locationData.range[1] - this.quote.length];
    copy = new StringLiteral(this.originalValue, {quote: this.quote, initialChunk: this.initialChunk, finalChunk: this.finalChunk, indent: this.indent, double: this.double, heregex: this.heregex});
    copy.locationData = locationData;
    return copy;
  }

  isFromHeredoc() {
    return this.quote.length === 3;
  }

  shouldGenerateTemplateLiteral() {
    return this.isFromHeredoc();
  }

  astNode(o) {
    if (this.shouldGenerateTemplateLiteral()) {
      return StringWithInterpolations.fromStringLiteral(this).ast(o);
    }
    return super.astNode(o);
  }

  astProperties() {
    return {
      value: this.originalValue,
      extra: {
        raw: `${this.delimiter}${this.originalValue}${this.delimiter}`
      }
    };
  }

};

exports.RegexLiteral = RegexLiteral = (function() {
  class RegexLiteral extends Literal {
    constructor(value, {delimiter: delimiter1 = '/', heregexCommentTokens: heregexCommentTokens = []} = {}) {
      var endDelimiterIndex, heregex, val;
      super('');
      this.delimiter = delimiter1;
      this.heregexCommentTokens = heregexCommentTokens;
      heregex = this.delimiter === '///';
      endDelimiterIndex = value.lastIndexOf('/');
      this.flags = value.slice(endDelimiterIndex + 1);
      val = this.originalValue = value.slice(1, endDelimiterIndex);
      if (heregex) {
        val = val.replace(HEREGEX_OMIT, '$1$2');
      }
      val = replaceUnicodeCodePointEscapes(val, {flags: this.flags});
      this.value = `${makeDelimitedLiteral(val, {
        delimiter: '/'
      })}${this.flags}`;
    }

    astType() {
      return 'RegExpLiteral';
    }

    astProperties(o) {
      var heregexCommentToken, pattern;
      [, pattern] = this.REGEX_REGEX.exec(this.value);
      return {
        value: void 0,
        pattern,
        flags: this.flags,
        delimiter: this.delimiter,
        originalPattern: this.originalValue,
        extra: {
          raw: this.value,
          originalRaw: `${this.delimiter}${this.originalValue}${this.delimiter}${this.flags}`,
          rawValue: void 0
        },
        comments: (function() {
          var j, len1, ref1, results1;
          ref1 = this.heregexCommentTokens;
          results1 = [];
          for (j = 0, len1 = ref1.length; j < len1; j++) {
            heregexCommentToken = ref1[j];
            if (heregexCommentToken.here) {
              results1.push(new HereComment(heregexCommentToken).ast(o));
            } else {
              results1.push(new LineComment(heregexCommentToken).ast(o));
            }
          }
          return results1;
        }).call(this)
      };
    }

  };

  RegexLiteral.prototype.REGEX_REGEX = /^\/(.*)\/\w*$/;

  return RegexLiteral;

}).call(this);

exports.PassthroughLiteral = PassthroughLiteral = class PassthroughLiteral extends Literal {
  constructor(originalValue, {here, generated} = {}) {
    super('');
    this.originalValue = originalValue;
    this.here = here;
    this.generated = generated;
    this.value = this.originalValue.replace(/\\+(`|$)/g, function(string) {
      // `string` is always a value like '\`', '\\\`', '\\\\\`', etc.
      // By reducing it to its latter half, we turn '\`' to '`', '\\\`' to '\`', etc.
      return string.slice(-Math.ceil(string.length / 2));
    });
  }

  astNode(o) {
    if (this.generated) {
      return null;
    }
    return super.astNode(o);
  }

  astProperties() {
    return {
      value: this.originalValue,
      here: !!this.here
    };
  }

};

exports.IdentifierLiteral = IdentifierLiteral = (function() {
  class IdentifierLiteral extends Literal {
    eachName(iterator) {
      return iterator(this);
    }

    astType() {
      if (this.jsx) {
        return 'JSXIdentifier';
      } else {
        return 'Identifier';
      }
    }

    astProperties() {
      return {
        name: this.value,
        declaration: !!this.isDeclaration
      };
    }

  };

  IdentifierLiteral.prototype.isAssignable = YES;

  return IdentifierLiteral;

}).call(this);

exports.PropertyName = PropertyName = (function() {
  class PropertyName extends Literal {
    astType() {
      if (this.jsx) {
        return 'JSXIdentifier';
      } else {
        return 'Identifier';
      }
    }

    astProperties() {
      return {
        name: this.value,
        declaration: false
      };
    }

  };

  PropertyName.prototype.isAssignable = YES;

  return PropertyName;

}).call(this);

exports.ComputedPropertyName = ComputedPropertyName = class ComputedPropertyName extends PropertyName {
  compileNode(o) {
    return [this.makeCode('['), ...this.value.compileToFragments(o, LEVEL_LIST), this.makeCode(']')];
  }

  astNode(o) {
    return this.value.ast(o);
  }

};

exports.StatementLiteral = StatementLiteral = (function() {
  class StatementLiteral extends Literal {
    jumps(o) {
      if (this.value === 'break' && !((o != null ? o.loop : void 0) || (o != null ? o.block : void 0))) {
        return this;
      }
      if (this.value === 'continue' && !(o != null ? o.loop : void 0)) {
        return this;
      }
    }

    compileNode(o) {
      return [this.makeCode(`${this.tab}${this.value};`)];
    }

    astType() {
      switch (this.value) {
        case 'continue':
          return 'ContinueStatement';
        case 'break':
          return 'BreakStatement';
        case 'debugger':
          return 'DebuggerStatement';
      }
    }

  };

  StatementLiteral.prototype.isStatement = YES;

  StatementLiteral.prototype.makeReturn = THIS;

  return StatementLiteral;

}).call(this);

exports.ThisLiteral = ThisLiteral = class ThisLiteral extends Literal {
  constructor(value) {
    super('this');
    this.shorthand = value === '@';
  }

  compileNode(o) {
    var code, ref1;
    code = ((ref1 = o.scope.method) != null ? ref1.bound : void 0) ? o.scope.method.context : this.value;
    return [this.makeCode(code)];
  }

  astType() {
    return 'ThisExpression';
  }

  astProperties() {
    return {
      shorthand: this.shorthand
    };
  }

};

exports.UndefinedLiteral = UndefinedLiteral = class UndefinedLiteral extends Literal {
  constructor() {
    super('undefined');
  }

  compileNode(o) {
    return [this.makeCode(o.level >= LEVEL_ACCESS ? '(void 0)' : 'void 0')];
  }

  astType() {
    return 'Identifier';
  }

  astProperties() {
    return {
      name: this.value,
      declaration: false
    };
  }

};

exports.NullLiteral = NullLiteral = class NullLiteral extends Literal {
  constructor() {
    super('null');
  }

};

exports.BooleanLiteral = BooleanLiteral = class BooleanLiteral extends Literal {
  constructor(value, {originalValue} = {}) {
    super(value);
    this.originalValue = originalValue;
    if (this.originalValue == null) {
      this.originalValue = this.value;
    }
  }

  astProperties() {
    return {
      value: this.value === 'true' ? true : false,
      name: this.originalValue
    };
  }

};

exports.DefaultLiteral = DefaultLiteral = class DefaultLiteral extends Literal {
  astType() {
    return 'Identifier';
  }

  astProperties() {
    return {
      name: 'default',
      declaration: false
    };
  }

};

//### Return

// A `return` is a *pureStatement*—wrapping it in a closure wouldn’t make sense.
exports.Return = Return = (function() {
  class Return extends Base {
    constructor(expression1, {belongsToFuncDirectiveReturn} = {}) {
      super();
      this.expression = expression1;
      this.belongsToFuncDirectiveReturn = belongsToFuncDirectiveReturn;
    }

    compileToFragments(o, level) {
      var expr, ref1;
      expr = (ref1 = this.expression) != null ? ref1.makeReturn() : void 0;
      if (expr && !(expr instanceof Return)) {
        return expr.compileToFragments(o, level);
      } else {
        return super.compileToFragments(o, level);
      }
    }

    compileNode(o) {
      var answer, fragment, j, len1;
      answer = [];
      // TODO: If we call `expression.compile()` here twice, we’ll sometimes
      // get back different results!
      if (this.expression) {
        answer = this.expression.compileToFragments(o, LEVEL_PAREN);
        unshiftAfterComments(answer, this.makeCode(`${this.tab}return `));
// Since the `return` got indented by `@tab`, preceding comments that are
// multiline need to be indented.
        for (j = 0, len1 = answer.length; j < len1; j++) {
          fragment = answer[j];
          if (fragment.isHereComment && indexOf.call(fragment.code, '\n') >= 0) {
            fragment.code = multident(fragment.code, this.tab);
          } else if (fragment.isLineComment) {
            fragment.code = `${this.tab}${fragment.code}`;
          } else {
            break;
          }
        }
      } else {
        answer.push(this.makeCode(`${this.tab}return`));
      }
      answer.push(this.makeCode(';'));
      return answer;
    }

    checkForPureStatementInExpression() {
      // don’t flag `return` from `await return`/`yield return` as invalid.
      if (this.belongsToFuncDirectiveReturn) {
        return;
      }
      return super.checkForPureStatementInExpression();
    }

    astType() {
      return 'ReturnStatement';
    }

    astProperties(o) {
      var ref1, ref2;
      return {
        argument: (ref1 = (ref2 = this.expression) != null ? ref2.ast(o, LEVEL_PAREN) : void 0) != null ? ref1 : null
      };
    }

  };

  Return.prototype.children = ['expression'];

  Return.prototype.isStatement = YES;

  Return.prototype.makeReturn = THIS;

  Return.prototype.jumps = THIS;

  return Return;

}).call(this);

// Parent class for `YieldReturn`/`AwaitReturn`.
exports.FuncDirectiveReturn = FuncDirectiveReturn = (function() {
  class FuncDirectiveReturn extends Return {
    constructor(expression, {returnKeyword}) {
      super(expression);
      this.returnKeyword = returnKeyword;
    }

    compileNode(o) {
      this.checkScope(o);
      return super.compileNode(o);
    }

    checkScope(o) {
      if (o.scope.parent == null) {
        return this.error(`${this.keyword} can only occur inside functions`);
      }
    }

    astNode(o) {
      this.checkScope(o);
      return new Op(this.keyword, new Return(this.expression, {
        belongsToFuncDirectiveReturn: true
      }).withLocationDataFrom(this.expression != null ? {
        locationData: mergeLocationData(this.returnKeyword.locationData, this.expression.locationData)
      } : this.returnKeyword)).withLocationDataFrom(this).ast(o);
    }

  };

  FuncDirectiveReturn.prototype.isStatementAst = NO;

  return FuncDirectiveReturn;

}).call(this);

// `yield return` works exactly like `return`, except that it turns the function
// into a generator.
exports.YieldReturn = YieldReturn = (function() {
  class YieldReturn extends FuncDirectiveReturn {};

  YieldReturn.prototype.keyword = 'yield';

  return YieldReturn;

}).call(this);

exports.AwaitReturn = AwaitReturn = (function() {
  class AwaitReturn extends FuncDirectiveReturn {};

  AwaitReturn.prototype.keyword = 'await';

  return AwaitReturn;

}).call(this);

//### Value

// A value, variable or literal or parenthesized, indexed or dotted into,
// or vanilla.
exports.Value = Value = (function() {
  class Value extends Base {
    constructor(base, props, tag, isDefaultValue = false) {
      var ref1, ref2;
      super();
      if (!props && base instanceof Value) {
        return base;
      }
      this.base = base;
      this.properties = props || [];
      this.tag = tag;
      if (tag) {
        this[tag] = true;
      }
      this.isDefaultValue = isDefaultValue;
      // If this is a `@foo =` assignment, if there are comments on `@` move them
      // to be on `foo`.
      if (((ref1 = this.base) != null ? ref1.comments : void 0) && this.base instanceof ThisLiteral && (((ref2 = this.properties[0]) != null ? ref2.name : void 0) != null)) {
        moveComments(this.base, this.properties[0].name);
      }
    }

    // Add a property (or *properties* ) `Access` to the list.
    add(props) {
      this.properties = this.properties.concat(props);
      this.forceUpdateLocation = true;
      return this;
    }

    hasProperties() {
      return this.properties.length !== 0;
    }

    bareLiteral(type) {
      return !this.properties.length && this.base instanceof type;
    }

    // Some boolean checks for the benefit of other nodes.
    isArray() {
      return this.bareLiteral(Arr);
    }

    isRange() {
      return this.bareLiteral(Range);
    }

    shouldCache() {
      return this.hasProperties() || this.base.shouldCache();
    }

    isAssignable(opts) {
      return this.hasProperties() || this.base.isAssignable(opts);
    }

    isNumber() {
      return this.bareLiteral(NumberLiteral);
    }

    isString() {
      return this.bareLiteral(StringLiteral);
    }

    isRegex() {
      return this.bareLiteral(RegexLiteral);
    }

    isUndefined() {
      return this.bareLiteral(UndefinedLiteral);
    }

    isNull() {
      return this.bareLiteral(NullLiteral);
    }

    isBoolean() {
      return this.bareLiteral(BooleanLiteral);
    }

    isAtomic() {
      var j, len1, node, ref1;
      ref1 = this.properties.concat(this.base);
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        node = ref1[j];
        if (node.soak || node instanceof Call || node instanceof Op && node.operator === 'do') {
          return false;
        }
      }
      return true;
    }

    isNotCallable() {
      return this.isNumber() || this.isString() || this.isRegex() || this.isArray() || this.isRange() || this.isSplice() || this.isObject() || this.isUndefined() || this.isNull() || this.isBoolean();
    }

    isStatement(o) {
      return !this.properties.length && this.base.isStatement(o);
    }

    isJSXTag() {
      return this.base instanceof JSXTag;
    }

    assigns(name) {
      return !this.properties.length && this.base.assigns(name);
    }

    jumps(o) {
      return !this.properties.length && this.base.jumps(o);
    }

    isObject(onlyGenerated) {
      if (this.properties.length) {
        return false;
      }
      return (this.base instanceof Obj) && (!onlyGenerated || this.base.generated);
    }

    isElision() {
      if (!(this.base instanceof Arr)) {
        return false;
      }
      return this.base.hasElision();
    }

    isSplice() {
      var lastProperty, ref1;
      ref1 = this.properties, [lastProperty] = slice1.call(ref1, -1);
      return lastProperty instanceof Slice;
    }

    looksStatic(className) {
      var name, ref1, thisLiteral;
      if (!(((thisLiteral = this.base) instanceof ThisLiteral || (name = this.base).value === className) && this.properties.length === 1 && ((ref1 = this.properties[0].name) != null ? ref1.value : void 0) !== 'prototype')) {
        return false;
      }
      return {
        staticClassName: thisLiteral != null ? thisLiteral : name
      };
    }

    // The value can be unwrapped as its inner node, if there are no attached
    // properties.
    unwrap() {
      if (this.properties.length) {
        return this;
      } else {
        return this.base;
      }
    }

    // A reference has base part (`this` value) and name part.
    // We cache them separately for compiling complex expressions.
    // `a()[b()] ?= c` -> `(_base = a())[_name = b()] ? _base[_name] = c`
    cacheReference(o) {
      var base, bref, name, nref, ref1;
      ref1 = this.properties, [name] = slice1.call(ref1, -1);
      if (this.properties.length < 2 && !this.base.shouldCache() && !(name != null ? name.shouldCache() : void 0)) {
        return [this, this]; // `a` `a.b`
      }
      base = new Value(this.base, this.properties.slice(0, -1));
      if (base.shouldCache()) { // `a().b`
        bref = new IdentifierLiteral(o.scope.freeVariable('base'));
        base = new Value(new Parens(new Assign(bref, base)));
      }
      if (!name) { // `a()`
        return [base, bref];
      }
      if (name.shouldCache()) { // `a[b()]`
        nref = new IdentifierLiteral(o.scope.freeVariable('name'));
        name = new Index(new Assign(nref, name.index));
        nref = new Index(nref);
      }
      return [base.add(name), new Value(bref || base.base, [nref || name])];
    }

    // We compile a value to JavaScript by compiling and joining each property.
    // Things get much more interesting if the chain of properties has *soak*
    // operators `?.` interspersed. Then we have to take care not to accidentally
    // evaluate anything twice when building the soak chain.
    compileNode(o) {
      var fragments, j, len1, prop, props;
      this.base.front = this.front;
      props = this.properties;
      if (props.length && (this.base.cached != null)) {
        // Cached fragments enable correct order of the compilation,
        // and reuse of variables in the scope.
        // Example:
        // `a(x = 5).b(-> x = 6)` should compile in the same order as
        // `a(x = 5); b(-> x = 6)`
        // (see issue #4437, https://github.com/jashkenas/coffeescript/issues/4437)
        fragments = this.base.cached;
      } else {
        fragments = this.base.compileToFragments(o, (props.length ? LEVEL_ACCESS : null));
      }
      if (props.length && SIMPLENUM.test(fragmentsToText(fragments))) {
        fragments.push(this.makeCode('.'));
      }
      for (j = 0, len1 = props.length; j < len1; j++) {
        prop = props[j];
        fragments.push(...(prop.compileToFragments(o)));
      }
      return fragments;
    }

    // Unfold a soak into an `If`: `a?.b` -> `a.b if a?`
    unfoldSoak(o) {
      return this.unfoldedSoak != null ? this.unfoldedSoak : this.unfoldedSoak = (() => {
        var fst, i, ifn, j, len1, prop, ref, ref1, snd;
        ifn = this.base.unfoldSoak(o);
        if (ifn) {
          ifn.body.properties.push(...this.properties);
          return ifn;
        }
        ref1 = this.properties;
        for (i = j = 0, len1 = ref1.length; j < len1; i = ++j) {
          prop = ref1[i];
          if (!prop.soak) {
            continue;
          }
          prop.soak = false;
          fst = new Value(this.base, this.properties.slice(0, i));
          snd = new Value(this.base, this.properties.slice(i));
          if (fst.shouldCache()) {
            ref = new IdentifierLiteral(o.scope.freeVariable('ref'));
            fst = new Parens(new Assign(ref, fst));
            snd.base = ref;
          }
          return new If(new Existence(fst), snd, {
            soak: true
          });
        }
        return false;
      })();
    }

    eachName(iterator, {checkAssignability = true} = {}) {
      if (this.hasProperties()) {
        return iterator(this);
      } else if (!checkAssignability || this.base.isAssignable()) {
        return this.base.eachName(iterator);
      } else {
        return this.error('tried to assign to unassignable value');
      }
    }

    // For AST generation, we need an `object` that’s this `Value` minus its last
    // property, if it has properties.
    object() {
      var initialProperties, object;
      if (!this.hasProperties()) {
        return this;
      }
      // Get all properties except the last one; for a `Value` with only one
      // property, `initialProperties` is an empty array.
      initialProperties = this.properties.slice(0, this.properties.length - 1);
      // Create the `object` that becomes the new “base” for the split-off final
      // property.
      object = new Value(this.base, initialProperties, this.tag, this.isDefaultValue);
      // Add location data to our new node, so that it has correct location data
      // for source maps or later conversion into AST location data.
      // This new `Value` has only one property, so the location data is just
      // that of the parent `Value`’s base.
      // This new `Value` has multiple properties, so the location data spans
      // from the parent `Value`’s base to the last property that’s included
      // in this new node (a.k.a. the second-to-last property of the parent).
      object.locationData = initialProperties.length === 0 ? this.base.locationData : mergeLocationData(this.base.locationData, initialProperties[initialProperties.length - 1].locationData);
      return object;
    }

    containsSoak() {
      var j, len1, property, ref1;
      if (!this.hasProperties()) {
        return false;
      }
      ref1 = this.properties;
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        property = ref1[j];
        if (property.soak) {
          return true;
        }
      }
      if (this.base instanceof Call && this.base.soak) {
        return true;
      }
      return false;
    }

    astNode(o) {
      if (!this.hasProperties()) {
        // If the `Value` has no properties, the AST node is just whatever this
        // node’s `base` is.
        return this.base.ast(o);
      }
      // Otherwise, call `Base::ast` which in turn calls the `astType` and
      // `astProperties` methods below.
      return super.astNode(o);
    }

    astType() {
      if (this.isJSXTag()) {
        return 'JSXMemberExpression';
      } else if (this.containsSoak()) {
        return 'OptionalMemberExpression';
      } else {
        return 'MemberExpression';
      }
    }

    // If this `Value` has properties, the *last* property (e.g. `c` in `a.b.c`)
    // becomes the `property`, and the preceding properties (e.g. `a.b`) become
    // a child `Value` node assigned to the `object` property.
    astProperties(o) {
      var computed, property, ref1, ref2;
      ref1 = this.properties, [property] = slice1.call(ref1, -1);
      if (this.isJSXTag()) {
        property.name.jsx = true;
      }
      computed = property instanceof Index || !(((ref2 = property.name) != null ? ref2.unwrap() : void 0) instanceof PropertyName);
      return {
        object: this.object().ast(o, LEVEL_ACCESS),
        property: property.ast(o, (computed ? LEVEL_PAREN : void 0)),
        computed,
        optional: !!property.soak,
        shorthand: !!property.shorthand
      };
    }

    astLocationData() {
      if (!this.isJSXTag()) {
        return super.astLocationData();
      }
      // don't include leading < of JSX tag in location data
      return mergeAstLocationData(jisonLocationDataToAstLocationData(this.base.tagNameLocationData), jisonLocationDataToAstLocationData(this.properties[this.properties.length - 1].locationData));
    }

  };

  Value.prototype.children = ['base', 'properties'];

  return Value;

}).call(this);

exports.MetaProperty = MetaProperty = (function() {
  class MetaProperty extends Base {
    constructor(meta, property1) {
      super();
      this.meta = meta;
      this.property = property1;
    }

    checkValid(o) {
      if (this.meta.value === 'new') {
        if (this.property instanceof Access && this.property.name.value === 'target') {
          if (o.scope.parent == null) {
            return this.error("new.target can only occur inside functions");
          }
        } else {
          return this.error("the only valid meta property for new is new.target");
        }
      } else if (this.meta.value === 'import') {
        if (!(this.property instanceof Access && this.property.name.value === 'meta')) {
          return this.error("the only valid meta property for import is import.meta");
        }
      }
    }

    compileNode(o) {
      var fragments;
      this.checkValid(o);
      fragments = [];
      fragments.push(...this.meta.compileToFragments(o, LEVEL_ACCESS));
      fragments.push(...this.property.compileToFragments(o));
      return fragments;
    }

    astProperties(o) {
      this.checkValid(o);
      return {
        meta: this.meta.ast(o, LEVEL_ACCESS),
        property: this.property.ast(o)
      };
    }

  };

  MetaProperty.prototype.children = ['meta', 'property'];

  return MetaProperty;

}).call(this);

//### HereComment

// Comment delimited by `###` (becoming `/* */`).
exports.HereComment = HereComment = class HereComment extends Base {
  constructor({
      content: content1,
      newLine,
      unshift,
      locationData: locationData1
    }) {
    super();
    this.content = content1;
    this.newLine = newLine;
    this.unshift = unshift;
    this.locationData = locationData1;
  }

  compileNode(o) {
    var fragment, hasLeadingMarks, indent, j, leadingWhitespace, len1, line, multiline, ref1;
    multiline = indexOf.call(this.content, '\n') >= 0;
    // Unindent multiline comments. They will be reindented later.
    if (multiline) {
      indent = null;
      ref1 = this.content.split('\n');
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        line = ref1[j];
        leadingWhitespace = /^\s*/.exec(line)[0];
        if (!indent || leadingWhitespace.length < indent.length) {
          indent = leadingWhitespace;
        }
      }
      if (indent) {
        this.content = this.content.replace(RegExp(`\\n${indent}`, "g"), '\n');
      }
    }
    hasLeadingMarks = /\n\s*[#|\*]/.test(this.content);
    if (hasLeadingMarks) {
      this.content = this.content.replace(/^([ \t]*)#(?=\s)/gm, ' *');
    }
    this.content = `/*${this.content}${hasLeadingMarks ? ' ' : ''}*/`;
    fragment = this.makeCode(this.content);
    fragment.newLine = this.newLine;
    fragment.unshift = this.unshift;
    fragment.multiline = multiline;
    // Don’t rely on `fragment.type`, which can break when the compiler is minified.
    fragment.isComment = fragment.isHereComment = true;
    return fragment;
  }

  astType() {
    return 'CommentBlock';
  }

  astProperties() {
    return {
      value: this.content
    };
  }

};

//### LineComment

// Comment running from `#` to the end of a line (becoming `//`).
exports.LineComment = LineComment = class LineComment extends Base {
  constructor({
      content: content1,
      newLine,
      unshift,
      locationData: locationData1,
      precededByBlankLine
    }) {
    super();
    this.content = content1;
    this.newLine = newLine;
    this.unshift = unshift;
    this.locationData = locationData1;
    this.precededByBlankLine = precededByBlankLine;
  }

  compileNode(o) {
    var fragment;
    fragment = this.makeCode(/^\s*$/.test(this.content) ? '' : `${this.precededByBlankLine ? `\n${o.indent}` : ''}//${this.content}`);
    fragment.newLine = this.newLine;
    fragment.unshift = this.unshift;
    fragment.trail = !this.newLine && !this.unshift;
    // Don’t rely on `fragment.type`, which can break when the compiler is minified.
    fragment.isComment = fragment.isLineComment = true;
    return fragment;
  }

  astType() {
    return 'CommentLine';
  }

  astProperties() {
    return {
      value: this.content
    };
  }

};

//### JSX
exports.JSXIdentifier = JSXIdentifier = class JSXIdentifier extends IdentifierLiteral {
  astType() {
    return 'JSXIdentifier';
  }

};

exports.JSXTag = JSXTag = class JSXTag extends JSXIdentifier {
  constructor(value, {tagNameLocationData, closingTagOpeningBracketLocationData, closingTagSlashLocationData, closingTagNameLocationData, closingTagClosingBracketLocationData}) {
    super(value);
    this.tagNameLocationData = tagNameLocationData;
    this.closingTagOpeningBracketLocationData = closingTagOpeningBracketLocationData;
    this.closingTagSlashLocationData = closingTagSlashLocationData;
    this.closingTagNameLocationData = closingTagNameLocationData;
    this.closingTagClosingBracketLocationData = closingTagClosingBracketLocationData;
  }

  astProperties() {
    return {
      name: this.value
    };
  }

};

exports.JSXExpressionContainer = JSXExpressionContainer = (function() {
  class JSXExpressionContainer extends Base {
    constructor(expression1, {locationData} = {}) {
      super();
      this.expression = expression1;
      this.expression.jsxAttribute = true;
      this.locationData = locationData != null ? locationData : this.expression.locationData;
    }

    compileNode(o) {
      return this.expression.compileNode(o);
    }

    astProperties(o) {
      return {
        expression: astAsBlockIfNeeded(this.expression, o)
      };
    }

  };

  JSXExpressionContainer.prototype.children = ['expression'];

  return JSXExpressionContainer;

}).call(this);

exports.JSXEmptyExpression = JSXEmptyExpression = class JSXEmptyExpression extends Base {};

exports.JSXText = JSXText = class JSXText extends Base {
  constructor(stringLiteral) {
    super();
    this.value = stringLiteral.unquotedValueForJSX;
    this.locationData = stringLiteral.locationData;
  }

  astProperties() {
    return {
      value: this.value,
      extra: {
        raw: this.value
      }
    };
  }

};

exports.JSXAttribute = JSXAttribute = (function() {
  class JSXAttribute extends Base {
    constructor({
        name: name1,
        value
      }) {
      var ref1;
      super();
      this.name = name1;
      this.value = value != null ? (value = value.base, value instanceof StringLiteral && !value.shouldGenerateTemplateLiteral() ? value : new JSXExpressionContainer(value)) : null;
      if ((ref1 = this.value) != null) {
        ref1.comments = value.comments;
      }
    }

    compileNode(o) {
      var compiledName, val;
      compiledName = this.name.compileToFragments(o, LEVEL_LIST);
      if (this.value == null) {
        return compiledName;
      }
      val = this.value.compileToFragments(o, LEVEL_LIST);
      return compiledName.concat(this.makeCode('='), val);
    }

    astProperties(o) {
      var name, ref1, ref2;
      name = this.name;
      if (indexOf.call(name.value, ':') >= 0) {
        name = new JSXNamespacedName(name);
      }
      return {
        name: name.ast(o),
        value: (ref1 = (ref2 = this.value) != null ? ref2.ast(o) : void 0) != null ? ref1 : null
      };
    }

  };

  JSXAttribute.prototype.children = ['name', 'value'];

  return JSXAttribute;

}).call(this);

exports.JSXAttributes = JSXAttributes = (function() {
  class JSXAttributes extends Base {
    constructor(arr) {
      var attribute, base, j, k, len1, len2, object, property, ref1, ref2, value, variable;
      super();
      this.attributes = [];
      ref1 = arr.objects;
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        object = ref1[j];
        this.checkValidAttribute(object);
        ({base} = object);
        if (base instanceof IdentifierLiteral) {
          // attribute with no value eg disabled
          attribute = new JSXAttribute({
            name: new JSXIdentifier(base.value).withLocationDataAndCommentsFrom(base)
          });
          attribute.locationData = base.locationData;
          this.attributes.push(attribute);
        } else if (!base.generated) {
          // object spread attribute eg {...props}
          attribute = base.properties[0];
          attribute.jsx = true;
          attribute.locationData = base.locationData;
          this.attributes.push(attribute);
        } else {
          ref2 = base.properties;
          // Obj containing attributes with values eg a="b" c={d}
          for (k = 0, len2 = ref2.length; k < len2; k++) {
            property = ref2[k];
            ({variable, value} = property);
            attribute = new JSXAttribute({
              name: new JSXIdentifier(variable.base.value).withLocationDataAndCommentsFrom(variable.base),
              value
            });
            attribute.locationData = property.locationData;
            this.attributes.push(attribute);
          }
        }
      }
      this.locationData = arr.locationData;
    }

    // Catch invalid attributes: <div {a:"b", props} {props} "value" />
    checkValidAttribute(object) {
      var attribute, properties;
      ({
        base: attribute
      } = object);
      properties = (attribute != null ? attribute.properties : void 0) || [];
      if (!(attribute instanceof Obj || attribute instanceof IdentifierLiteral) || (attribute instanceof Obj && !attribute.generated && (properties.length > 1 || !(properties[0] instanceof Splat)))) {
        return object.error(`Unexpected token. Allowed JSX attributes are: id="val", src={source}, {props...} or attribute.`);
      }
    }

    compileNode(o) {
      var attribute, fragments, j, len1, ref1;
      fragments = [];
      ref1 = this.attributes;
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        attribute = ref1[j];
        fragments.push(this.makeCode(' '));
        fragments.push(...attribute.compileToFragments(o, LEVEL_TOP));
      }
      return fragments;
    }

    astNode(o) {
      var attribute, j, len1, ref1, results1;
      ref1 = this.attributes;
      results1 = [];
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        attribute = ref1[j];
        results1.push(attribute.ast(o));
      }
      return results1;
    }

  };

  JSXAttributes.prototype.children = ['attributes'];

  return JSXAttributes;

}).call(this);

exports.JSXNamespacedName = JSXNamespacedName = (function() {
  class JSXNamespacedName extends Base {
    constructor(tag) {
      var name, namespace;
      super();
      [namespace, name] = tag.value.split(':');
      this.namespace = new JSXIdentifier(namespace).withLocationDataFrom({
        locationData: extractSameLineLocationDataFirst(namespace.length)(tag.locationData)
      });
      this.name = new JSXIdentifier(name).withLocationDataFrom({
        locationData: extractSameLineLocationDataLast(name.length)(tag.locationData)
      });
      this.locationData = tag.locationData;
    }

    astProperties(o) {
      return {
        namespace: this.namespace.ast(o),
        name: this.name.ast(o)
      };
    }

  };

  JSXNamespacedName.prototype.children = ['namespace', 'name'];

  return JSXNamespacedName;

}).call(this);

// Node for a JSX element
exports.JSXElement = JSXElement = (function() {
  class JSXElement extends Base {
    constructor({
        tagName: tagName1,
        attributes,
        content: content1
      }) {
      super();
      this.tagName = tagName1;
      this.attributes = attributes;
      this.content = content1;
    }

    compileNode(o) {
      var fragments, ref1, tag;
      if ((ref1 = this.content) != null) {
        ref1.base.jsx = true;
      }
      fragments = [this.makeCode('<')];
      fragments.push(...(tag = this.tagName.compileToFragments(o, LEVEL_ACCESS)));
      fragments.push(...this.attributes.compileToFragments(o));
      if (this.content) {
        fragments.push(this.makeCode('>'));
        fragments.push(...this.content.compileNode(o, LEVEL_LIST));
        fragments.push(...[this.makeCode('</'), ...tag, this.makeCode('>')]);
      } else {
        fragments.push(this.makeCode(' />'));
      }
      return fragments;
    }

    isFragment() {
      return !this.tagName.base.value.length;
    }

    astNode(o) {
      var tagName;
      // The location data spanning the opening element < ... > is captured by
      // the generated Arr which contains the element's attributes
      this.openingElementLocationData = jisonLocationDataToAstLocationData(this.attributes.locationData);
      tagName = this.tagName.base;
      tagName.locationData = tagName.tagNameLocationData;
      if (this.content != null) {
        this.closingElementLocationData = mergeAstLocationData(jisonLocationDataToAstLocationData(tagName.closingTagOpeningBracketLocationData), jisonLocationDataToAstLocationData(tagName.closingTagClosingBracketLocationData));
      }
      return super.astNode(o);
    }

    astType() {
      if (this.isFragment()) {
        return 'JSXFragment';
      } else {
        return 'JSXElement';
      }
    }

    elementAstProperties(o) {
      var closingElement, columnDiff, currentExpr, openingElement, rangeDiff, ref1, shiftAstLocationData, tagNameAst;
      tagNameAst = () => {
        var tag;
        tag = this.tagName.unwrap();
        if ((tag != null ? tag.value : void 0) && indexOf.call(tag.value, ':') >= 0) {
          tag = new JSXNamespacedName(tag);
        }
        return tag.ast(o);
      };
      openingElement = Object.assign({
        type: 'JSXOpeningElement',
        name: tagNameAst(),
        selfClosing: this.closingElementLocationData == null,
        attributes: this.attributes.ast(o)
      }, this.openingElementLocationData);
      closingElement = null;
      if (this.closingElementLocationData != null) {
        closingElement = Object.assign({
          type: 'JSXClosingElement',
          name: Object.assign(tagNameAst(), jisonLocationDataToAstLocationData(this.tagName.base.closingTagNameLocationData))
        }, this.closingElementLocationData);
        if ((ref1 = closingElement.name.type) === 'JSXMemberExpression' || ref1 === 'JSXNamespacedName') {
          rangeDiff = closingElement.range[0] - openingElement.range[0] + '/'.length;
          columnDiff = closingElement.loc.start.column - openingElement.loc.start.column + '/'.length;
          shiftAstLocationData = (node) => {
            node.range = [node.range[0] + rangeDiff, node.range[1] + rangeDiff];
            node.start += rangeDiff;
            node.end += rangeDiff;
            node.loc.start = {
              line: this.closingElementLocationData.loc.start.line,
              column: node.loc.start.column + columnDiff
            };
            return node.loc.end = {
              line: this.closingElementLocationData.loc.start.line,
              column: node.loc.end.column + columnDiff
            };
          };
          if (closingElement.name.type === 'JSXMemberExpression') {
            currentExpr = closingElement.name;
            while (currentExpr.type === 'JSXMemberExpression') {
              if (currentExpr !== closingElement.name) {
                shiftAstLocationData(currentExpr);
              }
              shiftAstLocationData(currentExpr.property);
              currentExpr = currentExpr.object;
            }
            shiftAstLocationData(currentExpr); // JSXNamespacedName
          } else {
            shiftAstLocationData(closingElement.name.namespace);
            shiftAstLocationData(closingElement.name.name);
          }
        }
      }
      return {openingElement, closingElement};
    }

    fragmentAstProperties(o) {
      var closingFragment, openingFragment;
      openingFragment = Object.assign({
        type: 'JSXOpeningFragment'
      }, this.openingElementLocationData);
      closingFragment = Object.assign({
        type: 'JSXClosingFragment'
      }, this.closingElementLocationData);
      return {openingFragment, closingFragment};
    }

    contentAst(o) {
      var base1, child, children, content, element, emptyExpression, expression, j, len1, results1, unwrapped;
      if (!(this.content && !(typeof (base1 = this.content.base).isEmpty === "function" ? base1.isEmpty() : void 0))) {
        return [];
      }
      content = this.content.unwrapAll();
      children = (function() {
        var j, len1, ref1, results1;
        if (content instanceof StringLiteral) {
          return [new JSXText(content)]; // StringWithInterpolations
        } else {
          ref1 = this.content.unwrapAll().extractElements(o, {
            includeInterpolationWrappers: true,
            isJsx: true
          });
          results1 = [];
          for (j = 0, len1 = ref1.length; j < len1; j++) {
            element = ref1[j];
            if (element instanceof StringLiteral) {
              results1.push(new JSXText(element)); // Interpolation
            } else {
              ({expression} = element);
              if (expression == null) {
                emptyExpression = new JSXEmptyExpression();
                emptyExpression.locationData = emptyExpressionLocationData({
                  interpolationNode: element,
                  openingBrace: '{',
                  closingBrace: '}'
                });
                results1.push(new JSXExpressionContainer(emptyExpression, {
                  locationData: element.locationData
                }));
              } else {
                unwrapped = expression.unwrapAll();
                // distinguish `<a><b /></a>` from `<a>{<b />}</a>`
                if (unwrapped instanceof JSXElement && unwrapped.locationData.range[0] === element.locationData.range[0]) {
                  results1.push(unwrapped);
                } else {
                  results1.push(new JSXExpressionContainer(unwrapped, {
                    locationData: element.locationData
                  }));
                }
              }
            }
          }
          return results1;
        }
      }).call(this);
      results1 = [];
      for (j = 0, len1 = children.length; j < len1; j++) {
        child = children[j];
        if (!(child instanceof JSXText && child.value.length === 0)) {
          results1.push(child.ast(o));
        }
      }
      return results1;
    }

    astProperties(o) {
      return Object.assign(this.isFragment() ? this.fragmentAstProperties(o) : this.elementAstProperties(o), {
        children: this.contentAst(o)
      });
    }

    astLocationData() {
      if (this.closingElementLocationData != null) {
        return mergeAstLocationData(this.openingElementLocationData, this.closingElementLocationData);
      } else {
        return this.openingElementLocationData;
      }
    }

  };

  JSXElement.prototype.children = ['tagName', 'attributes', 'content'];

  return JSXElement;

}).call(this);

//### Call

// Node for a function invocation.
exports.Call = Call = (function() {
  class Call extends Base {
    constructor(variable1, args1 = [], soak1, token1) {
      var ref1;
      super();
      this.variable = variable1;
      this.args = args1;
      this.soak = soak1;
      this.token = token1;
      this.implicit = this.args.implicit;
      this.isNew = false;
      if (this.variable instanceof Value && this.variable.isNotCallable()) {
        this.variable.error("literal is not a function");
      }
      if (this.variable.base instanceof JSXTag) {
        return new JSXElement({
          tagName: this.variable,
          attributes: new JSXAttributes(this.args[0].base),
          content: this.args[1]
        });
      }
      // `@variable` never gets output as a result of this node getting created as
      // part of `RegexWithInterpolations`, so for that case move any comments to
      // the `args` property that gets passed into `RegexWithInterpolations` via
      // the grammar.
      if (((ref1 = this.variable.base) != null ? ref1.value : void 0) === 'RegExp' && this.args.length !== 0) {
        moveComments(this.variable, this.args[0]);
      }
    }

    // When setting the location, we sometimes need to update the start location to
    // account for a newly-discovered `new` operator to the left of us. This
    // expands the range on the left, but not the right.
    updateLocationDataIfMissing(locationData) {
      var base, ref1;
      if (this.locationData && this.needsUpdatedStartLocation) {
        this.locationData = Object.assign({}, this.locationData, {
          first_line: locationData.first_line,
          first_column: locationData.first_column,
          range: [locationData.range[0], this.locationData.range[1]]
        });
        base = ((ref1 = this.variable) != null ? ref1.base : void 0) || this.variable;
        if (base.needsUpdatedStartLocation) {
          this.variable.locationData = Object.assign({}, this.variable.locationData, {
            first_line: locationData.first_line,
            first_column: locationData.first_column,
            range: [locationData.range[0], this.variable.locationData.range[1]]
          });
          base.updateLocationDataIfMissing(locationData);
        }
        delete this.needsUpdatedStartLocation;
      }
      return super.updateLocationDataIfMissing(locationData);
    }

    // Tag this invocation as creating a new instance.
    newInstance() {
      var base, ref1;
      base = ((ref1 = this.variable) != null ? ref1.base : void 0) || this.variable;
      if (base instanceof Call && !base.isNew) {
        base.newInstance();
      } else {
        this.isNew = true;
      }
      this.needsUpdatedStartLocation = true;
      return this;
    }

    // Soaked chained invocations unfold into if/else ternary structures.
    unfoldSoak(o) {
      var call, ifn, j, left, len1, list, ref1, rite;
      if (this.soak) {
        if (this.variable instanceof Super) {
          left = new Literal(this.variable.compile(o));
          rite = new Value(left);
          if (this.variable.accessor == null) {
            this.variable.error("Unsupported reference to 'super'");
          }
        } else {
          if (ifn = unfoldSoak(o, this, 'variable')) {
            return ifn;
          }
          [left, rite] = new Value(this.variable).cacheReference(o);
        }
        rite = new Call(rite, this.args);
        rite.isNew = this.isNew;
        left = new Literal(`typeof ${left.compile(o)} === \"function\"`);
        return new If(left, new Value(rite), {
          soak: true
        });
      }
      call = this;
      list = [];
      while (true) {
        if (call.variable instanceof Call) {
          list.push(call);
          call = call.variable;
          continue;
        }
        if (!(call.variable instanceof Value)) {
          break;
        }
        list.push(call);
        if (!((call = call.variable.base) instanceof Call)) {
          break;
        }
      }
      ref1 = list.reverse();
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        call = ref1[j];
        if (ifn) {
          if (call.variable instanceof Call) {
            call.variable = ifn;
          } else {
            call.variable.base = ifn;
          }
        }
        ifn = unfoldSoak(o, call, 'variable');
      }
      return ifn;
    }

    // Compile a vanilla function call.
    compileNode(o) {
      var arg, argCode, argIndex, cache, compiledArgs, fragments, j, len1, ref1, ref2, ref3, ref4, varAccess;
      this.checkForNewSuper();
      if ((ref1 = this.variable) != null) {
        ref1.front = this.front;
      }
      compiledArgs = [];
      // If variable is `Accessor` fragments are cached and used later
      // in `Value::compileNode` to ensure correct order of the compilation,
      // and reuse of variables in the scope.
      // Example:
      // `a(x = 5).b(-> x = 6)` should compile in the same order as
      // `a(x = 5); b(-> x = 6)`
      // (see issue #4437, https://github.com/jashkenas/coffeescript/issues/4437)
      varAccess = ((ref2 = this.variable) != null ? (ref3 = ref2.properties) != null ? ref3[0] : void 0 : void 0) instanceof Access;
      argCode = (function() {
        var j, len1, ref4, results1;
        ref4 = this.args || [];
        results1 = [];
        for (j = 0, len1 = ref4.length; j < len1; j++) {
          arg = ref4[j];
          if (arg instanceof Code) {
            results1.push(arg);
          }
        }
        return results1;
      }).call(this);
      if (argCode.length > 0 && varAccess && !this.variable.base.cached) {
        [cache] = this.variable.base.cache(o, LEVEL_ACCESS, function() {
          return false;
        });
        this.variable.base.cached = cache;
      }
      ref4 = this.args;
      for (argIndex = j = 0, len1 = ref4.length; j < len1; argIndex = ++j) {
        arg = ref4[argIndex];
        if (argIndex) {
          compiledArgs.push(this.makeCode(", "));
        }
        compiledArgs.push(...(arg.compileToFragments(o, LEVEL_LIST)));
      }
      fragments = [];
      if (this.isNew) {
        fragments.push(this.makeCode('new '));
      }
      fragments.push(...this.variable.compileToFragments(o, LEVEL_ACCESS));
      fragments.push(this.makeCode('('), ...compiledArgs, this.makeCode(')'));
      return fragments;
    }

    checkForNewSuper() {
      if (this.isNew) {
        if (this.variable instanceof Super) {
          return this.variable.error("Unsupported reference to 'super'");
        }
      }
    }

    containsSoak() {
      var ref1;
      if (this.soak) {
        return true;
      }
      if ((ref1 = this.variable) != null ? typeof ref1.containsSoak === "function" ? ref1.containsSoak() : void 0 : void 0) {
        return true;
      }
      return false;
    }

    astNode(o) {
      var ref1;
      if (this.soak && this.variable instanceof Super && ((ref1 = o.scope.namedMethod()) != null ? ref1.ctor : void 0)) {
        this.variable.error("Unsupported reference to 'super'");
      }
      this.checkForNewSuper();
      return super.astNode(o);
    }

    astType() {
      if (this.isNew) {
        return 'NewExpression';
      } else if (this.containsSoak()) {
        return 'OptionalCallExpression';
      } else {
        return 'CallExpression';
      }
    }

    astProperties(o) {
      var arg;
      return {
        callee: this.variable.ast(o, LEVEL_ACCESS),
        arguments: (function() {
          var j, len1, ref1, results1;
          ref1 = this.args;
          results1 = [];
          for (j = 0, len1 = ref1.length; j < len1; j++) {
            arg = ref1[j];
            results1.push(arg.ast(o, LEVEL_LIST));
          }
          return results1;
        }).call(this),
        optional: !!this.soak,
        implicit: !!this.implicit
      };
    }

  };

  Call.prototype.children = ['variable', 'args'];

  return Call;

}).call(this);

//### Super

// Takes care of converting `super()` calls into calls against the prototype's
// function of the same name.
// When `expressions` are set the call will be compiled in such a way that the
// expressions are evaluated without altering the return value of the `SuperCall`
// expression.
exports.SuperCall = SuperCall = (function() {
  class SuperCall extends Call {
    isStatement(o) {
      var ref1;
      return ((ref1 = this.expressions) != null ? ref1.length : void 0) && o.level === LEVEL_TOP;
    }

    compileNode(o) {
      var ref, ref1, replacement, superCall;
      if (!((ref1 = this.expressions) != null ? ref1.length : void 0)) {
        return super.compileNode(o);
      }
      superCall = new Literal(fragmentsToText(super.compileNode(o)));
      replacement = new Block(this.expressions.slice());
      if (o.level > LEVEL_TOP) {
        // If we might be in an expression we need to cache and return the result
        [superCall, ref] = superCall.cache(o, null, YES);
        replacement.push(ref);
      }
      replacement.unshift(superCall);
      return replacement.compileToFragments(o, o.level === LEVEL_TOP ? o.level : LEVEL_LIST);
    }

  };

  SuperCall.prototype.children = Call.prototype.children.concat(['expressions']);

  return SuperCall;

}).call(this);

exports.Super = Super = (function() {
  class Super extends Base {
    constructor(accessor, superLiteral) {
      super();
      this.accessor = accessor;
      this.superLiteral = superLiteral;
    }

    compileNode(o) {
      var fragments, method, name, nref, ref1, ref2, salvagedComments, variable;
      this.checkInInstanceMethod(o);
      method = o.scope.namedMethod();
      if (!((method.ctor != null) || (this.accessor != null))) {
        ({name, variable} = method);
        if (name.shouldCache() || (name instanceof Index && name.index.isAssignable())) {
          nref = new IdentifierLiteral(o.scope.parent.freeVariable('name'));
          name.index = new Assign(nref, name.index);
        }
        this.accessor = nref != null ? new Index(nref) : name;
      }
      if ((ref1 = this.accessor) != null ? (ref2 = ref1.name) != null ? ref2.comments : void 0 : void 0) {
        // A `super()` call gets compiled to e.g. `super.method()`, which means
        // the `method` property name gets compiled for the first time here, and
        // again when the `method:` property of the class gets compiled. Since
        // this compilation happens first, comments attached to `method:` would
        // get incorrectly output near `super.method()`, when we want them to
        // get output on the second pass when `method:` is output. So set them
        // aside during this compilation pass, and put them back on the object so
        // that they’re there for the later compilation.
        salvagedComments = this.accessor.name.comments;
        delete this.accessor.name.comments;
      }
      fragments = (new Value(new Literal('super'), this.accessor ? [this.accessor] : [])).compileToFragments(o);
      if (salvagedComments) {
        attachCommentsToNode(salvagedComments, this.accessor.name);
      }
      return fragments;
    }

    checkInInstanceMethod(o) {
      var method;
      method = o.scope.namedMethod();
      if (!(method != null ? method.isMethod : void 0)) {
        return this.error('cannot use super outside of an instance method');
      }
    }

    astNode(o) {
      var ref1;
      this.checkInInstanceMethod(o);
      if (this.accessor != null) {
        return (new Value(new Super().withLocationDataFrom((ref1 = this.superLiteral) != null ? ref1 : this), [this.accessor]).withLocationDataFrom(this)).ast(o);
      }
      return super.astNode(o);
    }

  };

  Super.prototype.children = ['accessor'];

  return Super;

}).call(this);

//### RegexWithInterpolations

// Regexes with interpolations are in fact just a variation of a `Call` (a
// `RegExp()` call to be precise) with a `StringWithInterpolations` inside.
exports.RegexWithInterpolations = RegexWithInterpolations = (function() {
  class RegexWithInterpolations extends Base {
    constructor(call1, {heregexCommentTokens: heregexCommentTokens = []} = {}) {
      super();
      this.call = call1;
      this.heregexCommentTokens = heregexCommentTokens;
    }

    compileNode(o) {
      return this.call.compileNode(o);
    }

    astType() {
      return 'InterpolatedRegExpLiteral';
    }

    astProperties(o) {
      var heregexCommentToken, ref1, ref2;
      return {
        interpolatedPattern: this.call.args[0].ast(o),
        flags: (ref1 = (ref2 = this.call.args[1]) != null ? ref2.unwrap().originalValue : void 0) != null ? ref1 : '',
        comments: (function() {
          var j, len1, ref3, results1;
          ref3 = this.heregexCommentTokens;
          results1 = [];
          for (j = 0, len1 = ref3.length; j < len1; j++) {
            heregexCommentToken = ref3[j];
            if (heregexCommentToken.here) {
              results1.push(new HereComment(heregexCommentToken).ast(o));
            } else {
              results1.push(new LineComment(heregexCommentToken).ast(o));
            }
          }
          return results1;
        }).call(this)
      };
    }

  };

  RegexWithInterpolations.prototype.children = ['call'];

  return RegexWithInterpolations;

}).call(this);

//### TaggedTemplateCall
exports.TaggedTemplateCall = TaggedTemplateCall = class TaggedTemplateCall extends Call {
  constructor(variable, arg, soak) {
    if (arg instanceof StringLiteral) {
      arg = StringWithInterpolations.fromStringLiteral(arg);
    }
    super(variable, [arg], soak);
  }

  compileNode(o) {
    return this.variable.compileToFragments(o, LEVEL_ACCESS).concat(this.args[0].compileToFragments(o, LEVEL_LIST));
  }

  astType() {
    return 'TaggedTemplateExpression';
  }

  astProperties(o) {
    return {
      tag: this.variable.ast(o, LEVEL_ACCESS),
      quasi: this.args[0].ast(o, LEVEL_LIST)
    };
  }

};

//### Extends

// Node to extend an object's prototype with an ancestor object.
// After `goog.inherits` from the
// [Closure Library](https://github.com/google/closure-library/blob/master/closure/goog/base.js).
exports.Extends = Extends = (function() {
  class Extends extends Base {
    constructor(child1, parent1) {
      super();
      this.child = child1;
      this.parent = parent1;
    }

    // Hooks one constructor into another's prototype chain.
    compileToFragments(o) {
      return new Call(new Value(new Literal(utility('extend', o))), [this.child, this.parent]).compileToFragments(o);
    }

  };

  Extends.prototype.children = ['child', 'parent'];

  return Extends;

}).call(this);

//### Access

// A `.` access into a property of a value, or the `::` shorthand for
// an access into the object's prototype.
exports.Access = Access = (function() {
  class Access extends Base {
    constructor(name1, {
        soak: soak1,
        shorthand
      } = {}) {
      super();
      this.name = name1;
      this.soak = soak1;
      this.shorthand = shorthand;
    }

    compileToFragments(o) {
      var name, node;
      name = this.name.compileToFragments(o);
      node = this.name.unwrap();
      if (node instanceof PropertyName) {
        return [this.makeCode('.'), ...name];
      } else {
        return [this.makeCode('['), ...name, this.makeCode(']')];
      }
    }

    astNode(o) {
      // Babel doesn’t have an AST node for `Access`, but rather just includes
      // this Access node’s child `name` Identifier node as the `property` of
      // the `MemberExpression` node.
      return this.name.ast(o);
    }

  };

  Access.prototype.children = ['name'];

  Access.prototype.shouldCache = NO;

  return Access;

}).call(this);

//### Index

// A `[ ... ]` indexed access into an array or object.
exports.Index = Index = (function() {
  class Index extends Base {
    constructor(index1) {
      super();
      this.index = index1;
    }

    compileToFragments(o) {
      return [].concat(this.makeCode("["), this.index.compileToFragments(o, LEVEL_PAREN), this.makeCode("]"));
    }

    shouldCache() {
      return this.index.shouldCache();
    }

    astNode(o) {
      // Babel doesn’t have an AST node for `Index`, but rather just includes
      // this Index node’s child `index` Identifier node as the `property` of
      // the `MemberExpression` node. The fact that the `MemberExpression`’s
      // `property` is an Index means that `computed` is `true` for the
      // `MemberExpression`.
      return this.index.ast(o);
    }

  };

  Index.prototype.children = ['index'];

  return Index;

}).call(this);

//### Range

// A range literal. Ranges can be used to extract portions (slices) of arrays,
// to specify a range for comprehensions, or as a value, to be expanded into the
// corresponding array of integers at runtime.
exports.Range = Range = (function() {
  class Range extends Base {
    constructor(from1, to1, tag) {
      super();
      this.from = from1;
      this.to = to1;
      this.exclusive = tag === 'exclusive';
      this.equals = this.exclusive ? '' : '=';
    }

    // Compiles the range's source variables -- where it starts and where it ends.
    // But only if they need to be cached to avoid double evaluation.
    compileVariables(o) {
      var shouldCache, step;
      o = merge(o, {
        top: true
      });
      shouldCache = del(o, 'shouldCache');
      [this.fromC, this.fromVar] = this.cacheToCodeFragments(this.from.cache(o, LEVEL_LIST, shouldCache));
      [this.toC, this.toVar] = this.cacheToCodeFragments(this.to.cache(o, LEVEL_LIST, shouldCache));
      if (step = del(o, 'step')) {
        [this.step, this.stepVar] = this.cacheToCodeFragments(step.cache(o, LEVEL_LIST, shouldCache));
      }
      this.fromNum = this.from.isNumber() ? parseNumber(this.fromVar) : null;
      this.toNum = this.to.isNumber() ? parseNumber(this.toVar) : null;
      return this.stepNum = (step != null ? step.isNumber() : void 0) ? parseNumber(this.stepVar) : null;
    }

    // When compiled normally, the range returns the contents of the *for loop*
    // needed to iterate over the values in the range. Used by comprehensions.
    compileNode(o) {
      var cond, condPart, from, gt, idx, idxName, known, lowerBound, lt, namedIndex, ref1, ref2, stepCond, stepNotZero, stepPart, to, upperBound, varPart;
      if (!this.fromVar) {
        this.compileVariables(o);
      }
      if (!o.index) {
        return this.compileArray(o);
      }
      // Set up endpoints.
      known = (this.fromNum != null) && (this.toNum != null);
      idx = del(o, 'index');
      idxName = del(o, 'name');
      namedIndex = idxName && idxName !== idx;
      varPart = known && !namedIndex ? `var ${idx} = ${this.fromC}` : `${idx} = ${this.fromC}`;
      if (this.toC !== this.toVar) {
        varPart += `, ${this.toC}`;
      }
      if (this.step !== this.stepVar) {
        varPart += `, ${this.step}`;
      }
      [lt, gt] = [`${idx} <${this.equals}`, `${idx} >${this.equals}`];
      // Generate the condition.
      [from, to] = [this.fromNum, this.toNum];
      // Always check if the `step` isn't zero to avoid the infinite loop.
      stepNotZero = `${(ref1 = this.stepNum) != null ? ref1 : this.stepVar} !== 0`;
      stepCond = `${(ref2 = this.stepNum) != null ? ref2 : this.stepVar} > 0`;
      lowerBound = `${lt} ${known ? to : this.toVar}`;
      upperBound = `${gt} ${known ? to : this.toVar}`;
      condPart = this.step != null ? (this.stepNum != null) && this.stepNum !== 0 ? this.stepNum > 0 ? `${lowerBound}` : `${upperBound}` : `${stepNotZero} && (${stepCond} ? ${lowerBound} : ${upperBound})` : known ? `${from <= to ? lt : gt} ${to}` : `(${this.fromVar} <= ${this.toVar} ? ${lowerBound} : ${upperBound})`;
      cond = this.stepVar ? `${this.stepVar} > 0` : `${this.fromVar} <= ${this.toVar}`;
      // Generate the step.
      stepPart = this.stepVar ? `${idx} += ${this.stepVar}` : known ? namedIndex ? from <= to ? `++${idx}` : `--${idx}` : from <= to ? `${idx}++` : `${idx}--` : namedIndex ? `${cond} ? ++${idx} : --${idx}` : `${cond} ? ${idx}++ : ${idx}--`;
      if (namedIndex) {
        varPart = `${idxName} = ${varPart}`;
      }
      if (namedIndex) {
        stepPart = `${idxName} = ${stepPart}`;
      }
      // The final loop body.
      return [this.makeCode(`${varPart}; ${condPart}; ${stepPart}`)];
    }

    // When used as a value, expand the range into the equivalent array.
    compileArray(o) {
      var args, body, cond, hasArgs, i, idt, known, post, pre, range, ref1, ref2, result, vars;
      known = (this.fromNum != null) && (this.toNum != null);
      if (known && Math.abs(this.fromNum - this.toNum) <= 20) {
        range = (function() {
          var results1 = [];
          for (var j = ref1 = this.fromNum, ref2 = this.toNum; ref1 <= ref2 ? j <= ref2 : j >= ref2; ref1 <= ref2 ? j++ : j--){ results1.push(j); }
          return results1;
        }).apply(this);
        if (this.exclusive) {
          range.pop();
        }
        return [this.makeCode(`[${range.join(', ')}]`)];
      }
      idt = this.tab + TAB;
      i = o.scope.freeVariable('i', {
        single: true,
        reserve: false
      });
      result = o.scope.freeVariable('results', {
        reserve: false
      });
      pre = `\n${idt}var ${result} = [];`;
      if (known) {
        o.index = i;
        body = fragmentsToText(this.compileNode(o));
      } else {
        vars = `${i} = ${this.fromC}` + (this.toC !== this.toVar ? `, ${this.toC}` : '');
        cond = `${this.fromVar} <= ${this.toVar}`;
        body = `var ${vars}; ${cond} ? ${i} <${this.equals} ${this.toVar} : ${i} >${this.equals} ${this.toVar}; ${cond} ? ${i}++ : ${i}--`;
      }
      post = `{ ${result}.push(${i}); }\n${idt}return ${result};\n${o.indent}`;
      hasArgs = function(node) {
        return node != null ? node.contains(isLiteralArguments) : void 0;
      };
      if (hasArgs(this.from) || hasArgs(this.to)) {
        args = ', arguments';
      }
      return [this.makeCode(`(function() {${pre}\n${idt}for (${body})${post}}).apply(this${args != null ? args : ''})`)];
    }

    astProperties(o) {
      var ref1, ref2, ref3, ref4;
      return {
        from: (ref1 = (ref2 = this.from) != null ? ref2.ast(o) : void 0) != null ? ref1 : null,
        to: (ref3 = (ref4 = this.to) != null ? ref4.ast(o) : void 0) != null ? ref3 : null,
        exclusive: this.exclusive
      };
    }

  };

  Range.prototype.children = ['from', 'to'];

  return Range;

}).call(this);

//### Slice

// An array slice literal. Unlike JavaScript’s `Array#slice`, the second parameter
// specifies the index of the end of the slice, just as the first parameter
// is the index of the beginning.
exports.Slice = Slice = (function() {
  class Slice extends Base {
    constructor(range1) {
      super();
      this.range = range1;
    }

    // We have to be careful when trying to slice through the end of the array,
    // `9e9` is used because not all implementations respect `undefined` or `1/0`.
    // `9e9` should be safe because `9e9` > `2**32`, the max array length.
    compileNode(o) {
      var compiled, compiledText, from, fromCompiled, to, toStr;
      ({to, from} = this.range);
      // Handle an expression in the property access, e.g. `a[!b in c..]`.
      if (from != null ? from.shouldCache() : void 0) {
        from = new Value(new Parens(from));
      }
      if (to != null ? to.shouldCache() : void 0) {
        to = new Value(new Parens(to));
      }
      fromCompiled = (from != null ? from.compileToFragments(o, LEVEL_PAREN) : void 0) || [this.makeCode('0')];
      if (to) {
        compiled = to.compileToFragments(o, LEVEL_PAREN);
        compiledText = fragmentsToText(compiled);
        if (!(!this.range.exclusive && +compiledText === -1)) {
          toStr = ', ' + (this.range.exclusive ? compiledText : to.isNumber() ? `${+compiledText + 1}` : (compiled = to.compileToFragments(o, LEVEL_ACCESS), `+${fragmentsToText(compiled)} + 1 || 9e9`));
        }
      }
      return [this.makeCode(`.slice(${fragmentsToText(fromCompiled)}${toStr || ''})`)];
    }

    astNode(o) {
      return this.range.ast(o);
    }

  };

  Slice.prototype.children = ['range'];

  return Slice;

}).call(this);

//### Obj

// An object literal, nothing fancy.
exports.Obj = Obj = (function() {
  class Obj extends Base {
    constructor(props, generated = false) {
      super();
      this.generated = generated;
      this.objects = this.properties = props || [];
    }

    isAssignable(opts) {
      var j, len1, message, prop, ref1, ref2;
      ref1 = this.properties;
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        prop = ref1[j];
        // Check for reserved words.
        message = isUnassignable(prop.unwrapAll().value);
        if (message) {
          prop.error(message);
        }
        if (prop instanceof Assign && prop.context === 'object' && !(((ref2 = prop.value) != null ? ref2.base : void 0) instanceof Arr)) {
          prop = prop.value;
        }
        if (!prop.isAssignable(opts)) {
          return false;
        }
      }
      return true;
    }

    shouldCache() {
      return !this.isAssignable();
    }

    // Check if object contains splat.
    hasSplat() {
      var j, len1, prop, ref1;
      ref1 = this.properties;
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        prop = ref1[j];
        if (prop instanceof Splat) {
          return true;
        }
      }
      return false;
    }

    // Move rest property to the end of the list.
    // `{a, rest..., b} = obj` -> `{a, b, rest...} = obj`
    // `foo = ({a, rest..., b}) ->` -> `foo = {a, b, rest...}) ->`
    reorderProperties() {
      var props, splatProp, splatProps;
      props = this.properties;
      splatProps = this.getAndCheckSplatProps();
      splatProp = props.splice(splatProps[0], 1);
      return this.objects = this.properties = [].concat(props, splatProp);
    }

    compileNode(o) {
      var answer, i, idt, indent, isCompact, j, join, k, key, l, lastNode, len1, len2, len3, node, prop, props, ref1, value;
      if (this.hasSplat() && this.lhs) {
        this.reorderProperties();
      }
      props = this.properties;
      if (this.generated) {
        for (j = 0, len1 = props.length; j < len1; j++) {
          node = props[j];
          if (node instanceof Value) {
            node.error('cannot have an implicit value in an implicit object');
          }
        }
      }
      idt = o.indent += TAB;
      lastNode = this.lastNode(this.properties);
      // If this object is the left-hand side of an assignment, all its children
      // are too.
      this.propagateLhs();
      isCompact = true;
      ref1 = this.properties;
      for (k = 0, len2 = ref1.length; k < len2; k++) {
        prop = ref1[k];
        if (prop instanceof Assign && prop.context === 'object') {
          isCompact = false;
        }
      }
      answer = [];
      answer.push(this.makeCode(isCompact ? '' : '\n'));
      for (i = l = 0, len3 = props.length; l < len3; i = ++l) {
        prop = props[i];
        join = i === props.length - 1 ? '' : isCompact ? ', ' : prop === lastNode ? '\n' : ',\n';
        indent = isCompact ? '' : idt;
        key = prop instanceof Assign && prop.context === 'object' ? prop.variable : prop instanceof Assign ? (!this.lhs ? prop.operatorToken.error(`unexpected ${prop.operatorToken.value}`) : void 0, prop.variable) : prop;
        if (key instanceof Value && key.hasProperties()) {
          if (prop.context === 'object' || !key.this) {
            key.error('invalid object key');
          }
          key = key.properties[0].name;
          prop = new Assign(key, prop, 'object');
        }
        if (key === prop) {
          if (prop.shouldCache()) {
            [key, value] = prop.base.cache(o);
            if (key instanceof IdentifierLiteral) {
              key = new PropertyName(key.value);
            }
            prop = new Assign(key, value, 'object');
          } else if (key instanceof Value && key.base instanceof ComputedPropertyName) {
            // `{ [foo()] }` output as `{ [ref = foo()]: ref }`.
            if (prop.base.value.shouldCache()) {
              [key, value] = prop.base.value.cache(o);
              if (key instanceof IdentifierLiteral) {
                key = new ComputedPropertyName(key.value);
              }
              prop = new Assign(key, value, 'object');
            } else {
              // `{ [expression] }` output as `{ [expression]: expression }`.
              prop = new Assign(key, prop.base.value, 'object');
            }
          } else if (!(typeof prop.bareLiteral === "function" ? prop.bareLiteral(IdentifierLiteral) : void 0) && !(prop instanceof Splat)) {
            prop = new Assign(prop, prop, 'object');
          }
        }
        if (indent) {
          answer.push(this.makeCode(indent));
        }
        answer.push(...prop.compileToFragments(o, LEVEL_TOP));
        if (join) {
          answer.push(this.makeCode(join));
        }
      }
      answer.push(this.makeCode(isCompact ? '' : `\n${this.tab}`));
      answer = this.wrapInBraces(answer);
      if (this.front) {
        return this.wrapInParentheses(answer);
      } else {
        return answer;
      }
    }

    getAndCheckSplatProps() {
      var i, prop, props, splatProps;
      if (!(this.hasSplat() && this.lhs)) {
        return;
      }
      props = this.properties;
      splatProps = (function() {
        var j, len1, results1;
        results1 = [];
        for (i = j = 0, len1 = props.length; j < len1; i = ++j) {
          prop = props[i];
          if (prop instanceof Splat) {
            results1.push(i);
          }
        }
        return results1;
      })();
      if ((splatProps != null ? splatProps.length : void 0) > 1) {
        props[splatProps[1]].error("multiple spread elements are disallowed");
      }
      return splatProps;
    }

    assigns(name) {
      var j, len1, prop, ref1;
      ref1 = this.properties;
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        prop = ref1[j];
        if (prop.assigns(name)) {
          return true;
        }
      }
      return false;
    }

    eachName(iterator) {
      var j, len1, prop, ref1, results1;
      ref1 = this.properties;
      results1 = [];
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        prop = ref1[j];
        if (prop instanceof Assign && prop.context === 'object') {
          prop = prop.value;
        }
        prop = prop.unwrapAll();
        if (prop.eachName != null) {
          results1.push(prop.eachName(iterator));
        } else {
          results1.push(void 0);
        }
      }
      return results1;
    }

    // Convert “bare” properties to `ObjectProperty`s (or `Splat`s).
    expandProperty(property) {
      var context, key, operatorToken, variable;
      ({variable, context, operatorToken} = property);
      key = property instanceof Assign && context === 'object' ? variable : property instanceof Assign ? (!this.lhs ? operatorToken.error(`unexpected ${operatorToken.value}`) : void 0, variable) : property;
      if (key instanceof Value && key.hasProperties()) {
        if (!(context !== 'object' && key.this)) {
          key.error('invalid object key');
        }
        if (property instanceof Assign) {
          return new ObjectProperty({
            fromAssign: property
          });
        } else {
          return new ObjectProperty({
            key: property
          });
        }
      }
      if (key !== property) {
        return new ObjectProperty({
          fromAssign: property
        });
      }
      if (property instanceof Splat) {
        return property;
      }
      return new ObjectProperty({
        key: property
      });
    }

    expandProperties() {
      var j, len1, property, ref1, results1;
      ref1 = this.properties;
      results1 = [];
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        property = ref1[j];
        results1.push(this.expandProperty(property));
      }
      return results1;
    }

    propagateLhs(setLhs) {
      var j, len1, property, ref1, results1, unwrappedValue, value;
      if (setLhs) {
        this.lhs = true;
      }
      if (!this.lhs) {
        return;
      }
      ref1 = this.properties;
      results1 = [];
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        property = ref1[j];
        if (property instanceof Assign && property.context === 'object') {
          ({value} = property);
          unwrappedValue = value.unwrapAll();
          if (unwrappedValue instanceof Arr || unwrappedValue instanceof Obj) {
            results1.push(unwrappedValue.propagateLhs(true));
          } else if (unwrappedValue instanceof Assign) {
            results1.push(unwrappedValue.nestedLhs = true);
          } else {
            results1.push(void 0);
          }
        } else if (property instanceof Assign) {
          // Shorthand property with default, e.g. `{a = 1} = b`.
          results1.push(property.nestedLhs = true);
        } else if (property instanceof Splat) {
          results1.push(property.propagateLhs(true));
        } else {
          results1.push(void 0);
        }
      }
      return results1;
    }

    astNode(o) {
      this.getAndCheckSplatProps();
      return super.astNode(o);
    }

    astType() {
      if (this.lhs) {
        return 'ObjectPattern';
      } else {
        return 'ObjectExpression';
      }
    }

    astProperties(o) {
      var property;
      return {
        implicit: !!this.generated,
        properties: (function() {
          var j, len1, ref1, results1;
          ref1 = this.expandProperties();
          results1 = [];
          for (j = 0, len1 = ref1.length; j < len1; j++) {
            property = ref1[j];
            results1.push(property.ast(o));
          }
          return results1;
        }).call(this)
      };
    }

  };

  Obj.prototype.children = ['properties'];

  return Obj;

}).call(this);

exports.ObjectProperty = ObjectProperty = class ObjectProperty extends Base {
  constructor({key, fromAssign}) {
    var context, value;
    super();
    if (fromAssign) {
      ({
        variable: this.key,
        value,
        context
      } = fromAssign);
      if (context === 'object') {
        // All non-shorthand properties (i.e. includes `:`).
        this.value = value;
      } else {
        // Left-hand-side shorthand with default e.g. `{a = 1} = b`.
        this.value = fromAssign;
        this.shorthand = true;
      }
      this.locationData = fromAssign.locationData;
    } else {
      // Shorthand without default e.g. `{a}` or `{@a}` or `{[a]}`.
      this.key = key;
      this.shorthand = true;
      this.locationData = key.locationData;
    }
  }

  astProperties(o) {
    var isComputedPropertyName, keyAst, ref1, ref2;
    isComputedPropertyName = (this.key instanceof Value && this.key.base instanceof ComputedPropertyName) || this.key.unwrap() instanceof StringWithInterpolations;
    keyAst = this.key.ast(o, LEVEL_LIST);
    return {
      key: (keyAst != null ? keyAst.declaration : void 0) ? Object.assign({}, keyAst, {
        declaration: false
      }) : keyAst,
      value: (ref1 = (ref2 = this.value) != null ? ref2.ast(o, LEVEL_LIST) : void 0) != null ? ref1 : keyAst,
      shorthand: !!this.shorthand,
      computed: !!isComputedPropertyName,
      method: false
    };
  }

};

//### Arr

// An array literal.
exports.Arr = Arr = (function() {
  class Arr extends Base {
    constructor(objs, lhs1 = false) {
      super();
      this.lhs = lhs1;
      this.objects = objs || [];
      this.propagateLhs();
    }

    hasElision() {
      var j, len1, obj, ref1;
      ref1 = this.objects;
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        obj = ref1[j];
        if (obj instanceof Elision) {
          return true;
        }
      }
      return false;
    }

    isAssignable(opts) {
      var allowEmptyArray, allowExpansion, allowNontrailingSplat, i, j, len1, obj, ref1;
      ({allowExpansion, allowNontrailingSplat, allowEmptyArray = false} = opts != null ? opts : {});
      if (!this.objects.length) {
        return allowEmptyArray;
      }
      ref1 = this.objects;
      for (i = j = 0, len1 = ref1.length; j < len1; i = ++j) {
        obj = ref1[i];
        if (!allowNontrailingSplat && obj instanceof Splat && i + 1 !== this.objects.length) {
          return false;
        }
        if (!((allowExpansion && obj instanceof Expansion) || (obj.isAssignable(opts) && (!obj.isAtomic || obj.isAtomic())))) {
          return false;
        }
      }
      return true;
    }

    shouldCache() {
      return !this.isAssignable();
    }

    compileNode(o) {
      var answer, compiledObjs, fragment, fragmentIndex, fragmentIsElision, fragments, includesLineCommentsOnNonFirstElement, index, j, k, l, len1, len2, len3, len4, len5, obj, objIndex, olen, p, passedElision, q, ref1, ref2, unwrappedObj;
      if (!this.objects.length) {
        return [this.makeCode('[]')];
      }
      o.indent += TAB;
      fragmentIsElision = function([fragment]) {
        return fragment.type === 'Elision' && fragment.code.trim() === ',';
      };
      // Detect if `Elision`s at the beginning of the array are processed (e.g. [, , , a]).
      passedElision = false;
      answer = [];
      ref1 = this.objects;
      for (objIndex = j = 0, len1 = ref1.length; j < len1; objIndex = ++j) {
        obj = ref1[objIndex];
        unwrappedObj = obj.unwrapAll();
        // Let `compileCommentFragments` know to intersperse block comments
        // into the fragments created when compiling this array.
        if (unwrappedObj.comments && unwrappedObj.comments.filter(function(comment) {
          return !comment.here;
        }).length === 0) {
          unwrappedObj.includeCommentFragments = YES;
        }
      }
      compiledObjs = (function() {
        var k, len2, ref2, results1;
        ref2 = this.objects;
        results1 = [];
        for (k = 0, len2 = ref2.length; k < len2; k++) {
          obj = ref2[k];
          results1.push(obj.compileToFragments(o, LEVEL_LIST));
        }
        return results1;
      }).call(this);
      olen = compiledObjs.length;
      // If `compiledObjs` includes newlines, we will output this as a multiline
      // array (i.e. with a newline and indentation after the `[`). If an element
      // contains line comments, that should also trigger multiline output since
      // by definition line comments will introduce newlines into our output.
      // The exception is if only the first element has line comments; in that
      // case, output as the compact form if we otherwise would have, so that the
      // first element’s line comments get output before or after the array.
      includesLineCommentsOnNonFirstElement = false;
      for (index = k = 0, len2 = compiledObjs.length; k < len2; index = ++k) {
        fragments = compiledObjs[index];
        for (l = 0, len3 = fragments.length; l < len3; l++) {
          fragment = fragments[l];
          if (fragment.isHereComment) {
            fragment.code = fragment.code.trim();
          } else if (index !== 0 && includesLineCommentsOnNonFirstElement === false && hasLineComments(fragment)) {
            includesLineCommentsOnNonFirstElement = true;
          }
        }
        // Add ', ' if all `Elisions` from the beginning of the array are processed (e.g. [, , , a]) and
        // element isn't `Elision` or last element is `Elision` (e.g. [a,,b,,])
        if (index !== 0 && passedElision && (!fragmentIsElision(fragments) || index === olen - 1)) {
          answer.push(this.makeCode(', '));
        }
        passedElision = passedElision || !fragmentIsElision(fragments);
        answer.push(...fragments);
      }
      if (includesLineCommentsOnNonFirstElement || indexOf.call(fragmentsToText(answer), '\n') >= 0) {
        for (fragmentIndex = p = 0, len4 = answer.length; p < len4; fragmentIndex = ++p) {
          fragment = answer[fragmentIndex];
          if (fragment.isHereComment) {
            fragment.code = `${multident(fragment.code, o.indent, false)}\n${o.indent}`;
          } else if (fragment.code === ', ' && !(fragment != null ? fragment.isElision : void 0) && ((ref2 = fragment.type) !== 'StringLiteral' && ref2 !== 'StringWithInterpolations')) {
            fragment.code = `,\n${o.indent}`;
          }
        }
        answer.unshift(this.makeCode(`[\n${o.indent}`));
        answer.push(this.makeCode(`\n${this.tab}]`));
      } else {
        for (q = 0, len5 = answer.length; q < len5; q++) {
          fragment = answer[q];
          if (fragment.isHereComment) {
            fragment.code = `${fragment.code} `;
          }
        }
        answer.unshift(this.makeCode('['));
        answer.push(this.makeCode(']'));
      }
      return answer;
    }

    assigns(name) {
      var j, len1, obj, ref1;
      ref1 = this.objects;
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        obj = ref1[j];
        if (obj.assigns(name)) {
          return true;
        }
      }
      return false;
    }

    eachName(iterator) {
      var j, len1, obj, ref1, results1;
      ref1 = this.objects;
      results1 = [];
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        obj = ref1[j];
        obj = obj.unwrapAll();
        results1.push(obj.eachName(iterator));
      }
      return results1;
    }

    // If this array is the left-hand side of an assignment, all its children
    // are too.
    propagateLhs(setLhs) {
      var j, len1, object, ref1, results1, unwrappedObject;
      if (setLhs) {
        this.lhs = true;
      }
      if (!this.lhs) {
        return;
      }
      ref1 = this.objects;
      results1 = [];
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        object = ref1[j];
        if (object instanceof Splat || object instanceof Expansion) {
          object.lhs = true;
        }
        unwrappedObject = object.unwrapAll();
        if (unwrappedObject instanceof Arr || unwrappedObject instanceof Obj) {
          results1.push(unwrappedObject.propagateLhs(true));
        } else if (unwrappedObject instanceof Assign) {
          results1.push(unwrappedObject.nestedLhs = true);
        } else {
          results1.push(void 0);
        }
      }
      return results1;
    }

    astType() {
      if (this.lhs) {
        return 'ArrayPattern';
      } else {
        return 'ArrayExpression';
      }
    }

    astProperties(o) {
      var object;
      return {
        elements: (function() {
          var j, len1, ref1, results1;
          ref1 = this.objects;
          results1 = [];
          for (j = 0, len1 = ref1.length; j < len1; j++) {
            object = ref1[j];
            results1.push(object.ast(o, LEVEL_LIST));
          }
          return results1;
        }).call(this)
      };
    }

  };

  Arr.prototype.children = ['objects'];

  return Arr;

}).call(this);

//### Class

// The CoffeeScript class definition.
// Initialize a **Class** with its name, an optional superclass, and a body.
exports.Class = Class = (function() {
  class Class extends Base {
    constructor(variable1, parent1, body1) {
      super();
      this.variable = variable1;
      this.parent = parent1;
      this.body = body1;
      if (this.body == null) {
        this.body = new Block();
        this.hasGeneratedBody = true;
      }
    }

    compileNode(o) {
      var executableBody, node, parentName;
      this.name = this.determineName();
      executableBody = this.walkBody(o);
      if (this.parent instanceof Value && !this.parent.hasProperties()) {
        // Special handling to allow `class expr.A extends A` declarations
        parentName = this.parent.base.value;
      }
      this.hasNameClash = (this.name != null) && this.name === parentName;
      node = this;
      if (executableBody || this.hasNameClash) {
        node = new ExecutableClassBody(node, executableBody);
      } else if ((this.name == null) && o.level === LEVEL_TOP) {
        // Anonymous classes are only valid in expressions
        node = new Parens(node);
      }
      if (this.boundMethods.length && this.parent) {
        if (this.variable == null) {
          this.variable = new IdentifierLiteral(o.scope.freeVariable('_class'));
        }
        if (this.variableRef == null) {
          [this.variable, this.variableRef] = this.variable.cache(o);
        }
      }
      if (this.variable) {
        node = new Assign(this.variable, node, null, {moduleDeclaration: this.moduleDeclaration});
      }
      this.compileNode = this.compileClassDeclaration;
      try {
        return node.compileToFragments(o);
      } finally {
        delete this.compileNode;
      }
    }

    compileClassDeclaration(o) {
      var ref1, ref2, result;
      if (this.externalCtor || this.boundMethods.length) {
        if (this.ctor == null) {
          this.ctor = this.makeDefaultConstructor();
        }
      }
      if ((ref1 = this.ctor) != null) {
        ref1.noReturn = true;
      }
      if (this.boundMethods.length) {
        this.proxyBoundMethods();
      }
      o.indent += TAB;
      result = [];
      result.push(this.makeCode("class "));
      if (this.name) {
        result.push(this.makeCode(this.name));
      }
      if (((ref2 = this.variable) != null ? ref2.comments : void 0) != null) {
        this.compileCommentFragments(o, this.variable, result);
      }
      if (this.name) {
        result.push(this.makeCode(' '));
      }
      if (this.parent) {
        result.push(this.makeCode('extends '), ...this.parent.compileToFragments(o), this.makeCode(' '));
      }
      result.push(this.makeCode('{'));
      if (!this.body.isEmpty()) {
        this.body.spaced = true;
        result.push(this.makeCode('\n'));
        result.push(...this.body.compileToFragments(o, LEVEL_TOP));
        result.push(this.makeCode(`\n${this.tab}`));
      }
      result.push(this.makeCode('}'));
      return result;
    }

    // Figure out the appropriate name for this class
    determineName() {
      var message, name, node, ref1, tail;
      if (!this.variable) {
        return null;
      }
      ref1 = this.variable.properties, [tail] = slice1.call(ref1, -1);
      node = tail ? tail instanceof Access && tail.name : this.variable.base;
      if (!(node instanceof IdentifierLiteral || node instanceof PropertyName)) {
        return null;
      }
      name = node.value;
      if (!tail) {
        message = isUnassignable(name);
        if (message) {
          this.variable.error(message);
        }
      }
      if (indexOf.call(JS_FORBIDDEN, name) >= 0) {
        return `_${name}`;
      } else {
        return name;
      }
    }

    walkBody(o) {
      var assign, end, executableBody, expression, expressions, exprs, i, initializer, initializerExpression, j, k, len1, len2, method, properties, pushSlice, ref1, start;
      this.ctor = null;
      this.boundMethods = [];
      executableBody = null;
      initializer = [];
      ({expressions} = this.body);
      i = 0;
      ref1 = expressions.slice();
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        expression = ref1[j];
        if (expression instanceof Value && expression.isObject(true)) {
          ({properties} = expression.base);
          exprs = [];
          end = 0;
          start = 0;
          pushSlice = function() {
            if (end > start) {
              return exprs.push(new Value(new Obj(properties.slice(start, end), true)));
            }
          };
          while (assign = properties[end]) {
            if (initializerExpression = this.addInitializerExpression(assign, o)) {
              pushSlice();
              exprs.push(initializerExpression);
              initializer.push(initializerExpression);
              start = end + 1;
            }
            end++;
          }
          pushSlice();
          splice.apply(expressions, [i, i - i + 1].concat(exprs)), exprs;
          i += exprs.length;
        } else {
          if (initializerExpression = this.addInitializerExpression(expression, o)) {
            initializer.push(initializerExpression);
            expressions[i] = initializerExpression;
          }
          i += 1;
        }
      }
      for (k = 0, len2 = initializer.length; k < len2; k++) {
        method = initializer[k];
        if (method instanceof Code) {
          if (method.ctor) {
            if (this.ctor) {
              method.error('Cannot define more than one constructor in a class');
            }
            this.ctor = method;
          } else if (method.isStatic && method.bound) {
            method.context = this.name;
          } else if (method.bound) {
            this.boundMethods.push(method);
          }
        }
      }
      if (!o.compiling) {
        return;
      }
      if (initializer.length !== expressions.length) {
        this.body.expressions = (function() {
          var l, len3, results1;
          results1 = [];
          for (l = 0, len3 = initializer.length; l < len3; l++) {
            expression = initializer[l];
            results1.push(expression.hoist());
          }
          return results1;
        })();
        return new Block(expressions);
      }
    }

    // Add an expression to the class initializer

    // This is the key method for determining whether an expression in a class
    // body should appear in the initializer or the executable body. If the given
    // `node` is valid in a class body the method will return a (new, modified,
    // or identical) node for inclusion in the class initializer, otherwise
    // nothing will be returned and the node will appear in the executable body.

    // At time of writing, only methods (instance and static) are valid in ES
    // class initializers. As new ES class features (such as class fields) reach
    // Stage 4, this method will need to be updated to support them. We
    // additionally allow `PassthroughLiteral`s (backticked expressions) in the
    // initializer as an escape hatch for ES features that are not implemented
    // (e.g. getters and setters defined via the `get` and `set` keywords as
    // opposed to the `Object.defineProperty` method).
    addInitializerExpression(node, o) {
      if (node.unwrapAll() instanceof PassthroughLiteral) {
        return node;
      } else if (this.validInitializerMethod(node)) {
        return this.addInitializerMethod(node);
      } else if (!o.compiling && this.validClassProperty(node)) {
        return this.addClassProperty(node);
      } else if (!o.compiling && this.validClassPrototypeProperty(node)) {
        return this.addClassPrototypeProperty(node);
      } else {
        return null;
      }
    }

    // Checks if the given node is a valid ES class initializer method.
    validInitializerMethod(node) {
      if (!(node instanceof Assign && node.value instanceof Code)) {
        return false;
      }
      if (node.context === 'object' && !node.variable.hasProperties()) {
        return true;
      }
      return node.variable.looksStatic(this.name) && (this.name || !node.value.bound);
    }

    // Returns a configured class initializer method
    addInitializerMethod(assign) {
      var isConstructor, method, methodName, operatorToken, variable;
      ({
        variable,
        value: method,
        operatorToken
      } = assign);
      method.isMethod = true;
      method.isStatic = variable.looksStatic(this.name);
      if (method.isStatic) {
        method.name = variable.properties[0];
      } else {
        methodName = variable.base;
        method.name = new (methodName.shouldCache() ? Index : Access)(methodName);
        method.name.updateLocationDataIfMissing(methodName.locationData);
        isConstructor = methodName instanceof StringLiteral ? methodName.originalValue === 'constructor' : methodName.value === 'constructor';
        if (isConstructor) {
          method.ctor = (this.parent ? 'derived' : 'base');
        }
        if (method.bound && method.ctor) {
          method.error('Cannot define a constructor as a bound (fat arrow) function');
        }
      }
      method.operatorToken = operatorToken;
      return method;
    }

    validClassProperty(node) {
      if (!(node instanceof Assign)) {
        return false;
      }
      return node.variable.looksStatic(this.name);
    }

    addClassProperty(assign) {
      var operatorToken, staticClassName, value, variable;
      ({variable, value, operatorToken} = assign);
      ({staticClassName} = variable.looksStatic(this.name));
      return new ClassProperty({
        name: variable.properties[0],
        isStatic: true,
        staticClassName,
        value,
        operatorToken
      }).withLocationDataFrom(assign);
    }

    validClassPrototypeProperty(node) {
      if (!(node instanceof Assign)) {
        return false;
      }
      return node.context === 'object' && !node.variable.hasProperties();
    }

    addClassPrototypeProperty(assign) {
      var value, variable;
      ({variable, value} = assign);
      return new ClassPrototypeProperty({
        name: variable.base,
        value
      }).withLocationDataFrom(assign);
    }

    makeDefaultConstructor() {
      var applyArgs, applyCtor, ctor;
      ctor = this.addInitializerMethod(new Assign(new Value(new PropertyName('constructor')), new Code()));
      this.body.unshift(ctor);
      if (this.parent) {
        ctor.body.push(new SuperCall(new Super(), [new Splat(new IdentifierLiteral('arguments'))]));
      }
      if (this.externalCtor) {
        applyCtor = new Value(this.externalCtor, [new Access(new PropertyName('apply'))]);
        applyArgs = [new ThisLiteral(), new IdentifierLiteral('arguments')];
        ctor.body.push(new Call(applyCtor, applyArgs));
        ctor.body.makeReturn();
      }
      return ctor;
    }

    proxyBoundMethods() {
      var method, name;
      this.ctor.thisAssignments = (function() {
        var j, len1, ref1, results1;
        ref1 = this.boundMethods;
        results1 = [];
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          method = ref1[j];
          if (this.parent) {
            method.classVariable = this.variableRef;
          }
          name = new Value(new ThisLiteral(), [method.name]);
          results1.push(new Assign(name, new Call(new Value(name, [new Access(new PropertyName('bind'))]), [new ThisLiteral()])));
        }
        return results1;
      }).call(this);
      return null;
    }

    declareName(o) {
      var alreadyDeclared, name, ref1;
      if (!((name = (ref1 = this.variable) != null ? ref1.unwrap() : void 0) instanceof IdentifierLiteral)) {
        return;
      }
      alreadyDeclared = o.scope.find(name.value);
      return name.isDeclaration = !alreadyDeclared;
    }

    isStatementAst() {
      return true;
    }

    astNode(o) {
      var argumentsNode, jumpNode, ref1;
      if (jumpNode = this.body.jumps()) {
        jumpNode.error('Class bodies cannot contain pure statements');
      }
      if (argumentsNode = this.body.contains(isLiteralArguments)) {
        argumentsNode.error("Class bodies shouldn't reference arguments");
      }
      this.declareName(o);
      this.name = this.determineName();
      this.body.isClassBody = true;
      if (this.hasGeneratedBody) {
        this.body.locationData = zeroWidthLocationDataFromEndLocation(this.locationData);
      }
      this.walkBody(o);
      sniffDirectives(this.body.expressions);
      if ((ref1 = this.ctor) != null) {
        ref1.noReturn = true;
      }
      return super.astNode(o);
    }

    astType(o) {
      if (o.level === LEVEL_TOP) {
        return 'ClassDeclaration';
      } else {
        return 'ClassExpression';
      }
    }

    astProperties(o) {
      var ref1, ref2, ref3, ref4;
      return {
        id: (ref1 = (ref2 = this.variable) != null ? ref2.ast(o) : void 0) != null ? ref1 : null,
        superClass: (ref3 = (ref4 = this.parent) != null ? ref4.ast(o, LEVEL_PAREN) : void 0) != null ? ref3 : null,
        body: this.body.ast(o, LEVEL_TOP)
      };
    }

  };

  Class.prototype.children = ['variable', 'parent', 'body'];

  return Class;

}).call(this);

exports.ExecutableClassBody = ExecutableClassBody = (function() {
  class ExecutableClassBody extends Base {
    constructor(_class, body1 = new Block()) {
      super();
      this.class = _class;
      this.body = body1;
    }

    compileNode(o) {
      var args, argumentsNode, directives, externalCtor, ident, jumpNode, klass, params, parent, ref1, wrapper;
      if (jumpNode = this.body.jumps()) {
        jumpNode.error('Class bodies cannot contain pure statements');
      }
      if (argumentsNode = this.body.contains(isLiteralArguments)) {
        argumentsNode.error("Class bodies shouldn't reference arguments");
      }
      params = [];
      args = [new ThisLiteral()];
      wrapper = new Code(params, this.body);
      klass = new Parens(new Call(new Value(wrapper, [new Access(new PropertyName('call'))]), args));
      this.body.spaced = true;
      o.classScope = wrapper.makeScope(o.scope);
      this.name = (ref1 = this.class.name) != null ? ref1 : o.classScope.freeVariable(this.defaultClassVariableName);
      ident = new IdentifierLiteral(this.name);
      directives = this.walkBody();
      this.setContext();
      if (this.class.hasNameClash) {
        parent = new IdentifierLiteral(o.classScope.freeVariable('superClass'));
        wrapper.params.push(new Param(parent));
        args.push(this.class.parent);
        this.class.parent = parent;
      }
      if (this.externalCtor) {
        externalCtor = new IdentifierLiteral(o.classScope.freeVariable('ctor', {
          reserve: false
        }));
        this.class.externalCtor = externalCtor;
        this.externalCtor.variable.base = externalCtor;
      }
      if (this.name !== this.class.name) {
        this.body.expressions.unshift(new Assign(new IdentifierLiteral(this.name), this.class));
      } else {
        this.body.expressions.unshift(this.class);
      }
      this.body.expressions.unshift(...directives);
      this.body.push(ident);
      return klass.compileToFragments(o);
    }

    // Traverse the class's children and:
    // - Hoist valid ES properties into `@properties`
    // - Hoist static assignments into `@properties`
    // - Convert invalid ES properties into class or prototype assignments
    walkBody() {
      var directives, expr, index;
      directives = [];
      index = 0;
      while (expr = this.body.expressions[index]) {
        if (!(expr instanceof Value && expr.isString())) {
          break;
        }
        if (expr.hoisted) {
          index++;
        } else {
          directives.push(...this.body.expressions.splice(index, 1));
        }
      }
      this.traverseChildren(false, (child) => {
        var cont, i, j, len1, node, ref1;
        if (child instanceof Class || child instanceof HoistTarget) {
          return false;
        }
        cont = true;
        if (child instanceof Block) {
          ref1 = child.expressions;
          for (i = j = 0, len1 = ref1.length; j < len1; i = ++j) {
            node = ref1[i];
            if (node instanceof Value && node.isObject(true)) {
              cont = false;
              child.expressions[i] = this.addProperties(node.base.properties);
            } else if (node instanceof Assign && node.variable.looksStatic(this.name)) {
              node.value.isStatic = true;
            }
          }
          child.expressions = flatten(child.expressions);
        }
        return cont;
      });
      return directives;
    }

    setContext() {
      return this.body.traverseChildren(false, (node) => {
        if (node instanceof ThisLiteral) {
          return node.value = this.name;
        } else if (node instanceof Code && node.bound && (node.isStatic || !node.name)) {
          return node.context = this.name;
        }
      });
    }

    // Make class/prototype assignments for invalid ES properties
    addProperties(assigns) {
      var assign, base, name, prototype, result, value, variable;
      result = (function() {
        var j, len1, results1;
        results1 = [];
        for (j = 0, len1 = assigns.length; j < len1; j++) {
          assign = assigns[j];
          variable = assign.variable;
          base = variable != null ? variable.base : void 0;
          value = assign.value;
          delete assign.context;
          if (base.value === 'constructor') {
            if (value instanceof Code) {
              base.error('constructors must be defined at the top level of a class body');
            }
            // The class scope is not available yet, so return the assignment to update later
            assign = this.externalCtor = new Assign(new Value(), value);
          } else if (!assign.variable.this) {
            name = base instanceof ComputedPropertyName ? new Index(base.value) : new (base.shouldCache() ? Index : Access)(base);
            prototype = new Access(new PropertyName('prototype'));
            variable = new Value(new ThisLiteral(), [prototype, name]);
            assign.variable = variable;
          } else if (assign.value instanceof Code) {
            assign.value.isStatic = true;
          }
          results1.push(assign);
        }
        return results1;
      }).call(this);
      return compact(result);
    }

  };

  ExecutableClassBody.prototype.children = ['class', 'body'];

  ExecutableClassBody.prototype.defaultClassVariableName = '_Class';

  return ExecutableClassBody;

}).call(this);

exports.ClassProperty = ClassProperty = (function() {
  class ClassProperty extends Base {
    constructor({
        name: name1,
        isStatic,
        staticClassName: staticClassName1,
        value: value1,
        operatorToken: operatorToken1
      }) {
      super();
      this.name = name1;
      this.isStatic = isStatic;
      this.staticClassName = staticClassName1;
      this.value = value1;
      this.operatorToken = operatorToken1;
    }

    astProperties(o) {
      var ref1, ref2, ref3, ref4;
      return {
        key: this.name.ast(o, LEVEL_LIST),
        value: this.value.ast(o, LEVEL_LIST),
        static: !!this.isStatic,
        computed: this.name instanceof Index || this.name instanceof ComputedPropertyName,
        operator: (ref1 = (ref2 = this.operatorToken) != null ? ref2.value : void 0) != null ? ref1 : '=',
        staticClassName: (ref3 = (ref4 = this.staticClassName) != null ? ref4.ast(o) : void 0) != null ? ref3 : null
      };
    }

  };

  ClassProperty.prototype.children = ['name', 'value', 'staticClassName'];

  ClassProperty.prototype.isStatement = YES;

  return ClassProperty;

}).call(this);

exports.ClassPrototypeProperty = ClassPrototypeProperty = (function() {
  class ClassPrototypeProperty extends Base {
    constructor({
        name: name1,
        value: value1
      }) {
      super();
      this.name = name1;
      this.value = value1;
    }

    astProperties(o) {
      return {
        key: this.name.ast(o, LEVEL_LIST),
        value: this.value.ast(o, LEVEL_LIST),
        computed: this.name instanceof ComputedPropertyName || this.name instanceof StringWithInterpolations
      };
    }

  };

  ClassPrototypeProperty.prototype.children = ['name', 'value'];

  ClassPrototypeProperty.prototype.isStatement = YES;

  return ClassPrototypeProperty;

}).call(this);

//### Import and Export
exports.ModuleDeclaration = ModuleDeclaration = (function() {
  class ModuleDeclaration extends Base {
    constructor(clause, source1, assertions) {
      super();
      this.clause = clause;
      this.source = source1;
      this.assertions = assertions;
      this.checkSource();
    }

    checkSource() {
      if ((this.source != null) && this.source instanceof StringWithInterpolations) {
        return this.source.error('the name of the module to be imported from must be an uninterpolated string');
      }
    }

    checkScope(o, moduleDeclarationType) {
      // TODO: would be appropriate to flag this error during AST generation (as
      // well as when compiling to JS). But `o.indent` isn’t tracked during AST
      // generation, and there doesn’t seem to be a current alternative way to track
      // whether we’re at the “program top-level”.
      if (o.indent.length !== 0) {
        return this.error(`${moduleDeclarationType} statements must be at top-level scope`);
      }
    }

    astAssertions(o) {
      var ref1;
      if (((ref1 = this.assertions) != null ? ref1.properties : void 0) != null) {
        return this.assertions.properties.map((assertion) => {
          var end, left, loc, right, start;
          ({start, end, loc, left, right} = assertion.ast(o));
          return {
            type: 'ImportAttribute',
            start,
            end,
            loc,
            key: left,
            value: right
          };
        });
      } else {
        return [];
      }
    }

  };

  ModuleDeclaration.prototype.children = ['clause', 'source', 'assertions'];

  ModuleDeclaration.prototype.isStatement = YES;

  ModuleDeclaration.prototype.jumps = THIS;

  ModuleDeclaration.prototype.makeReturn = THIS;

  return ModuleDeclaration;

}).call(this);

exports.ImportDeclaration = ImportDeclaration = class ImportDeclaration extends ModuleDeclaration {
  compileNode(o) {
    var code, ref1;
    this.checkScope(o, 'import');
    o.importedSymbols = [];
    code = [];
    code.push(this.makeCode(`${this.tab}import `));
    if (this.clause != null) {
      code.push(...this.clause.compileNode(o));
    }
    if (((ref1 = this.source) != null ? ref1.value : void 0) != null) {
      if (this.clause !== null) {
        code.push(this.makeCode(' from '));
      }
      code.push(this.makeCode(this.source.value));
      if (this.assertions != null) {
        code.push(this.makeCode(' assert '));
        code.push(...this.assertions.compileToFragments(o));
      }
    }
    code.push(this.makeCode(';'));
    return code;
  }

  astNode(o) {
    o.importedSymbols = [];
    return super.astNode(o);
  }

  astProperties(o) {
    var ref1, ref2, ret;
    ret = {
      specifiers: (ref1 = (ref2 = this.clause) != null ? ref2.ast(o) : void 0) != null ? ref1 : [],
      source: this.source.ast(o),
      assertions: this.astAssertions(o)
    };
    if (this.clause) {
      ret.importKind = 'value';
    }
    return ret;
  }

};

exports.ImportClause = ImportClause = (function() {
  class ImportClause extends Base {
    constructor(defaultBinding, namedImports) {
      super();
      this.defaultBinding = defaultBinding;
      this.namedImports = namedImports;
    }

    compileNode(o) {
      var code;
      code = [];
      if (this.defaultBinding != null) {
        code.push(...this.defaultBinding.compileNode(o));
        if (this.namedImports != null) {
          code.push(this.makeCode(', '));
        }
      }
      if (this.namedImports != null) {
        code.push(...this.namedImports.compileNode(o));
      }
      return code;
    }

    astNode(o) {
      var ref1, ref2;
      // The AST for `ImportClause` is the non-nested list of import specifiers
      // that will be the `specifiers` property of an `ImportDeclaration` AST
      return compact(flatten([(ref1 = this.defaultBinding) != null ? ref1.ast(o) : void 0, (ref2 = this.namedImports) != null ? ref2.ast(o) : void 0]));
    }

  };

  ImportClause.prototype.children = ['defaultBinding', 'namedImports'];

  return ImportClause;

}).call(this);

exports.ExportDeclaration = ExportDeclaration = class ExportDeclaration extends ModuleDeclaration {
  compileNode(o) {
    var code, ref1;
    this.checkScope(o, 'export');
    this.checkForAnonymousClassExport();
    code = [];
    code.push(this.makeCode(`${this.tab}export `));
    if (this instanceof ExportDefaultDeclaration) {
      code.push(this.makeCode('default '));
    }
    if (!(this instanceof ExportDefaultDeclaration) && (this.clause instanceof Assign || this.clause instanceof Class)) {
      code.push(this.makeCode('var '));
      this.clause.moduleDeclaration = 'export';
    }
    if ((this.clause.body != null) && this.clause.body instanceof Block) {
      code = code.concat(this.clause.compileToFragments(o, LEVEL_TOP));
    } else {
      code = code.concat(this.clause.compileNode(o));
    }
    if (((ref1 = this.source) != null ? ref1.value : void 0) != null) {
      code.push(this.makeCode(` from ${this.source.value}`));
      if (this.assertions != null) {
        code.push(this.makeCode(' assert '));
        code.push(...this.assertions.compileToFragments(o));
      }
    }
    code.push(this.makeCode(';'));
    return code;
  }

  // Prevent exporting an anonymous class; all exported members must be named
  checkForAnonymousClassExport() {
    if (!(this instanceof ExportDefaultDeclaration) && this.clause instanceof Class && !this.clause.variable) {
      return this.clause.error('anonymous classes cannot be exported');
    }
  }

  astNode(o) {
    this.checkForAnonymousClassExport();
    return super.astNode(o);
  }

};

exports.ExportNamedDeclaration = ExportNamedDeclaration = class ExportNamedDeclaration extends ExportDeclaration {
  astProperties(o) {
    var clauseAst, ref1, ref2, ret;
    ret = {
      source: (ref1 = (ref2 = this.source) != null ? ref2.ast(o) : void 0) != null ? ref1 : null,
      assertions: this.astAssertions(o),
      exportKind: 'value'
    };
    clauseAst = this.clause.ast(o);
    if (this.clause instanceof ExportSpecifierList) {
      ret.specifiers = clauseAst;
      ret.declaration = null;
    } else {
      ret.specifiers = [];
      ret.declaration = clauseAst;
    }
    return ret;
  }

};

exports.ExportDefaultDeclaration = ExportDefaultDeclaration = class ExportDefaultDeclaration extends ExportDeclaration {
  astProperties(o) {
    return {
      declaration: this.clause.ast(o),
      assertions: this.astAssertions(o)
    };
  }

};

exports.ExportAllDeclaration = ExportAllDeclaration = class ExportAllDeclaration extends ExportDeclaration {
  astProperties(o) {
    return {
      source: this.source.ast(o),
      assertions: this.astAssertions(o),
      exportKind: 'value'
    };
  }

};

exports.ModuleSpecifierList = ModuleSpecifierList = (function() {
  class ModuleSpecifierList extends Base {
    constructor(specifiers) {
      super();
      this.specifiers = specifiers;
    }

    compileNode(o) {
      var code, compiledList, fragments, index, j, len1, specifier;
      code = [];
      o.indent += TAB;
      compiledList = (function() {
        var j, len1, ref1, results1;
        ref1 = this.specifiers;
        results1 = [];
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          specifier = ref1[j];
          results1.push(specifier.compileToFragments(o, LEVEL_LIST));
        }
        return results1;
      }).call(this);
      if (this.specifiers.length !== 0) {
        code.push(this.makeCode(`{\n${o.indent}`));
        for (index = j = 0, len1 = compiledList.length; j < len1; index = ++j) {
          fragments = compiledList[index];
          if (index) {
            code.push(this.makeCode(`,\n${o.indent}`));
          }
          code.push(...fragments);
        }
        code.push(this.makeCode("\n}"));
      } else {
        code.push(this.makeCode('{}'));
      }
      return code;
    }

    astNode(o) {
      var j, len1, ref1, results1, specifier;
      ref1 = this.specifiers;
      results1 = [];
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        specifier = ref1[j];
        results1.push(specifier.ast(o));
      }
      return results1;
    }

  };

  ModuleSpecifierList.prototype.children = ['specifiers'];

  return ModuleSpecifierList;

}).call(this);

exports.ImportSpecifierList = ImportSpecifierList = class ImportSpecifierList extends ModuleSpecifierList {};

exports.ExportSpecifierList = ExportSpecifierList = class ExportSpecifierList extends ModuleSpecifierList {};

exports.ModuleSpecifier = ModuleSpecifier = (function() {
  class ModuleSpecifier extends Base {
    constructor(original, alias, moduleDeclarationType1) {
      var ref1, ref2;
      super();
      this.original = original;
      this.alias = alias;
      this.moduleDeclarationType = moduleDeclarationType1;
      if (this.original.comments || ((ref1 = this.alias) != null ? ref1.comments : void 0)) {
        this.comments = [];
        if (this.original.comments) {
          this.comments.push(...this.original.comments);
        }
        if ((ref2 = this.alias) != null ? ref2.comments : void 0) {
          this.comments.push(...this.alias.comments);
        }
      }
      // The name of the variable entering the local scope
      this.identifier = this.alias != null ? this.alias.value : this.original.value;
    }

    compileNode(o) {
      var code;
      this.addIdentifierToScope(o);
      code = [];
      code.push(this.makeCode(this.original.value));
      if (this.alias != null) {
        code.push(this.makeCode(` as ${this.alias.value}`));
      }
      return code;
    }

    addIdentifierToScope(o) {
      return o.scope.find(this.identifier, this.moduleDeclarationType);
    }

    astNode(o) {
      this.addIdentifierToScope(o);
      return super.astNode(o);
    }

  };

  ModuleSpecifier.prototype.children = ['original', 'alias'];

  return ModuleSpecifier;

}).call(this);

exports.ImportSpecifier = ImportSpecifier = class ImportSpecifier extends ModuleSpecifier {
  constructor(imported, local) {
    super(imported, local, 'import');
  }

  addIdentifierToScope(o) {
    var ref1;
    // Per the spec, symbols can’t be imported multiple times
    // (e.g. `import { foo, foo } from 'lib'` is invalid)
    if ((ref1 = this.identifier, indexOf.call(o.importedSymbols, ref1) >= 0) || o.scope.check(this.identifier)) {
      this.error(`'${this.identifier}' has already been declared`);
    } else {
      o.importedSymbols.push(this.identifier);
    }
    return super.addIdentifierToScope(o);
  }

  astProperties(o) {
    var originalAst, ref1, ref2;
    originalAst = this.original.ast(o);
    return {
      imported: originalAst,
      local: (ref1 = (ref2 = this.alias) != null ? ref2.ast(o) : void 0) != null ? ref1 : originalAst,
      importKind: null
    };
  }

};

exports.ImportDefaultSpecifier = ImportDefaultSpecifier = class ImportDefaultSpecifier extends ImportSpecifier {
  astProperties(o) {
    return {
      local: this.original.ast(o)
    };
  }

};

exports.ImportNamespaceSpecifier = ImportNamespaceSpecifier = class ImportNamespaceSpecifier extends ImportSpecifier {
  astProperties(o) {
    return {
      local: this.alias.ast(o)
    };
  }

};

exports.ExportSpecifier = ExportSpecifier = class ExportSpecifier extends ModuleSpecifier {
  constructor(local, exported) {
    super(local, exported, 'export');
  }

  astProperties(o) {
    var originalAst, ref1, ref2;
    originalAst = this.original.ast(o);
    return {
      local: originalAst,
      exported: (ref1 = (ref2 = this.alias) != null ? ref2.ast(o) : void 0) != null ? ref1 : originalAst
    };
  }

};

exports.DynamicImport = DynamicImport = class DynamicImport extends Base {
  compileNode() {
    return [this.makeCode('import')];
  }

  astType() {
    return 'Import';
  }

};

exports.DynamicImportCall = DynamicImportCall = class DynamicImportCall extends Call {
  compileNode(o) {
    this.checkArguments();
    return super.compileNode(o);
  }

  checkArguments() {
    var ref1;
    if (!((1 <= (ref1 = this.args.length) && ref1 <= 2))) {
      return this.error('import() accepts either one or two arguments');
    }
  }

  astNode(o) {
    this.checkArguments();
    return super.astNode(o);
  }

};

//### Assign

// The **Assign** is used to assign a local variable to value, or to set the
// property of an object -- including within object literals.
exports.Assign = Assign = (function() {
  class Assign extends Base {
    constructor(variable1, value1, context1, options = {}) {
      super();
      this.variable = variable1;
      this.value = value1;
      this.context = context1;
      ({param: this.param, subpattern: this.subpattern, operatorToken: this.operatorToken, moduleDeclaration: this.moduleDeclaration, originalContext: this.originalContext = this.context} = options);
      this.propagateLhs();
    }

    isStatement(o) {
      return (o != null ? o.level : void 0) === LEVEL_TOP && (this.context != null) && (this.moduleDeclaration || indexOf.call(this.context, "?") >= 0);
    }

    checkNameAssignability(o, varBase) {
      if (o.scope.type(varBase.value) === 'import') {
        return varBase.error(`'${varBase.value}' is read-only`);
      }
    }

    assigns(name) {
      return this[this.context === 'object' ? 'value' : 'variable'].assigns(name);
    }

    unfoldSoak(o) {
      return unfoldSoak(o, this, 'variable');
    }

    // During AST generation, we need to allow assignment to these constructs
    // that are considered “unassignable” during compile-to-JS, while still
    // flagging things like `[null] = b`.
    addScopeVariables(o, {allowAssignmentToExpansion = false, allowAssignmentToNontrailingSplat = false, allowAssignmentToEmptyArray = false, allowAssignmentToComplexSplat = false} = {}) {
      var varBase;
      if (!(!this.context || this.context === '**=')) {
        return;
      }
      varBase = this.variable.unwrapAll();
      if (!varBase.isAssignable({
        allowExpansion: allowAssignmentToExpansion,
        allowNontrailingSplat: allowAssignmentToNontrailingSplat,
        allowEmptyArray: allowAssignmentToEmptyArray,
        allowComplexSplat: allowAssignmentToComplexSplat
      })) {
        this.variable.error(`'${this.variable.compile(o)}' can't be assigned`);
      }
      return varBase.eachName((name) => {
        var alreadyDeclared, commentFragments, commentsNode, message;
        if (typeof name.hasProperties === "function" ? name.hasProperties() : void 0) {
          return;
        }
        message = isUnassignable(name.value);
        if (message) {
          name.error(message);
        }
        // `moduleDeclaration` can be `'import'` or `'export'`.
        this.checkNameAssignability(o, name);
        if (this.moduleDeclaration) {
          o.scope.add(name.value, this.moduleDeclaration);
          return name.isDeclaration = true;
        } else if (this.param) {
          return o.scope.add(name.value, this.param === 'alwaysDeclare' ? 'var' : 'param');
        } else {
          alreadyDeclared = o.scope.find(name.value);
          if (name.isDeclaration == null) {
            name.isDeclaration = !alreadyDeclared;
          }
          // If this assignment identifier has one or more herecomments
          // attached, output them as part of the declarations line (unless
          // other herecomments are already staged there) for compatibility
          // with Flow typing. Don’t do this if this assignment is for a
          // class, e.g. `ClassName = class ClassName {`, as Flow requires
          // the comment to be between the class name and the `{`.
          if (name.comments && !o.scope.comments[name.value] && !(this.value instanceof Class) && name.comments.every(function(comment) {
            return comment.here && !comment.multiline;
          })) {
            commentsNode = new IdentifierLiteral(name.value);
            commentsNode.comments = name.comments;
            commentFragments = [];
            this.compileCommentFragments(o, commentsNode, commentFragments);
            return o.scope.comments[name.value] = commentFragments;
          }
        }
      });
    }

    // Compile an assignment, delegating to `compileDestructuring` or
    // `compileSplice` if appropriate. Keep track of the name of the base object
    // we've been assigned to, for correct internal references. If the variable
    // has not been seen yet within the current scope, declare it.
    compileNode(o) {
      var answer, compiledName, isValue, name, properties, prototype, ref1, ref2, ref3, ref4, val;
      isValue = this.variable instanceof Value;
      if (isValue) {
        // If `@variable` is an array or an object, we’re destructuring;
        // if it’s also `isAssignable()`, the destructuring syntax is supported
        // in ES and we can output it as is; otherwise we `@compileDestructuring`
        // and convert this ES-unsupported destructuring into acceptable output.
        if (this.variable.isArray() || this.variable.isObject()) {
          if (!this.variable.isAssignable()) {
            if (this.variable.isObject() && this.variable.base.hasSplat()) {
              return this.compileObjectDestruct(o);
            } else {
              return this.compileDestructuring(o);
            }
          }
        }
        if (this.variable.isSplice()) {
          return this.compileSplice(o);
        }
        if (this.isConditional()) {
          return this.compileConditional(o);
        }
        if ((ref1 = this.context) === '//=' || ref1 === '%%=') {
          return this.compileSpecialMath(o);
        }
      }
      this.addScopeVariables(o);
      if (this.value instanceof Code) {
        if (this.value.isStatic) {
          this.value.name = this.variable.properties[0];
        } else if (((ref2 = this.variable.properties) != null ? ref2.length : void 0) >= 2) {
          ref3 = this.variable.properties, [...properties] = ref3, [prototype, name] = splice.call(properties, -2);
          if (((ref4 = prototype.name) != null ? ref4.value : void 0) === 'prototype') {
            this.value.name = name;
          }
        }
      }
      val = this.value.compileToFragments(o, LEVEL_LIST);
      compiledName = this.variable.compileToFragments(o, LEVEL_LIST);
      if (this.context === 'object') {
        if (this.variable.shouldCache()) {
          compiledName.unshift(this.makeCode('['));
          compiledName.push(this.makeCode(']'));
        }
        return compiledName.concat(this.makeCode(': '), val);
      }
      answer = compiledName.concat(this.makeCode(` ${this.context || '='} `), val);
      // Per https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment#Assignment_without_declaration,
      // if we’re destructuring without declaring, the destructuring assignment must be wrapped in parentheses.
      // The assignment is wrapped in parentheses if 'o.level' has lower precedence than LEVEL_LIST (3)
      // (i.e. LEVEL_COND (4), LEVEL_OP (5) or LEVEL_ACCESS (6)), or if we're destructuring object, e.g. {a,b} = obj.
      if (o.level > LEVEL_LIST || isValue && this.variable.base instanceof Obj && !this.nestedLhs && !(this.param === true)) {
        return this.wrapInParentheses(answer);
      } else {
        return answer;
      }
    }

    // Object rest property is not assignable: `{{a}...}`
    compileObjectDestruct(o) {
      var assigns, props, refVal, splat, splatProp;
      this.variable.base.reorderProperties();
      ({
        properties: props
      } = this.variable.base);
      [splat] = slice1.call(props, -1);
      splatProp = splat.name;
      assigns = [];
      refVal = new Value(new IdentifierLiteral(o.scope.freeVariable('ref')));
      props.splice(-1, 1, new Splat(refVal));
      assigns.push(new Assign(new Value(new Obj(props)), this.value).compileToFragments(o, LEVEL_LIST));
      assigns.push(new Assign(new Value(splatProp), refVal).compileToFragments(o, LEVEL_LIST));
      return this.joinFragmentArrays(assigns, ', ');
    }

    // Brief implementation of recursive pattern matching, when assigning array or
    // object literals to a value. Peeks at their properties to assign inner names.
    compileDestructuring(o) {
      var assignObjects, assigns, code, compSlice, compSplice, complexObjects, expIdx, expans, fragments, hasObjAssigns, isExpans, isSplat, leftObjs, loopObjects, obj, objIsUnassignable, objects, olen, processObjects, pushAssign, ref, refExp, restVar, rightObjs, slicer, splatVar, splatVarAssign, splatVarRef, splats, splatsAndExpans, top, value, vvar, vvarText;
      top = o.level === LEVEL_TOP;
      ({value} = this);
      ({objects} = this.variable.base);
      olen = objects.length;
      // Special-case for `{} = a` and `[] = a` (empty patterns).
      // Compile to simply `a`.
      if (olen === 0) {
        code = value.compileToFragments(o);
        if (o.level >= LEVEL_OP) {
          return this.wrapInParentheses(code);
        } else {
          return code;
        }
      }
      [obj] = objects;
      this.disallowLoneExpansion();
      ({splats, expans, splatsAndExpans} = this.getAndCheckSplatsAndExpansions());
      isSplat = (splats != null ? splats.length : void 0) > 0;
      isExpans = (expans != null ? expans.length : void 0) > 0;
      vvar = value.compileToFragments(o, LEVEL_LIST);
      vvarText = fragmentsToText(vvar);
      assigns = [];
      pushAssign = (variable, val) => {
        return assigns.push(new Assign(variable, val, null, {
          param: this.param,
          subpattern: true
        }).compileToFragments(o, LEVEL_LIST));
      };
      if (isSplat) {
        splatVar = objects[splats[0]].name.unwrap();
        if (splatVar instanceof Arr || splatVar instanceof Obj) {
          splatVarRef = new IdentifierLiteral(o.scope.freeVariable('ref'));
          objects[splats[0]].name = splatVarRef;
          splatVarAssign = function() {
            return pushAssign(new Value(splatVar), splatVarRef);
          };
        }
      }
      // At this point, there are several things to destructure. So the `fn()` in
      // `{a, b} = fn()` must be cached, for example. Make vvar into a simple
      // variable if it isn’t already.
      if (!(value.unwrap() instanceof IdentifierLiteral) || this.variable.assigns(vvarText)) {
        ref = o.scope.freeVariable('ref');
        assigns.push([this.makeCode(ref + ' = '), ...vvar]);
        vvar = [this.makeCode(ref)];
        vvarText = ref;
      }
      slicer = function(type) {
        return function(vvar, start, end = false) {
          var args, slice;
          if (!(vvar instanceof Value)) {
            vvar = new IdentifierLiteral(vvar);
          }
          args = [vvar, new NumberLiteral(start)];
          if (end) {
            args.push(new NumberLiteral(end));
          }
          slice = new Value(new IdentifierLiteral(utility(type, o)), [new Access(new PropertyName('call'))]);
          return new Value(new Call(slice, args));
        };
      };
      // Helper which outputs `[].slice` code.
      compSlice = slicer("slice");
      // Helper which outputs `[].splice` code.
      compSplice = slicer("splice");
      // Check if `objects` array contains any instance of `Assign`, e.g. {a:1}.
      hasObjAssigns = function(objs) {
        var i, j, len1, results1;
        results1 = [];
        for (i = j = 0, len1 = objs.length; j < len1; i = ++j) {
          obj = objs[i];
          if (obj instanceof Assign && obj.context === 'object') {
            results1.push(i);
          }
        }
        return results1;
      };
      // Check if `objects` array contains any unassignable object.
      objIsUnassignable = function(objs) {
        var j, len1;
        for (j = 0, len1 = objs.length; j < len1; j++) {
          obj = objs[j];
          if (!obj.isAssignable()) {
            return true;
          }
        }
        return false;
      };
      // `objects` are complex when there is object assign ({a:1}),
      // unassignable object, or just a single node.
      complexObjects = function(objs) {
        return hasObjAssigns(objs).length || objIsUnassignable(objs) || olen === 1;
      };
      // "Complex" `objects` are processed in a loop.
      // Examples: [a, b, {c, r...}, d], [a, ..., {b, r...}, c, d]
      loopObjects = (objs, vvar, vvarTxt) => {
        var acc, i, idx, j, len1, message, results1, vval;
        results1 = [];
        for (i = j = 0, len1 = objs.length; j < len1; i = ++j) {
          obj = objs[i];
          if (obj instanceof Elision) {
            // `Elision` can be skipped.
            continue;
          }
          // If `obj` is {a: 1}
          if (obj instanceof Assign && obj.context === 'object') {
            ({
              variable: {
                base: idx
              },
              value: vvar
            } = obj);
            if (vvar instanceof Assign) {
              ({
                variable: vvar
              } = vvar);
            }
            idx = vvar.this ? vvar.properties[0].name : new PropertyName(vvar.unwrap().value);
            acc = idx.unwrap() instanceof PropertyName;
            vval = new Value(value, [new (acc ? Access : Index)(idx)]);
          } else {
            // `obj` is [a...], {a...} or a
            vvar = (function() {
              switch (false) {
                case !(obj instanceof Splat):
                  return new Value(obj.name);
                default:
                  return obj;
              }
            })();
            vval = (function() {
              switch (false) {
                case !(obj instanceof Splat):
                  return compSlice(vvarTxt, i);
                default:
                  return new Value(new Literal(vvarTxt), [new Index(new NumberLiteral(i))]);
              }
            })();
          }
          message = isUnassignable(vvar.unwrap().value);
          if (message) {
            vvar.error(message);
          }
          results1.push(pushAssign(vvar, vval));
        }
        return results1;
      };
      // "Simple" `objects` can be split and compiled to arrays, [a, b, c] = arr, [a, b, c...] = arr
      assignObjects = (objs, vvar, vvarTxt) => {
        var vval;
        vvar = new Value(new Arr(objs, true));
        vval = vvarTxt instanceof Value ? vvarTxt : new Value(new Literal(vvarTxt));
        return pushAssign(vvar, vval);
      };
      processObjects = function(objs, vvar, vvarTxt) {
        if (complexObjects(objs)) {
          return loopObjects(objs, vvar, vvarTxt);
        } else {
          return assignObjects(objs, vvar, vvarTxt);
        }
      };
      // In case there is `Splat` or `Expansion` in `objects`,
      // we can split array in two simple subarrays.
      // `Splat` [a, b, c..., d, e] can be split into  [a, b, c...] and [d, e].
      // `Expansion` [a, b, ..., c, d] can be split into [a, b] and [c, d].
      // Examples:
      // a) `Splat`
      //   CS: [a, b, c..., d, e] = arr
      //   JS: [a, b, ...c] = arr, [d, e] = splice.call(c, -2)
      // b) `Expansion`
      //   CS: [a, b, ..., d, e] = arr
      //   JS: [a, b] = arr, [d, e] = slice.call(arr, -2)
      if (splatsAndExpans.length) {
        expIdx = splatsAndExpans[0];
        leftObjs = objects.slice(0, expIdx + (isSplat ? 1 : 0));
        rightObjs = objects.slice(expIdx + 1);
        if (leftObjs.length !== 0) {
          processObjects(leftObjs, vvar, vvarText);
        }
        if (rightObjs.length !== 0) {
          // Slice or splice `objects`.
          refExp = (function() {
            switch (false) {
              case !isSplat:
                return compSplice(new Value(objects[expIdx].name), rightObjs.length * -1);
              case !isExpans:
                return compSlice(vvarText, rightObjs.length * -1);
            }
          })();
          if (complexObjects(rightObjs)) {
            restVar = refExp;
            refExp = o.scope.freeVariable('ref');
            assigns.push([this.makeCode(refExp + ' = '), ...restVar.compileToFragments(o, LEVEL_LIST)]);
          }
          processObjects(rightObjs, vvar, refExp);
        }
      } else {
        // There is no `Splat` or `Expansion` in `objects`.
        processObjects(objects, vvar, vvarText);
      }
      if (typeof splatVarAssign === "function") {
        splatVarAssign();
      }
      if (!(top || this.subpattern)) {
        assigns.push(vvar);
      }
      fragments = this.joinFragmentArrays(assigns, ', ');
      if (o.level < LEVEL_LIST) {
        return fragments;
      } else {
        return this.wrapInParentheses(fragments);
      }
    }

    // Disallow `[...] = a` for some reason. (Could be equivalent to `[] = a`?)
    disallowLoneExpansion() {
      var loneObject, objects;
      if (!(this.variable.base instanceof Arr)) {
        return;
      }
      ({objects} = this.variable.base);
      if ((objects != null ? objects.length : void 0) !== 1) {
        return;
      }
      [loneObject] = objects;
      if (loneObject instanceof Expansion) {
        return loneObject.error('Destructuring assignment has no target');
      }
    }

    // Show error if there is more than one `Splat`, or `Expansion`.
    // Examples: [a, b, c..., d, e, f...], [a, b, ..., c, d, ...], [a, b, ..., c, d, e...]
    getAndCheckSplatsAndExpansions() {
      var expans, i, obj, objects, splats, splatsAndExpans;
      if (!(this.variable.base instanceof Arr)) {
        return {
          splats: [],
          expans: [],
          splatsAndExpans: []
        };
      }
      ({objects} = this.variable.base);
      // Count all `Splats`: [a, b, c..., d, e]
      splats = (function() {
        var j, len1, results1;
        results1 = [];
        for (i = j = 0, len1 = objects.length; j < len1; i = ++j) {
          obj = objects[i];
          if (obj instanceof Splat) {
            results1.push(i);
          }
        }
        return results1;
      })();
      // Count all `Expansions`: [a, b, ..., c, d]
      expans = (function() {
        var j, len1, results1;
        results1 = [];
        for (i = j = 0, len1 = objects.length; j < len1; i = ++j) {
          obj = objects[i];
          if (obj instanceof Expansion) {
            results1.push(i);
          }
        }
        return results1;
      })();
      // Combine splats and expansions.
      splatsAndExpans = [...splats, ...expans];
      if (splatsAndExpans.length > 1) {
        // Sort 'splatsAndExpans' so we can show error at first disallowed token.
        objects[splatsAndExpans.sort()[1]].error("multiple splats/expansions are disallowed in an assignment");
      }
      return {splats, expans, splatsAndExpans};
    }

    // When compiling a conditional assignment, take care to ensure that the
    // operands are only evaluated once, even though we have to reference them
    // more than once.
    compileConditional(o) {
      var fragments, left, right;
      [left, right] = this.variable.cacheReference(o);
      // Disallow conditional assignment of undefined variables.
      if (!left.properties.length && left.base instanceof Literal && !(left.base instanceof ThisLiteral) && !o.scope.check(left.base.value)) {
        this.throwUnassignableConditionalError(left.base.value);
      }
      if (indexOf.call(this.context, "?") >= 0) {
        o.isExistentialEquals = true;
        return new If(new Existence(left), right, {
          type: 'if'
        }).addElse(new Assign(right, this.value, '=')).compileToFragments(o);
      } else {
        fragments = new Op(this.context.slice(0, -1), left, new Assign(right, this.value, '=')).compileToFragments(o);
        if (o.level <= LEVEL_LIST) {
          return fragments;
        } else {
          return this.wrapInParentheses(fragments);
        }
      }
    }

    // Convert special math assignment operators like `a //= b` to the equivalent
    // extended form `a = a ** b` and then compiles that.
    compileSpecialMath(o) {
      var left, right;
      [left, right] = this.variable.cacheReference(o);
      return new Assign(left, new Op(this.context.slice(0, -1), right, this.value)).compileToFragments(o);
    }

    // Compile the assignment from an array splice literal, using JavaScript's
    // `Array#splice` method.
    compileSplice(o) {
      var answer, exclusive, from, fromDecl, fromRef, name, to, unwrappedVar, valDef, valRef;
      ({
        range: {from, to, exclusive}
      } = this.variable.properties.pop());
      unwrappedVar = this.variable.unwrapAll();
      if (unwrappedVar.comments) {
        moveComments(unwrappedVar, this);
        delete this.variable.comments;
      }
      name = this.variable.compile(o);
      if (from) {
        [fromDecl, fromRef] = this.cacheToCodeFragments(from.cache(o, LEVEL_OP));
      } else {
        fromDecl = fromRef = '0';
      }
      if (to) {
        if ((from != null ? from.isNumber() : void 0) && to.isNumber()) {
          to = to.compile(o) - fromRef;
          if (!exclusive) {
            to += 1;
          }
        } else {
          to = to.compile(o, LEVEL_ACCESS) + ' - ' + fromRef;
          if (!exclusive) {
            to += ' + 1';
          }
        }
      } else {
        to = "9e9";
      }
      [valDef, valRef] = this.value.cache(o, LEVEL_LIST);
      answer = [].concat(this.makeCode(`${utility('splice', o)}.apply(${name}, [${fromDecl}, ${to}].concat(`), valDef, this.makeCode(")), "), valRef);
      if (o.level > LEVEL_TOP) {
        return this.wrapInParentheses(answer);
      } else {
        return answer;
      }
    }

    eachName(iterator) {
      return this.variable.unwrapAll().eachName(iterator);
    }

    isDefaultAssignment() {
      return this.param || this.nestedLhs;
    }

    propagateLhs() {
      var ref1, ref2;
      if (!(((ref1 = this.variable) != null ? typeof ref1.isArray === "function" ? ref1.isArray() : void 0 : void 0) || ((ref2 = this.variable) != null ? typeof ref2.isObject === "function" ? ref2.isObject() : void 0 : void 0))) {
        return;
      }
      // This is the left-hand side of an assignment; let `Arr` and `Obj`
      // know that, so that those nodes know that they’re assignable as
      // destructured variables.
      return this.variable.base.propagateLhs(true);
    }

    throwUnassignableConditionalError(name) {
      return this.variable.error(`the variable \"${name}\" can't be assigned with ${this.context} because it has not been declared before`);
    }

    isConditional() {
      var ref1;
      return (ref1 = this.context) === '||=' || ref1 === '&&=' || ref1 === '?=';
    }

    astNode(o) {
      var variable;
      this.disallowLoneExpansion();
      this.getAndCheckSplatsAndExpansions();
      if (this.isConditional()) {
        variable = this.variable.unwrap();
        if (variable instanceof IdentifierLiteral && !o.scope.check(variable.value)) {
          this.throwUnassignableConditionalError(variable.value);
        }
      }
      this.addScopeVariables(o, {
        allowAssignmentToExpansion: true,
        allowAssignmentToNontrailingSplat: true,
        allowAssignmentToEmptyArray: true,
        allowAssignmentToComplexSplat: true
      });
      return super.astNode(o);
    }

    astType() {
      if (this.isDefaultAssignment()) {
        return 'AssignmentPattern';
      } else {
        return 'AssignmentExpression';
      }
    }

    astProperties(o) {
      var ref1, ret;
      ret = {
        right: this.value.ast(o, LEVEL_LIST),
        left: this.variable.ast(o, LEVEL_LIST)
      };
      if (!this.isDefaultAssignment()) {
        ret.operator = (ref1 = this.originalContext) != null ? ref1 : '=';
      }
      return ret;
    }

  };

  Assign.prototype.children = ['variable', 'value'];

  Assign.prototype.isAssignable = YES;

  Assign.prototype.isStatementAst = NO;

  return Assign;

}).call(this);

//### FuncGlyph
exports.FuncGlyph = FuncGlyph = class FuncGlyph extends Base {
  constructor(glyph) {
    super();
    this.glyph = glyph;
  }

};

//### Code

// A function definition. This is the only node that creates a new Scope.
// When for the purposes of walking the contents of a function body, the Code
// has no *children* -- they're within the inner scope.
exports.Code = Code = (function() {
  class Code extends Base {
    constructor(params, body, funcGlyph, paramStart) {
      var ref1;
      super();
      this.funcGlyph = funcGlyph;
      this.paramStart = paramStart;
      this.params = params || [];
      this.body = body || new Block();
      this.bound = ((ref1 = this.funcGlyph) != null ? ref1.glyph : void 0) === '=>';
      this.isGenerator = false;
      this.isAsync = false;
      this.isMethod = false;
      this.body.traverseChildren(false, (node) => {
        if ((node instanceof Op && node.isYield()) || node instanceof YieldReturn) {
          this.isGenerator = true;
        }
        if ((node instanceof Op && node.isAwait()) || node instanceof AwaitReturn) {
          this.isAsync = true;
        }
        if (node instanceof For && node.isAwait()) {
          return this.isAsync = true;
        }
      });
      this.propagateLhs();
    }

    isStatement() {
      return this.isMethod;
    }

    makeScope(parentScope) {
      return new Scope(parentScope, this.body, this);
    }

    // Compilation creates a new scope unless explicitly asked to share with the
    // outer scope. Handles splat parameters in the parameter list by setting
    // such parameters to be the final parameter in the function definition, as
    // required per the ES2015 spec. If the CoffeeScript function definition had
    // parameters after the splat, they are declared via expressions in the
    // function body.
    compileNode(o) {
      var answer, body, boundMethodCheck, comment, condition, exprs, generatedVariables, haveBodyParam, haveSplatParam, i, ifTrue, j, k, l, len1, len2, len3, m, methodScope, modifiers, name, param, paramToAddToScope, params, paramsAfterSplat, ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7, ref8, scopeVariablesCount, signature, splatParamName, thisAssignments, wasEmpty, yieldNode;
      this.checkForAsyncOrGeneratorConstructor();
      if (this.bound) {
        if ((ref1 = o.scope.method) != null ? ref1.bound : void 0) {
          this.context = o.scope.method.context;
        }
        if (!this.context) {
          this.context = 'this';
        }
      }
      this.updateOptions(o);
      params = [];
      exprs = [];
      thisAssignments = (ref2 = (ref3 = this.thisAssignments) != null ? ref3.slice() : void 0) != null ? ref2 : [];
      paramsAfterSplat = [];
      haveSplatParam = false;
      haveBodyParam = false;
      this.checkForDuplicateParams();
      this.disallowLoneExpansionAndMultipleSplats();
      // Separate `this` assignments.
      this.eachParamName(function(name, node, param, obj) {
        var replacement, target;
        if (node.this) {
          name = node.properties[0].name.value;
          if (indexOf.call(JS_FORBIDDEN, name) >= 0) {
            name = `_${name}`;
          }
          target = new IdentifierLiteral(o.scope.freeVariable(name, {
            reserve: false
          }));
          // `Param` is object destructuring with a default value: ({@prop = 1}) ->
          // In a case when the variable name is already reserved, we have to assign
          // a new variable name to the destructured variable: ({prop:prop1 = 1}) ->
          replacement = param.name instanceof Obj && obj instanceof Assign && obj.operatorToken.value === '=' ? new Assign(new IdentifierLiteral(name), target, 'object') : target; //, operatorToken: new Literal ':'
          param.renameParam(node, replacement);
          return thisAssignments.push(new Assign(node, target));
        }
      });
      ref4 = this.params;
      // Parse the parameters, adding them to the list of parameters to put in the
      // function definition; and dealing with splats or expansions, including
      // adding expressions to the function body to declare all parameter
      // variables that would have been after the splat/expansion parameter.
      // If we encounter a parameter that needs to be declared in the function
      // body for any reason, for example it’s destructured with `this`, also
      // declare and assign all subsequent parameters in the function body so that
      // any non-idempotent parameters are evaluated in the correct order.
      for (i = j = 0, len1 = ref4.length; j < len1; i = ++j) {
        param = ref4[i];
        // Was `...` used with this parameter? Splat/expansion parameters cannot
        // have default values, so we need not worry about that.
        if (param.splat || param instanceof Expansion) {
          haveSplatParam = true;
          if (param.splat) {
            if (param.name instanceof Arr || param.name instanceof Obj) {
              // Splat arrays are treated oddly by ES; deal with them the legacy
              // way in the function body. TODO: Should this be handled in the
              // function parameter list, and if so, how?
              splatParamName = o.scope.freeVariable('arg');
              params.push(ref = new Value(new IdentifierLiteral(splatParamName)));
              exprs.push(new Assign(new Value(param.name), ref));
            } else {
              params.push(ref = param.asReference(o));
              splatParamName = fragmentsToText(ref.compileNodeWithoutComments(o));
            }
            if (param.shouldCache()) {
              exprs.push(new Assign(new Value(param.name), ref)); // `param` is an Expansion
            }
          } else {
            splatParamName = o.scope.freeVariable('args');
            params.push(new Value(new IdentifierLiteral(splatParamName)));
          }
          o.scope.parameter(splatParamName);
        } else {
          // Parse all other parameters; if a splat paramater has not yet been
          // encountered, add these other parameters to the list to be output in
          // the function definition.
          if (param.shouldCache() || haveBodyParam) {
            param.assignedInBody = true;
            haveBodyParam = true;
            // This parameter cannot be declared or assigned in the parameter
            // list. So put a reference in the parameter list and add a statement
            // to the function body assigning it, e.g.
            // `(arg) => { var a = arg.a; }`, with a default value if it has one.
            if (param.value != null) {
              condition = new Op('===', param, new UndefinedLiteral());
              ifTrue = new Assign(new Value(param.name), param.value);
              exprs.push(new If(condition, ifTrue));
            } else {
              exprs.push(new Assign(new Value(param.name), param.asReference(o), null, {
                param: 'alwaysDeclare'
              }));
            }
          }
          // If this parameter comes before the splat or expansion, it will go
          // in the function definition parameter list.
          if (!haveSplatParam) {
            // If this parameter has a default value, and it hasn’t already been
            // set by the `shouldCache()` block above, define it as a statement in
            // the function body. This parameter comes after the splat parameter,
            // so we can’t define its default value in the parameter list.
            if (param.shouldCache()) {
              ref = param.asReference(o);
            } else {
              if ((param.value != null) && !param.assignedInBody) {
                ref = new Assign(new Value(param.name), param.value, null, {
                  param: true
                });
              } else {
                ref = param;
              }
            }
            // Add this parameter’s reference(s) to the function scope.
            if (param.name instanceof Arr || param.name instanceof Obj) {
              // This parameter is destructured.
              param.name.lhs = true;
              if (!param.shouldCache()) {
                param.name.eachName(function(prop) {
                  return o.scope.parameter(prop.value);
                });
              }
            } else {
              // This compilation of the parameter is only to get its name to add
              // to the scope name tracking; since the compilation output here
              // isn’t kept for eventual output, don’t include comments in this
              // compilation, so that they get output the “real” time this param
              // is compiled.
              paramToAddToScope = param.value != null ? param : ref;
              o.scope.parameter(fragmentsToText(paramToAddToScope.compileToFragmentsWithoutComments(o)));
            }
            params.push(ref);
          } else {
            paramsAfterSplat.push(param);
            // If this parameter had a default value, since it’s no longer in the
            // function parameter list we need to assign its default value
            // (if necessary) as an expression in the body.
            if ((param.value != null) && !param.shouldCache()) {
              condition = new Op('===', param, new UndefinedLiteral());
              ifTrue = new Assign(new Value(param.name), param.value);
              exprs.push(new If(condition, ifTrue));
            }
            if (((ref5 = param.name) != null ? ref5.value : void 0) != null) {
              // Add this parameter to the scope, since it wouldn’t have been added
              // yet since it was skipped earlier.
              o.scope.add(param.name.value, 'var', true);
            }
          }
        }
      }
      // If there were parameters after the splat or expansion parameter, those
      // parameters need to be assigned in the body of the function.
      if (paramsAfterSplat.length !== 0) {
        // Create a destructured assignment, e.g. `[a, b, c] = [args..., b, c]`
        exprs.unshift(new Assign(new Value(new Arr([
          new Splat(new IdentifierLiteral(splatParamName)),
          ...((function() {
            var k,
          len2,
          results1;
            results1 = [];
            for (k = 0, len2 = paramsAfterSplat.length; k < len2; k++) {
              param = paramsAfterSplat[k];
              results1.push(param.asReference(o));
            }
            return results1;
          })())
        ])), new Value(new IdentifierLiteral(splatParamName))));
      }
      // Add new expressions to the function body
      wasEmpty = this.body.isEmpty();
      this.disallowSuperInParamDefaults();
      this.checkSuperCallsInConstructorBody();
      if (!this.expandCtorSuper(thisAssignments)) {
        this.body.expressions.unshift(...thisAssignments);
      }
      this.body.expressions.unshift(...exprs);
      if (this.isMethod && this.bound && !this.isStatic && this.classVariable) {
        boundMethodCheck = new Value(new Literal(utility('boundMethodCheck', o)));
        this.body.expressions.unshift(new Call(boundMethodCheck, [new Value(new ThisLiteral()), this.classVariable]));
      }
      if (!(wasEmpty || this.noReturn)) {
        this.body.makeReturn();
      }
      // JavaScript doesn’t allow bound (`=>`) functions to also be generators.
      // This is usually caught via `Op::compileContinuation`, but double-check:
      if (this.bound && this.isGenerator) {
        yieldNode = this.body.contains(function(node) {
          return node instanceof Op && node.operator === 'yield';
        });
        (yieldNode || this).error('yield cannot occur inside bound (fat arrow) functions');
      }
      // Assemble the output
      modifiers = [];
      if (this.isMethod && this.isStatic) {
        modifiers.push('static');
      }
      if (this.isAsync) {
        modifiers.push('async');
      }
      if (!(this.isMethod || this.bound)) {
        modifiers.push(`function${this.isGenerator ? '*' : ''}`);
      } else if (this.isGenerator) {
        modifiers.push('*');
      }
      signature = [this.makeCode('(')];
      // Block comments between a function name and `(` get output between
      // `function` and `(`.
      if (((ref6 = this.paramStart) != null ? ref6.comments : void 0) != null) {
        this.compileCommentFragments(o, this.paramStart, signature);
      }
      for (i = k = 0, len2 = params.length; k < len2; i = ++k) {
        param = params[i];
        if (i !== 0) {
          signature.push(this.makeCode(', '));
        }
        if (haveSplatParam && i === params.length - 1) {
          signature.push(this.makeCode('...'));
        }
        // Compile this parameter, but if any generated variables get created
        // (e.g. `ref`), shift those into the parent scope since we can’t put a
        // `var` line inside a function parameter list.
        scopeVariablesCount = o.scope.variables.length;
        signature.push(...param.compileToFragments(o, LEVEL_PAREN));
        if (scopeVariablesCount !== o.scope.variables.length) {
          generatedVariables = o.scope.variables.splice(scopeVariablesCount);
          o.scope.parent.variables.push(...generatedVariables);
        }
      }
      signature.push(this.makeCode(')'));
      // Block comments between `)` and `->`/`=>` get output between `)` and `{`.
      if (((ref7 = this.funcGlyph) != null ? ref7.comments : void 0) != null) {
        ref8 = this.funcGlyph.comments;
        for (l = 0, len3 = ref8.length; l < len3; l++) {
          comment = ref8[l];
          comment.unshift = false;
        }
        this.compileCommentFragments(o, this.funcGlyph, signature);
      }
      if (!this.body.isEmpty()) {
        body = this.body.compileWithDeclarations(o);
      }
      // We need to compile the body before method names to ensure `super`
      // references are handled.
      if (this.isMethod) {
        [methodScope, o.scope] = [o.scope, o.scope.parent];
        name = this.name.compileToFragments(o);
        if (name[0].code === '.') {
          name.shift();
        }
        o.scope = methodScope;
      }
      answer = this.joinFragmentArrays((function() {
        var len4, p, results1;
        results1 = [];
        for (p = 0, len4 = modifiers.length; p < len4; p++) {
          m = modifiers[p];
          results1.push(this.makeCode(m));
        }
        return results1;
      }).call(this), ' ');
      if (modifiers.length && name) {
        answer.push(this.makeCode(' '));
      }
      if (name) {
        answer.push(...name);
      }
      answer.push(...signature);
      if (this.bound && !this.isMethod) {
        answer.push(this.makeCode(' =>'));
      }
      answer.push(this.makeCode(' {'));
      if (body != null ? body.length : void 0) {
        answer.push(this.makeCode('\n'), ...body, this.makeCode(`\n${this.tab}`));
      }
      answer.push(this.makeCode('}'));
      if (this.isMethod) {
        return indentInitial(answer, this);
      }
      if (this.front || (o.level >= LEVEL_ACCESS)) {
        return this.wrapInParentheses(answer);
      } else {
        return answer;
      }
    }

    updateOptions(o) {
      o.scope = del(o, 'classScope') || this.makeScope(o.scope);
      o.scope.shared = del(o, 'sharedScope');
      o.indent += TAB;
      delete o.bare;
      return delete o.isExistentialEquals;
    }

    checkForDuplicateParams() {
      var paramNames;
      paramNames = [];
      return this.eachParamName(function(name, node, param) {
        if (indexOf.call(paramNames, name) >= 0) {
          node.error(`multiple parameters named '${name}'`);
        }
        return paramNames.push(name);
      });
    }

    eachParamName(iterator) {
      var j, len1, param, ref1, results1;
      ref1 = this.params;
      results1 = [];
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        param = ref1[j];
        results1.push(param.eachName(iterator));
      }
      return results1;
    }

    // Short-circuit `traverseChildren` method to prevent it from crossing scope
    // boundaries unless `crossScope` is `true`.
    traverseChildren(crossScope, func) {
      if (crossScope) {
        return super.traverseChildren(crossScope, func);
      }
    }

    // Short-circuit `replaceInContext` method to prevent it from crossing context boundaries. Bound
    // functions have the same context.
    replaceInContext(child, replacement) {
      if (this.bound) {
        return super.replaceInContext(child, replacement);
      } else {
        return false;
      }
    }

    disallowSuperInParamDefaults({forAst} = {}) {
      if (!this.ctor) {
        return false;
      }
      return this.eachSuperCall(Block.wrap(this.params), function(superCall) {
        return superCall.error("'super' is not allowed in constructor parameter defaults");
      }, {
        checkForThisBeforeSuper: !forAst
      });
    }

    checkSuperCallsInConstructorBody() {
      var seenSuper;
      if (!this.ctor) {
        return false;
      }
      seenSuper = this.eachSuperCall(this.body, (superCall) => {
        if (this.ctor === 'base') {
          return superCall.error("'super' is only allowed in derived class constructors");
        }
      });
      return seenSuper;
    }

    flagThisParamInDerivedClassConstructorWithoutCallingSuper(param) {
      return param.error("Can't use @params in derived class constructors without calling super");
    }

    checkForAsyncOrGeneratorConstructor() {
      if (this.ctor) {
        if (this.isAsync) {
          this.name.error('Class constructor may not be async');
        }
        if (this.isGenerator) {
          return this.name.error('Class constructor may not be a generator');
        }
      }
    }

    disallowLoneExpansionAndMultipleSplats() {
      var j, len1, param, ref1, results1, seenSplatParam;
      seenSplatParam = false;
      ref1 = this.params;
      results1 = [];
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        param = ref1[j];
        // Was `...` used with this parameter? (Only one such parameter is allowed
        // per function.)
        if (param.splat || param instanceof Expansion) {
          if (seenSplatParam) {
            param.error('only one splat or expansion parameter is allowed per function definition');
          } else if (param instanceof Expansion && this.params.length === 1) {
            param.error('an expansion parameter cannot be the only parameter in a function definition');
          }
          results1.push(seenSplatParam = true);
        } else {
          results1.push(void 0);
        }
      }
      return results1;
    }

    expandCtorSuper(thisAssignments) {
      var haveThisParam, param, ref1, seenSuper;
      if (!this.ctor) {
        return false;
      }
      seenSuper = this.eachSuperCall(this.body, (superCall) => {
        return superCall.expressions = thisAssignments;
      });
      haveThisParam = thisAssignments.length && thisAssignments.length !== ((ref1 = this.thisAssignments) != null ? ref1.length : void 0);
      if (this.ctor === 'derived' && !seenSuper && haveThisParam) {
        param = thisAssignments[0].variable;
        this.flagThisParamInDerivedClassConstructorWithoutCallingSuper(param);
      }
      return seenSuper;
    }

    // Find all super calls in the given context node;
    // returns `true` if `iterator` is called.
    eachSuperCall(context, iterator, {checkForThisBeforeSuper = true} = {}) {
      var seenSuper;
      seenSuper = false;
      context.traverseChildren(true, (child) => {
        var childArgs;
        if (child instanceof SuperCall) {
          // `super` in a constructor (the only `super` without an accessor)
          // cannot be given an argument with a reference to `this`, as that would
          // be referencing `this` before calling `super`.
          if (!child.variable.accessor) {
            childArgs = child.args.filter(function(arg) {
              return !(arg instanceof Class) && (!(arg instanceof Code) || arg.bound);
            });
            Block.wrap(childArgs).traverseChildren(true, (node) => {
              if (node.this) {
                return node.error("Can't call super with @params in derived class constructors");
              }
            });
          }
          seenSuper = true;
          iterator(child);
        } else if (checkForThisBeforeSuper && child instanceof ThisLiteral && this.ctor === 'derived' && !seenSuper) {
          child.error("Can't reference 'this' before calling super in derived class constructors");
        }
        // `super` has the same target in bound (arrow) functions, so check them too
        return !(child instanceof SuperCall) && (!(child instanceof Code) || child.bound);
      });
      return seenSuper;
    }

    propagateLhs() {
      var j, len1, name, param, ref1, results1;
      ref1 = this.params;
      results1 = [];
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        param = ref1[j];
        ({name} = param);
        if (name instanceof Arr || name instanceof Obj) {
          results1.push(name.propagateLhs(true));
        } else if (param instanceof Expansion) {
          results1.push(param.lhs = true);
        } else {
          results1.push(void 0);
        }
      }
      return results1;
    }

    astAddParamsToScope(o) {
      return this.eachParamName(function(name) {
        return o.scope.add(name, 'param');
      });
    }

    astNode(o) {
      var seenSuper;
      this.updateOptions(o);
      this.checkForAsyncOrGeneratorConstructor();
      this.checkForDuplicateParams();
      this.disallowSuperInParamDefaults({
        forAst: true
      });
      this.disallowLoneExpansionAndMultipleSplats();
      seenSuper = this.checkSuperCallsInConstructorBody();
      if (this.ctor === 'derived' && !seenSuper) {
        this.eachParamName((name, node) => {
          if (node.this) {
            return this.flagThisParamInDerivedClassConstructorWithoutCallingSuper(node);
          }
        });
      }
      this.astAddParamsToScope(o);
      if (!(this.body.isEmpty() || this.noReturn)) {
        this.body.makeReturn(null, true);
      }
      return super.astNode(o);
    }

    astType() {
      if (this.isMethod) {
        return 'ClassMethod';
      } else if (this.bound) {
        return 'ArrowFunctionExpression';
      } else {
        return 'FunctionExpression';
      }
    }

    paramForAst(param) {
      var name, splat, value;
      if (param instanceof Expansion) {
        return param;
      }
      ({name, value, splat} = param);
      if (splat) {
        return new Splat(name, {
          lhs: true,
          postfix: splat.postfix
        }).withLocationDataFrom(param);
      } else if (value != null) {
        return new Assign(name, value, null, {
          param: true
        }).withLocationDataFrom({
          locationData: mergeLocationData(name.locationData, value.locationData)
        });
      } else {
        return name;
      }
    }

    methodAstProperties(o) {
      var getIsComputed, ref1, ref2, ref3, ref4;
      getIsComputed = () => {
        if (this.name instanceof Index) {
          return true;
        }
        if (this.name instanceof ComputedPropertyName) {
          return true;
        }
        if (this.name.name instanceof ComputedPropertyName) {
          return true;
        }
        return false;
      };
      return {
        static: !!this.isStatic,
        key: this.name.ast(o),
        computed: getIsComputed(),
        kind: this.ctor ? 'constructor' : 'method',
        operator: (ref1 = (ref2 = this.operatorToken) != null ? ref2.value : void 0) != null ? ref1 : '=',
        staticClassName: (ref3 = (ref4 = this.isStatic.staticClassName) != null ? ref4.ast(o) : void 0) != null ? ref3 : null,
        bound: !!this.bound
      };
    }

    astProperties(o) {
      var param, ref1;
      return Object.assign({
        params: (function() {
          var j, len1, ref1, results1;
          ref1 = this.params;
          results1 = [];
          for (j = 0, len1 = ref1.length; j < len1; j++) {
            param = ref1[j];
            results1.push(this.paramForAst(param).ast(o));
          }
          return results1;
        }).call(this),
        body: this.body.ast(Object.assign({}, o, {
          checkForDirectives: true
        }), LEVEL_TOP),
        generator: !!this.isGenerator,
        async: !!this.isAsync,
        // We never generate named functions, so specify `id` as `null`, which
        // matches the Babel AST for anonymous function expressions/arrow functions
        id: null,
        hasIndentedBody: this.body.locationData.first_line > ((ref1 = this.funcGlyph) != null ? ref1.locationData.first_line : void 0)
      }, this.isMethod ? this.methodAstProperties(o) : {});
    }

    astLocationData() {
      var astLocationData, functionLocationData;
      functionLocationData = super.astLocationData();
      if (!this.isMethod) {
        return functionLocationData;
      }
      astLocationData = mergeAstLocationData(this.name.astLocationData(), functionLocationData);
      if (this.isStatic.staticClassName != null) {
        astLocationData = mergeAstLocationData(this.isStatic.staticClassName.astLocationData(), astLocationData);
      }
      return astLocationData;
    }

  };

  Code.prototype.children = ['params', 'body'];

  Code.prototype.jumps = NO;

  return Code;

}).call(this);

//### Param

// A parameter in a function definition. Beyond a typical JavaScript parameter,
// these parameters can also attach themselves to the context of the function,
// as well as be a splat, gathering up a group of parameters into an array.
exports.Param = Param = (function() {
  class Param extends Base {
    constructor(name1, value1, splat1) {
      var message, token;
      super();
      this.name = name1;
      this.value = value1;
      this.splat = splat1;
      message = isUnassignable(this.name.unwrapAll().value);
      if (message) {
        this.name.error(message);
      }
      if (this.name instanceof Obj && this.name.generated) {
        token = this.name.objects[0].operatorToken;
        token.error(`unexpected ${token.value}`);
      }
    }

    compileToFragments(o) {
      return this.name.compileToFragments(o, LEVEL_LIST);
    }

    compileToFragmentsWithoutComments(o) {
      return this.name.compileToFragmentsWithoutComments(o, LEVEL_LIST);
    }

    asReference(o) {
      var name, node;
      if (this.reference) {
        return this.reference;
      }
      node = this.name;
      if (node.this) {
        name = node.properties[0].name.value;
        if (indexOf.call(JS_FORBIDDEN, name) >= 0) {
          name = `_${name}`;
        }
        node = new IdentifierLiteral(o.scope.freeVariable(name));
      } else if (node.shouldCache()) {
        node = new IdentifierLiteral(o.scope.freeVariable('arg'));
      }
      node = new Value(node);
      node.updateLocationDataIfMissing(this.locationData);
      return this.reference = node;
    }

    shouldCache() {
      return this.name.shouldCache();
    }

    // Iterates the name or names of a `Param`.
    // In a sense, a destructured parameter represents multiple JS parameters. This
    // method allows to iterate them all.
    // The `iterator` function will be called as `iterator(name, node)` where
    // `name` is the name of the parameter and `node` is the AST node corresponding
    // to that name.
    eachName(iterator, name = this.name) {
      var atParam, checkAssignabilityOfLiteral, j, len1, nObj, node, obj, ref1, ref2;
      checkAssignabilityOfLiteral = function(literal) {
        var message;
        message = isUnassignable(literal.value);
        if (message) {
          literal.error(message);
        }
        if (!literal.isAssignable()) {
          return literal.error(`'${literal.value}' can't be assigned`);
        }
      };
      atParam = (obj, originalObj = null) => {
        return iterator(`@${obj.properties[0].name.value}`, obj, this, originalObj);
      };
      if (name instanceof Call) {
        name.error("Function invocation can't be assigned");
      }
      // * simple literals `foo`
      if (name instanceof Literal) {
        checkAssignabilityOfLiteral(name);
        return iterator(name.value, name, this);
      }
      if (name instanceof Value) {
        // * at-params `@foo`
        return atParam(name);
      }
      ref2 = (ref1 = name.objects) != null ? ref1 : [];
      for (j = 0, len1 = ref2.length; j < len1; j++) {
        obj = ref2[j];
        // Save original obj.
        nObj = obj;
        // * destructured parameter with default value
        if (obj instanceof Assign && (obj.context == null)) {
          obj = obj.variable;
        }
        // * assignments within destructured parameters `{foo:bar}`
        if (obj instanceof Assign) {
          // ... possibly with a default value
          if (obj.value instanceof Assign) {
            obj = obj.value.variable;
          } else {
            obj = obj.value;
          }
          this.eachName(iterator, obj.unwrap());
        // * splats within destructured parameters `[xs...]`
        } else if (obj instanceof Splat) {
          node = obj.name.unwrap();
          iterator(node.value, node, this);
        } else if (obj instanceof Value) {
          // * destructured parameters within destructured parameters `[{a}]`
          if (obj.isArray() || obj.isObject()) {
            this.eachName(iterator, obj.base);
          // * at-params within destructured parameters `{@foo}`
          } else if (obj.this) {
            atParam(obj, nObj);
          } else {
            // * simple destructured parameters {foo}
            checkAssignabilityOfLiteral(obj.base);
            iterator(obj.base.value, obj.base, this);
          }
        } else if (obj instanceof Elision) {
          obj;
        } else if (!(obj instanceof Expansion)) {
          obj.error(`illegal parameter ${obj.compile()}`);
        }
      }
    }

    // Rename a param by replacing the given AST node for a name with a new node.
    // This needs to ensure that the the source for object destructuring does not change.
    renameParam(node, newNode) {
      var isNode, replacement;
      isNode = function(candidate) {
        return candidate === node;
      };
      replacement = (node, parent) => {
        var key;
        if (parent instanceof Obj) {
          key = node;
          if (node.this) {
            key = node.properties[0].name;
          }
          // No need to assign a new variable for the destructured variable if the variable isn't reserved.
          // Examples:
          // `({@foo}) ->`  should compile to `({foo}) { this.foo = foo}`
          // `foo = 1; ({@foo}) ->` should compile to `foo = 1; ({foo:foo1}) { this.foo = foo1 }`
          if (node.this && key.value === newNode.value) {
            return new Value(newNode);
          } else {
            return new Assign(new Value(key), newNode, 'object');
          }
        } else {
          return newNode;
        }
      };
      return this.replaceInContext(isNode, replacement);
    }

  };

  Param.prototype.children = ['name', 'value'];

  return Param;

}).call(this);

//### Splat

// A splat, either as a parameter to a function, an argument to a call,
// or as part of a destructuring assignment.
exports.Splat = Splat = (function() {
  class Splat extends Base {
    constructor(name, {
        lhs: lhs1,
        postfix: postfix = true
      } = {}) {
      super();
      this.lhs = lhs1;
      this.postfix = postfix;
      this.name = name.compile ? name : new Literal(name);
    }

    shouldCache() {
      return false;
    }

    isAssignable({allowComplexSplat = false} = {}) {
      if (this.name instanceof Obj || this.name instanceof Parens) {
        return allowComplexSplat;
      }
      return this.name.isAssignable() && (!this.name.isAtomic || this.name.isAtomic());
    }

    assigns(name) {
      return this.name.assigns(name);
    }

    compileNode(o) {
      var compiledSplat;
      compiledSplat = [this.makeCode('...'), ...this.name.compileToFragments(o, LEVEL_OP)];
      if (!this.jsx) {
        return compiledSplat;
      }
      return [this.makeCode('{'), ...compiledSplat, this.makeCode('}')];
    }

    unwrap() {
      return this.name;
    }

    propagateLhs(setLhs) {
      var base1;
      if (setLhs) {
        this.lhs = true;
      }
      if (!this.lhs) {
        return;
      }
      return typeof (base1 = this.name).propagateLhs === "function" ? base1.propagateLhs(true) : void 0;
    }

    astType() {
      if (this.jsx) {
        return 'JSXSpreadAttribute';
      } else if (this.lhs) {
        return 'RestElement';
      } else {
        return 'SpreadElement';
      }
    }

    astProperties(o) {
      return {
        argument: this.name.ast(o, LEVEL_OP),
        postfix: this.postfix
      };
    }

  };

  Splat.prototype.children = ['name'];

  return Splat;

}).call(this);

//### Expansion

// Used to skip values inside an array destructuring (pattern matching) or
// parameter list.
exports.Expansion = Expansion = (function() {
  class Expansion extends Base {
    compileNode(o) {
      return this.throwLhsError();
    }

    asReference(o) {
      return this;
    }

    eachName(iterator) {}

    throwLhsError() {
      return this.error('Expansion must be used inside a destructuring assignment or parameter list');
    }

    astNode(o) {
      if (!this.lhs) {
        this.throwLhsError();
      }
      return super.astNode(o);
    }

    astType() {
      return 'RestElement';
    }

    astProperties() {
      return {
        argument: null
      };
    }

  };

  Expansion.prototype.shouldCache = NO;

  return Expansion;

}).call(this);

//### Elision

// Array elision element (for example, [,a, , , b, , c, ,]).
exports.Elision = Elision = (function() {
  class Elision extends Base {
    compileToFragments(o, level) {
      var fragment;
      fragment = super.compileToFragments(o, level);
      fragment.isElision = true;
      return fragment;
    }

    compileNode(o) {
      return [this.makeCode(', ')];
    }

    asReference(o) {
      return this;
    }

    eachName(iterator) {}

    astNode() {
      return null;
    }

  };

  Elision.prototype.isAssignable = YES;

  Elision.prototype.shouldCache = NO;

  return Elision;

}).call(this);

//### While

// A while loop, the only sort of low-level loop exposed by CoffeeScript. From
// it, all other loops can be manufactured. Useful in cases where you need more
// flexibility or more speed than a comprehension can provide.
exports.While = While = (function() {
  class While extends Base {
    constructor(condition1, {
        invert: inverted,
        guard,
        isLoop
      } = {}) {
      super();
      this.condition = condition1;
      this.inverted = inverted;
      this.guard = guard;
      this.isLoop = isLoop;
    }

    makeReturn(results, mark) {
      if (results) {
        return super.makeReturn(results, mark);
      }
      this.returns = !this.jumps();
      if (mark) {
        if (this.returns) {
          this.body.makeReturn(results, mark);
        }
        return;
      }
      return this;
    }

    addBody(body1) {
      this.body = body1;
      return this;
    }

    jumps() {
      var expressions, j, jumpNode, len1, node;
      ({expressions} = this.body);
      if (!expressions.length) {
        return false;
      }
      for (j = 0, len1 = expressions.length; j < len1; j++) {
        node = expressions[j];
        if (jumpNode = node.jumps({
          loop: true
        })) {
          return jumpNode;
        }
      }
      return false;
    }

    // The main difference from a JavaScript *while* is that the CoffeeScript
    // *while* can be used as a part of a larger expression -- while loops may
    // return an array containing the computed result of each iteration.
    compileNode(o) {
      var answer, body, rvar, set;
      o.indent += TAB;
      set = '';
      ({body} = this);
      if (body.isEmpty()) {
        body = this.makeCode('');
      } else {
        if (this.returns) {
          body.makeReturn(rvar = o.scope.freeVariable('results'));
          set = `${this.tab}${rvar} = [];\n`;
        }
        if (this.guard) {
          if (body.expressions.length > 1) {
            body.expressions.unshift(new If((new Parens(this.guard)).invert(), new StatementLiteral("continue")));
          } else {
            if (this.guard) {
              body = Block.wrap([new If(this.guard, body)]);
            }
          }
        }
        body = [].concat(this.makeCode("\n"), body.compileToFragments(o, LEVEL_TOP), this.makeCode(`\n${this.tab}`));
      }
      answer = [].concat(this.makeCode(set + this.tab + "while ("), this.processedCondition().compileToFragments(o, LEVEL_PAREN), this.makeCode(") {"), body, this.makeCode("}"));
      if (this.returns) {
        answer.push(this.makeCode(`\n${this.tab}return ${rvar};`));
      }
      return answer;
    }

    processedCondition() {
      return this.processedConditionCache != null ? this.processedConditionCache : this.processedConditionCache = this.inverted ? this.condition.invert() : this.condition;
    }

    astType() {
      return 'WhileStatement';
    }

    astProperties(o) {
      var ref1, ref2;
      return {
        test: this.condition.ast(o, LEVEL_PAREN),
        body: this.body.ast(o, LEVEL_TOP),
        guard: (ref1 = (ref2 = this.guard) != null ? ref2.ast(o) : void 0) != null ? ref1 : null,
        inverted: !!this.inverted,
        postfix: !!this.postfix,
        loop: !!this.isLoop
      };
    }

  };

  While.prototype.children = ['condition', 'guard', 'body'];

  While.prototype.isStatement = YES;

  return While;

}).call(this);

//### Op

// Simple Arithmetic and logical operations. Performs some conversion from
// CoffeeScript operations into their JavaScript equivalents.
exports.Op = Op = (function() {
  var CONVERSIONS, INVERSIONS;

  class Op extends Base {
    constructor(op, first, second, flip, {invertOperator, originalOperator: originalOperator = op} = {}) {
      var call, firstCall, message, ref1, unwrapped;
      super();
      this.invertOperator = invertOperator;
      this.originalOperator = originalOperator;
      if (op === 'new') {
        if (((firstCall = unwrapped = first.unwrap()) instanceof Call || (firstCall = unwrapped.base) instanceof Call) && !firstCall.do && !firstCall.isNew) {
          return new Value(firstCall.newInstance(), firstCall === unwrapped ? [] : unwrapped.properties);
        }
        if (!(first instanceof Parens || first.unwrap() instanceof IdentifierLiteral || (typeof first.hasProperties === "function" ? first.hasProperties() : void 0))) {
          first = new Parens(first);
        }
        call = new Call(first, []);
        call.locationData = this.locationData;
        call.isNew = true;
        return call;
      }
      this.operator = CONVERSIONS[op] || op;
      this.first = first;
      this.second = second;
      this.flip = !!flip;
      if ((ref1 = this.operator) === '--' || ref1 === '++') {
        message = isUnassignable(this.first.unwrapAll().value);
        if (message) {
          this.first.error(message);
        }
      }
      return this;
    }

    isNumber() {
      var ref1;
      return this.isUnary() && ((ref1 = this.operator) === '+' || ref1 === '-') && this.first instanceof Value && this.first.isNumber();
    }

    isAwait() {
      return this.operator === 'await';
    }

    isYield() {
      var ref1;
      return (ref1 = this.operator) === 'yield' || ref1 === 'yield*';
    }

    isUnary() {
      return !this.second;
    }

    shouldCache() {
      return !this.isNumber();
    }

    // Am I capable of
    // [Python-style comparison chaining](https://docs.python.org/3/reference/expressions.html#not-in)?
    isChainable() {
      var ref1;
      return (ref1 = this.operator) === '<' || ref1 === '>' || ref1 === '>=' || ref1 === '<=' || ref1 === '===' || ref1 === '!==';
    }

    isChain() {
      return this.isChainable() && this.first.isChainable();
    }

    invert() {
      var allInvertable, curr, fst, op, ref1;
      if (this.isInOperator()) {
        this.invertOperator = '!';
        return this;
      }
      if (this.isChain()) {
        allInvertable = true;
        curr = this;
        while (curr && curr.operator) {
          allInvertable && (allInvertable = curr.operator in INVERSIONS);
          curr = curr.first;
        }
        if (!allInvertable) {
          return new Parens(this).invert();
        }
        curr = this;
        while (curr && curr.operator) {
          curr.invert = !curr.invert;
          curr.operator = INVERSIONS[curr.operator];
          curr = curr.first;
        }
        return this;
      } else if (op = INVERSIONS[this.operator]) {
        this.operator = op;
        if (this.first.unwrap() instanceof Op) {
          this.first.invert();
        }
        return this;
      } else if (this.second) {
        return new Parens(this).invert();
      } else if (this.operator === '!' && (fst = this.first.unwrap()) instanceof Op && ((ref1 = fst.operator) === '!' || ref1 === 'in' || ref1 === 'instanceof')) {
        return fst;
      } else {
        return new Op('!', this);
      }
    }

    unfoldSoak(o) {
      var ref1;
      return ((ref1 = this.operator) === '++' || ref1 === '--' || ref1 === 'delete') && unfoldSoak(o, this, 'first');
    }

    generateDo(exp) {
      var call, func, j, len1, param, passedParams, ref, ref1;
      passedParams = [];
      func = exp instanceof Assign && (ref = exp.value.unwrap()) instanceof Code ? ref : exp;
      ref1 = func.params || [];
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        param = ref1[j];
        if (param.value) {
          passedParams.push(param.value);
          delete param.value;
        } else {
          passedParams.push(param);
        }
      }
      call = new Call(exp, passedParams);
      call.do = true;
      return call;
    }

    isInOperator() {
      return this.originalOperator === 'in';
    }

    compileNode(o) {
      var answer, inNode, isChain, lhs, rhs;
      if (this.isInOperator()) {
        inNode = new In(this.first, this.second);
        return (this.invertOperator ? inNode.invert() : inNode).compileNode(o);
      }
      if (this.invertOperator) {
        this.invertOperator = null;
        return this.invert().compileNode(o);
      }
      if (this.operator === 'do') {
        return Op.prototype.generateDo(this.first).compileNode(o);
      }
      isChain = this.isChain();
      if (!isChain) {
        // In chains, there's no need to wrap bare obj literals in parens,
        // as the chained expression is wrapped.
        this.first.front = this.front;
      }
      this.checkDeleteOperand(o);
      if (this.isYield() || this.isAwait()) {
        return this.compileContinuation(o);
      }
      if (this.isUnary()) {
        return this.compileUnary(o);
      }
      if (isChain) {
        return this.compileChain(o);
      }
      switch (this.operator) {
        case '?':
          return this.compileExistence(o, this.second.isDefaultValue);
        case '//':
          return this.compileFloorDivision(o);
        case '%%':
          return this.compileModulo(o);
        default:
          lhs = this.first.compileToFragments(o, LEVEL_OP);
          rhs = this.second.compileToFragments(o, LEVEL_OP);
          answer = [].concat(lhs, this.makeCode(` ${this.operator} `), rhs);
          if (o.level <= LEVEL_OP) {
            return answer;
          } else {
            return this.wrapInParentheses(answer);
          }
      }
    }

    // Mimic Python's chained comparisons when multiple comparison operators are
    // used sequentially. For example:

    //     bin/coffee -e 'console.log 50 < 65 > 10'
    //     true
    compileChain(o) {
      var fragments, fst, shared;
      [this.first.second, shared] = this.first.second.cache(o);
      fst = this.first.compileToFragments(o, LEVEL_OP);
      fragments = fst.concat(this.makeCode(` ${this.invert ? '&&' : '||'} `), shared.compileToFragments(o), this.makeCode(` ${this.operator} `), this.second.compileToFragments(o, LEVEL_OP));
      return this.wrapInParentheses(fragments);
    }

    // Keep reference to the left expression, unless this an existential assignment
    compileExistence(o, checkOnlyUndefined) {
      var fst, ref;
      if (this.first.shouldCache()) {
        ref = new IdentifierLiteral(o.scope.freeVariable('ref'));
        fst = new Parens(new Assign(ref, this.first));
      } else {
        fst = this.first;
        ref = fst;
      }
      return new If(new Existence(fst, checkOnlyUndefined), ref, {
        type: 'if'
      }).addElse(this.second).compileToFragments(o);
    }

    // Compile a unary **Op**.
    compileUnary(o) {
      var op, parts, plusMinus;
      parts = [];
      op = this.operator;
      parts.push([this.makeCode(op)]);
      if (op === '!' && this.first instanceof Existence) {
        this.first.negated = !this.first.negated;
        return this.first.compileToFragments(o);
      }
      if (o.level >= LEVEL_ACCESS) {
        return (new Parens(this)).compileToFragments(o);
      }
      plusMinus = op === '+' || op === '-';
      if ((op === 'typeof' || op === 'delete') || plusMinus && this.first instanceof Op && this.first.operator === op) {
        parts.push([this.makeCode(' ')]);
      }
      if (plusMinus && this.first instanceof Op) {
        this.first = new Parens(this.first);
      }
      parts.push(this.first.compileToFragments(o, LEVEL_OP));
      if (this.flip) {
        parts.reverse();
      }
      return this.joinFragmentArrays(parts, '');
    }

    compileContinuation(o) {
      var op, parts, ref1;
      parts = [];
      op = this.operator;
      if (!this.isAwait()) {
        this.checkContinuation(o);
      }
      if (indexOf.call(Object.keys(this.first), 'expression') >= 0 && !(this.first instanceof Throw)) {
        if (this.first.expression != null) {
          parts.push(this.first.expression.compileToFragments(o, LEVEL_OP));
        }
      } else {
        if (o.level >= LEVEL_PAREN) {
          parts.push([this.makeCode("(")]);
        }
        parts.push([this.makeCode(op)]);
        if (((ref1 = this.first.base) != null ? ref1.value : void 0) !== '') {
          parts.push([this.makeCode(" ")]);
        }
        parts.push(this.first.compileToFragments(o, LEVEL_OP));
        if (o.level >= LEVEL_PAREN) {
          parts.push([this.makeCode(")")]);
        }
      }
      return this.joinFragmentArrays(parts, '');
    }

    checkContinuation(o) {
      var ref1;
      if (o.scope.parent == null) {
        this.error(`${this.operator} can only occur inside functions`);
      }
      if (((ref1 = o.scope.method) != null ? ref1.bound : void 0) && o.scope.method.isGenerator) {
        return this.error('yield cannot occur inside bound (fat arrow) functions');
      }
    }

    compileFloorDivision(o) {
      var div, floor, second;
      floor = new Value(new IdentifierLiteral('Math'), [new Access(new PropertyName('floor'))]);
      second = this.second.shouldCache() ? new Parens(this.second) : this.second;
      div = new Op('/', this.first, second);
      return new Call(floor, [div]).compileToFragments(o);
    }

    compileModulo(o) {
      var mod;
      mod = new Value(new Literal(utility('modulo', o)));
      return new Call(mod, [this.first, this.second]).compileToFragments(o);
    }

    toString(idt) {
      return super.toString(idt, this.constructor.name + ' ' + this.operator);
    }

    checkDeleteOperand(o) {
      if (this.operator === 'delete' && o.scope.check(this.first.unwrapAll().value)) {
        return this.error('delete operand may not be argument or var');
      }
    }

    astNode(o) {
      if (this.isYield()) {
        this.checkContinuation(o);
      }
      this.checkDeleteOperand(o);
      return super.astNode(o);
    }

    astType() {
      if (this.isAwait()) {
        return 'AwaitExpression';
      }
      if (this.isYield()) {
        return 'YieldExpression';
      }
      if (this.isChain()) {
        return 'ChainedComparison';
      }
      switch (this.operator) {
        case '||':
        case '&&':
        case '?':
          return 'LogicalExpression';
        case '++':
        case '--':
          return 'UpdateExpression';
        default:
          if (this.isUnary()) {
            return 'UnaryExpression';
          } else {
            return 'BinaryExpression';
          }
      }
    }

    operatorAst() {
      return `${this.invertOperator ? `${this.invertOperator} ` : ''}${this.originalOperator}`;
    }

    chainAstProperties(o) {
      var currentOp, operand, operands, operators;
      operators = [this.operatorAst()];
      operands = [this.second];
      currentOp = this.first;
      while (true) {
        operators.unshift(currentOp.operatorAst());
        operands.unshift(currentOp.second);
        currentOp = currentOp.first;
        if (!currentOp.isChainable()) {
          operands.unshift(currentOp);
          break;
        }
      }
      return {
        operators,
        operands: (function() {
          var j, len1, results1;
          results1 = [];
          for (j = 0, len1 = operands.length; j < len1; j++) {
            operand = operands[j];
            results1.push(operand.ast(o, LEVEL_OP));
          }
          return results1;
        })()
      };
    }

    astProperties(o) {
      var argument, firstAst, operatorAst, ref1, secondAst;
      if (this.isChain()) {
        return this.chainAstProperties(o);
      }
      firstAst = this.first.ast(o, LEVEL_OP);
      secondAst = (ref1 = this.second) != null ? ref1.ast(o, LEVEL_OP) : void 0;
      operatorAst = this.operatorAst();
      switch (false) {
        case !this.isUnary():
          argument = this.isYield() && this.first.unwrap().value === '' ? null : firstAst;
          if (this.isAwait()) {
            return {argument};
          }
          if (this.isYield()) {
            return {
              argument,
              delegate: this.operator === 'yield*'
            };
          }
          return {
            argument,
            operator: operatorAst,
            prefix: !this.flip
          };
        default:
          return {
            left: firstAst,
            right: secondAst,
            operator: operatorAst
          };
      }
    }

  };

  // The map of conversions from CoffeeScript to JavaScript symbols.
  CONVERSIONS = {
    '==': '===',
    '!=': '!==',
    'of': 'in',
    'yieldfrom': 'yield*'
  };

  // The map of invertible operators.
  INVERSIONS = {
    '!==': '===',
    '===': '!=='
  };

  Op.prototype.children = ['first', 'second'];

  return Op;

}).call(this);

//### In
exports.In = In = (function() {
  class In extends Base {
    constructor(object1, array) {
      super();
      this.object = object1;
      this.array = array;
    }

    compileNode(o) {
      var hasSplat, j, len1, obj, ref1;
      if (this.array instanceof Value && this.array.isArray() && this.array.base.objects.length) {
        ref1 = this.array.base.objects;
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          obj = ref1[j];
          if (!(obj instanceof Splat)) {
            continue;
          }
          hasSplat = true;
          break;
        }
        if (!hasSplat) {
          // `compileOrTest` only if we have an array literal with no splats
          return this.compileOrTest(o);
        }
      }
      return this.compileLoopTest(o);
    }

    compileOrTest(o) {
      var cmp, cnj, i, item, j, len1, ref, ref1, sub, tests;
      [sub, ref] = this.object.cache(o, LEVEL_OP);
      [cmp, cnj] = this.negated ? [' !== ', ' && '] : [' === ', ' || '];
      tests = [];
      ref1 = this.array.base.objects;
      for (i = j = 0, len1 = ref1.length; j < len1; i = ++j) {
        item = ref1[i];
        if (i) {
          tests.push(this.makeCode(cnj));
        }
        tests = tests.concat((i ? ref : sub), this.makeCode(cmp), item.compileToFragments(o, LEVEL_ACCESS));
      }
      if (o.level < LEVEL_OP) {
        return tests;
      } else {
        return this.wrapInParentheses(tests);
      }
    }

    compileLoopTest(o) {
      var fragments, ref, sub;
      [sub, ref] = this.object.cache(o, LEVEL_LIST);
      fragments = [].concat(this.makeCode(utility('indexOf', o) + ".call("), this.array.compileToFragments(o, LEVEL_LIST), this.makeCode(", "), ref, this.makeCode(") " + (this.negated ? '< 0' : '>= 0')));
      if (fragmentsToText(sub) === fragmentsToText(ref)) {
        return fragments;
      }
      fragments = sub.concat(this.makeCode(', '), fragments);
      if (o.level < LEVEL_LIST) {
        return fragments;
      } else {
        return this.wrapInParentheses(fragments);
      }
    }

    toString(idt) {
      return super.toString(idt, this.constructor.name + (this.negated ? '!' : ''));
    }

  };

  In.prototype.children = ['object', 'array'];

  In.prototype.invert = NEGATE;

  return In;

}).call(this);

//### Try

// A classic *try/catch/finally* block.
exports.Try = Try = (function() {
  class Try extends Base {
    constructor(attempt, _catch, ensure, finallyTag) {
      super();
      this.attempt = attempt;
      this.catch = _catch;
      this.ensure = ensure;
      this.finallyTag = finallyTag;
    }

    jumps(o) {
      var ref1;
      return this.attempt.jumps(o) || ((ref1 = this.catch) != null ? ref1.jumps(o) : void 0);
    }

    makeReturn(results, mark) {
      var ref1, ref2;
      if (mark) {
        if ((ref1 = this.attempt) != null) {
          ref1.makeReturn(results, mark);
        }
        if ((ref2 = this.catch) != null) {
          ref2.makeReturn(results, mark);
        }
        return;
      }
      if (this.attempt) {
        this.attempt = this.attempt.makeReturn(results);
      }
      if (this.catch) {
        this.catch = this.catch.makeReturn(results);
      }
      return this;
    }

    // Compilation is more or less as you would expect -- the *finally* clause
    // is optional, the *catch* is not.
    compileNode(o) {
      var catchPart, ensurePart, generatedErrorVariableName, originalIndent, tryPart;
      originalIndent = o.indent;
      o.indent += TAB;
      tryPart = this.attempt.compileToFragments(o, LEVEL_TOP);
      catchPart = this.catch ? this.catch.compileToFragments(merge(o, {
        indent: originalIndent
      }), LEVEL_TOP) : !(this.ensure || this.catch) ? (generatedErrorVariableName = o.scope.freeVariable('error', {
        reserve: false
      }), [this.makeCode(` catch (${generatedErrorVariableName}) {}`)]) : [];
      ensurePart = this.ensure ? [].concat(this.makeCode(" finally {\n"), this.ensure.compileToFragments(o, LEVEL_TOP), this.makeCode(`\n${this.tab}}`)) : [];
      return [].concat(this.makeCode(`${this.tab}try {\n`), tryPart, this.makeCode(`\n${this.tab}}`), catchPart, ensurePart);
    }

    astType() {
      return 'TryStatement';
    }

    astProperties(o) {
      var ref1, ref2;
      return {
        block: this.attempt.ast(o, LEVEL_TOP),
        handler: (ref1 = (ref2 = this.catch) != null ? ref2.ast(o) : void 0) != null ? ref1 : null,
        // Include `finally` keyword in location data.
        finalizer: this.ensure != null ? Object.assign(this.ensure.ast(o, LEVEL_TOP), mergeAstLocationData(jisonLocationDataToAstLocationData(this.finallyTag.locationData), this.ensure.astLocationData())) : null
      };
    }

  };

  Try.prototype.children = ['attempt', 'catch', 'ensure'];

  Try.prototype.isStatement = YES;

  return Try;

}).call(this);

exports.Catch = Catch = (function() {
  class Catch extends Base {
    constructor(recovery, errorVariable) {
      var base1, ref1;
      super();
      this.recovery = recovery;
      this.errorVariable = errorVariable;
      if ((ref1 = this.errorVariable) != null) {
        if (typeof (base1 = ref1.unwrap()).propagateLhs === "function") {
          base1.propagateLhs(true);
        }
      }
    }

    jumps(o) {
      return this.recovery.jumps(o);
    }

    makeReturn(results, mark) {
      var ret;
      ret = this.recovery.makeReturn(results, mark);
      if (mark) {
        return;
      }
      this.recovery = ret;
      return this;
    }

    compileNode(o) {
      var generatedErrorVariableName, placeholder;
      o.indent += TAB;
      generatedErrorVariableName = o.scope.freeVariable('error', {
        reserve: false
      });
      placeholder = new IdentifierLiteral(generatedErrorVariableName);
      this.checkUnassignable();
      if (this.errorVariable) {
        this.recovery.unshift(new Assign(this.errorVariable, placeholder));
      }
      return [].concat(this.makeCode(" catch ("), placeholder.compileToFragments(o), this.makeCode(") {\n"), this.recovery.compileToFragments(o, LEVEL_TOP), this.makeCode(`\n${this.tab}}`));
    }

    checkUnassignable() {
      var message;
      if (this.errorVariable) {
        message = isUnassignable(this.errorVariable.unwrapAll().value);
        if (message) {
          return this.errorVariable.error(message);
        }
      }
    }

    astNode(o) {
      var ref1;
      this.checkUnassignable();
      if ((ref1 = this.errorVariable) != null) {
        ref1.eachName(function(name) {
          var alreadyDeclared;
          alreadyDeclared = o.scope.find(name.value);
          return name.isDeclaration = !alreadyDeclared;
        });
      }
      return super.astNode(o);
    }

    astType() {
      return 'CatchClause';
    }

    astProperties(o) {
      var ref1, ref2;
      return {
        param: (ref1 = (ref2 = this.errorVariable) != null ? ref2.ast(o) : void 0) != null ? ref1 : null,
        body: this.recovery.ast(o, LEVEL_TOP)
      };
    }

  };

  Catch.prototype.children = ['recovery', 'errorVariable'];

  Catch.prototype.isStatement = YES;

  return Catch;

}).call(this);

//### Throw

// Simple node to throw an exception.
exports.Throw = Throw = (function() {
  class Throw extends Base {
    constructor(expression1) {
      super();
      this.expression = expression1;
    }

    compileNode(o) {
      var fragments;
      fragments = this.expression.compileToFragments(o, LEVEL_LIST);
      unshiftAfterComments(fragments, this.makeCode('throw '));
      fragments.unshift(this.makeCode(this.tab));
      fragments.push(this.makeCode(';'));
      return fragments;
    }

    astType() {
      return 'ThrowStatement';
    }

    astProperties(o) {
      return {
        argument: this.expression.ast(o, LEVEL_LIST)
      };
    }

  };

  Throw.prototype.children = ['expression'];

  Throw.prototype.isStatement = YES;

  Throw.prototype.jumps = NO;

  // A **Throw** is already a return, of sorts...
  Throw.prototype.makeReturn = THIS;

  return Throw;

}).call(this);

//### Existence

// Checks a variable for existence -- not `null` and not `undefined`. This is
// similar to `.nil?` in Ruby, and avoids having to consult a JavaScript truth
// table. Optionally only check if a variable is not `undefined`.
exports.Existence = Existence = (function() {
  class Existence extends Base {
    constructor(expression1, onlyNotUndefined = false) {
      var salvagedComments;
      super();
      this.expression = expression1;
      this.comparisonTarget = onlyNotUndefined ? 'undefined' : 'null';
      salvagedComments = [];
      this.expression.traverseChildren(true, function(child) {
        var comment, j, len1, ref1;
        if (child.comments) {
          ref1 = child.comments;
          for (j = 0, len1 = ref1.length; j < len1; j++) {
            comment = ref1[j];
            if (indexOf.call(salvagedComments, comment) < 0) {
              salvagedComments.push(comment);
            }
          }
          return delete child.comments;
        }
      });
      attachCommentsToNode(salvagedComments, this);
      moveComments(this.expression, this);
    }

    compileNode(o) {
      var cmp, cnj, code;
      this.expression.front = this.front;
      code = this.expression.compile(o, LEVEL_OP);
      if (this.expression.unwrap() instanceof IdentifierLiteral && !o.scope.check(code)) {
        [cmp, cnj] = this.negated ? ['===', '||'] : ['!==', '&&'];
        code = `typeof ${code} ${cmp} \"undefined\"` + (this.comparisonTarget !== 'undefined' ? ` ${cnj} ${code} ${cmp} ${this.comparisonTarget}` : '');
      } else {
        // We explicity want to use loose equality (`==`) when comparing against `null`,
        // so that an existence check roughly corresponds to a check for truthiness.
        // Do *not* change this to `===` for `null`, as this will break mountains of
        // existing code. When comparing only against `undefined`, however, we want to
        // use `===` because this use case is for parity with ES2015+ default values,
        // which only get assigned when the variable is `undefined` (but not `null`).
        cmp = this.comparisonTarget === 'null' ? this.negated ? '==' : '!=' : this.negated ? '===' : '!=='; // `undefined`
        code = `${code} ${cmp} ${this.comparisonTarget}`;
      }
      return [this.makeCode(o.level <= LEVEL_COND ? code : `(${code})`)];
    }

    astType() {
      return 'UnaryExpression';
    }

    astProperties(o) {
      return {
        argument: this.expression.ast(o),
        operator: '?',
        prefix: false
      };
    }

  };

  Existence.prototype.children = ['expression'];

  Existence.prototype.invert = NEGATE;

  return Existence;

}).call(this);

//### Parens

// An extra set of parentheses, specified explicitly in the source. At one time
// we tried to clean up the results by detecting and removing redundant
// parentheses, but no longer -- you can put in as many as you please.

// Parentheses are a good way to force any statement to become an expression.
exports.Parens = Parens = (function() {
  class Parens extends Base {
    constructor(body1) {
      super();
      this.body = body1;
    }

    unwrap() {
      return this.body;
    }

    shouldCache() {
      return this.body.shouldCache();
    }

    compileNode(o) {
      var bare, expr, fragments, ref1, shouldWrapComment;
      expr = this.body.unwrap();
      // If these parentheses are wrapping an `IdentifierLiteral` followed by a
      // block comment, output the parentheses (or put another way, don’t optimize
      // away these redundant parentheses). This is because Flow requires
      // parentheses in certain circumstances to distinguish identifiers followed
      // by comment-based type annotations from JavaScript labels.
      shouldWrapComment = (ref1 = expr.comments) != null ? ref1.some(function(comment) {
        return comment.here && !comment.unshift && !comment.newLine;
      }) : void 0;
      if (expr instanceof Value && expr.isAtomic() && !this.jsxAttribute && !shouldWrapComment) {
        expr.front = this.front;
        return expr.compileToFragments(o);
      }
      fragments = expr.compileToFragments(o, LEVEL_PAREN);
      bare = o.level < LEVEL_OP && !shouldWrapComment && (expr instanceof Op && !expr.isInOperator() || expr.unwrap() instanceof Call || (expr instanceof For && expr.returns)) && (o.level < LEVEL_COND || fragments.length <= 3);
      if (this.jsxAttribute) {
        return this.wrapInBraces(fragments);
      }
      if (bare) {
        return fragments;
      } else {
        return this.wrapInParentheses(fragments);
      }
    }

    astNode(o) {
      return this.body.unwrap().ast(o, LEVEL_PAREN);
    }

  };

  Parens.prototype.children = ['body'];

  return Parens;

}).call(this);

//### StringWithInterpolations
exports.StringWithInterpolations = StringWithInterpolations = (function() {
  class StringWithInterpolations extends Base {
    constructor(body1, {quote, startQuote, jsxAttribute} = {}) {
      super();
      this.body = body1;
      this.quote = quote;
      this.startQuote = startQuote;
      this.jsxAttribute = jsxAttribute;
    }

    static fromStringLiteral(stringLiteral) {
      var updatedString, updatedStringValue;
      updatedString = stringLiteral.withoutQuotesInLocationData();
      updatedStringValue = new Value(updatedString).withLocationDataFrom(updatedString);
      return new StringWithInterpolations(Block.wrap([updatedStringValue]), {
        quote: stringLiteral.quote,
        jsxAttribute: stringLiteral.jsxAttribute
      }).withLocationDataFrom(stringLiteral);
    }

    // `unwrap` returns `this` to stop ancestor nodes reaching in to grab @body,
    // and using @body.compileNode. `StringWithInterpolations.compileNode` is
    // _the_ custom logic to output interpolated strings as code.
    unwrap() {
      return this;
    }

    shouldCache() {
      return this.body.shouldCache();
    }

    extractElements(o, {includeInterpolationWrappers, isJsx} = {}) {
      var elements, expr, salvagedComments;
      // Assumes that `expr` is `Block`
      expr = this.body.unwrap();
      elements = [];
      salvagedComments = [];
      expr.traverseChildren(false, (node) => {
        var comment, commentPlaceholder, empty, j, k, len1, len2, ref1, ref2, ref3, unwrapped;
        if (node instanceof StringLiteral) {
          if (node.comments) {
            salvagedComments.push(...node.comments);
            delete node.comments;
          }
          elements.push(node);
          return true;
        } else if (node instanceof Interpolation) {
          if (salvagedComments.length !== 0) {
            for (j = 0, len1 = salvagedComments.length; j < len1; j++) {
              comment = salvagedComments[j];
              comment.unshift = true;
              comment.newLine = true;
            }
            attachCommentsToNode(salvagedComments, node);
          }
          if ((unwrapped = (ref1 = node.expression) != null ? ref1.unwrapAll() : void 0) instanceof PassthroughLiteral && unwrapped.generated && !(isJsx && o.compiling)) {
            if (o.compiling) {
              commentPlaceholder = new StringLiteral('').withLocationDataFrom(node);
              commentPlaceholder.comments = unwrapped.comments;
              if (node.comments) {
                (commentPlaceholder.comments != null ? commentPlaceholder.comments : commentPlaceholder.comments = []).push(...node.comments);
              }
              elements.push(new Value(commentPlaceholder));
            } else {
              empty = new Interpolation().withLocationDataFrom(node);
              empty.comments = node.comments;
              elements.push(empty);
            }
          } else if (node.expression || includeInterpolationWrappers) {
            if (node.comments) {
              ((ref2 = node.expression) != null ? ref2.comments != null ? ref2.comments : ref2.comments = [] : void 0).push(...node.comments);
            }
            elements.push(includeInterpolationWrappers ? node : node.expression);
          }
          return false;
        } else if (node.comments) {
          // This node is getting discarded, but salvage its comments.
          if (elements.length !== 0 && !(elements[elements.length - 1] instanceof StringLiteral)) {
            ref3 = node.comments;
            for (k = 0, len2 = ref3.length; k < len2; k++) {
              comment = ref3[k];
              comment.unshift = false;
              comment.newLine = true;
            }
            attachCommentsToNode(node.comments, elements[elements.length - 1]);
          } else {
            salvagedComments.push(...node.comments);
          }
          delete node.comments;
        }
        return true;
      });
      return elements;
    }

    compileNode(o) {
      var code, element, elements, fragments, j, len1, ref1, unquotedElementValue, wrapped;
      if (this.comments == null) {
        this.comments = (ref1 = this.startQuote) != null ? ref1.comments : void 0;
      }
      if (this.jsxAttribute) {
        wrapped = new Parens(new StringWithInterpolations(this.body));
        wrapped.jsxAttribute = true;
        return wrapped.compileNode(o);
      }
      elements = this.extractElements(o, {
        isJsx: this.jsx
      });
      fragments = [];
      if (!this.jsx) {
        fragments.push(this.makeCode('`'));
      }
      for (j = 0, len1 = elements.length; j < len1; j++) {
        element = elements[j];
        if (element instanceof StringLiteral) {
          unquotedElementValue = this.jsx ? element.unquotedValueForJSX : element.unquotedValueForTemplateLiteral;
          fragments.push(this.makeCode(unquotedElementValue));
        } else {
          if (!this.jsx) {
            fragments.push(this.makeCode('$'));
          }
          code = element.compileToFragments(o, LEVEL_PAREN);
          if (!this.isNestedTag(element) || code.some(function(fragment) {
            var ref2;
            return (ref2 = fragment.comments) != null ? ref2.some(function(comment) {
              return comment.here === false;
            }) : void 0;
          })) {
            code = this.wrapInBraces(code);
            // Flag the `{` and `}` fragments as having been generated by this
            // `StringWithInterpolations` node, so that `compileComments` knows
            // to treat them as bounds. But the braces are unnecessary if all of
            // the enclosed comments are `/* */` comments. Don’t trust
            // `fragment.type`, which can report minified variable names when
            // this compiler is minified.
            code[0].isStringWithInterpolations = true;
            code[code.length - 1].isStringWithInterpolations = true;
          }
          fragments.push(...code);
        }
      }
      if (!this.jsx) {
        fragments.push(this.makeCode('`'));
      }
      return fragments;
    }

    isNestedTag(element) {
      var call;
      call = typeof element.unwrapAll === "function" ? element.unwrapAll() : void 0;
      return this.jsx && call instanceof JSXElement;
    }

    astType() {
      return 'TemplateLiteral';
    }

    astProperties(o) {
      var element, elements, emptyInterpolation, expression, expressions, index, j, last, len1, node, quasis;
      elements = this.extractElements(o, {
        includeInterpolationWrappers: true
      });
      [last] = slice1.call(elements, -1);
      quasis = [];
      expressions = [];
      for (index = j = 0, len1 = elements.length; j < len1; index = ++j) {
        element = elements[index];
        if (element instanceof StringLiteral) {
          quasis.push(new TemplateElement(element.originalValue, {
            tail: element === last
          }).withLocationDataFrom(element).ast(o)); // Interpolation
        } else {
          ({expression} = element);
          node = expression == null ? (emptyInterpolation = new EmptyInterpolation(), emptyInterpolation.locationData = emptyExpressionLocationData({
            interpolationNode: element,
            openingBrace: '#{',
            closingBrace: '}'
          }), emptyInterpolation) : expression.unwrapAll();
          expressions.push(astAsBlockIfNeeded(node, o));
        }
      }
      return {expressions, quasis, quote: this.quote};
    }

  };

  StringWithInterpolations.prototype.children = ['body'];

  return StringWithInterpolations;

}).call(this);

exports.TemplateElement = TemplateElement = class TemplateElement extends Base {
  constructor(value1, {
      tail: tail1
    } = {}) {
    super();
    this.value = value1;
    this.tail = tail1;
  }

  astProperties() {
    return {
      value: {
        raw: this.value
      },
      tail: !!this.tail
    };
  }

};

exports.Interpolation = Interpolation = (function() {
  class Interpolation extends Base {
    constructor(expression1) {
      super();
      this.expression = expression1;
    }

  };

  Interpolation.prototype.children = ['expression'];

  return Interpolation;

}).call(this);

// Represents the contents of an empty interpolation (e.g. `#{}`).
// Only used during AST generation.
exports.EmptyInterpolation = EmptyInterpolation = class EmptyInterpolation extends Base {
  constructor() {
    super();
  }

};

//### For

// CoffeeScript's replacement for the *for* loop is our array and object
// comprehensions, that compile into *for* loops here. They also act as an
// expression, able to return the result of each filtered iteration.

// Unlike Python array comprehensions, they can be multi-line, and you can pass
// the current index of the loop as a second parameter. Unlike Ruby blocks,
// you can map and filter in a single pass.
exports.For = For = (function() {
  class For extends While {
    constructor(body, source) {
      super();
      this.addBody(body);
      this.addSource(source);
    }

    isAwait() {
      var ref1;
      return (ref1 = this.await) != null ? ref1 : false;
    }

    addBody(body) {
      var base1, expressions;
      this.body = Block.wrap([body]);
      ({expressions} = this.body);
      if (expressions.length) {
        if ((base1 = this.body).locationData == null) {
          base1.locationData = mergeLocationData(expressions[0].locationData, expressions[expressions.length - 1].locationData);
        }
      }
      return this;
    }

    addSource(source) {
      var attr, attribs, attribute, base1, j, k, len1, len2, ref1, ref2, ref3, ref4;
      ({source: this.source = false} = source);
      attribs = ["name", "index", "guard", "step", "own", "ownTag", "await", "awaitTag", "object", "from"];
      for (j = 0, len1 = attribs.length; j < len1; j++) {
        attr = attribs[j];
        this[attr] = (ref1 = source[attr]) != null ? ref1 : this[attr];
      }
      if (!this.source) {
        return this;
      }
      if (this.from && this.index) {
        this.index.error('cannot use index with for-from');
      }
      if (this.own && !this.object) {
        this.ownTag.error(`cannot use own with for-${this.from ? 'from' : 'in'}`);
      }
      if (this.object) {
        [this.name, this.index] = [this.index, this.name];
      }
      if (((ref2 = this.index) != null ? typeof ref2.isArray === "function" ? ref2.isArray() : void 0 : void 0) || ((ref3 = this.index) != null ? typeof ref3.isObject === "function" ? ref3.isObject() : void 0 : void 0)) {
        this.index.error('index cannot be a pattern matching expression');
      }
      if (this.await && !this.from) {
        this.awaitTag.error('await must be used with for-from');
      }
      this.range = this.source instanceof Value && this.source.base instanceof Range && !this.source.properties.length && !this.from;
      this.pattern = this.name instanceof Value;
      if (this.pattern) {
        if (typeof (base1 = this.name.unwrap()).propagateLhs === "function") {
          base1.propagateLhs(true);
        }
      }
      if (this.range && this.index) {
        this.index.error('indexes do not apply to range loops');
      }
      if (this.range && this.pattern) {
        this.name.error('cannot pattern match over range loops');
      }
      this.returns = false;
      ref4 = ['source', 'guard', 'step', 'name', 'index'];
      // Move up any comments in the “`for` line”, i.e. the line of code with `for`,
      // from any child nodes of that line up to the `for` node itself so that these
      // comments get output, and get output above the `for` loop.
      for (k = 0, len2 = ref4.length; k < len2; k++) {
        attribute = ref4[k];
        if (!this[attribute]) {
          continue;
        }
        this[attribute].traverseChildren(true, (node) => {
          var comment, l, len3, ref5;
          if (node.comments) {
            ref5 = node.comments;
            for (l = 0, len3 = ref5.length; l < len3; l++) {
              comment = ref5[l];
              // These comments are buried pretty deeply, so if they happen to be
              // trailing comments the line they trail will be unrecognizable when
              // we’re done compiling this `for` loop; so just shift them up to
              // output above the `for` line.
              comment.newLine = comment.unshift = true;
            }
            return moveComments(node, this[attribute]);
          }
        });
        moveComments(this[attribute], this);
      }
      return this;
    }

    // Welcome to the hairiest method in all of CoffeeScript. Handles the inner
    // loop, filtering, stepping, and result saving for array, object, and range
    // comprehensions. Some of the generated code can be shared in common, and
    // some cannot.
    compileNode(o) {
      var body, bodyFragments, compare, compareDown, declare, declareDown, defPart, down, forClose, forCode, forPartFragments, fragments, guardPart, idt1, increment, index, ivar, kvar, kvarAssign, last, lvar, name, namePart, ref, ref1, resultPart, returnResult, rvar, scope, source, step, stepNum, stepVar, svar, varPart;
      body = Block.wrap([this.body]);
      ref1 = body.expressions, [last] = slice1.call(ref1, -1);
      if ((last != null ? last.jumps() : void 0) instanceof Return) {
        this.returns = false;
      }
      source = this.range ? this.source.base : this.source;
      scope = o.scope;
      if (!this.pattern) {
        name = this.name && (this.name.compile(o, LEVEL_LIST));
      }
      index = this.index && (this.index.compile(o, LEVEL_LIST));
      if (name && !this.pattern) {
        scope.find(name);
      }
      if (index && !(this.index instanceof Value)) {
        scope.find(index);
      }
      if (this.returns) {
        rvar = scope.freeVariable('results');
      }
      if (this.from) {
        if (this.pattern) {
          ivar = scope.freeVariable('x', {
            single: true
          });
        }
      } else {
        ivar = (this.object && index) || scope.freeVariable('i', {
          single: true
        });
      }
      kvar = ((this.range || this.from) && name) || index || ivar;
      kvarAssign = kvar !== ivar ? `${kvar} = ` : "";
      if (this.step && !this.range) {
        [step, stepVar] = this.cacheToCodeFragments(this.step.cache(o, LEVEL_LIST, shouldCacheOrIsAssignable));
        if (this.step.isNumber()) {
          stepNum = parseNumber(stepVar);
        }
      }
      if (this.pattern) {
        name = ivar;
      }
      varPart = '';
      guardPart = '';
      defPart = '';
      idt1 = this.tab + TAB;
      if (this.range) {
        forPartFragments = source.compileToFragments(merge(o, {
          index: ivar,
          name,
          step: this.step,
          shouldCache: shouldCacheOrIsAssignable
        }));
      } else {
        svar = this.source.compile(o, LEVEL_LIST);
        if ((name || this.own) && !this.from && !(this.source.unwrap() instanceof IdentifierLiteral)) {
          defPart += `${this.tab}${ref = scope.freeVariable('ref')} = ${svar};\n`;
          svar = ref;
        }
        if (name && !this.pattern && !this.from) {
          namePart = `${name} = ${svar}[${kvar}]`;
        }
        if (!this.object && !this.from) {
          if (step !== stepVar) {
            defPart += `${this.tab}${step};\n`;
          }
          down = stepNum < 0;
          if (!(this.step && (stepNum != null) && down)) {
            lvar = scope.freeVariable('len');
          }
          declare = `${kvarAssign}${ivar} = 0, ${lvar} = ${svar}.length`;
          declareDown = `${kvarAssign}${ivar} = ${svar}.length - 1`;
          compare = `${ivar} < ${lvar}`;
          compareDown = `${ivar} >= 0`;
          if (this.step) {
            if (stepNum != null) {
              if (down) {
                compare = compareDown;
                declare = declareDown;
              }
            } else {
              compare = `${stepVar} > 0 ? ${compare} : ${compareDown}`;
              declare = `(${stepVar} > 0 ? (${declare}) : ${declareDown})`;
            }
            increment = `${ivar} += ${stepVar}`;
          } else {
            increment = `${kvar !== ivar ? `++${ivar}` : `${ivar}++`}`;
          }
          forPartFragments = [this.makeCode(`${declare}; ${compare}; ${kvarAssign}${increment}`)];
        }
      }
      if (this.returns) {
        resultPart = `${this.tab}${rvar} = [];\n`;
        returnResult = `\n${this.tab}return ${rvar};`;
        body.makeReturn(rvar);
      }
      if (this.guard) {
        if (body.expressions.length > 1) {
          body.expressions.unshift(new If((new Parens(this.guard)).invert(), new StatementLiteral("continue")));
        } else {
          if (this.guard) {
            body = Block.wrap([new If(this.guard, body)]);
          }
        }
      }
      if (this.pattern) {
        body.expressions.unshift(new Assign(this.name, this.from ? new IdentifierLiteral(kvar) : new Literal(`${svar}[${kvar}]`)));
      }
      if (namePart) {
        varPart = `\n${idt1}${namePart};`;
      }
      if (this.object) {
        forPartFragments = [this.makeCode(`${kvar} in ${svar}`)];
        if (this.own) {
          guardPart = `\n${idt1}if (!${utility('hasProp', o)}.call(${svar}, ${kvar})) continue;`;
        }
      } else if (this.from) {
        if (this.await) {
          forPartFragments = new Op('await', new Parens(new Literal(`${kvar} of ${svar}`)));
          forPartFragments = forPartFragments.compileToFragments(o, LEVEL_TOP);
        } else {
          forPartFragments = [this.makeCode(`${kvar} of ${svar}`)];
        }
      }
      bodyFragments = body.compileToFragments(merge(o, {
        indent: idt1
      }), LEVEL_TOP);
      if (bodyFragments && bodyFragments.length > 0) {
        bodyFragments = [].concat(this.makeCode('\n'), bodyFragments, this.makeCode('\n'));
      }
      fragments = [this.makeCode(defPart)];
      if (resultPart) {
        fragments.push(this.makeCode(resultPart));
      }
      forCode = this.await ? 'for ' : 'for (';
      forClose = this.await ? '' : ')';
      fragments = fragments.concat(this.makeCode(this.tab), this.makeCode(forCode), forPartFragments, this.makeCode(`${forClose} {${guardPart}${varPart}`), bodyFragments, this.makeCode(this.tab), this.makeCode('}'));
      if (returnResult) {
        fragments.push(this.makeCode(returnResult));
      }
      return fragments;
    }

    astNode(o) {
      var addToScope, ref1, ref2;
      addToScope = function(name) {
        var alreadyDeclared;
        alreadyDeclared = o.scope.find(name.value);
        return name.isDeclaration = !alreadyDeclared;
      };
      if ((ref1 = this.name) != null) {
        ref1.eachName(addToScope, {
          checkAssignability: false
        });
      }
      if ((ref2 = this.index) != null) {
        ref2.eachName(addToScope, {
          checkAssignability: false
        });
      }
      return super.astNode(o);
    }

    astType() {
      return 'For';
    }

    astProperties(o) {
      var ref1, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9;
      return {
        source: (ref1 = this.source) != null ? ref1.ast(o) : void 0,
        body: this.body.ast(o, LEVEL_TOP),
        guard: (ref2 = (ref3 = this.guard) != null ? ref3.ast(o) : void 0) != null ? ref2 : null,
        name: (ref4 = (ref5 = this.name) != null ? ref5.ast(o) : void 0) != null ? ref4 : null,
        index: (ref6 = (ref7 = this.index) != null ? ref7.ast(o) : void 0) != null ? ref6 : null,
        step: (ref8 = (ref9 = this.step) != null ? ref9.ast(o) : void 0) != null ? ref8 : null,
        postfix: !!this.postfix,
        own: !!this.own,
        await: !!this.await,
        style: (function() {
          switch (false) {
            case !this.from:
              return 'from';
            case !this.object:
              return 'of';
            case !this.name:
              return 'in';
            default:
              return 'range';
          }
        }).call(this)
      };
    }

  };

  For.prototype.children = ['body', 'source', 'guard', 'step'];

  return For;

}).call(this);

//### Switch

// A JavaScript *switch* statement. Converts into a returnable expression on-demand.
exports.Switch = Switch = (function() {
  class Switch extends Base {
    constructor(subject, cases1, otherwise) {
      super();
      this.subject = subject;
      this.cases = cases1;
      this.otherwise = otherwise;
    }

    jumps(o = {
        block: true
      }) {
      var block, j, jumpNode, len1, ref1, ref2;
      ref1 = this.cases;
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        ({block} = ref1[j]);
        if (jumpNode = block.jumps(o)) {
          return jumpNode;
        }
      }
      return (ref2 = this.otherwise) != null ? ref2.jumps(o) : void 0;
    }

    makeReturn(results, mark) {
      var block, j, len1, ref1, ref2;
      ref1 = this.cases;
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        ({block} = ref1[j]);
        block.makeReturn(results, mark);
      }
      if (results) {
        this.otherwise || (this.otherwise = new Block([new Literal('void 0')]));
      }
      if ((ref2 = this.otherwise) != null) {
        ref2.makeReturn(results, mark);
      }
      return this;
    }

    compileNode(o) {
      var block, body, cond, conditions, expr, fragments, i, idt1, idt2, j, k, len1, len2, ref1, ref2;
      idt1 = o.indent + TAB;
      idt2 = o.indent = idt1 + TAB;
      fragments = [].concat(this.makeCode(this.tab + "switch ("), (this.subject ? this.subject.compileToFragments(o, LEVEL_PAREN) : this.makeCode("false")), this.makeCode(") {\n"));
      ref1 = this.cases;
      for (i = j = 0, len1 = ref1.length; j < len1; i = ++j) {
        ({conditions, block} = ref1[i]);
        ref2 = flatten([conditions]);
        for (k = 0, len2 = ref2.length; k < len2; k++) {
          cond = ref2[k];
          if (!this.subject) {
            cond = cond.invert();
          }
          fragments = fragments.concat(this.makeCode(idt1 + "case "), cond.compileToFragments(o, LEVEL_PAREN), this.makeCode(":\n"));
        }
        if ((body = block.compileToFragments(o, LEVEL_TOP)).length > 0) {
          fragments = fragments.concat(body, this.makeCode('\n'));
        }
        if (i === this.cases.length - 1 && !this.otherwise) {
          break;
        }
        expr = this.lastNode(block.expressions);
        if (expr instanceof Return || expr instanceof Throw || (expr instanceof Literal && expr.jumps() && expr.value !== 'debugger')) {
          continue;
        }
        fragments.push(cond.makeCode(idt2 + 'break;\n'));
      }
      if (this.otherwise && this.otherwise.expressions.length) {
        fragments.push(this.makeCode(idt1 + "default:\n"), ...(this.otherwise.compileToFragments(o, LEVEL_TOP)), this.makeCode("\n"));
      }
      fragments.push(this.makeCode(this.tab + '}'));
      return fragments;
    }

    astType() {
      return 'SwitchStatement';
    }

    casesAst(o) {
      var caseIndex, caseLocationData, cases, consequent, j, k, kase, l, lastTestIndex, len1, len2, len3, ref1, ref2, results1, test, testConsequent, testIndex, tests;
      cases = [];
      ref1 = this.cases;
      for (caseIndex = j = 0, len1 = ref1.length; j < len1; caseIndex = ++j) {
        kase = ref1[caseIndex];
        ({
          conditions: tests,
          block: consequent
        } = kase);
        tests = flatten([tests]);
        lastTestIndex = tests.length - 1;
        for (testIndex = k = 0, len2 = tests.length; k < len2; testIndex = ++k) {
          test = tests[testIndex];
          testConsequent = testIndex === lastTestIndex ? consequent : null;
          caseLocationData = test.locationData;
          if (testConsequent != null ? testConsequent.expressions.length : void 0) {
            caseLocationData = mergeLocationData(caseLocationData, testConsequent.expressions[testConsequent.expressions.length - 1].locationData);
          }
          if (testIndex === 0) {
            caseLocationData = mergeLocationData(caseLocationData, kase.locationData, {
              justLeading: true
            });
          }
          if (testIndex === lastTestIndex) {
            caseLocationData = mergeLocationData(caseLocationData, kase.locationData, {
              justEnding: true
            });
          }
          cases.push(new SwitchCase(test, testConsequent, {
            trailing: testIndex === lastTestIndex
          }).withLocationDataFrom({
            locationData: caseLocationData
          }));
        }
      }
      if ((ref2 = this.otherwise) != null ? ref2.expressions.length : void 0) {
        cases.push(new SwitchCase(null, this.otherwise).withLocationDataFrom(this.otherwise));
      }
      results1 = [];
      for (l = 0, len3 = cases.length; l < len3; l++) {
        kase = cases[l];
        results1.push(kase.ast(o));
      }
      return results1;
    }

    astProperties(o) {
      var ref1, ref2;
      return {
        discriminant: (ref1 = (ref2 = this.subject) != null ? ref2.ast(o, LEVEL_PAREN) : void 0) != null ? ref1 : null,
        cases: this.casesAst(o)
      };
    }

  };

  Switch.prototype.children = ['subject', 'cases', 'otherwise'];

  Switch.prototype.isStatement = YES;

  return Switch;

}).call(this);

SwitchCase = (function() {
  class SwitchCase extends Base {
    constructor(test1, block1, {trailing} = {}) {
      super();
      this.test = test1;
      this.block = block1;
      this.trailing = trailing;
    }

    astProperties(o) {
      var ref1, ref2, ref3, ref4;
      return {
        test: (ref1 = (ref2 = this.test) != null ? ref2.ast(o, LEVEL_PAREN) : void 0) != null ? ref1 : null,
        consequent: (ref3 = (ref4 = this.block) != null ? ref4.ast(o, LEVEL_TOP).body : void 0) != null ? ref3 : [],
        trailing: !!this.trailing
      };
    }

  };

  SwitchCase.prototype.children = ['test', 'block'];

  return SwitchCase;

}).call(this);

exports.SwitchWhen = SwitchWhen = (function() {
  class SwitchWhen extends Base {
    constructor(conditions1, block1) {
      super();
      this.conditions = conditions1;
      this.block = block1;
    }

  };

  SwitchWhen.prototype.children = ['conditions', 'block'];

  return SwitchWhen;

}).call(this);

//### If

// *If/else* statements. Acts as an expression by pushing down requested returns
// to the last line of each clause.

// Single-expression **Ifs** are compiled into conditional operators if possible,
// because ternaries are already proper expressions, and don’t need conversion.
exports.If = If = (function() {
  class If extends Base {
    constructor(condition1, body1, options = {}) {
      super();
      this.condition = condition1;
      this.body = body1;
      this.elseBody = null;
      this.isChain = false;
      ({soak: this.soak, postfix: this.postfix, type: this.type} = options);
      if (this.condition.comments) {
        moveComments(this.condition, this);
      }
    }

    bodyNode() {
      var ref1;
      return (ref1 = this.body) != null ? ref1.unwrap() : void 0;
    }

    elseBodyNode() {
      var ref1;
      return (ref1 = this.elseBody) != null ? ref1.unwrap() : void 0;
    }

    // Rewrite a chain of **Ifs** to add a default case as the final *else*.
    addElse(elseBody) {
      if (this.isChain) {
        this.elseBodyNode().addElse(elseBody);
        this.locationData = mergeLocationData(this.locationData, this.elseBodyNode().locationData);
      } else {
        this.isChain = elseBody instanceof If;
        this.elseBody = this.ensureBlock(elseBody);
        this.elseBody.updateLocationDataIfMissing(elseBody.locationData);
        if ((this.locationData != null) && (this.elseBody.locationData != null)) {
          this.locationData = mergeLocationData(this.locationData, this.elseBody.locationData);
        }
      }
      return this;
    }

    // The **If** only compiles into a statement if either of its bodies needs
    // to be a statement. Otherwise a conditional operator is safe.
    isStatement(o) {
      var ref1;
      return (o != null ? o.level : void 0) === LEVEL_TOP || this.bodyNode().isStatement(o) || ((ref1 = this.elseBodyNode()) != null ? ref1.isStatement(o) : void 0);
    }

    jumps(o) {
      var ref1;
      return this.body.jumps(o) || ((ref1 = this.elseBody) != null ? ref1.jumps(o) : void 0);
    }

    compileNode(o) {
      if (this.isStatement(o)) {
        return this.compileStatement(o);
      } else {
        return this.compileExpression(o);
      }
    }

    makeReturn(results, mark) {
      var ref1, ref2;
      if (mark) {
        if ((ref1 = this.body) != null) {
          ref1.makeReturn(results, mark);
        }
        if ((ref2 = this.elseBody) != null) {
          ref2.makeReturn(results, mark);
        }
        return;
      }
      if (results) {
        this.elseBody || (this.elseBody = new Block([new Literal('void 0')]));
      }
      this.body && (this.body = new Block([this.body.makeReturn(results)]));
      this.elseBody && (this.elseBody = new Block([this.elseBody.makeReturn(results)]));
      return this;
    }

    ensureBlock(node) {
      if (node instanceof Block) {
        return node;
      } else {
        return new Block([node]);
      }
    }

    // Compile the `If` as a regular *if-else* statement. Flattened chains
    // force inner *else* bodies into statement form.
    compileStatement(o) {
      var answer, body, child, cond, exeq, ifPart, indent;
      child = del(o, 'chainChild');
      exeq = del(o, 'isExistentialEquals');
      if (exeq) {
        return new If(this.processedCondition().invert(), this.elseBodyNode(), {
          type: 'if'
        }).compileToFragments(o);
      }
      indent = o.indent + TAB;
      cond = this.processedCondition().compileToFragments(o, LEVEL_PAREN);
      body = this.ensureBlock(this.body).compileToFragments(merge(o, {indent}));
      ifPart = [].concat(this.makeCode("if ("), cond, this.makeCode(") {\n"), body, this.makeCode(`\n${this.tab}}`));
      if (!child) {
        ifPart.unshift(this.makeCode(this.tab));
      }
      if (!this.elseBody) {
        return ifPart;
      }
      answer = ifPart.concat(this.makeCode(' else '));
      if (this.isChain) {
        o.chainChild = true;
        answer = answer.concat(this.elseBody.unwrap().compileToFragments(o, LEVEL_TOP));
      } else {
        answer = answer.concat(this.makeCode("{\n"), this.elseBody.compileToFragments(merge(o, {indent}), LEVEL_TOP), this.makeCode(`\n${this.tab}}`));
      }
      return answer;
    }

    // Compile the `If` as a conditional operator.
    compileExpression(o) {
      var alt, body, cond, fragments;
      cond = this.processedCondition().compileToFragments(o, LEVEL_COND);
      body = this.bodyNode().compileToFragments(o, LEVEL_LIST);
      alt = this.elseBodyNode() ? this.elseBodyNode().compileToFragments(o, LEVEL_LIST) : [this.makeCode('void 0')];
      fragments = cond.concat(this.makeCode(" ? "), body, this.makeCode(" : "), alt);
      if (o.level >= LEVEL_COND) {
        return this.wrapInParentheses(fragments);
      } else {
        return fragments;
      }
    }

    unfoldSoak() {
      return this.soak && this;
    }

    processedCondition() {
      return this.processedConditionCache != null ? this.processedConditionCache : this.processedConditionCache = this.type === 'unless' ? this.condition.invert() : this.condition;
    }

    isStatementAst(o) {
      return o.level === LEVEL_TOP;
    }

    astType(o) {
      if (this.isStatementAst(o)) {
        return 'IfStatement';
      } else {
        return 'ConditionalExpression';
      }
    }

    astProperties(o) {
      var isStatement, ref1, ref2, ref3, ref4;
      isStatement = this.isStatementAst(o);
      return {
        test: this.condition.ast(o, isStatement ? LEVEL_PAREN : LEVEL_COND),
        consequent: isStatement ? this.body.ast(o, LEVEL_TOP) : this.bodyNode().ast(o, LEVEL_TOP),
        alternate: this.isChain ? this.elseBody.unwrap().ast(o, isStatement ? LEVEL_TOP : LEVEL_COND) : !isStatement && ((ref1 = this.elseBody) != null ? (ref2 = ref1.expressions) != null ? ref2.length : void 0 : void 0) === 1 ? this.elseBody.expressions[0].ast(o, LEVEL_TOP) : (ref3 = (ref4 = this.elseBody) != null ? ref4.ast(o, LEVEL_TOP) : void 0) != null ? ref3 : null,
        postfix: !!this.postfix,
        inverted: this.type === 'unless'
      };
    }

  };

  If.prototype.children = ['condition', 'body', 'elseBody'];

  return If;

}).call(this);

// A sequence expression e.g. `(a; b)`.
// Currently only used during AST generation.
exports.Sequence = Sequence = (function() {
  class Sequence extends Base {
    constructor(expressions1) {
      super();
      this.expressions = expressions1;
    }

    astNode(o) {
      if (this.expressions.length === 1) {
        return this.expressions[0].ast(o);
      }
      return super.astNode(o);
    }

    astType() {
      return 'SequenceExpression';
    }

    astProperties(o) {
      var expression;
      return {
        expressions: (function() {
          var j, len1, ref1, results1;
          ref1 = this.expressions;
          results1 = [];
          for (j = 0, len1 = ref1.length; j < len1; j++) {
            expression = ref1[j];
            results1.push(expression.ast(o));
          }
          return results1;
        }).call(this)
      };
    }

  };

  Sequence.prototype.children = ['expressions'];

  return Sequence;

}).call(this);

// Constants
// ---------
UTILITIES = {
  modulo: function() {
    return 'function(a, b) { return (+a % (b = +b) + b) % b; }';
  },
  boundMethodCheck: function() {
    return "function(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new Error('Bound instance method accessed before binding'); } }";
  },
  // Shortcuts to speed up the lookup time for native functions.
  hasProp: function() {
    return '{}.hasOwnProperty';
  },
  indexOf: function() {
    return '[].indexOf';
  },
  slice: function() {
    return '[].slice';
  },
  splice: function() {
    return '[].splice';
  }
};

// Levels indicate a node's position in the AST. Useful for knowing if
// parens are necessary or superfluous.
LEVEL_TOP = 1; // ...;

LEVEL_PAREN = 2; // (...)

LEVEL_LIST = 3; // [...]

LEVEL_COND = 4; // ... ? x : y

LEVEL_OP = 5; // !...

LEVEL_ACCESS = 6; // ...[0]


// Tabs are two spaces for pretty printing.
TAB = '  ';

SIMPLENUM = /^[+-]?\d+(?:_\d+)*$/;

SIMPLE_STRING_OMIT = /\s*\n\s*/g;

LEADING_BLANK_LINE = /^[^\n\S]*\n/;

TRAILING_BLANK_LINE = /\n[^\n\S]*$/;

STRING_OMIT = /((?:\\\\)+)|\\[^\S\n]*\n\s*/g; // Consume (and preserve) an even number of backslashes.
// Remove escaped newlines.

HEREGEX_OMIT = /((?:\\\\)+)|\\(\s)|\s+(?:#.*)?/g; // Consume (and preserve) an even number of backslashes.
// Preserve escaped whitespace.
// Remove whitespace and comments.

// Helper Functions
// ----------------

// Helper for ensuring that utility functions are assigned at the top level.
utility = function(name, o) {
  var ref, root;
  ({root} = o.scope);
  if (name in root.utilities) {
    return root.utilities[name];
  } else {
    ref = root.freeVariable(name);
    root.assign(ref, UTILITIES[name](o));
    return root.utilities[name] = ref;
  }
};

multident = function(code, tab, includingFirstLine = true) {
  var endsWithNewLine;
  endsWithNewLine = code[code.length - 1] === '\n';
  code = (includingFirstLine ? tab : '') + code.replace(/\n/g, `$&${tab}`);
  code = code.replace(/\s+$/, '');
  if (endsWithNewLine) {
    code = code + '\n';
  }
  return code;
};

// Wherever in CoffeeScript 1 we might’ve inserted a `makeCode "#{@tab}"` to
// indent a line of code, now we must account for the possibility of comments
// preceding that line of code. If there are such comments, indent each line of
// such comments, and _then_ indent the first following line of code.
indentInitial = function(fragments, node) {
  var fragment, fragmentIndex, j, len1;
  for (fragmentIndex = j = 0, len1 = fragments.length; j < len1; fragmentIndex = ++j) {
    fragment = fragments[fragmentIndex];
    if (fragment.isHereComment) {
      fragment.code = multident(fragment.code, node.tab);
    } else {
      fragments.splice(fragmentIndex, 0, node.makeCode(`${node.tab}`));
      break;
    }
  }
  return fragments;
};

hasLineComments = function(node) {
  var comment, j, len1, ref1;
  if (!node.comments) {
    return false;
  }
  ref1 = node.comments;
  for (j = 0, len1 = ref1.length; j < len1; j++) {
    comment = ref1[j];
    if (comment.here === false) {
      return true;
    }
  }
  return false;
};

// Move the `comments` property from one object to another, deleting it from
// the first object.
moveComments = function(from, to) {
  if (!(from != null ? from.comments : void 0)) {
    return;
  }
  attachCommentsToNode(from.comments, to);
  return delete from.comments;
};

// Sometimes when compiling a node, we want to insert a fragment at the start
// of an array of fragments; but if the start has one or more comment fragments,
// we want to insert this fragment after those but before any non-comments.
unshiftAfterComments = function(fragments, fragmentToInsert) {
  var fragment, fragmentIndex, inserted, j, len1;
  inserted = false;
  for (fragmentIndex = j = 0, len1 = fragments.length; j < len1; fragmentIndex = ++j) {
    fragment = fragments[fragmentIndex];
    if (!(!fragment.isComment)) {
      continue;
    }
    fragments.splice(fragmentIndex, 0, fragmentToInsert);
    inserted = true;
    break;
  }
  if (!inserted) {
    fragments.push(fragmentToInsert);
  }
  return fragments;
};

isLiteralArguments = function(node) {
  return node instanceof IdentifierLiteral && node.value === 'arguments';
};

isLiteralThis = function(node) {
  return node instanceof ThisLiteral || (node instanceof Code && node.bound);
};

shouldCacheOrIsAssignable = function(node) {
  return node.shouldCache() || (typeof node.isAssignable === "function" ? node.isAssignable() : void 0);
};

// Unfold a node's child if soak, then tuck the node under created `If`
unfoldSoak = function(o, parent, name) {
  var ifn;
  if (!(ifn = parent[name].unfoldSoak(o))) {
    return;
  }
  parent[name] = ifn.body;
  ifn.body = new Value(parent);
  return ifn;
};

// Constructs a string or regex by escaping certain characters.
makeDelimitedLiteral = function(body, {
    delimiter: delimiterOption,
    escapeNewlines,
    double,
    includeDelimiters = true,
    escapeDelimiter = true,
    convertTrailingNullEscapes
  } = {}) {
  var escapeTemplateLiteralCurlies, printedDelimiter, regex;
  if (body === '' && delimiterOption === '/') {
    body = '(?:)';
  }
  escapeTemplateLiteralCurlies = delimiterOption === '`';
  regex = RegExp(`(\\\\\\\\)|(\\\\0(?=\\d))${convertTrailingNullEscapes ? /|(\\0)$/.source : '' // Escaped backslash. // Trailing null character that could be mistaken as octal escape.
  // Null character mistaken as octal escape.
  // Trailing null character that could be mistaken as octal escape.
  // (Possibly escaped) delimiter.
  // `${` inside template literals must be escaped.
  // (Possibly escaped) newlines.
  // Other escapes.
}${escapeDelimiter ? RegExp(`|\\\\?(${delimiterOption})`).source : '' // (Possibly escaped) delimiter.
}${escapeTemplateLiteralCurlies ? /|\\?(\$\{)/.source : '' // `${` inside template literals must be escaped.
}|\\\\?(?:${escapeNewlines ? '(\n)|' : ''}(\\r)|(\\u2028)|(\\u2029))|(\\\\.)`, "g");
  body = body.replace(regex, function(match, backslash, nul, ...args) {
    var cr, delimiter, lf, ls, other, ps, templateLiteralCurly, trailingNullEscape;
    trailingNullEscape = convertTrailingNullEscapes ? args.shift() : void 0;
    delimiter = escapeDelimiter ? args.shift() : void 0;
    templateLiteralCurly = escapeTemplateLiteralCurlies ? args.shift() : void 0;
    lf = escapeNewlines ? args.shift() : void 0;
    [cr, ls, ps, other] = args;
    switch (false) {
      // Ignore escaped backslashes.
      case !backslash:
        if (double) {
          return backslash + backslash;
        } else {
          return backslash;
        }
      case !nul:
        return '\\x00';
      case !trailingNullEscape:
        return "\\x00";
      case !delimiter:
        return `\\${delimiter}`;
      case !templateLiteralCurly:
        return "\\${";
      case !lf:
        return '\\n';
      case !cr:
        return '\\r';
      case !ls:
        return '\\u2028';
      case !ps:
        return '\\u2029';
      case !other:
        if (double) {
          return `\\${other}`;
        } else {
          return other;
        }
    }
  });
  printedDelimiter = includeDelimiters ? delimiterOption : '';
  return `${printedDelimiter}${body}${printedDelimiter}`;
};

sniffDirectives = function(expressions, {notFinalExpression} = {}) {
  var expression, index, lastIndex, results1, unwrapped;
  index = 0;
  lastIndex = expressions.length - 1;
  results1 = [];
  while (index <= lastIndex) {
    if (index === lastIndex && notFinalExpression) {
      break;
    }
    expression = expressions[index];
    if ((unwrapped = expression != null ? typeof expression.unwrap === "function" ? expression.unwrap() : void 0 : void 0) instanceof PassthroughLiteral && unwrapped.generated) {
      index++;
      continue;
    }
    if (!(expression instanceof Value && expression.isString() && !expression.unwrap().shouldGenerateTemplateLiteral())) {
      break;
    }
    expressions[index] = new Directive(expression).withLocationDataFrom(expression);
    results1.push(index++);
  }
  return results1;
};

astAsBlockIfNeeded = function(node, o) {
  var unwrapped;
  unwrapped = node.unwrap();
  if (unwrapped instanceof Block && unwrapped.expressions.length > 1) {
    unwrapped.makeReturn(null, true);
    return unwrapped.ast(o, LEVEL_TOP);
  } else {
    return node.ast(o, LEVEL_PAREN);
  }
};

// Helpers for `mergeLocationData` and `mergeAstLocationData` below.
lesser = function(a, b) {
  if (a < b) {
    return a;
  } else {
    return b;
  }
};

greater = function(a, b) {
  if (a > b) {
    return a;
  } else {
    return b;
  }
};

isAstLocGreater = function(a, b) {
  if (a.line > b.line) {
    return true;
  }
  if (a.line !== b.line) {
    return false;
  }
  return a.column > b.column;
};

isLocationDataStartGreater = function(a, b) {
  if (a.first_line > b.first_line) {
    return true;
  }
  if (a.first_line !== b.first_line) {
    return false;
  }
  return a.first_column > b.first_column;
};

isLocationDataEndGreater = function(a, b) {
  if (a.last_line > b.last_line) {
    return true;
  }
  if (a.last_line !== b.last_line) {
    return false;
  }
  return a.last_column > b.last_column;
};

// Take two nodes’ location data and return a new `locationData` object that
// encompasses the location data of both nodes. So the new `first_line` value
// will be the earlier of the two nodes’ `first_line` values, the new
// `last_column` the later of the two nodes’ `last_column` values, etc.

// If you only want to extend the first node’s location data with the start or
// end location data of the second node, pass the `justLeading` or `justEnding`
// options. So e.g. if `first`’s range is [4, 5] and `second`’s range is [1, 10],
// you’d get:
// ```
// mergeLocationData(first, second).range                   # [1, 10]
// mergeLocationData(first, second, justLeading: yes).range # [1, 5]
// mergeLocationData(first, second, justEnding:  yes).range # [4, 10]
// ```
exports.mergeLocationData = mergeLocationData = function(locationDataA, locationDataB, {justLeading, justEnding} = {}) {
  return Object.assign(justEnding ? {
    first_line: locationDataA.first_line,
    first_column: locationDataA.first_column
  } : isLocationDataStartGreater(locationDataA, locationDataB) ? {
    first_line: locationDataB.first_line,
    first_column: locationDataB.first_column
  } : {
    first_line: locationDataA.first_line,
    first_column: locationDataA.first_column
  }, justLeading ? {
    last_line: locationDataA.last_line,
    last_column: locationDataA.last_column,
    last_line_exclusive: locationDataA.last_line_exclusive,
    last_column_exclusive: locationDataA.last_column_exclusive
  } : isLocationDataEndGreater(locationDataA, locationDataB) ? {
    last_line: locationDataA.last_line,
    last_column: locationDataA.last_column,
    last_line_exclusive: locationDataA.last_line_exclusive,
    last_column_exclusive: locationDataA.last_column_exclusive
  } : {
    last_line: locationDataB.last_line,
    last_column: locationDataB.last_column,
    last_line_exclusive: locationDataB.last_line_exclusive,
    last_column_exclusive: locationDataB.last_column_exclusive
  }, {
    range: [justEnding ? locationDataA.range[0] : lesser(locationDataA.range[0], locationDataB.range[0]), justLeading ? locationDataA.range[1] : greater(locationDataA.range[1], locationDataB.range[1])]
  });
};

// Take two AST nodes, or two AST nodes’ location data objects, and return a new
// location data object that encompasses the location data of both nodes. So the
// new `start` value will be the earlier of the two nodes’ `start` values, the
// new `end` value will be the later of the two nodes’ `end` values, etc.

// If you only want to extend the first node’s location data with the start or
// end location data of the second node, pass the `justLeading` or `justEnding`
// options. So e.g. if `first`’s range is [4, 5] and `second`’s range is [1, 10],
// you’d get:
// ```
// mergeAstLocationData(first, second).range                   # [1, 10]
// mergeAstLocationData(first, second, justLeading: yes).range # [1, 5]
// mergeAstLocationData(first, second, justEnding:  yes).range # [4, 10]
// ```
exports.mergeAstLocationData = mergeAstLocationData = function(nodeA, nodeB, {justLeading, justEnding} = {}) {
  return {
    loc: {
      start: justEnding ? nodeA.loc.start : isAstLocGreater(nodeA.loc.start, nodeB.loc.start) ? nodeB.loc.start : nodeA.loc.start,
      end: justLeading ? nodeA.loc.end : isAstLocGreater(nodeA.loc.end, nodeB.loc.end) ? nodeA.loc.end : nodeB.loc.end
    },
    range: [justEnding ? nodeA.range[0] : lesser(nodeA.range[0], nodeB.range[0]), justLeading ? nodeA.range[1] : greater(nodeA.range[1], nodeB.range[1])],
    start: justEnding ? nodeA.start : lesser(nodeA.start, nodeB.start),
    end: justLeading ? nodeA.end : greater(nodeA.end, nodeB.end)
  };
};

// Convert Jison-style node class location data to Babel-style location data
exports.jisonLocationDataToAstLocationData = jisonLocationDataToAstLocationData = function({first_line, first_column, last_line_exclusive, last_column_exclusive, range}) {
  return {
    loc: {
      start: {
        line: first_line + 1,
        column: first_column
      },
      end: {
        line: last_line_exclusive + 1,
        column: last_column_exclusive
      }
    },
    range: [range[0], range[1]],
    start: range[0],
    end: range[1]
  };
};

// Generate a zero-width location data that corresponds to the end of another node’s location.
zeroWidthLocationDataFromEndLocation = function({
    range: [, endRange],
    last_line_exclusive,
    last_column_exclusive
  }) {
  return {
    first_line: last_line_exclusive,
    first_column: last_column_exclusive,
    last_line: last_line_exclusive,
    last_column: last_column_exclusive,
    last_line_exclusive,
    last_column_exclusive,
    range: [endRange, endRange]
  };
};

extractSameLineLocationDataFirst = function(numChars) {
  return function({
      range: [startRange],
      first_line,
      first_column
    }) {
    return {
      first_line,
      first_column,
      last_line: first_line,
      last_column: first_column + numChars - 1,
      last_line_exclusive: first_line,
      last_column_exclusive: first_column + numChars,
      range: [startRange, startRange + numChars]
    };
  };
};

extractSameLineLocationDataLast = function(numChars) {
  return function({
      range: [, endRange],
      last_line,
      last_column,
      last_line_exclusive,
      last_column_exclusive
    }) {
    return {
      first_line: last_line,
      first_column: last_column - (numChars - 1),
      last_line: last_line,
      last_column: last_column,
      last_line_exclusive,
      last_column_exclusive,
      range: [endRange - numChars, endRange]
    };
  };
};

// We don’t currently have a token corresponding to the empty space
// between interpolation/JSX expression braces, so piece together the location
// data by trimming the braces from the Interpolation’s location data.
// Technically the last_line/last_column calculation here could be
// incorrect if the ending brace is preceded by a newline, but
// last_line/last_column aren’t used for AST generation anyway.
emptyExpressionLocationData = function({
    interpolationNode: element,
    openingBrace,
    closingBrace
  }) {
  return {
    first_line: element.locationData.first_line,
    first_column: element.locationData.first_column + openingBrace.length,
    last_line: element.locationData.last_line,
    last_column: element.locationData.last_column - closingBrace.length,
    last_line_exclusive: element.locationData.last_line,
    last_column_exclusive: element.locationData.last_column,
    range: [element.locationData.range[0] + openingBrace.length, element.locationData.range[1] - closingBrace.length]
  };
};

//# sourceMappingURL=nodes.js.map
