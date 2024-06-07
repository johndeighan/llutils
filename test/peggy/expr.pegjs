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
	var func0, func1, func2, func3, func4;

	func0 = (left, op, right) => {
	  if (op === '+') {
	    return left + right;
	  } else {
	    return left - right;
	  }
	};

	func1 = (left, op, right) => {
	  if (op === '*') {
	    return left * right;
	  } else {
	    return left / right;
	  }
	};

	func2 = (f) => {
	  return f;
	};

	func3 = (str) => {
	  return parseInt(str);
	};

	func4 = (digits, decimal) => {
	  return parseFloat(digits + '.' + decimal);
	};
}}
expr
	= left:term ws op:addOp ws right:expr
		{ return func0(left,op,right); }
	/ term
term
	= left:factor ws op:mulOp ws right:term
		{ return func1(left,op,right); }
	/ factor
factor
	= number
	/ '(' ws f:expr ws ')'
		{ return func2(f); }
addOp
	= '+'
	/ '-'
mulOp
	= '*'
	/ '/'
ws
	= ' '*
integer
	= str:[0-9]+
		{ return func3(mkString(str)); }
float
	= digits:[0-9]+ '.' decimal:[0-9]+
		{ return func4(mkString(digits),mkString(decimal)); }
number
	= float
	/ integer