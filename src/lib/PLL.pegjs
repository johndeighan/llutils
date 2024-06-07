{{
	let level = 0;
	let sep = false;
}}

// --------------------------------------------------------------------------

{
	level = 0;
	sep = false;
}

// -------------------------------------------------

SEP
	= hInfo: INDENTATION
		& {
			let {match, nTabs} = hInfo;
			return sep || (match && (nTabs == level));
			}

		{
		sep = false;
		return 'SEP';
		}

INDENT
	= hInfo: INDENTATION
		& {
			let {match, nTabs} = hInfo;
			return match && (nTabs == level+1);
			}

		{
		level += 1;
		return `INDENT ${level-1} -> ${level}`;
		}

EXTEND
	= hInfo: INDENTATION
		& {
			let {match, nTabs} = hInfo;
			return match && (nTabs == level+1);
			}

		{
		return 'EXTEND';
		}

UNDENT
	= hInfo: INDENTATION
		& {
			let {match, nTabs} = hInfo;
			return (match && (nTabs < level)) || (level > 0);
			}

		{
		level -= 1;
		sep = true;    // cause SEP after last UNDENT
		return `UNDENT ${level+1} -> ${level}`;
		}

INDENTATION
	= lTabs: ("\r"? "\n" ([ \t]* "\n")* @"\t"*)?

		{
		let match = (lTabs != null)
		return {
			match: match,
			nTabs: (match ? lTabs.length : 0),
			}
		}
