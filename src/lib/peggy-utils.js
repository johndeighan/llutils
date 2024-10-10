  // peggy-utils.coffee
import {
  undef,
  defined,
  notdefined,
  LOG,
  OL,
  keys,
  pass,
  lpad,
  rpad,
  zpad,
  words,
  getOptions,
  toBlock,
  isString,
  isArray,
  isHash,
  isEmpty,
  nonEmpty,
  assert,
  croak
} from '@jdeighan/llutils';

import {
  indented
} from '@jdeighan/llutils/indent';

import {
  DUMP,
  BOX
} from '@jdeighan/llutils/dump';

import {
  TextTable
} from '@jdeighan/llutils/text-table';

// ---------------------------------------------------------------------------
export var ByteCodeWriter = class ByteCodeWriter {
  constructor(hOptions = {}) {
    this.lRuleNames = [];
    this.hRules = {};
    // --- These are set when the AST is known
    this.literals = undef;
    this.expectations = undef;
    // --- options
    this.detailed = hOptions.detailed;
  }

  // ..........................................................
  setAST(ast) {
    assert(ast.type === 'grammar', "not a grammar");
    assert(ast.rules.length > 0, "no rules");
    this.literals = ast.literals;
    this.expectations = ast.expectations;
  }

  // ..........................................................
  add(ruleName, lOpcodes) {
    assert(isString(ruleName), `not a string: ${OL(ruleName)}`);
    assert(isArray(lOpcodes), `not an array: ${OL(lOpcodes)}`);
    assert(notdefined(this.hRules[ruleName]), `rule ${ruleName} already defined`);
    this.lRuleNames.push(ruleName);
    this.hRules[ruleName] = lOpcodes;
  }

  // ..........................................................
  getOpInfo(op, pos) {
    switch (op) {
      case 35:
        return ['PUSH_EMPTY_STRING', [], []];
      case 5:
        return ['PUSH_CUR_POS', [], []];
      case 1:
        return ['PUSH_UNDEFINED', [], []];
      case 2:
        return ['PUSH_NULL', [], []];
      case 3:
        return ['PUSH_FAILED', [], []];
      case 4:
        return ['PUSH_EMPTY_ARRAY', [], []];
      case 6:
        return ['POP', [], []];
      case 7:
        return ['POP_CUR_POS', [], []];
      case 8:
        return ['POP_N', ['/'], []];
      case 9:
        return ['NIP', [], []];
      case 10:
        return ['APPEND', [], []];
      case 11:
        return ['WRAP', [''], []];
      case 12:
        return ['TEXT', [], []];
      case 36:
        return ['PLUCK', ['/', '/', '/', 'p'], []];
      case 13:
        return ['IF', [], ['THEN', 'ELSE']];
      case 14:
        return ['IF_ERROR', [], ['THEN', 'ELSE']];
      case 15:
        return ['IF_NOT_ERROR', [], ['THEN', 'ELSE']];
      case 30:
        return ['IF_LT', [], ['THEN', 'ELSE']];
      case 31:
        return ['IF_GE', [], ['THEN', 'ELSE']];
      case 32:
        return ['IF_LT_DYNAMIC', [], ['THEN', 'ELSE']];
      case 33:
        return ['IF_GE_DYNAMIC', [], ['THEN', 'ELSE']];
      case 16:
        return ['WHILE_NOT_ERROR', [], ['THEN']];
      case 17:
        return ['MATCH_ANY', [], ['THEN', 'ELSE']];
      case 18:
        return ['MATCH_STRING', ['/lit'], ['THEN', 'ELSE']];
      case 19:
        return ['MATCH_STRING_IC', ['/lit'], ['THEN', 'ELSE']];
      case 20:
        return ['MATCH_CHAR_CLASS', ['/class'], []];
      case 21:
        return ['ACCEPT_N', ['/num'], []];
      case 22:
        return ['ACCEPT_STRING', ['/lit'], []];
      case 23:
        return ['FAIL', ['/expectation'], []];
      case 24:
        return ['LOAD_SAVED_POS', ['pos/num'], []];
      case 25:
        return ['UPDATE_SAVED_POS', ['pos/num'], []];
      case 26:
        return ['CALL', [], []];
      case 27:
        return ['RULE', ['/rule'], []];
      case 37:
        return ['SOURCE_MAP_PUSH', [], []];
      case 38:
        return ['SOURCE_MAP_POP', [], []];
      case 39:
        return ['SOURCE_MAP_LABEL_PUSH', [], []];
      case 40:
        return ['SOURCE_MAP_LABEL_POP', [], []];
      default:
        return [`OPCODE ${op}`, [], []];
    }
  }

  // ..........................................................
  argStr(arg, infoStr) {
    var hExpect, label, result, type, value;
    if (infoStr === '/') {
      return arg.toString();
    }
    [label, type] = infoStr.split('/');
    switch (type) {
      case 'rule':
        if (arg < this.lRuleNames.length) {
          result = `<${this.lRuleNames[arg]}>`;
        } else {
          result = `<#${arg}>`;
        }
        break;
      case 'lit':
        result = `'${this.literals[arg]}'`;
        break;
      case 'num':
      case 'i':
        result = arg.toString();
        break;
      case 'expectation':
        hExpect = this.expectations[arg];
        if (defined(hExpect)) {
          ({type, value} = hExpect);
          switch (type) {
            case 'literal':
              result = `\"${value}\"`;
              break;
            case 'class':
              result = "[..]";
              break;
            case 'any':
              result = '.';
              break;
            default:
              result = `Unknown expectation type: ${type}`;
          }
        } else {
          result = 'hExpect = undef';
        }
        break;
      case 'block':
        if (label) {
          result = `${label}:${arg}`;
        } else {
          result = `BLOCK: ${arg}`;
        }
        break;
      case 'class':
        if (label) {
          result = `${label}:[${arg}]`;
        } else {
          result = `CLASS: ${arg}`;
        }
        break;
      default:
        result = `<UNKNOWN>: ${OL(arg)}`;
    }
    if (this.detailed) {
      return `(${arg}) ${result}`;
    } else {
      return result;
    }
  }

  // ..........................................................
  opStr(lOpcodes) {
    var blockBase, blockLen, i, j, lArgDesc, lArgInfo, lArgs, lBlockInfo, lLines, lSubOps, label, len, name, numArgs, op, pos;
    lLines = [];
    pos = 0;
    while (pos < lOpcodes.length) {
      op = lOpcodes[pos];
      pos += 1;
      [name, lArgInfo, lBlockInfo] = this.getOpInfo(op, pos);
      numArgs = lArgInfo.length;
      if (numArgs === 0) {
        if (this.detailed) {
          lLines.push(`(${op}) ${name}`);
        } else {
          lLines.push(`${name}`);
        }
      } else {
        lArgs = lOpcodes.slice(pos, pos + numArgs);
        pos += numArgs;
        lArgDesc = lArgs.map((arg, i) => {
          return this.argStr(arg, lArgInfo[i]);
        });
        if (this.detailed) {
          lLines.push(`(${op}) ${name} ${lArgDesc.join(' ')}`);
        } else {
          lLines.push(`${name} ${lArgDesc.join(' ')}`);
        }
      }
      blockBase = pos + lBlockInfo.length;
      for (i = j = 0, len = lBlockInfo.length; j < len; i = ++j) {
        label = lBlockInfo[i];
        blockLen = lOpcodes[pos];
        pos += 1;
        switch (label) {
          case 'ELSE':
            if (blockLen > 0) {
              lLines.push('ELSE');
            }
            break;
          case 'THEN':
            pass();
            break;
          default:
            croak(`Bad block label: ${label}`);
        }
        lSubOps = lOpcodes.slice(blockBase, blockBase + blockLen);
        lLines.push(indented(this.opStr(lSubOps)));
        blockBase += blockLen;
      }
      pos = blockBase;
    }
    return lLines.join("\n");
  }

  // ..........................................................
  getBlock() {
    var block, j, lOpcodes, lParts, len, ref, ruleName;
    lParts = [];
    ref = keys(this.hRules);
    for (j = 0, len = ref.length; j < len; j++) {
      ruleName = ref[j];
      lParts.push(`<${ruleName}>`);
      lOpcodes = this.hRules[ruleName];
      block = this.opStr(lOpcodes).trimEnd();
      if (block !== '') {
        lParts.push(indented(block));
      }
      lParts.push('');
    }
    return lParts.join("\n").trimEnd();
  }

};

// --------------------------------------------------------------------------
export var OpDumper = class OpDumper {
  constructor(hOptions = {}) {
    var ignore;
    ({ignore} = getOptions(hOptions, {
      ignore: [37, 38, 39, 40]
    }));
    this.lIgnore = ignore;
    this.level = 0;
    this.lLines = [];
  }

  // ..........................................................
  setStack(stack) {
    this.stack = stack;
  }

  // ..........................................................
  incLevel() {
    return this.level += 1;
  }

  decLevel() {
    return this.level -= 1;
  }

  // ..........................................................
  out(str) {
    this.lLines.push("  ".repeat(this.level) + str);
  }

  // ..........................................................
  outOp(index, op) {
    if (!this.lIgnore.includes(op)) {
      return this.out(`OP[${lpad(index, 2)}]: ${lpad(op, 2)} ${this.getName(op)}`);
    }
  }

  // ..........................................................
  outBC(lByteCodes) {
    return;
    // --- For now, don't output anything
    this.out('OPCODES: ' + lByteCodes.filter((x) => {
      return !this.lIgnore.includes(x);
    }).map((x) => {
      return x.toString();
    }).join(' '));
  }

  // ..........................................................
  outCode(lLines, label) {
    var j, len, line;
    lLines = BOX(toBlock(lLines), label, {
      echo: false,
      asArray: true
    });
    for (j = 0, len = lLines.length; j < len; j++) {
      line = lLines[j];
      this.out(line);
    }
  }

  // ..........................................................
  getBlock() {
    return this.lLines.join("\n");
  }

  // ..........................................................
  getName(op) {
    switch (op) {
      case 0:
        return 'PUSH';
      case 35:
        return 'PUSH_EMPTY_STRING';
      case 1:
        return 'PUSH_UNDEFINED';
      case 2:
        return 'PUSH_NULL';
      case 3:
        return 'PUSH_FAILED';
      case 4:
        return 'PUSH_EMPTY_ARRAY';
      case 5:
        return 'PUSH_CURR_POS';
      case 6:
        return 'POP';
      case 7:
        return 'POP_CURR_POS';
      case 8:
        return 'POP_N';
      case 9:
        return 'NIP';
      case 10:
        return 'APPEND';
      case 11:
        return 'WRAP';
      case 12:
        return 'TEXT';
      case 36:
        return 'PLUCK';
      // ---  Conditions and Loops
      case 13:
        return 'IF';
      case 14:
        return 'IF_ERROR';
      case 15:
        return 'IF_NOT_ERROR';
      case 30:
        return 'IF_LT';
      case 31:
        return 'IF_GE';
      case 32:
        return 'IF_LT_DYNAMIC';
      case 33:
        return 'IF_GE_DYNAMIC';
      case 16:
        return 'WHILE_NOT_ERROR';
      // ---  Matching
      case 17:
        return 'MATCH_ANY';
      case 18:
        return 'MATCH_STRING';
      case 19:
        return 'MATCH_STRING_IC';
      case 20:
        return 'MATCH_CHAR_CLASS';
      case 20:
        return 'MATCH_REGEXP';
      case 21:
        return 'ACCEPT_N';
      case 22:
        return 'ACCEPT_STRING';
      case 23:
        return 'FAIL';
      // ---  Calls
      case 24:
        return 'LOAD_SAVED_POS';
      case 25:
        return 'UPDATE_SAVED_POS';
      case 26:
        return 'CALL';
      // ---  Rules
      case 27:
        return 'RULE';
      case 41:
        return 'LIBRARY_RULE';
      // ---  Failure Reporting
      case 28:
        return 'SILENT_FAILS_ON';
      case 29:
        return 'SILENT_FAILS_OFF';
      case 37:
        return 'SOURCE_MAP_PUSH';
      case 38:
        return 'SOURCE_MAP_POP';
      case 39:
        return 'SOURCE_MAP_LABEL_PUSH';
      case 40:
        return 'SOURCE_MAP_LABEL_POP';
      default:
        return '<UNKNOWN>';
    }
  }

};

// ---------------------------------------------------------------------------
export var BaseTracer = class BaseTracer {
  constructor(hOptions = {}) {
    var h, j, len, ref, rule;
    h = getOptions(hOptions, {
      posType: 'linecol',
      lIgnore: ['_'],
      lIgnoreSubs: []
    });
    this.hOptions = h;
    this.posType = h.posType;
    this.lIgnoreSubs = h.lIgnoreSubs;
    this.lIgnore = h.lIgnore;
    ref = this.lIgnore;
    for (j = 0, len = ref.length; j < len; j++) {
      rule = ref[j];
      if (!this.lIgnoreSubs.includes(rule)) {
        this.lIgnoreSubs.push(rule);
      }
    }
    this.lStack = []; // stack of rule names
  }

  
    // ..........................................................
  traceIt(hInfo) {
    var action, category, i, j, k, len, len1, ref, ref1, rule, type;
    ({type, rule} = hInfo);
    [category, action] = type.split('.');
    // --- NOTE: Any rule name in @lIgnore
    //           will also be in @lIgnoreSubs
    if (this.lIgnore.includes(rule)) {
      if (category === 'rule') {
        return false;
      }
    }
    if ((category === 'rule') && ((action === 'match') || (action === 'fail'))) {
      ref = this.lStack;
      for (i = j = 0, len = ref.length; j < len; i = ++j) {
        rule = ref[i];
        if (this.lIgnoreSubs.includes(rule) && (i !== this.lStack.length - 1)) {
          return false;
        }
      }
    } else {
      ref1 = this.lStack;
      for (k = 0, len1 = ref1.length; k < len1; k++) {
        rule = ref1[k];
        if (this.lIgnoreSubs.includes(rule)) {
          return false;
        }
      }
    }
    return true;
  }

  // ..........................................................
  destroy() {}

  // ..........................................................
  adjustStack(hInfo) {
    var rule, type;
    ({type, rule} = hInfo);
    switch (type) {
      case 'rule.enter':
        this.lStack.push(rule);
        break;
      case 'rule.fail':
      case 'rule.match':
        this.lStack.pop();
    }
  }

  // ..........................................................
  trace(hInfo) {}

  // ..........................................................
  posStr(location, posType = undef) {
    var e, ec, el, eo, s, sc, sl, so;
    if (notdefined(posType)) {
      posType = this.posType;
    }
    if (notdefined(location) || !isHash(location)) {
      return rpad('unknown', 12);
    }
    ({
      start: s,
      end: e
    } = location);
    sl = zpad(s.line);
    sc = zpad(s.column);
    so = zpad(s.offset);
    el = zpad(e.line);
    ec = zpad(e.column);
    eo = zpad(e.offset);
    if ((sl === 1) && (el === 1)) {
      return posStr(location, 'offset');
    }
    switch (this.posType) {
      case 'linecol':
        if (so === eo) {
          return `${sl}:${sc}`;
        } else {
          return `${sl}:${sc}-${el}:${ec}`;
        }
        break;
      case 'offset':
        if (so === eo) {
          return `${so}`;
        } else {
          return `${so}-${eo}`;
        }
        break;
      default:
        if (so === eo) {
          return `${sl}:${sc}:${so}`;
        } else {
          return `${sl}:${sc}:${so}-${el}:${ec}:${eo}`;
        }
    }
  }

};

// ---------------------------------------------------------------------------
export var RawTracer = class RawTracer extends BaseTracer {
  trace(hInfo) {
    this.adjustStack(hInfo);
    return LOG(JSON.stringify(hInfo, null, 3));
  }

};

// ---------------------------------------------------------------------------
export var DebugTracer = class DebugTracer extends BaseTracer {
  constructor(hOptions = {}) {
    super(hOptions);
    this.tt = new TextTable('l l l l l');
    this.tt.fullsep();
    this.tt.labels(words('type rule result details position'));
    this.tt.sep();
  }

  trace(hInfo) {
    var details, location, result, rule, type;
    this.adjustStack(hInfo);
    ({type, rule, result, details, location} = hInfo);
    this.tt.data([type, rule, JSON.stringify(result), details, this.posStr(location)]);
  }

  destroy() {
    return LOG(this.tt.asString());
  }

};

// ---------------------------------------------------------------------------
export var AdvancedTracer = class AdvancedTracer extends BaseTracer {
  traceStr(hInfo, level = 0) {
    var action, details, endPos, locStr, location, obj, pre, ref, ref1, result, rule, startPos, type;
    ({type, rule, location, result, details} = hInfo);
    locStr = this.posStr(location);
    startPos = location != null ? (ref = location.start) != null ? ref.offset : void 0 : void 0;
    endPos = location != null ? (ref1 = location.end) != null ? ref1.offset : void 0 : void 0;
    [obj, action] = type.split('.');
    switch (action) {
      case 'enter':
        assert(obj === 'rule', `obj=${obj}, act=${action}`);
        pre = "│  ".repeat(level);
        return `${pre}? ${rule}`;
      case 'match':
        if (obj === 'rule') {
          pre = "│  ".repeat(level - 1) + "└─>";
        } else {
          pre = "│  ".repeat(level);
        }
        if (defined(result)) {
          if (defined(endPos)) {
            return `${pre} ${OL(result)} (pos -> ${endPos})`;
          } else {
            return `${pre} ${OL(result)}`;
          }
        } else {
          if (defined(endPos)) {
            return `${pre} YES (pos=${endPos})`;
          } else {
            return `${pre} YES`;
          }
        }
        break;
      case 'fail':
        if (obj === 'rule') {
          pre = "│  ".repeat(level - 1) + "└─> FAIL";
          if (defined(location)) {
            return ` ${pre} (at ${locStr})`;
          } else {
            return ` ${pre}`.trim();
          }
        } else {
          pre = "│  ".repeat(level - 1) + "x  ";
          if (defined(location)) {
            return `${pre} ${obj} ${OL(details)} (at ${locStr})`;
          } else {
            return `${pre} ${obj}`;
          }
        }
        break;
      default:
        return `UNKNOWN type: ${type}`;
    }
  }

  // ..........................................................
  trace(hInfo) {
    var j, len, result, str;
    if (this.traceIt(hInfo)) {
      result = this.traceStr(hInfo, this.lStack.length);
      if (isString(result)) {
        LOG(result);
      } else if (isArray(result)) {
        for (j = 0, len = result.length; j < len; j++) {
          str = result[j];
          LOG(str);
        }
      }
    }
    this.adjustStack(hInfo);
  }

};

// ---------------------------------------------------------------------------
export var DetailedTracer = class DetailedTracer extends AdvancedTracer {
  constructor(input, hOptions = {}) {
    super(hOptions);
    this.input = input;
    this.input = this.hOptions.input;
    this.hVars = this.hOptions.hVars;
  }

  // ..........................................................
  varStr() {
    var j, lParts, len, ref, value, varname;
    if (isEmpty(this.hVars)) {
      return '';
    }
    lParts = [];
    ref = keys(this.hVars);
    for (j = 0, len = ref.length; j < len; j++) {
      varname = ref[j];
      value = this.hVars[varname]();
      lParts.push(`${varname} = ${OL(value)}`);
    }
    if (lParts.length === 0) {
      return '';
    } else {
      return ' (' + lParts.join(',') + ')';
    }
  }

  // ..........................................................
  traceStr(hInfo, level) {
    var location, offset, result, rule, str, type;
    str = super.traceStr(hInfo);
    if ((hInfo.type !== 'rule.fail') || isEmpty(this.input)) {
      return str;
    }
    ({type, rule, location, result} = hInfo);
    if (defined(location)) {
      ({offset} = location.start);
      return [str, `${escapeStr(this.input, {offset})}${this.varStr()}`];
    } else {
      return [str, `${escapeStr(this.input)}${this.varStr()}`];
    }
  }

};

// ---------------------------------------------------------------------------
// --- tracer can be:
//        - undef
//        - a string: 'none', 'debug', 'peggy','advanced','detailed'
//        - an object with a function property named 'trace'
//        - a function
export var getTracer = (tracer = 'advanced', hOptions = {}) => {
  var option;
  hOptions = getOptions(hOptions, {
    input: undef,
    lIgnore: ['_'],
    lIgnoreSubs: [],
    hVars: {}
  });
  switch (typeof tracer) {
    case 'undefined':
      return new BaseTracer(hOptions);
    case 'object':
      if (defined(tracer)) {
        return tracer;
      } else {
        return new BaseTracer(hOptions);
      }
      break;
    case 'function':
      return {
        trace: tracer
      };
    case 'string':
      [tracer, option] = tracer.split('/');
      if (option) {
        hOptions.posType = option;
      }
      switch (tracer) {
        case 'raw':
          return new RawTracer(hOptions);
        case 'debug':
          return new DebugTracer(hOptions);
        case 'advanced':
          return new AdvancedTracer(hOptions);
        case 'detailed':
          return new DetailedTracer(hOptions);
        case 'peggy':
          return undef;
        default:
          return new BaseTracer(hOptions);
      }
  }
};

//# sourceMappingURL=peggy-utils.js.map
