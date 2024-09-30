// Generated automatically by nearley, version unknown
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }
var grammar = {
    Lexer: undefined,
    ParserRules: [
    {"name": "a$string$1", "symbols": [{"literal":"a"}, {"literal":"b"}, {"literal":"c"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "a", "symbols": ["a$string$1"]}
]
  , ParserStart: "a"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
