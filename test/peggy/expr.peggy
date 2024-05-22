GLOBAL
	import {join} from '@jdeighan/llutils'

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
	digits:[0-9]+
		str = join(digits)
		return parseInt(str)

float
	digits:[0-9]+ '.' decimal:[0-9]+
		str = join(digits, '.', decimal)
		return parseFloat(str)

number
	float
	integer
