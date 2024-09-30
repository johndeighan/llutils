@preprocessor coffee
# expr.ne

expr -> number "+" number {%
	(data) =>
		return {
			op: "sum"
			left:  data[0]
			right: data[2]
			}
	%}

number -> [0-9]:+ {%
	(data) =>
		parseInt(data[0].join(""))
	%}
