// Generated automatically by nearley, version unknown
// http://github.com/Hardmath123/nearley
(function() {
  var grammar, id;
  id = function(d) {
    return d[0];
  };
  grammar = {
    Lexer: void 0,
    ParserRules: [
      {
        "name": "expr",
        "symbols": [
          "number",
          {
            "literal": "+"
          },
          "number"
        ],
        "postprocess": (data) => {
          return {
            op: "sum",
            left: data[0],
            right: data[2]
          };
        }
      },
      {
        "name": "number$ebnf$1",
        "symbols": [/[0-9]/]
      },
      {
        "name": "number$ebnf$1",
        "symbols": ["number$ebnf$1",
      /[0-9]/],
        "postprocess": function(d) {
          return d[0].concat([d[1]]);
        }
      },
      {
        "name": "number",
        "symbols": ["number$ebnf$1"],
        "postprocess": (data) => {
          return parseInt(data[0].join(""));
        }
      }
    ],
    ParserStart: "expr"
  };
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    return module.exports = grammar;
  } else {
    return window.grammar = grammar;
  }
})();

//# sourceMappingURL=expr.generated.js.map
