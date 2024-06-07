{{
	import {
		undef, defined, anyDefined, notdefined,
		getOptions, OL, hasKey,
		isEmpty, isString, isHash, isFunction,
		} from '@jdeighan/llutils';
	import {DUMP} from '@jdeighan/llutils/dump';
	import {getTracer} from '@jdeighan/llutils/tracer';

	let lStack = undef;

	class ExtractError extends Error {
		constructor(message) {
			super(message);
			this.name = "ExtractError";
			}
		}

	// -----------------------------------------------------------------------

	function croak(errmsg) {

		throw new ExtractError(errmsg);
		return;
		}

	// -----------------------------------------------------------------------

	function assert(cond, errmsg) {

		if (! cond)
			throw new ExtractError(errmsg);
		return;
		}

	// -----------------------------------------------------------------------
	// --- Duplicates throw exception

	function mergeKeys(hObj, ...lMore) {

		assert(isHash(hObj), `hObj not a hash: ${OL(hObj)}`);
		for (let h of lMore) {
			if (isEmpty(h)) {
				continue;
				}
			assert(isHash(h), `Not a hash: ${OL(h)}`);
			for (let key of Object.keys(h)) {
				assert(!hasKey(hObj, key),
					`key ${OL(key)} already exists in hObj`);
				hObj[key] = h[key];
				}
			}
		return hObj;
		}

	// -----------------------------------------------------------------------

	export function extract(obj, desc, tracer='none') {

		debugger
		assert(isHash(obj), `obj = ${OL(obj)}`);
		assert(isString(desc), `desc = ${OL(desc)}`);
		lStack = [obj];
		return peg$parse(desc, {tracer: getTracer(tracer, desc)});
		}
}}

// --------------------------------------------------------------------------

program
	= lDesc: desc |1.., SEP| "\n"*

		{
			return mergeKeys({}, ...lDesc);
			}

desc
	= result: expr

		& {
			// --- name is always defined
			//     obj might not be defined
			//     store indicates whether we should store it
			// NOTE: If store is true, obj is defined

			let obj = result[1];

			// --- NOTE: obj may be undef
			//           in that case, there should be no 'more'
			lStack.push(obj)
			return true;
			}

		hMore: more?

		{
			lStack.pop();
			let [name, obj, store] = result;
			let hResult = store ? {[name]: obj} : {};
			if (defined(hMore)) {
				mergeKeys(hResult, hMore);
				}
			return hResult;
			}

more
	= INDENT h: program UNDENT
		{
			return h;
			}

expr
	= lParen: "("?
		optional: ("?" _)?
		_ lSelectors: identifier|1.., "."|
		expected: (_ "=" _ @string)?
		as: (_ "as" _ @identifier)?
		rParen: ")"?

		{
		// --- Will return [name, obj, store]

		let obj = lStack.at(-1); // --- Top of Stack
		assert(isHash(obj), `obj = ${OL(obj)}`);

//		DUMP(lStack, 'lStack');

		// --- Don't store if expression inside '(' and ')'
		//     or expected is defined
		//     or it's optional and missing
		let store = notdefined(expected);
		if (defined(lParen, rParen)) {
			store = false;
			}
		else {
			assert(notdefined(lParen, rParen), 'Mismatched parens');
			}

		// --- Apply selectors
		//     For now, all selectors are ("." identifier)
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

		// --- If there's an expected value (always a string),
		//     obj must exist and be that string

		if (defined(expected)) {
			assert(obj == expected,
				`Expecting ${name} = ${OL(expected)}, found ${OL(obj)}`);
			}

		// --- If no obj && not optional, throw exception
		if (notdefined(obj)) {
			if (notdefined(optional)) {
				croak(`key ${OL(name)} is missing`);
				}
			store = false;
			}
		return [name, obj, store];
		}


identifier
	= str: $ ([A-Za-z_][A-Za-z0-9_]*)
		{
		return str;
		}

string
	= '"' lChars:[^"]* '"'
		{
		return lChars.join('');
		}

_
	= " "*
