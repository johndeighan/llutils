  // tracer.coffee
import {
  undef,
  defined,
  notdefined,
  pass,
  OL,
  escapeStr,
  keys,
  assert,
  isString,
  isArray,
  isHash,
  isEmpty,
  getOptions,
  lpad,
  rpad,
  zpad,
  words
} from '@jdeighan/llutils';

import {
  TextTable
} from '@jdeighan/llutils/text-table';

// ---------------------------------------------------------------------------
export var NullTracer = class NullTracer {
  constructor(posType1 = 'offset') {
    this.posType = posType1;
  }

  // ..........................................................
  destroy() {}

  // ..........................................................
  trace(hInfo) {}

  // ..........................................................
  posStr(location) {
    var e, ec, el, eo, s, sc, sl, so;
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
export var RawTracer = class RawTracer extends NullTracer {
  trace(hInfo) {
    return console.log(JSON.stringify(hInfo, null, 3));
  }

};

// ---------------------------------------------------------------------------
export var DebugTracer = class DebugTracer extends NullTracer {
  constructor() {
    super();
    this.tt = new TextTable('l l l l l');
    this.tt.fullsep();
    this.tt.labels(words('type rule result details position'));
    this.tt.sep();
  }

  trace(hInfo) {
    var details, location, result, rule, type;
    ({type, rule, result, details, location} = hInfo);
    this.tt.data([type, rule, JSON.stringify(result), details, this.posStr(location)]);
  }

  destroy() {
    return console.log(this.tt.asString());
  }

};

// ---------------------------------------------------------------------------
export var AdvancedTracer = class AdvancedTracer extends NullTracer {
  constructor(hOptions = {}) {
    var ignore, posType;
    super();
    ({ignore, posType} = getOptions(hOptions, {
      ignore: ['_'],
      posType: 'offset'
    }));
    this.lIgnore = ignore;
    this.posType = posType;
    this.level = 0;
  }

  // ..........................................................
  traceStr(hInfo) {
    var action, count, details, endPos, locStr, location, obj, pre, ref, ref1, result, rule, startPos, type;
    ({type, rule, location, result, details} = hInfo);
    locStr = this.posStr(location);
    startPos = location != null ? (ref = location.start) != null ? ref.offset : void 0 : void 0;
    endPos = location != null ? (ref1 = location.end) != null ? ref1.offset : void 0 : void 0;
    [obj, action] = type.split('.');
    switch (action) {
      case 'enter':
        assert(obj === 'rule', `obj=${obj}, act=${action}`);
        pre = "│  ".repeat(this.level);
        return `${pre}? ${rule}`;
      case 'match':
        if (obj === 'rule') {
          count = (this.level === 0) ? 0 : this.level - 1;
          pre = "│  ".repeat(count) + "└─>";
        } else {
          pre = "│  ".repeat(this.level);
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
        pre = "│  ".repeat(this.level - 1) + "x  ";
        if (obj === 'rule') {
          if (defined(location)) {
            return `${pre} (at ${locStr})`;
          } else {
            return `${pre}`.trim();
          }
        } else {
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
    var i, len, result, str;
    // --- DEBUG console.dir hInfo

    // --- ignore some rules
    if (this.lIgnore.includes(hInfo.rule)) {
      return;
    }
    result = this.traceStr(hInfo);
    if (isString(result)) {
      console.log(result);
    } else if (isArray(result)) {
      for (i = 0, len = result.length; i < len; i++) {
        str = result[i];
        console.log(str);
      }
    }
    switch (hInfo.type) {
      case 'rule.enter':
        this.level += 1;
        break;
      case 'rule.fail':
      case 'rule.match':
        this.level -= 1;
    }
  }

};

// ---------------------------------------------------------------------------
export var DetailedTracer = class DetailedTracer extends AdvancedTracer {
  constructor(input1, hOptions = {}) {
    var hVars;
    super(hOptions);
    this.input = input1;
    ({hVars} = getOptions(hOptions, {
      hVars: {}
    }));
    this.hVars = hOptions.hVars;
  }

  // ..........................................................
  varStr() {
    var i, lParts, len, ref, value, varname;
    if (isEmpty(this.hVars)) {
      return '';
    }
    lParts = [];
    ref = keys(this.hVars);
    for (i = 0, len = ref.length; i < len; i++) {
      varname = ref[i];
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
  traceStr(hInfo) {
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
export var getTracer = (tracer = 'advanced', input, hVars = {}) => {
  var hOptions, option;
  switch (typeof tracer) {
    case 'undefined':
      return new NullTracer();
    case 'object':
      if (hasKey(tracer, trace)) {
        return tracer;
      } else if (tracer === null) {
        return new NullTracer();
      } else {
        return croak("Invalid tracer object, no 'trace' method");
      }
      break;
    case 'function':
      return {
        trace: tracer
      };
    case 'string':
      [tracer, option] = tracer.split('/');
      hOptions = {hVars};
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
          return new DetailedTracer(input, hOptions);
        case 'peggy':
          return undef;
        default:
          return new NullTracer();
      }
  }
};

//# sourceMappingURL=tracer.js.map
