{{
	var mkString;

	mkString = (...lItems) => {
	  var i, item, lStrings, len;
	  lStrings = [];
	  for (i = 0, len = lItems.length; i < len; i++) {
	    item = lItems[i];
	    if ((typeof item === 'string') || (item instanceof String)) {
	      lStrings.push(item);
	    } else if (Array.isArray(item)) {
	      lStrings.push(mkString(...item));
	    }
	  }
	  return lStrings.join('');
	};
	var check, func0, func1, func2, func3, func4, func5, hOptions, init;

	import {
	  undef,
	  defined,
	  notdefined,
	  pass,
	  isEmpty,
	  hasKey,
	  keys,
	  OL,
	  words,
	  add_s,
	  assert,
	  croak,
	  getOptions,
	  isString,
	  isFunction,
	  isBoolean,
	  isArray
	} from '@jdeighan/llutils';

	import {
	  DUMP
	} from '@jdeighan/llutils/dump';

	import {
	  getTracer
	} from '@jdeighan/llutils/tracer';

	hOptions = {};

	// ------------------------------------------------------------------------
	// --- hDesc is: {
	//        <tag>: <type>    - <tag>s are allowed names
	//                         - <type> is 'boolean','string',
	//                           'number','integer'
	//        _: [min, max]    - min/max may be undef
	//        }

	// --- If hDesc is undef, no checking is done
	export var getArgs = (argStr = undef, hDesc = undef, tracer = 'none') => {
	  var err, hResult;
	  if (notdefined(argStr)) {
	    argStr = process.argv.slice(2).join(' ');
	  }
	  assert(isString(argStr), `Not a string: ${OL(argStr)}`);
	  try {
	    hResult = peg$parse(argStr, {
	      tracer: getTracer(tracer, argStr)
	    });
	  } catch (error) {
	    err = error;
	    console.log(`ERROR parsing command args: ${OL(argStr)}`);
	    process.exit();
	  }
	  if (defined(hDesc)) {
	    check(hResult, hDesc);
	  }
	  return hResult;
	};

	// ..........................................................
	check = (hResult, hDesc) => {
	  var i, key, lLimits, lNonOptions, len, max, min, n, ref, type, value;
	  // --- Check number of non-options
	  lLimits = hDesc._;
	  if (defined(lLimits)) {
	    assert(isArray(lLimits), `Not an array: ${OL(lLimits)}`);
	    [min, max] = lLimits;
	    if (notdefined(min)) {
	      min = 0;
	    }
	    if (notdefined(max)) {
	      max = 2e308;
	    }
	    // --- How many non-options were provided?
	    lNonOptions = hResult._;
	    if (defined(lNonOptions)) {
	      assert(isArray(lNonOptions), `Not an array: ${OL(lNonOptions)}`);
	      n = lNonOptions.length;
	    } else {
	      n = 0;
	    }
	    assert(n >= min, `There must be at least ${min} non-option${add_s(min)}`);
	    assert(n <= max, `There can be at most ${max} non-option${add_s(max)}`);
	  }
	  ref = keys(hResult);
	  // --- Check types of all options
	  for (i = 0, len = ref.length; i < len; i++) {
	    key = ref[i];
	    if (key !== '_') {
	      type = hDesc[key];
	      value = hResult[key];
	      switch (type) {
	        case 'string':
	          pass();
	          break;
	        case 'boolean':
	          assert(isBoolean(value), `Bad boolean: ${OL(value)}`);
	          break;
	        case 'number':
	          hResult[key] = parseFloat(value);
	          break;
	        case 'integer':
	          hResult[key] = parseInt(value, 10);
	          break;
	        default:
	          croak(`Invalid type: ${OL(type)}`);
	      }
	    }
	  }
	};

	init = () => {
	  return hOptions = {};
	};

	func0 = () => {
	  return hOptions;
	};

	func1 = (lChars, value) => {
	  var ch, i, len, results;
	  if (isEmpty(value)) {
	    results = [];
	    for (i = 0, len = lChars.length; i < len; i++) {
	      ch = lChars[i];
	      results.push(hOptions[ch] = true);
	    }
	    return results;
	  } else {
	    return hOptions[lChars.join('')] = value[1];
	  }
	};

	func2 = (val) => {
	  if (hasKey(hOptions, '_')) {
	    return hOptions._.push(val);
	  } else {
	    return hOptions._ = [val];
	  }
	};

	func3 = (str) => {
	  return str;
	};

	func4 = (str) => {
	  return str;
	};

	func5 = (str) => {
	  return str;
	};
}}
{
init();
}
cmdArgs
	= arg (ws arg)*
		{ return func0(); }
arg
	= '-' lChars:[A-Za-z]+ value:(@'=' @stringVal)?
		{ return func1(lChars,value); }
	/ val:stringVal
		{ return func2(val); }
stringVal
	= '"'  str:[^"]*  '"'
		{ return func3(mkString(str)); }
	/ "'"  str:[^']*  "'"
		{ return func4(mkString(str)); }
	/ !'-' str:[^ \t]+
		{ return func5(mkString(str)); }
ws
	= [ \t]+