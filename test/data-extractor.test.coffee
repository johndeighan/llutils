# temp.test.coffee - from data-extractor.test.coffee

import {
	undef, fromTAML,
	} from '@jdeighan/llutils'
import {DUMP} from '@jdeighan/llutils/dump'

import * as lib from '@jdeighan/llutils/data-extractor'
Object.assign(global, lib)
import * as lib2 from '@jdeighan/llutils/utest'
Object.assign(global, lib2)

# ---------------------------------------------------------------------------

(() =>
	h = fromTAML("""
		---
		type: Assignment
		right: Value
		left: Variable
		position:
			start: 1
			end: 5
			source:
				file: temp.txt
		""")

	equal extract(h, 'type'), {
		type: 'Assignment'
		}

	equal extract(h, """
		type
		"""),
		{
		type: 'Assignment'
		}

	equal extract(h, """
		type
		left
		right
		"""),
		{
		type: 'Assignment'
		left: 'Variable'
		right: 'Value'
		}

	# --- enclose in parens to not extract
	equal extract(h, """
		type
		(left)
		right
		"""),
		{
		type: 'Assignment'
		right: 'Value'
		}

	# --- Can't extract same #symbol twice
	fails () => extract(h, """
		type
		left
		type
		""")

	# --- Unless it isn't stored
	succeeds () => extract(h, """
		type
		left
		(type)
		""")

	# --- Keys you name must exist
	fails () => extract(h, """
		type
		left
		right
		doesnotexist
		""")

	# --- Unless you mark it as optional
	succeeds () => extract(h, """
		type
		left
		right
		? doesnotexist
		""")

	# --- Provide expected value, in which case
	#     it's not stored
	equal extract(h, """
		type="Assignment"
		left
		right
		"""),
		{
		left: 'Variable'
		right: 'Value'
		}

	# --- Mismatch causes failure
	fails () => extract(h, """
		type="NonAssignment"
		left
		right
		""")

	# --- Extract sub-keys
	equal extract(h, """
		type="Assignment"
		position.start
		position.end
		position.source.file
		"""),
		{
		start: 1
		end: 5
		file: 'temp.txt'
		}

	# --- Rename keys
	equal extract(h, """
		type="Assignment"
		right as RightSide
		position.start as StartingPos
		"""),
		{
		RightSide: 'Value'
		StartingPos: 1
		}

	#symbol "nested"

	# --- Extract sub-keys
	equal extract(h, """
		type="Assignment"
		(position)
			start
			end
			(source)
				file
		"""),
		{
		start: 1
		end: 5
		file: 'temp.txt'
		}

	)()

#symbol "from original test"

(() =>
	h = fromTAML("""
		---
		type: Assignment
		right:
			type: Function
			params:
				-
					type: Identifier
					name: x
				-
					type: Unknown
					name: z
				-
					type: Identifier
					name: y
			body:
				type: Block
		left:
			type: Identifier
		""")

	equal extract(h, 'type'), {type: 'Assignment'}
	equal extract(h, 'type as kind'), {kind: 'Assignment'}
	equal extract(h, '?type'), {type: 'Assignment'}
	equal extract(h, '?missing'), {}
	fails () => extract(h, 'missing')
	equal extract(h, 'left'), {left: {type: 'Identifier'}}

	# --- Optional missing key is not a problem
	equal extract(h, """
		?missing
		type
		"""), {type: 'Assignment'}

	# --- Non-optional missing key throws exception
	fails () => extract(h, """
		type
		missing
		""")

	like  extract(h, 'right'), {right: {
		type: 'Function'
		body: {type: 'Block'}
		}}

	equal extract(h, """
		type
		left
		"""), {
		type: 'Assignment'
		left: {type: 'Identifier'}
		}

	equal extract(h, """
		type
		left
		"""), {
		type: 'Assignment'
		left: {type: 'Identifier'}
		}

	like extract(h, """
		type
		right
			type as rtype
		"""), {
		type: 'Assignment'
		rtype: 'Function'
		}

	like extract(h, """
		type
		right.type as rtype
		"""), {
		type: 'Assignment'
		rtype: 'Function'
		}
	)()

# ---------------------------------------------------------------------------

(() =>
	h = {
		type: "ExportNamedDeclaration",
		source: null,
		assertions: [],
		exportKind: "value",
		specifiers: [],
		declaration: {
			type: "AssignmentExpression",
			right: {
				type: "ArrowFunctionExpression",
				params: [
					{
						type: "Identifier",
						name: "x",
						declaration: false
					}
				],
				body: {
					type: "BlockStatement",
					body: [
						{
							type: "ReturnStatement",
							argument: {
								type: "BinaryExpression",
								left: {
									type: "NumericLiteral",
									value: 42
								},
								right: {
									type: "Identifier",
									name: "x",
									declaration: false
								},
								operator: "+"
							}
						}
					]
				},
				generator: false,
				async: false,
				id: null,
				hasIndentedBody: true
			},
			left: {
				type: "Identifier",
				name: "func",
				declaration: true
			},
			operator: "="
		}
	}

	hResult = extract(h, """
		type="ExportNamedDeclaration"
		exportKind="value"
		(declaration)
			type="AssignmentExpression"
			left.type="Identifier"
			left.name
		""")
	equal hResult, {name: 'func'}
	)()

# ---------------------------------------------------------------------------

(() =>
	hAST = {
		type: 'program'
		name: 'John'
		body: {
			type: 'if'
			cond: 'x==2'
			body: {
				type: 'assign'
				left: 'x'
				right: 2
				}
			}
		}

	result = extract(hAST, """
		type="program"
		name
		(body)
			type as bodyType
			cond
		""")

	equal result, {
		name: 'John'
		bodyType: 'if'
		cond: 'x==2'
		}
	)()

# ---------------------------------------------------------------------------

(() =>
	hAST = {
		type: 'program'
		name: 'John'
		}

	result = extract(hAST, """
		type="program"
		name
		?body
			type as bodyType
			cond
		""")

	equal result, {
		name: 'John'
		}
	)()

# ---------------------------------------------------------------------------

(() =>
	hAST = {
		type: 'program'
		name: 'John'
		}

	result = extract(hAST, """
		type="program"
		name
		(?body)
			type as bodyType
			cond
		""")

	equal result, {
		name: 'John'
		}
	)()

# ---------------------------------------------------------------------------

(() =>
	hAST = {
		type: 'program'
		name: 'John'
		body: {
			type: 'if'
			cond: 'x==2'
			body: {
				type: 'assign'
				left: 'x'
				right: 2
				}
			}
		}

	result = extract(hAST, """
		type="program"
		name
		(?body)
			type as bodyType
			cond
		""")

	equal result, {
		name: 'John'
		bodyType: 'if'
		cond: 'x==2'
		}
	)()
