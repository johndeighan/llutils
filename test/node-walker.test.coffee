# node-walker.test.coffee

import {
	undef, defined, notdefined, hasKey, dclone,
	assert, words, fromTAML,
	} from '@jdeighan/llutils'
import {hSampleAST} from './node-walker/SampleAST.js'

import * as lib from '@jdeighan/llutils/node-walker'
Object.assign(global, lib)
import * as lib2 from '@jdeighan/llutils/utest'
Object.assign(global, lib2)

# ---------------------------------------------------------------------------
#symbol "matches(lStack, str)"

(() =>
	truthy itemMatches({key: 'program', hNode: {type: 'File'}}, ['program','File'])
	truthy itemMatches({key: 'program', hNode: {type: 'File'}}, ['','File'])
	truthy itemMatches({key: 'program', hNode: {type: 'File'}}, ['program',''])
	truthy itemMatches({key: 'program', hNode: {type: 'File'}}, ['',''])
	)()

# ---------------------------------------------------------------------------
#symbol "stackMatches(lStack, str)"

(() =>
	lStack = [
		{key: 'program', hNode: {type: 'File'}}
		{key: 'body', hNode: {type: 'Program'}}
		{key: 'declaration', hNode: {type: 'ExportNamedDeclaration'}}
		{key: 'right', hNode: {type: 'AssignmentExpression'}}
	]

	truthy stackMatches(lStack, 'right')
	)()

# ---------------------------------------------------------------------------
#symbol "parsePath(str)"

equal parsePath("left:Expression"), [
	['left', 'Expression']
	]

equal parsePath("left: Expression"), [
	['left', 'Expression']
	]

equal parsePath("  left: Expression  "), [
	['left', 'Expression']
	]

# --- parts can be separated by / or newline

equal parsePath("left: Expression / right: Literal"), [
	['left', 'Expression']
	['right', 'Literal']
	]

equal parsePath("""
	left: Expression
	right: Literal
	"""), [
	['left', 'Expression']
	['right', 'Literal']
	]

equal parsePath("right:"), [['right','']]
equal parsePath("right"), [['right','']]

# ---------------------------------------------------------------------------
#symbol "NodeWalker"

(() =>
	hNode = fromTAML("""
		---
		type: ExportNamedDeclaration
		declaration:
			type: AssignmentExpression
			right:
				type: ArrowFunctionExpression
				params:
					- type: Identifier
						name: x
						declaration: false
				body:
					type: BlockStatement
					body:
						- type: ReturnStatement
							argument:
								type: BinaryExpression
								left:
									type: NumericLiteral
									value: 42
								right:
									type: Identifier
									name: x
									declaration: false
								operator: +
				generator: false
				async: false
				id: null
				hasIndentedBody: true
			left:
				type: Identifier
				name: func
				declaration: true
			operator: =
		""")

	walker = new NodeWalker()
	walker.walk(hNode)
	equal walker.getTrace(), """
		ExportNamedDeclaration
			declaration: AssignmentExpression
				right: ArrowFunctionExpression
					params: Identifier
					body: BlockStatement
						body: ReturnStatement
							argument: BinaryExpression
								left: NumericLiteral
								right: Identifier
				left: Identifier
		"""
	)()


# --- A counter walks an AST and
#     counts the number of nodes of each type

class Counter extends NodeWalker
	init: () ->
		@hCounts = {}

	visit: (type, hNode) ->
		if hasKey(hNode, type)
			@hCounts[type] += 1
		else
			@hCounts[type] = 1

	get: () =>
		return @hCounts

# ---------------------------------------------------------------------------

(() =>
	counter = new Counter()
	counter.walk(hSampleAST)

	equal counter.get(), {
		File: 1
		Program: 1
		ExpressionStatement: 1
		AssignmentExpression: 1
		NumericLiteral: 1
		Identifier: 1
		}
	)()

(() =>
	counter = new Counter()
	counter.walk({
		type: 'File'
		program: {
			type: 'Program'
			body: [
				{type: 'ExpressionStatement'}
				{type: 'AssignmentStatement'}
				{type: 'ForStatement'}
				]
			}
		})

	equal counter.get(), {
		File: 1
		Program: 1
		ExpressionStatement: 1
		AssignmentStatement: 1
		ForStatement: 1
		}

)()

# ---------------------------------------------------------------------------
# --- Change type of selected nodes in place

(() =>
	lLiterals = ['NumericLiteral', 'StringLiteral']

	class Patcher extends NodeWalker

		visit: (type, hNode) ->

			if lLiterals.includes(type)
				hNode.type = 'Literal'

	hAST = {
		type: "File"
		program: {
			type: "Program"
			body: [
				{
					type: "ExpressionStatement"
					expression: {
						type: "AssignmentExpression"
						right: {
							type: "NumericLiteral"
							value: 42
						left: {
							type: "Identifier"
							name: "x"
							}
						}
					}
				}
				{
					type: "ExpressionStatement"
					expression: {
						type: "AssignmentExpression"
						right: {
							type: "StringLiteral"
							value: 'abc'
						left: {
							type: "Identifier"
							name: "x"
							}
						}
					}
				}
				]
			}
		}

	pat = new Patcher().walk(hAST)

	equal hAST, {
		type: "File"
		program: {
			type: "Program"
			body: [
				{
					type: "ExpressionStatement"
					expression: {
						type: "AssignmentExpression"
						right: {
							type: "Literal"
							value: 42
						left: {
							type: "Identifier"
							name: "x"
							}
						}
					}
				}
				{
					type: "ExpressionStatement"
					expression: {
						type: "AssignmentExpression"
						right: {
							type: "Literal"
							value: 'abc'
						left: {
							type: "Identifier"
							name: "x"
							}
						}
					}
				}
				]
			}
		}
	)()

# ---------------------------------------------------------------------------
# --- Remove location information from sample AST

(() =>

	class Remover extends NodeWalker

		init: () ->
			@lKeys = words('loc extra range start end tokens')
			return

		visit: (type, hNode) ->
			for key in @lKeys
				if hasKey(hNode, key)
					delete hNode[key]

	rem = new Remover()
	hAST = dclone(hSampleAST)
	rem.walk(hAST)

	equal hAST, {
		type: "File",
		program: {
			type: "Program",
			body: [
				{
					type: "ExpressionStatement",
					expression: {
						type: "AssignmentExpression",
						right: {
							type: "NumericLiteral",
							value: 42,
						},
						left: {
							type: "Identifier",
							name: "x",
							declaration: true,
						},
						operator: "=",
					},
				}
			],
			directives: [],
		},
		comments: [],
		}
	)()
