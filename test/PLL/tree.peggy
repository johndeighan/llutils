---
type: coffee
include: 'src/lib/PLL.peggy'
---

# --------------------------------------------------------------------------

tree

	NL* lStmts: stmt |1.., SEP| NL*

		return {
			type: 'tree',
			body: lStmts
			}

stmt

	ident:identifier children:(INDENT @tree UNDENT)?

		hResult = {
			type: 'stmt'
			ident
			}

		if children
			hResult.children = children.body
		return hResult

identifier

	first: one_ident lMore: ( EXTEND @one_ident)*

		return [first, lMore...].join(' ')

one_ident

	str: $ ([a-z]+) & {return (str != 'if');}

		return str

NL

	"\r" ? "\n"
