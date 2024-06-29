program = stmt

stmt = word: $ [a-z]+
	{
	if (word === 'if') {
		return undefined;
		}
	return word;
	}
