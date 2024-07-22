  // tracer.coffee
import {
  undef,
  defined,
  notdefined,
  pass,
  OL,
  escapeStr,
  assert,
  croak,
  isString,
  isArray,
  isHash,
  isEmpty,
  lpad,
  rpad,
  zpad,
  words,
  keys,
  hasKey,
  getOptions
} from '@jdeighan/llutils';

import {
  TextTable
} from '@jdeighan/llutils/text-table';

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
    return console.log(JSON.stringify(hInfo, null, 3));
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
    return console.log(this.tt.asString());
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
    debugger;
    var j, len, result, str;
    if (this.traceIt(hInfo)) {
      result = this.traceStr(hInfo, this.lStack.length);
      if (isString(result)) {
        console.log(result);
      } else if (isArray(result)) {
        for (j = 0, len = result.length; j < len; j++) {
          str = result[j];
          console.log(str);
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
      return [str, `${escapeStr(this.input, 'esc', {offset})}${this.varStr()}`];
    } else {
      return [str, `${escapeStr(this.input, 'esc')}${this.varStr()}`];
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

//# sourceMappingURL=tracer.js.map
