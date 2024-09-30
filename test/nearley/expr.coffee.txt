# Generated automatically by nearley, version unknown
# http://github.com/Hardmath123/nearley
do ->
  id = (d) -> d[0]

  grammar = {
    Lexer: undefined,
    ParserRules: [
          {"name": "expr", "symbols": ["number", {"literal":"+"}, "number"], "postprocess": 
              (data) =>
                 return {
                    op: "sum"
                    left:  data[0]
                    right: data[2]
                    }
              },
          {"name": "number$ebnf$1", "symbols": [/[0-9]/]},
          {"name": "number$ebnf$1", "symbols": ["number$ebnf$1", /[0-9]/], "postprocess": (d) -> d[0].concat([d[1]])},
          {"name": "number", "symbols": ["number$ebnf$1"], "postprocess": 
              (data) =>
                 parseInt(data[0].join(""))
              }
      ],
    ParserStart: "expr"
  }
  if typeof module != 'undefined' && typeof module.exports != 'undefined'
    module.exports = grammar;
  else
    window.grammar = grammar;
