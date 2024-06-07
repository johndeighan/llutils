expr
	left:term ws op:addOp ws right:expr
		if (op == '+')
			return left + right
		else
			return left - right
	term

term
	left:factor ws op:mulOp ws right:term
		if (op == '*')
			return left * right
		else
			return left / right
	factor

factor
	number
	'(' ws f:expr ws ')'
		return f

addOp
	'+'
	'-'

mulOp
	'*'
	'/'

ws
	' '*

integer
	str::[0-9]+
		return parseInt(str)

float
	digits::[0-9]+ '.' decimal::[0-9]+
		return parseFloat(digits + '.' + decimal)

number
	float
	integer
