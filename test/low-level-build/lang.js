// @generated by Peggy 4.0.2.
//
// https://peggyjs.org/



	var init, isExtend, isIndent, isSep, isUndent, level, log, parse__EXTEND__1, parse__INDENTATION__1, parse__INDENT__1, parse__SEP__1, parse__UNDENT__1, sep;

	level = 0;

	sep = false;

	log = (...lObj) => {
	  var i, len, obj;
	  for (i = 0, len = lObj.length; i < len; i++) {
	    obj = lObj[i];
	    console.log(obj);
	  }
	  return true;
	};

	isSep = ({match, nTabs}) => {
	  return sep || (match && (nTabs === level));
	};

	isIndent = ({match, nTabs}) => {
	  return match && (nTabs === level + 1);
	};

	isExtend = ({match, nTabs}) => {
	  return match && (nTabs > level + 1);
	};

	isUndent = ({match, nTabs}) => {
	  if (match && (nTabs < level)) {
	    return true;
	  }
	  if ((nTabs === 0) && (level > 0)) {
	    return true;
	  }
	  return false;
	};

	init = () => {
	  level = 0;
	  return sep = false;
	};

	// --------------------------------------------------------------
	parse__SEP__1 = (hInfo) => {
	  sep = false;
	  return 'SEP';
	};

	// --------------------------------------------------------------
	parse__INDENT__1 = (hInfo) => {
	  level += 1;
	  return `INDENT ${level - 1} -> ${level}`;
	};

	// --------------------------------------------------------------
	parse__EXTEND__1 = (hInfo) => {
	  return 'EXTEND';
	};

	// --------------------------------------------------------------
	parse__UNDENT__1 = (hInfo) => {
	  level -= 1;
	  sep = true; // cause SEP after last UNDENT
	  return `UNDENT ${level + 1} -> ${level}`;
	};

	// --------------------------------------------------------------
	parse__INDENTATION__1 = (lTabs) => {
	  return {
	    match: lTabs !== null,
	    nTabs: lTabs === null ? 0 : lTabs.length
	  };
	};


	var init, parse__identifier__1, parse__program__1, parse__stmt__1, parse__stmt__2;

	import {
	  undef,
	  defined,
	  OL,
	  assert,
	  nonEmpty
	} from '@jdeighan/llutils';

	import {
	  getTracer
	} from '@jdeighan/llutils/peggy';

	export var evaluate = (input, tracerType = 'none') => {
	  var tracer;
	  tracer = getTracer(tracerType, input, {
	    level: () => {
	      return level;
	    },
	    sep: () => {
	      return sep;
	    }
	  });
	  if (defined(tracer)) {
	    return peg$parse(input, {tracer});
	  } else {
	    return peg$parse(input);
	  }
	};

	init = () => {
	  var level, sep;
	  level = 0;
	  return sep = false;
	};

	// --------------------------------------------------------------
	parse__program__1 = (lStmts) => {
	  return {
	    type: 'program',
	    body: lStmts
	  };
	};

	// --------------------------------------------------------------
	parse__stmt__1 = (varname, val) => {
	  return {
	    type: 'assign',
	    varname,
	    val
	  };
	};

	// --------------------------------------------------------------
	parse__stmt__2 = (body) => {
	  return {
	    type: 'if',
	    body
	  };
	};

	// --------------------------------------------------------------
	parse__identifier__1 = (str) => {
	  return str;
	};

function peg$subclass(child, parent) {
  function C() { this.constructor = child; }
  C.prototype = parent.prototype;
  child.prototype = new C();
}

function peg$SyntaxError(message, expected, found, location) {
  var self = Error.call(this, message);
  // istanbul ignore next Check is a necessary evil to support older environments
  if (Object.setPrototypeOf) {
    Object.setPrototypeOf(self, peg$SyntaxError.prototype);
  }
  self.expected = expected;
  self.found = found;
  self.location = location;
  self.name = "SyntaxError";
  return self;
}

peg$subclass(peg$SyntaxError, Error);

function peg$padEnd(str, targetLength, padString) {
  padString = padString || " ";
  if (str.length > targetLength) { return str; }
  targetLength -= str.length;
  padString += padString.repeat(targetLength);
  return str + padString.slice(0, targetLength);
}

peg$SyntaxError.prototype.format = function(sources) {
  var str = "Error: " + this.message;
  if (this.location) {
    var src = null;
    var k;
    for (k = 0; k < sources.length; k++) {
      if (sources[k].source === this.location.source) {
        src = sources[k].text.split(/\r\n|\n|\r/g);
        break;
      }
    }
    var s = this.location.start;
    var offset_s = (this.location.source && (typeof this.location.source.offset === "function"))
      ? this.location.source.offset(s)
      : s;
    var loc = this.location.source + ":" + offset_s.line + ":" + offset_s.column;
    if (src) {
      var e = this.location.end;
      var filler = peg$padEnd("", offset_s.line.toString().length, ' ');
      var line = src[s.line - 1];
      var last = s.line === e.line ? e.column : line.length + 1;
      var hatLen = (last - s.column) || 1;
      str += "\n --> " + loc + "\n"
          + filler + " |\n"
          + offset_s.line + " | " + line + "\n"
          + filler + " | " + peg$padEnd("", s.column - 1, ' ')
          + peg$padEnd("", hatLen, "^");
    } else {
      str += "\n at " + loc;
    }
  }
  return str;
};

peg$SyntaxError.buildMessage = function(expected, found) {
  var DESCRIBE_EXPECTATION_FNS = {
    literal: function(expectation) {
      return "\"" + literalEscape(expectation.text) + "\"";
    },

    class: function(expectation) {
      var escapedParts = expectation.parts.map(function(part) {
        return Array.isArray(part)
          ? classEscape(part[0]) + "-" + classEscape(part[1])
          : classEscape(part);
      });

      return "[" + (expectation.inverted ? "^" : "") + escapedParts.join("") + "]";
    },

    any: function() {
      return "any character";
    },

    end: function() {
      return "end of input";
    },

    other: function(expectation) {
      return expectation.description;
    }
  };

  function hex(ch) {
    return ch.charCodeAt(0).toString(16).toUpperCase();
  }

  function literalEscape(s) {
    return s
      .replace(/\\/g, "\\\\")
      .replace(/"/g,  "\\\"")
      .replace(/\0/g, "\\0")
      .replace(/\t/g, "\\t")
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/[\x00-\x0F]/g,          function(ch) { return "\\x0" + hex(ch); })
      .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) { return "\\x"  + hex(ch); });
  }

  function classEscape(s) {
    return s
      .replace(/\\/g, "\\\\")
      .replace(/\]/g, "\\]")
      .replace(/\^/g, "\\^")
      .replace(/-/g,  "\\-")
      .replace(/\0/g, "\\0")
      .replace(/\t/g, "\\t")
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/[\x00-\x0F]/g,          function(ch) { return "\\x0" + hex(ch); })
      .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) { return "\\x"  + hex(ch); });
  }

  function describeExpectation(expectation) {
    return DESCRIBE_EXPECTATION_FNS[expectation.type](expectation);
  }

  function describeExpected(expected) {
    var descriptions = expected.map(describeExpectation);
    var i, j;

    descriptions.sort();

    if (descriptions.length > 0) {
      for (i = 1, j = 1; i < descriptions.length; i++) {
        if (descriptions[i - 1] !== descriptions[i]) {
          descriptions[j] = descriptions[i];
          j++;
        }
      }
      descriptions.length = j;
    }

    switch (descriptions.length) {
      case 1:
        return descriptions[0];

      case 2:
        return descriptions[0] + " or " + descriptions[1];

      default:
        return descriptions.slice(0, -1).join(", ")
          + ", or "
          + descriptions[descriptions.length - 1];
    }
  }

  function describeFound(found) {
    return found ? "\"" + literalEscape(found) + "\"" : "end of input";
  }

  return "Expected " + describeExpected(expected) + " but " + describeFound(found) + " found.";
};

function peg$DefaultTracer() {
  this.indentLevel = 0;
}

peg$DefaultTracer.prototype.destroy = function() {};
peg$DefaultTracer.prototype.trace = function(event) {
  var that = this;

  function log(event) {
    function repeat(str, n) {
       var resultStr = "", i;

       for (i = 0; i < n; i++) {
         resultStr += str;
       }

       return resultStr;
    }

    function pad(string, length) {
      return string + repeat(" ", length - string.length);
    }

    if (typeof console === "object") {
      console.log(
        event.location.start.line + ":" + event.location.start.column + "-"
          + event.location.end.line + ":" + event.location.end.column + " "
          + pad(event.type, 12) + " "
          + repeat("  ", that.indentLevel)
          + (event.type.startsWith('rule') ? '<' + event.rule + '>' : '')
          + (event.result ? ' ' + JSON.stringify(event.result) : '')
      );
    }
  }

  switch (event.type) {
    case "rule.enter":
      log(event);
      this.indentLevel++;
      break;

    case "rule.match":
      this.indentLevel--;
      log(event);
      break;

    case "rule.fail":
      this.indentLevel--;
      log(event);
      break;

  }
};

function peg$parse(input, options) {
  options = options !== undefined ? options : {};

  var peg$FAILED = {};
  var peg$source = options.grammarSource;

  var peg$startRuleFunctions = { program: peg$parse_program, stmt: peg$parse_stmt, identifier: peg$parse_identifier, int: peg$parse_int, NL: peg$parse_NL, SEP: peg$parse_SEP, INDENT: peg$parse_INDENT, EXTEND: peg$parse_EXTEND, UNDENT: peg$parse_UNDENT, INDENTATION: peg$parse_INDENTATION };
  var peg$startRuleFunction = peg$parse_program;

  var peg$c0 = "lStmts";
  var peg$c1 = "varname";
  var peg$c2 = "=";
  var peg$c3 = "val";
  var peg$c4 = "if";
  var peg$c5 = "body";
  var peg$c6 = "str";
  var peg$c7 = "\r";
  var peg$c8 = "\n";
  var peg$c9 = "hInfo";
  var peg$c10 = "\t";
  var peg$c11 = "lTabs";
  var peg$r0 = /^[a-z]/;
  var peg$r1 = /^[0-9]/;
  var peg$r2 = /^[ \t]/;
  var peg$e0 = peg$literalExpectation("=", false);
  var peg$e1 = peg$literalExpectation("if", false);
  var peg$e2 = peg$classExpectation([["a", "z"]], false, false);
  var peg$e3 = peg$classExpectation([["0", "9"]], false, false);
  var peg$e4 = peg$literalExpectation("\r", false);
  var peg$e5 = peg$literalExpectation("\n", false);
  var peg$e6 = peg$classExpectation([" ", "\t"], false, false);
  var peg$e7 = peg$literalExpectation("\t", false);

  var peg$f0 = function(lStmts) { return parse__program__1(lStmts); };
  var peg$f1 = function(varname, val) { return parse__stmt__1(varname, val); };
  var peg$f2 = function(body) { return parse__stmt__2(body); };
  var peg$f3 = function(str) {return (str != 'if');};
  var peg$f4 = function(str) { return parse__identifier__1(str); };
  var peg$f5 = function(hInfo) {return isSep(hInfo)};
  var peg$f6 = function(hInfo) { return parse__SEP__1(hInfo); };
  var peg$f7 = function(hInfo) {return isIndent(hInfo)};
  var peg$f8 = function(hInfo) { return parse__INDENT__1(hInfo); };
  var peg$f9 = function(hInfo) {return isExtend(hInfo)};
  var peg$f10 = function(hInfo) { return parse__EXTEND__1(hInfo); };
  var peg$f11 = function(hInfo) {return isUndent(hInfo)};
  var peg$f12 = function(hInfo) { return parse__UNDENT__1(hInfo); };
  var peg$f13 = function(lTabs) { return parse__INDENTATION__1(lTabs); };
  var peg$currPos = options.peg$currPos | 0;
  var peg$savedPos = peg$currPos;
  var peg$posDetailsCache = [{ line: 1, column: 1 }];
  var peg$maxFailPos = peg$currPos;
  var peg$maxFailExpected = options.peg$maxFailExpected || [];
  var peg$silentFails = options.peg$silentFails | 0;

  var peg$tracer = ("tracer" in options) && (options.tracer !== undefined)
    ? options.tracer
    : new peg$DefaultTracer();

  var peg$result;

  if (options.startRule) {
    if (!(options.startRule in peg$startRuleFunctions)) {
      throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
    }

    peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
  }

  function text() {
    return input.substring(peg$savedPos, peg$currPos);
  }

  function offset() {
    return peg$savedPos;
  }

  function range() {
    return {
      source: peg$source,
      start: peg$savedPos,
      end: peg$currPos
    };
  }

  function location() {
    return peg$computeLocation(peg$savedPos, peg$currPos);
  }

  function expected(description, location) {
    location = location !== undefined
      ? location
      : peg$computeLocation(peg$savedPos, peg$currPos);

    throw peg$buildStructuredError(
      [peg$otherExpectation(description)],
      input.substring(peg$savedPos, peg$currPos),
      location
    );
  }

  function error(message, location) {
    location = location !== undefined
      ? location
      : peg$computeLocation(peg$savedPos, peg$currPos);

    throw peg$buildSimpleError(message, location);
  }

  function peg$literalExpectation(text, ignoreCase) {
    return { type: "literal", text: text, ignoreCase: ignoreCase };
  }

  function peg$classExpectation(parts, inverted, ignoreCase) {
    return { type: "class", parts: parts, inverted: inverted, ignoreCase: ignoreCase };
  }

  function peg$anyExpectation() {
    return { type: "any" };
  }

  function peg$endExpectation() {
    return { type: "end" };
  }

  function peg$otherExpectation(description) {
    return { type: "other", description: description };
  }

  function peg$computePosDetails(pos) {
    var details = peg$posDetailsCache[pos];
    var p;

    if (details) {
      return details;
    } else {
      if (pos >= peg$posDetailsCache.length) {
        p = peg$posDetailsCache.length - 1;
      } else {
        p = pos;
        while (!peg$posDetailsCache[--p]) {}
      }

      details = peg$posDetailsCache[p];
      details = {
        line: details.line,
        column: details.column
      };

      while (p < pos) {
        if (input.charCodeAt(p) === 10) {
          details.line++;
          details.column = 1;
        } else {
          details.column++;
        }

        p++;
      }

      peg$posDetailsCache[pos] = details;

      return details;
    }
  }

  function peg$computeLocation(startPos, endPos, offset) {
    var startPosDetails = peg$computePosDetails(startPos);
    var endPosDetails = peg$computePosDetails(endPos);

    var res = {
      source: peg$source,
      start: {
        offset: startPos,
        line: startPosDetails.line,
        column: startPosDetails.column
      },
      end: {
        offset: endPos,
        line: endPosDetails.line,
        column: endPosDetails.column
      }
    };
    if (offset && peg$source && (typeof peg$source.offset === "function")) {
      res.start = peg$source.offset(res.start);
      res.end = peg$source.offset(res.end);
    }
    return res;
  }

  function peg$fail(expected) {
    if (peg$currPos < peg$maxFailPos) { return; }

    if (peg$currPos > peg$maxFailPos) {
      peg$maxFailPos = peg$currPos;
      peg$maxFailExpected = [];
    }

    peg$maxFailExpected.push(expected);
  }

  function peg$buildSimpleError(message, location) {
    return new peg$SyntaxError(message, null, null, location);
  }

  function peg$buildStructuredError(expected, found, location) {
    return new peg$SyntaxError(
      peg$SyntaxError.buildMessage(expected, found),
      expected,
      found,
      location
    );
  }

  function peg$parse_program() {
    var startPos = peg$currPos;
    var s0, s1, s2, s3, s4;

    peg$tracer.trace({
      type: "rule.enter",
      rule: "program",
      location: peg$computeLocation(startPos, startPos, true),
    });

    s0 = peg$currPos;
    s1 = peg$currPos;
    s2 = [];
    s3 = peg$parse_stmt();
    while (s3 !== peg$FAILED) {
      s2.push(s3);
      s3 = peg$currPos;
      s4 = peg$parse_SEP();
      if (s4 !== peg$FAILED) {
        s4 = peg$parse_stmt();
        if (s4 === peg$FAILED) {
          peg$currPos = s3;
          s3 = peg$FAILED;
        } else {
          s3 = s4;
        }
      } else {
        s3 = s4;
      }
    }
    if (s2.length < 1) {
      peg$currPos = s1;
      s1 = peg$FAILED;
    } else {
      s1 = s2;
    }
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$parse_NL();
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$parse_NL();
      }
      peg$savedPos = s0;
      s0 = peg$f0(s1);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    if (s0 !== peg$FAILED) {
      peg$tracer.trace({
        type: "rule.match",
        rule: "program",
        result: s0,
        location: peg$computeLocation(startPos, peg$currPos, true),
      });
    } else {
      peg$tracer.trace({
        type: "rule.fail",
        rule: "program",
        location: peg$computeLocation(startPos, startPos, true),
      });
    }

    return s0;
  }

  function peg$parse_stmt() {
    var startPos = peg$currPos;
    var s0, s1, s2, s3, s4, s5, s6;

    peg$tracer.trace({
      type: "rule.enter",
      rule: "stmt",
      location: peg$computeLocation(startPos, startPos, true),
    });

    s0 = peg$currPos;
    s1 = peg$parse_identifier();
    if (s1 !== peg$FAILED) {
      if (input.charCodeAt(peg$currPos) === 61) {
        s2 = peg$c2;
        peg$currPos++;
        peg$tracer.trace({
          type: "string.match",
          rule: "stmt",
          result: "=",
          location: peg$computeLocation(startPos, peg$currPos, true),
        });
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$e0); }
        peg$tracer.trace({
          type: "string.fail",
          rule: "stmt",
          details: "=",
          location: peg$computeLocation(peg$currPos, peg$currPos, true),
        });
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parse_int();
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s0 = peg$f1(s1, s3);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c4) {
        s1 = peg$c4;
        peg$currPos += 2;
        peg$tracer.trace({
          type: "string.match",
          rule: "stmt",
          result: "if",
          location: peg$computeLocation(startPos, peg$currPos, true),
        });
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$e1); }
        peg$tracer.trace({
          type: "string.fail",
          rule: "stmt",
          details: "if",
          location: peg$computeLocation(peg$currPos, peg$currPos, true),
        });
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parse_INDENT();
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          s4 = [];
          s5 = peg$parse_stmt();
          while (s5 !== peg$FAILED) {
            s4.push(s5);
            s5 = peg$currPos;
            s6 = peg$parse_SEP();
            if (s6 !== peg$FAILED) {
              s6 = peg$parse_stmt();
              if (s6 === peg$FAILED) {
                peg$currPos = s5;
                s5 = peg$FAILED;
              } else {
                s5 = s6;
              }
            } else {
              s5 = s6;
            }
          }
          if (s4.length < 1) {
            peg$currPos = s3;
            s3 = peg$FAILED;
          } else {
            s3 = s4;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parse_UNDENT();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s0 = peg$f2(s3);
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    }

    if (s0 !== peg$FAILED) {
      peg$tracer.trace({
        type: "rule.match",
        rule: "stmt",
        result: s0,
        location: peg$computeLocation(startPos, peg$currPos, true),
      });
    } else {
      peg$tracer.trace({
        type: "rule.fail",
        rule: "stmt",
        location: peg$computeLocation(startPos, startPos, true),
      });
    }

    return s0;
  }

  function peg$parse_identifier() {
    var startPos = peg$currPos;
    var s0, s1, s2, s3;

    peg$tracer.trace({
      type: "rule.enter",
      rule: "identifier",
      location: peg$computeLocation(startPos, startPos, true),
    });

    s0 = peg$currPos;
    s1 = peg$currPos;
    s2 = [];
    s3 = input.charAt(peg$currPos);
    if (peg$r0.test(s3)) {
      peg$currPos++;
      peg$tracer.trace({
        type: "class.match",
        rule: "identifier",
        result: input.charAt(peg$currPos-1),
        details: peg$r0.toString(),
        location: peg$computeLocation(peg$currPos-1, peg$currPos, true),
      });
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e2); }
      peg$tracer.trace({
        type: "class.fail",
        rule: "identifier",
        details: peg$r0.toString(),
        location: peg$computeLocation(peg$currPos, peg$currPos, true),
      });
    }
    if (s3 !== peg$FAILED) {
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = input.charAt(peg$currPos);
        if (peg$r0.test(s3)) {
          peg$currPos++;
          peg$tracer.trace({
            type: "class.match",
            rule: "identifier",
            result: input.charAt(peg$currPos-1),
            details: peg$r0.toString(),
            location: peg$computeLocation(peg$currPos-1, peg$currPos, true),
          });
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$e2); }
          peg$tracer.trace({
            type: "class.fail",
            rule: "identifier",
            details: peg$r0.toString(),
            location: peg$computeLocation(peg$currPos, peg$currPos, true),
          });
        }
      }
    } else {
      s2 = peg$FAILED;
    }
    if (s2 !== peg$FAILED) {
      s1 = input.substring(s1, peg$currPos);
    } else {
      s1 = s2;
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = peg$currPos;
      s2 = peg$f3(s1);
      if (s2) {
        s2 = undefined;
      } else {
        s2 = peg$FAILED;
      }
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f4(s1);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    if (s0 !== peg$FAILED) {
      peg$tracer.trace({
        type: "rule.match",
        rule: "identifier",
        result: s0,
        location: peg$computeLocation(startPos, peg$currPos, true),
      });
    } else {
      peg$tracer.trace({
        type: "rule.fail",
        rule: "identifier",
        location: peg$computeLocation(startPos, startPos, true),
      });
    }

    return s0;
  }

  function peg$parse_int() {
    var startPos = peg$currPos;
    var s0, s1, s2;

    peg$tracer.trace({
      type: "rule.enter",
      rule: "int",
      location: peg$computeLocation(startPos, startPos, true),
    });

    s0 = peg$currPos;
    s1 = [];
    s2 = input.charAt(peg$currPos);
    if (peg$r1.test(s2)) {
      peg$currPos++;
      peg$tracer.trace({
        type: "class.match",
        rule: "int",
        result: input.charAt(peg$currPos-1),
        details: peg$r1.toString(),
        location: peg$computeLocation(peg$currPos-1, peg$currPos, true),
      });
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e3); }
      peg$tracer.trace({
        type: "class.fail",
        rule: "int",
        details: peg$r1.toString(),
        location: peg$computeLocation(peg$currPos, peg$currPos, true),
      });
    }
    if (s2 !== peg$FAILED) {
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        s2 = input.charAt(peg$currPos);
        if (peg$r1.test(s2)) {
          peg$currPos++;
          peg$tracer.trace({
            type: "class.match",
            rule: "int",
            result: input.charAt(peg$currPos-1),
            details: peg$r1.toString(),
            location: peg$computeLocation(peg$currPos-1, peg$currPos, true),
          });
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$e3); }
          peg$tracer.trace({
            type: "class.fail",
            rule: "int",
            details: peg$r1.toString(),
            location: peg$computeLocation(peg$currPos, peg$currPos, true),
          });
        }
      }
    } else {
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      s0 = input.substring(s0, peg$currPos);
    } else {
      s0 = s1;
    }

    if (s0 !== peg$FAILED) {
      peg$tracer.trace({
        type: "rule.match",
        rule: "int",
        result: s0,
        location: peg$computeLocation(startPos, peg$currPos, true),
      });
    } else {
      peg$tracer.trace({
        type: "rule.fail",
        rule: "int",
        location: peg$computeLocation(startPos, startPos, true),
      });
    }

    return s0;
  }

  function peg$parse_NL() {
    var startPos = peg$currPos;
    var s0, s1, s2;

    peg$tracer.trace({
      type: "rule.enter",
      rule: "NL",
      location: peg$computeLocation(startPos, startPos, true),
    });

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 13) {
      s1 = peg$c7;
      peg$currPos++;
      peg$tracer.trace({
        type: "string.match",
        rule: "NL",
        result: "\r",
        location: peg$computeLocation(startPos, peg$currPos, true),
      });
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e4); }
      peg$tracer.trace({
        type: "string.fail",
        rule: "NL",
        details: "\r",
        location: peg$computeLocation(peg$currPos, peg$currPos, true),
      });
    }
    if (s1 === peg$FAILED) {
      s1 = null;
    }
    if (input.charCodeAt(peg$currPos) === 10) {
      s2 = peg$c8;
      peg$currPos++;
      peg$tracer.trace({
        type: "string.match",
        rule: "NL",
        result: "\n",
        location: peg$computeLocation(startPos, peg$currPos, true),
      });
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e5); }
      peg$tracer.trace({
        type: "string.fail",
        rule: "NL",
        details: "\n",
        location: peg$computeLocation(peg$currPos, peg$currPos, true),
      });
    }
    if (s2 !== peg$FAILED) {
      s1 = [s1, s2];
      s0 = s1;
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    if (s0 !== peg$FAILED) {
      peg$tracer.trace({
        type: "rule.match",
        rule: "NL",
        result: s0,
        location: peg$computeLocation(startPos, peg$currPos, true),
      });
    } else {
      peg$tracer.trace({
        type: "rule.fail",
        rule: "NL",
        location: peg$computeLocation(startPos, startPos, true),
      });
    }

    return s0;
  }

  function peg$parse_SEP() {
    var startPos = peg$currPos;
    var s0, s1, s2;

    peg$tracer.trace({
      type: "rule.enter",
      rule: "SEP",
      location: peg$computeLocation(startPos, startPos, true),
    });

    s0 = peg$currPos;
    s1 = peg$parse_INDENTATION();
    peg$savedPos = peg$currPos;
    s2 = peg$f5(s1);
    if (s2) {
      s2 = undefined;
    } else {
      s2 = peg$FAILED;
    }
    if (s2 !== peg$FAILED) {
      peg$savedPos = s0;
      s0 = peg$f6(s1);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    if (s0 !== peg$FAILED) {
      peg$tracer.trace({
        type: "rule.match",
        rule: "SEP",
        result: s0,
        location: peg$computeLocation(startPos, peg$currPos, true),
      });
    } else {
      peg$tracer.trace({
        type: "rule.fail",
        rule: "SEP",
        location: peg$computeLocation(startPos, startPos, true),
      });
    }

    return s0;
  }

  function peg$parse_INDENT() {
    var startPos = peg$currPos;
    var s0, s1, s2;

    peg$tracer.trace({
      type: "rule.enter",
      rule: "INDENT",
      location: peg$computeLocation(startPos, startPos, true),
    });

    s0 = peg$currPos;
    s1 = peg$parse_INDENTATION();
    peg$savedPos = peg$currPos;
    s2 = peg$f7(s1);
    if (s2) {
      s2 = undefined;
    } else {
      s2 = peg$FAILED;
    }
    if (s2 !== peg$FAILED) {
      peg$savedPos = s0;
      s0 = peg$f8(s1);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    if (s0 !== peg$FAILED) {
      peg$tracer.trace({
        type: "rule.match",
        rule: "INDENT",
        result: s0,
        location: peg$computeLocation(startPos, peg$currPos, true),
      });
    } else {
      peg$tracer.trace({
        type: "rule.fail",
        rule: "INDENT",
        location: peg$computeLocation(startPos, startPos, true),
      });
    }

    return s0;
  }

  function peg$parse_EXTEND() {
    var startPos = peg$currPos;
    var s0, s1, s2;

    peg$tracer.trace({
      type: "rule.enter",
      rule: "EXTEND",
      location: peg$computeLocation(startPos, startPos, true),
    });

    s0 = peg$currPos;
    s1 = peg$parse_INDENTATION();
    peg$savedPos = peg$currPos;
    s2 = peg$f9(s1);
    if (s2) {
      s2 = undefined;
    } else {
      s2 = peg$FAILED;
    }
    if (s2 !== peg$FAILED) {
      peg$savedPos = s0;
      s0 = peg$f10(s1);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    if (s0 !== peg$FAILED) {
      peg$tracer.trace({
        type: "rule.match",
        rule: "EXTEND",
        result: s0,
        location: peg$computeLocation(startPos, peg$currPos, true),
      });
    } else {
      peg$tracer.trace({
        type: "rule.fail",
        rule: "EXTEND",
        location: peg$computeLocation(startPos, startPos, true),
      });
    }

    return s0;
  }

  function peg$parse_UNDENT() {
    var startPos = peg$currPos;
    var s0, s1, s2;

    peg$tracer.trace({
      type: "rule.enter",
      rule: "UNDENT",
      location: peg$computeLocation(startPos, startPos, true),
    });

    s0 = peg$currPos;
    s1 = peg$parse_INDENTATION();
    peg$savedPos = peg$currPos;
    s2 = peg$f11(s1);
    if (s2) {
      s2 = undefined;
    } else {
      s2 = peg$FAILED;
    }
    if (s2 !== peg$FAILED) {
      peg$savedPos = s0;
      s0 = peg$f12(s1);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    if (s0 !== peg$FAILED) {
      peg$tracer.trace({
        type: "rule.match",
        rule: "UNDENT",
        result: s0,
        location: peg$computeLocation(startPos, peg$currPos, true),
      });
    } else {
      peg$tracer.trace({
        type: "rule.fail",
        rule: "UNDENT",
        location: peg$computeLocation(startPos, startPos, true),
      });
    }

    return s0;
  }

  function peg$parse_INDENTATION() {
    var startPos = peg$currPos;
    var s0, s1, s2, s3, s4, s5, s6, s7;

    peg$tracer.trace({
      type: "rule.enter",
      rule: "INDENTATION",
      location: peg$computeLocation(startPos, startPos, true),
    });

    s0 = peg$currPos;
    s1 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 13) {
      s2 = peg$c7;
      peg$currPos++;
      peg$tracer.trace({
        type: "string.match",
        rule: "INDENTATION",
        result: "\r",
        location: peg$computeLocation(startPos, peg$currPos, true),
      });
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e4); }
      peg$tracer.trace({
        type: "string.fail",
        rule: "INDENTATION",
        details: "\r",
        location: peg$computeLocation(peg$currPos, peg$currPos, true),
      });
    }
    if (s2 === peg$FAILED) {
      s2 = null;
    }
    if (input.charCodeAt(peg$currPos) === 10) {
      s3 = peg$c8;
      peg$currPos++;
      peg$tracer.trace({
        type: "string.match",
        rule: "INDENTATION",
        result: "\n",
        location: peg$computeLocation(startPos, peg$currPos, true),
      });
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e5); }
      peg$tracer.trace({
        type: "string.fail",
        rule: "INDENTATION",
        details: "\n",
        location: peg$computeLocation(peg$currPos, peg$currPos, true),
      });
    }
    if (s3 !== peg$FAILED) {
      s4 = [];
      s5 = peg$currPos;
      s6 = [];
      s7 = input.charAt(peg$currPos);
      if (peg$r2.test(s7)) {
        peg$currPos++;
        peg$tracer.trace({
          type: "class.match",
          rule: "INDENTATION",
          result: input.charAt(peg$currPos-1),
          details: peg$r2.toString(),
          location: peg$computeLocation(peg$currPos-1, peg$currPos, true),
        });
      } else {
        s7 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$e6); }
        peg$tracer.trace({
          type: "class.fail",
          rule: "INDENTATION",
          details: peg$r2.toString(),
          location: peg$computeLocation(peg$currPos, peg$currPos, true),
        });
      }
      while (s7 !== peg$FAILED) {
        s6.push(s7);
        s7 = input.charAt(peg$currPos);
        if (peg$r2.test(s7)) {
          peg$currPos++;
          peg$tracer.trace({
            type: "class.match",
            rule: "INDENTATION",
            result: input.charAt(peg$currPos-1),
            details: peg$r2.toString(),
            location: peg$computeLocation(peg$currPos-1, peg$currPos, true),
          });
        } else {
          s7 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$e6); }
          peg$tracer.trace({
            type: "class.fail",
            rule: "INDENTATION",
            details: peg$r2.toString(),
            location: peg$computeLocation(peg$currPos, peg$currPos, true),
          });
        }
      }
      if (input.charCodeAt(peg$currPos) === 10) {
        s7 = peg$c8;
        peg$currPos++;
        peg$tracer.trace({
          type: "string.match",
          rule: "INDENTATION",
          result: "\n",
          location: peg$computeLocation(startPos, peg$currPos, true),
        });
      } else {
        s7 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$e5); }
        peg$tracer.trace({
          type: "string.fail",
          rule: "INDENTATION",
          details: "\n",
          location: peg$computeLocation(peg$currPos, peg$currPos, true),
        });
      }
      if (s7 !== peg$FAILED) {
        s6 = [s6, s7];
        s5 = s6;
      } else {
        peg$currPos = s5;
        s5 = peg$FAILED;
      }
      while (s5 !== peg$FAILED) {
        s4.push(s5);
        s5 = peg$currPos;
        s6 = [];
        s7 = input.charAt(peg$currPos);
        if (peg$r2.test(s7)) {
          peg$currPos++;
          peg$tracer.trace({
            type: "class.match",
            rule: "INDENTATION",
            result: input.charAt(peg$currPos-1),
            details: peg$r2.toString(),
            location: peg$computeLocation(peg$currPos-1, peg$currPos, true),
          });
        } else {
          s7 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$e6); }
          peg$tracer.trace({
            type: "class.fail",
            rule: "INDENTATION",
            details: peg$r2.toString(),
            location: peg$computeLocation(peg$currPos, peg$currPos, true),
          });
        }
        while (s7 !== peg$FAILED) {
          s6.push(s7);
          s7 = input.charAt(peg$currPos);
          if (peg$r2.test(s7)) {
            peg$currPos++;
            peg$tracer.trace({
              type: "class.match",
              rule: "INDENTATION",
              result: input.charAt(peg$currPos-1),
              details: peg$r2.toString(),
              location: peg$computeLocation(peg$currPos-1, peg$currPos, true),
            });
          } else {
            s7 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$e6); }
            peg$tracer.trace({
              type: "class.fail",
              rule: "INDENTATION",
              details: peg$r2.toString(),
              location: peg$computeLocation(peg$currPos, peg$currPos, true),
            });
          }
        }
        if (input.charCodeAt(peg$currPos) === 10) {
          s7 = peg$c8;
          peg$currPos++;
          peg$tracer.trace({
            type: "string.match",
            rule: "INDENTATION",
            result: "\n",
            location: peg$computeLocation(startPos, peg$currPos, true),
          });
        } else {
          s7 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$e5); }
          peg$tracer.trace({
            type: "string.fail",
            rule: "INDENTATION",
            details: "\n",
            location: peg$computeLocation(peg$currPos, peg$currPos, true),
          });
        }
        if (s7 !== peg$FAILED) {
          s6 = [s6, s7];
          s5 = s6;
        } else {
          peg$currPos = s5;
          s5 = peg$FAILED;
        }
      }
      s5 = [];
      if (input.charCodeAt(peg$currPos) === 9) {
        s6 = peg$c10;
        peg$currPos++;
        peg$tracer.trace({
          type: "string.match",
          rule: "INDENTATION",
          result: "\t",
          location: peg$computeLocation(startPos, peg$currPos, true),
        });
      } else {
        s6 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$e7); }
        peg$tracer.trace({
          type: "string.fail",
          rule: "INDENTATION",
          details: "\t",
          location: peg$computeLocation(peg$currPos, peg$currPos, true),
        });
      }
      while (s6 !== peg$FAILED) {
        s5.push(s6);
        if (input.charCodeAt(peg$currPos) === 9) {
          s6 = peg$c10;
          peg$currPos++;
          peg$tracer.trace({
            type: "string.match",
            rule: "INDENTATION",
            result: "\t",
            location: peg$computeLocation(startPos, peg$currPos, true),
          });
        } else {
          s6 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$e7); }
          peg$tracer.trace({
            type: "string.fail",
            rule: "INDENTATION",
            details: "\t",
            location: peg$computeLocation(peg$currPos, peg$currPos, true),
          });
        }
      }
      s1 = s5;
    } else {
      peg$currPos = s1;
      s1 = peg$FAILED;
    }
    if (s1 === peg$FAILED) {
      s1 = null;
    }
    peg$savedPos = s0;
    s1 = peg$f13(s1);
    s0 = s1;

    if (s0 !== peg$FAILED) {
      peg$tracer.trace({
        type: "rule.match",
        rule: "INDENTATION",
        result: s0,
        location: peg$computeLocation(startPos, peg$currPos, true),
      });
    } else {
      peg$tracer.trace({
        type: "rule.fail",
        rule: "INDENTATION",
        location: peg$computeLocation(startPos, startPos, true),
      });
    }

    return s0;
  }


init();


init();

  peg$result = peg$startRuleFunction();

  if (options.peg$library) {
    return /** @type {any} */ ({
      peg$result,
      peg$currPos,
      peg$FAILED,
      peg$maxFailExpected,
      peg$maxFailPos
    });
  }
  peg$tracer.destroy();
  if (peg$result !== peg$FAILED && peg$currPos === input.length) {
    return peg$result;
  } else {
    if (peg$result !== peg$FAILED && peg$currPos < input.length) {
      peg$fail(peg$endExpectation());
    }

    throw peg$buildStructuredError(
      peg$maxFailExpected,
      peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null,
      peg$maxFailPos < input.length
        ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1)
        : peg$computeLocation(peg$maxFailPos, peg$maxFailPos)
    );
  }
}

const peg$allowedStartRules = [
  "program",
  "stmt",
  "identifier",
  "int",
  "NL",
  "SEP",
  "INDENT",
  "EXTEND",
  "UNDENT",
  "INDENTATION"
];

export {
  peg$DefaultTracer as DefaultTracer,
  peg$allowedStartRules as StartRules,
  peg$SyntaxError as SyntaxError,
  peg$parse as parse
};
