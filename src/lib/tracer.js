// tracer.coffee
var DefaultTracer, DetailedTracer, NullTracer;

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
  isEmpty
} from '@jdeighan/llutils';

// ---------------------------------------------------------------------------
NullTracer = class NullTracer {
  trace() {}

};

DefaultTracer = class DefaultTracer extends NullTracer {
  constructor() {
    super();
    this.level = 0;
  }

  prefix() {
    return "│  ".repeat(this.level);
  }

  result() {
    var count;
    count = (this.level === 0) ? 0 : this.level - 1;
    return "│  ".repeat(count) + "└─>";
  }

  // --- This allows unit testing
  traceStr(hInfo) {
    var column, line, location, offset, result, rule, type;
    ({type, rule, location, result} = hInfo);
    if (defined(location)) {
      ({line, column, offset} = location.start);
    }
    switch (type) {
      case 'rule.enter':
        return `${this.prefix()}? ${rule}`;
      case 'rule.fail':
        if (defined(location)) {
          return `${this.result()} NO (at ${line}:${column}:${offset})`;
        } else {
          return `${this.result()} NO`;
        }
        break;
      case 'rule.match':
        if (defined(result)) {
          return `${this.result()} ${OL(result)}`;
        } else {
          return `${this.result()} YES`;
        }
        break;
      default:
        return `UNKNOWN type: ${type}`;
    }
  }

  trace(hInfo) {
    var i, len, result, str;
    // --- ignore whitespace rule
    if (hInfo.rule === '_') {
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

DetailedTracer = class DetailedTracer extends DefaultTracer {
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
export var getTracer = (tracer, input, hVars = {}) => {
  if (tracer === null) {
    tracer = undef;
  }
  switch (typeof tracer) {
    case 'undefined':
      return new NullTracer();
    case 'object':
      if (hasKey(tracer, trace)) {
        return tracer;
      } else {
        return new NullTracer();
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
          return new DetailedTracer(input, hVars);
        case 'peggy':
          return undef;
        default:
          return new NullTracer();
      }
  }
};

//# sourceMappingURL=tracer.js.map
