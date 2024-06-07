{{
	import {
		undef, defined, anyDefined, notdefined, getOptions, OL, hasKey,
		assert, croak, isString, isHash, isFunction,
		} from '@jdeighan/llutils';
	import {getTracer} from '@jdeighan/llutils/tracer';

	let hResult = undef;
	let level = undef;
	let lObjects = undef;
	let lArrayNames = undef;

	class ExtractError extends Error {
		constructor(message) {
			super(message);
			this.name = "ExtractError";
			}
		}

	// ------------------------------------------------------------------------

	export function extract(ds, desc, tracer='none') {

		debugger
		assert(defined(ds), `ds = ${OL(ds)}`);
		assert(isString(desc), `desc = ${OL(desc)}`);

		let hParseOptions = undef;
		if (isFunction(tracer)) {
			hParseOptions = {tracer};
			}
		else {
			hParseOptions = {tracer: getTracer(tracer)};
			}

		hResult = {};
		level = 0;
		lObjects = [ds];
		lArrayNames = [undef];

		peg$parse(desc, hParseOptions);
		return hResult;
	}
}}

// --------------------------------------------------------------------------

start
	= expr (NL TABs expr)* NL?

expr
	= lParen: "("?
		optional: "?"?
		ws lSelectors: IDENTIFIER|1.., "."|
		expected: (ws "=" ws @string)?
		as: (ws "as" ws @IDENTIFIER)?
		rParen: ")"?

		{
		let store = true;
		if (defined(lParen, rParen)) {
			store = false;
			}
		else if (anyDefined(lParen, rParen)) {
			croak("Mismatched parens");
			}

		let initObj = lObjects[level];

		// --- Get the starting object
		let obj = lObjects[level];
		assert(defined(obj), `No current obj at level ${level}`);

		// --- Apply selectors
		//     For now, all selectors are ("." IDENTIFIER)
		let lastIdent = undef;
		for (let ident of lSelectors) {
			lastIdent = ident;       // --- key to store value under
			if (hasKey(obj, ident)) {
				obj = obj[ident];
				}
			else {
				obj = undef;
				break;
				}
			}

		let name = as || lastIdent;

		if (defined(obj)) {
			lObjects[level+1] = obj;
			if (defined(expected)) {
				if (obj != expected) {
					let errmsg = `Expecting ${name} = ${OL(expected)}, found ${OL(obj)}`;
					throw new ExtractError(errmsg);
					}
				// --- Don't add to hResult
				}
			else if (store) {
				if (defined(hResult[name])) {
					throw new Error(`Key ${OL(name)} is already defined`);
					}
				hResult[name] = obj
				}
			}
		else if (notdefined(optional)) {
			let errmsg = `key ${OL(name)} is missing`;
			throw new ExtractError(errmsg);
			}
		}

	/ '['
		ws
		optional: "?"?
		ws lSelectors: IDENTIFIER|1.., "."|
		as: (ws "as" ws @IDENTIFIER)?
		ws
		']'

		{
		let initObj = lObjects[level];

		// --- Get the starting object
		let obj = lObjects[level];
		assert(defined(obj), `No current obj at level ${level}`);

		// --- Apply selectors
		//     For now, all selectors are ("." IDENTIFIER)
		let lastIdent = undef;
		for (let ident of lSelectors) {
			lastIdent = ident;       // --- key to store value under
			if (hasKey(obj, ident)) {
				obj = obj[ident];
				}
			else {
				obj = undef;
				break;
				}
			}

		let name = as || lastIdent;
		if (defined(obj)) {
			assert(isArray(obj), `obj = ${OL(obj)}`);
			lObjects[level+1] = obj;
			lArrayNames[level+1] = name;
			if (defined(hResult[name])) {
				throw new Error(`Key ${OL(name)} is already defined`);
				}
			hResult[name] = []   # --- new, empty array !
			}
		else if (notdefined(optional)) {
			let errmsg = `key ${OL(name)} is missing`;
			throw new ExtractError(errmsg);
			}
		}

string
	= '"' lChars:[^"]* '"'
		{
		return lChars.join('');
		}

IDENTIFIER
	= lChars:[A-Za-z_]+
		{
		return lChars.join('');
		}

ws
	= " "*

NL
	= "\n"

TABs
	= lTabs:"\t"*
		{
		level = lTabs.length;
		}
