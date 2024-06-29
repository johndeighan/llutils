  // tracer.coffee
import {
  undef,
  defined,
  pass,
  OL,
  escapeStr,
  keys,
  assert,
  isString,
  isArray,
  isEmpty,
  getOptions
} from '@jdeighan/llutils';

// ---------------------------------------------------------------------------
export var NullTracer = class NullTracer {
  trace() {}

};

// ---------------------------------------------------------------------------
export var DefaultTracer = class DefaultTracer extends NullTracer {
  constructor(hOptions = {}) {
    super();
    hOptions = getOptions(hOptions, {
      ignore: ['_']
    });
    this.lIgnore = hOptions.ignore;
    this.level = 0;
  }

  // ..........................................................
  prefix(type) {
    var count;
    if ((type === 'rule.enter') || (type === 'match.string')) {
      return "│  ".repeat(this.level);
    } else if (type === 'fail.string') {
      return "│  ".repeat(this.level - 1) + "x  ";
    } else {
      count = (this.level === 0) ? 0 : this.level - 1;
      return "│  ".repeat(count) + "└─>";
    }
  }

  // ..........................................................
  traceStr(hInfo) {
    var e_col, e_line, e_offset, endPos, locStr, location, pre, result, rule, s_col, s_line, s_offset, type;
    ({type, rule, location, result} = hInfo);
    if (defined(location)) {
      ({
        line: s_line,
        column: s_col,
        offset: s_offset
      } = location.start);
      ({
        line: e_line,
        column: e_col,
        offset: e_offset
      } = location.end);
      locStr = `${s_line}:${s_col}:${s_offset}`;
      endPos = e_offset;
    } else {
      locStr = '?';
      endPos = undef;
    }
    pre = this.prefix(type);
    switch (type) {
      case 'rule.enter':
        return `${pre}? ${rule}`;
      case 'rule.fail':
        if (defined(location)) {
          return `${pre} NO (at ${locStr})`;
        } else {
          return `${pre} NO`;
        }
        break;
      case 'fail.string':
        if (defined(location)) {
          return `${pre} NO ${rule} (at ${locStr})`;
        } else {
          return `${pre} NO ${rule}`;
        }
        break;
      case 'rule.match':
      case 'match.string':
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
      default:
        return `UNKNOWN type: ${type}`;
    }
  }

  // ..........................................................
  trace(hInfo) {
    var i, len, result, str;
    // --- DEBUG console.dir hInfo

    // --- ignore whitespace rule
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
export var DetailedTracer = class DetailedTracer extends DefaultTracer {
  constructor(input1, hVars1 = {}) {
    super();
    this.input = input1;
    this.hVars = hVars1;
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
//        - a string: 'peggy','default','detailed'
//        - an object with a function property named 'trace'
//        - a function
export var getTracer = (tracer = 'default', input, hVars = {}) => {
  if (isEmpty(tracer) || (tracer === 'none') || (tracer === 'null')) {
    return new NullTracer();
  }
  switch (typeof tracer) {
    case 'undefined':
      return new NullTracer();
    case 'object':
      if (hasKey(tracer, trace)) {
        return tracer;
      } else {
        return croak("Invalid tracer object, no 'trace' method");
      }
      break;
    case 'function':
      return {
        trace: tracer
      };
    case 'string':
      switch (tracer) {
        case 'default':
          return new DefaultTracer();
        case 'detailed':
        case 'advanced':
          return new DetailedTracer(input, hVars);
        case 'peggy':
          return undef;
        default:
          return new NullTracer();
      }
  }
};

//# sourceMappingURL=tracer.js.map
