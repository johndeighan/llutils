// @generated by Peggy 4.0.3.
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

peg$DefaultTracer.prototype.trace = function(event) {
  var that = this;

  function log(event) {
    function repeat(string, n) {
       var result = "", i;

       for (i = 0; i < n; i++) {
         result += string;
       }

       return result;
    }

    function pad(string, length) {
      return string + repeat(" ", length - string.length);
    }

    if (typeof console === "object") {
      console.log(
        event.location.start.line + ":" + event.location.start.column + "-"
          + event.location.end.line + ":" + event.location.end.column + " "
          + pad(event.type, 10) + " "
          + repeat("  ", that.indentLevel) + event.rule
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

    default:
      throw new Error("Invalid event type: " + event.type + ".");
  }
};

function peg$parse(input, options) {
  options = options !== undefined ? options : {};

  var peg$FAILED = {};
  var peg$source = options.grammarSource;

  var peg$startRuleFunctions = { SEP: peg$parseSEP, INDENT: peg$parseINDENT, EXTEND: peg$parseEXTEND, UNDENT: peg$parseUNDENT, INDENTATION: peg$parseINDENTATION };
  var peg$startRuleFunction = peg$parseSEP;

  var peg$c0 = "hInfo";
  var peg$c1 = "\r";
  var peg$c2 = "\n";
  var peg$c3 = "\t";
  var peg$c4 = "lTabs";

  var peg$r0 = /^[ \t]/;

  var peg$e0 = peg$literalExpectation("\r", false);
  var peg$e1 = peg$literalExpectation("\n", false);
  var peg$e2 = peg$classExpectation([" ", "\t"], false, false);
  var peg$e3 = peg$literalExpectation("\t", false);

  var peg$f0 = function(hInfo) {return isSep(hInfo)};
  var peg$f1 = function(hInfo) { return parse__SEP__1(hInfo); };
  var peg$f2 = function(hInfo) {return isIndent(hInfo)};
  var peg$f3 = function(hInfo) { return parse__INDENT__1(hInfo); };
  var peg$f4 = function(hInfo) {return isExtend(hInfo)};
  var peg$f5 = function(hInfo) { return parse__EXTEND__1(hInfo); };
  var peg$f6 = function(hInfo) {return isUndent(hInfo)};
  var peg$f7 = function(hInfo) { return parse__UNDENT__1(hInfo); };
  var peg$f8 = function(lTabs) { return parse__INDENTATION__1(lTabs); };
  var peg$currPos = options.peg$currPos | 0;
  var peg$savedPos = peg$currPos;
  var peg$posDetailsCache = [{ line: 1, column: 1 }];
  var peg$maxFailPos = peg$currPos;
  var peg$maxFailExpected = options.peg$maxFailExpected || [];
  var peg$silentFails = options.peg$silentFails | 0;

  var peg$tracer = "tracer" in options ? options.tracer : new peg$DefaultTracer();

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

  function peg$parseSEP() {
    var startPos = peg$currPos;
    var s0, s1, s2;

    peg$tracer.trace({
      type: "rule.enter",
      rule: "SEP",
      location: peg$computeLocation(startPos, startPos, true)
    });

    s0 = peg$currPos;
    s1 = peg$parseINDENTATION();
    peg$savedPos = peg$currPos;
    s2 = peg$f0(s1);
    if (s2) {
      s2 = undefined;
    } else {
      s2 = peg$FAILED;
    }
    if (s2 !== peg$FAILED) {
      peg$savedPos = s0;
      s0 = peg$f1(s1);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    if (s0 !== peg$FAILED) {
      peg$tracer.trace({
        type: "rule.match",
        rule: "SEP",
        result: s0,
        location: peg$computeLocation(startPos, peg$currPos, true)
      });
    } else {
      peg$tracer.trace({
        type: "rule.fail",
        rule: "SEP",
        location: peg$computeLocation(startPos, startPos, true)
      });
    }

    return s0;
  }

  function peg$parseINDENT() {
    var startPos = peg$currPos;
    var s0, s1, s2;

    peg$tracer.trace({
      type: "rule.enter",
      rule: "INDENT",
      location: peg$computeLocation(startPos, startPos, true)
    });

    s0 = peg$currPos;
    s1 = peg$parseINDENTATION();
    peg$savedPos = peg$currPos;
    s2 = peg$f2(s1);
    if (s2) {
      s2 = undefined;
    } else {
      s2 = peg$FAILED;
    }
    if (s2 !== peg$FAILED) {
      peg$savedPos = s0;
      s0 = peg$f3(s1);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    if (s0 !== peg$FAILED) {
      peg$tracer.trace({
        type: "rule.match",
        rule: "INDENT",
        result: s0,
        location: peg$computeLocation(startPos, peg$currPos, true)
      });
    } else {
      peg$tracer.trace({
        type: "rule.fail",
        rule: "INDENT",
        location: peg$computeLocation(startPos, startPos, true)
      });
    }

    return s0;
  }

  function peg$parseEXTEND() {
    var startPos = peg$currPos;
    var s0, s1, s2;

    peg$tracer.trace({
      type: "rule.enter",
      rule: "EXTEND",
      location: peg$computeLocation(startPos, startPos, true)
    });

    s0 = peg$currPos;
    s1 = peg$parseINDENTATION();
    peg$savedPos = peg$currPos;
    s2 = peg$f4(s1);
    if (s2) {
      s2 = undefined;
    } else {
      s2 = peg$FAILED;
    }
    if (s2 !== peg$FAILED) {
      peg$savedPos = s0;
      s0 = peg$f5(s1);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    if (s0 !== peg$FAILED) {
      peg$tracer.trace({
        type: "rule.match",
        rule: "EXTEND",
        result: s0,
        location: peg$computeLocation(startPos, peg$currPos, true)
      });
    } else {
      peg$tracer.trace({
        type: "rule.fail",
        rule: "EXTEND",
        location: peg$computeLocation(startPos, startPos, true)
      });
    }

    return s0;
  }

  function peg$parseUNDENT() {
    var startPos = peg$currPos;
    var s0, s1, s2;

    peg$tracer.trace({
      type: "rule.enter",
      rule: "UNDENT",
      location: peg$computeLocation(startPos, startPos, true)
    });

    s0 = peg$currPos;
    s1 = peg$parseINDENTATION();
    peg$savedPos = peg$currPos;
    s2 = peg$f6(s1);
    if (s2) {
      s2 = undefined;
    } else {
      s2 = peg$FAILED;
    }
    if (s2 !== peg$FAILED) {
      peg$savedPos = s0;
      s0 = peg$f7(s1);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    if (s0 !== peg$FAILED) {
      peg$tracer.trace({
        type: "rule.match",
        rule: "UNDENT",
        result: s0,
        location: peg$computeLocation(startPos, peg$currPos, true)
      });
    } else {
      peg$tracer.trace({
        type: "rule.fail",
        rule: "UNDENT",
        location: peg$computeLocation(startPos, startPos, true)
      });
    }

    return s0;
  }

  function peg$parseINDENTATION() {
    var startPos = peg$currPos;
    var s0, s1, s2, s3, s4, s5, s6, s7;

    peg$tracer.trace({
      type: "rule.enter",
      rule: "INDENTATION",
      location: peg$computeLocation(startPos, startPos, true)
    });

    s0 = peg$currPos;
    s1 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 13) {
      s2 = peg$c1;
      peg$currPos++;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e0); }
    }
    if (s2 === peg$FAILED) {
      s2 = null;
    }
    if (input.charCodeAt(peg$currPos) === 10) {
      s3 = peg$c2;
      peg$currPos++;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e1); }
    }
    if (s3 !== peg$FAILED) {
      s4 = [];
      s5 = peg$currPos;
      s6 = [];
      s7 = input.charAt(peg$currPos);
      if (peg$r0.test(s7)) {
        peg$currPos++;
      } else {
        s7 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$e2); }
      }
      while (s7 !== peg$FAILED) {
        s6.push(s7);
        s7 = input.charAt(peg$currPos);
        if (peg$r0.test(s7)) {
          peg$currPos++;
        } else {
          s7 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$e2); }
        }
      }
      if (input.charCodeAt(peg$currPos) === 10) {
        s7 = peg$c2;
        peg$currPos++;
      } else {
        s7 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$e1); }
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
        if (peg$r0.test(s7)) {
          peg$currPos++;
        } else {
          s7 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$e2); }
        }
        while (s7 !== peg$FAILED) {
          s6.push(s7);
          s7 = input.charAt(peg$currPos);
          if (peg$r0.test(s7)) {
            peg$currPos++;
          } else {
            s7 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$e2); }
          }
        }
        if (input.charCodeAt(peg$currPos) === 10) {
          s7 = peg$c2;
          peg$currPos++;
        } else {
          s7 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$e1); }
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
        s6 = peg$c3;
        peg$currPos++;
      } else {
        s6 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$e3); }
      }
      while (s6 !== peg$FAILED) {
        s5.push(s6);
        if (input.charCodeAt(peg$currPos) === 9) {
          s6 = peg$c3;
          peg$currPos++;
        } else {
          s6 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$e3); }
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
    s1 = peg$f8(s1);
    s0 = s1;

    if (s0 !== peg$FAILED) {
      peg$tracer.trace({
        type: "rule.match",
        rule: "INDENTATION",
        result: s0,
        location: peg$computeLocation(startPos, peg$currPos, true)
      });
    } else {
      peg$tracer.trace({
        type: "rule.fail",
        rule: "INDENTATION",
        location: peg$computeLocation(startPos, startPos, true)
      });
    }

    return s0;
  }


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
