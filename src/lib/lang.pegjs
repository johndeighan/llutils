{{
	// lang.pegjs
	import {
		undef, defined, OL,
		assert, nonEmpty,
		} from '@jdeighan/llutils';
	import {getTracer} from '@jdeighan/llutils/tracer';

	// ---------------------------------------------------------

	export function evaluate(input, tracerType='none') {

		let tracer = getTracer(tracerType, input, {
			level: () => level,
			sep: () => sep,
			});
		if (defined(tracer)) {
			return peg$parse(input, {tracer});
			}
		else {
			return peg$parse(input);
			}
		}
}}

// --------------------------------------------------------------------------

{
	level = 0;
	sep = false;
}

// --------------------------------------------------------------------------

program
	= lStmts: stmt |1.., SEP| NL*

		{
		return {
			type: 'program',
			body: lStmts
			};
		}

stmt
	= varname:identifier '=' val:int

		{
		return {
			type: 'assign',
			varname,
			val,
			};
		}

	/ 'if'
		INDENT
		body: stmt|1..,SEP|
		UNDENT

		{
		return {
			type: 'if',
			body
			};
		}

identifier
	= str: $ ([a-z]+) & {return (str != 'if');}

		{
		return str;
		}

int = $ [0-9]+

NL = "\r" ? "\n"
