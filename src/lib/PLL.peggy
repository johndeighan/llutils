---
type: coffee
---

GLOBAL
	level = 0
	sep = false

	# ..........................................................

	log = (...lObj) =>

		for obj in lObj
			console.log obj
		return true

	# ..........................................................

	isSep = ({match, nTabs}) =>

		return sep || (match && (nTabs == level))

	# ..........................................................

	isIndent = ({match, nTabs}) =>

		return match && (nTabs == level+1)

	# ..........................................................

	isExtend = ({match, nTabs}) =>

		return match && (nTabs > level+1)

	# ..........................................................

	isUndent = ({match, nTabs}) =>

		if (match && (nTabs < level))
			return true
		if ((nTabs == 0) && (level > 0))
			return true
		return false

# --------------------------------------------------------------------------

PER_PARSE

	level = 0
	sep = false

# -------------------------------------------------

SEP

	hInfo: INDENTATION & {return isSep(hInfo)}

		sep = false
		return 'SEP'

INDENT

	hInfo: INDENTATION & {return isIndent(hInfo)}

		level += 1
		return "INDENT #{level-1} -> #{level}"

EXTEND

	hInfo: INDENTATION & {return isExtend(hInfo)}

		return 'EXTEND'

UNDENT

	hInfo: INDENTATION & {return isUndent(hInfo)}

		level -= 1
		sep = true    # cause SEP after last UNDENT
		return "UNDENT #{level+1} -> #{level}"

# --- returns [ <was \n\t*>, <num TABs> ]

INDENTATION

	lTabs: ("\r"? "\n" ([ \t]* "\n")* @"\t"*)?

		return {
			match: (lTabs != null)
			nTabs: if (lTabs == null) then 0 else lTabs.length
			}
