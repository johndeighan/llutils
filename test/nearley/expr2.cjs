// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }
var grammar = {
    Lexer: undefined,
    ParserRules: [
    {"name": "expr", "symbols": ["int", {"literal":"+"}, "int"], "postprocess": ([fst, _, snd]) => fst + snd},
    {"name": "expr", "symbols": ["int", {"literal":"-"}, "int"], "postprocess": ([fst, _, snd]) => fst - snd},
    {"name": "expr", "symbols": ["int", {"literal":"*"}, "int"], "postprocess": ([fst, _, snd]) => fst * snd},
    {"name": "expr", "symbols": ["int", {"literal":"/"}, "int"], "postprocess": ([fst, _, snd]) => fst / snd},
    {"name": "int$ebnf$1", "symbols": [/[0-9]/]},
    {"name": "int$ebnf$1", "symbols": ["int$ebnf$1", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "int", "symbols": ["int$ebnf$1"], "postprocess": d => parseInt(d[0].join(""))}
]
  , ParserStart: "expr"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
