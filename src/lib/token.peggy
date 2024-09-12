---
type: coffee
---

GLOBAL

	import {undef, nonEmpty} from '@jdeighan/llutils'
	import {
		getTracer,
		} from '@jdeighan/llutils/tracer'

	export parseToken = (input, tracerType='none') =>

		debugger
		tracer = getTracer(tracerType)
		return peg$parse(input, {tracer})

token
	boolean
	number
	string
	identifier
	NL

boolean

	"true"

		return {
			type: 'boolean'
			value: true
			}

	"false"

		return {
			type: 'boolean'
			value: false
			}

number

	pre:$[0-9]+ post:$("." [0-9]*)?

		if nonEmpty(post)
			return {
				type: "float"
				value: parseFloat("#{pre}#{post}")
				}
		else
			return {
				type: "integer"
				value: parseInt(pre, 10)
				}

string

	'"' str: $ ([^"]*) '"'

		return {
			type: 'string'
			value: str
			}

	"'" str: $ ([^']*) "'"

		return {
			type: 'string'
			value: str
			}

identifier

	str: $ ([A-Za-z]+) & {return (str != 'if');}

		return {
			type: 'identifier'
			value: str
			}
NL

	"\r" ? "\n"

_

	" "+
