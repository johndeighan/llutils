# SampleAST.coffee

# ---------------------------------------------------------------------------

export hSampleAST = {
	"type": "File",
	"program": {
		"type": "Program",
		"body": [
			{
				"type": "ExpressionStatement",
				"expression": {
					"type": "AssignmentExpression",
					"right": {
						"type": "NumericLiteral",
						"value": 42,
						"extra": {
							"rawValue": 42,
							"raw": "42"
						},
						"loc": {
							"start": {
								"line": 1,
								"column": 4
							},
							"end": {
								"line": 1,
								"column": 6
							}
						},
						"range": [
							4,
							6
						],
						"start": 4,
						"end": 6
					},
					"left": {
						"type": "Identifier",
						"name": "x",
						"declaration": true,
						"loc": {
							"start": {
								"line": 1,
								"column": 0
							},
							"end": {
								"line": 1,
								"column": 1
							}
						},
						"range": [
							0,
							1
						],
						"start": 0,
						"end": 1
					},
					"operator": "=",
					"loc": {
						"start": {
							"line": 1,
							"column": 0
						},
						"end": {
							"line": 1,
							"column": 6
						}
					},
					"range": [
						0,
						6
					],
					"start": 0,
					"end": 6
				},
				"loc": {
					"start": {
						"line": 1,
						"column": 0
					},
					"end": {
						"line": 1,
						"column": 6
					}
				},
				"range": [
					0,
					6
				],
				"start": 0,
				"end": 6
			}
		],
		"directives": [],
		"loc": {
			"start": {
				"line": 1,
				"column": 0
			},
			"end": {
				"line": 1,
				"column": 6
			}
		},
		"range": [
			0,
			6
		],
		"start": 0,
		"end": 6
	},
	"comments": [],
	"loc": {
		"start": {
			"line": 1,
			"column": 0
		},
		"end": {
			"line": 1,
			"column": 6
		}
	},
	"range": [
		0,
		6
	],
	"start": 0,
	"end": 6,
	"tokens": [
		[
			"IDENTIFIER",
			"x",
			{
				"range": [
					0,
					1
				],
				"first_line": 0,
				"first_column": 0,
				"last_line": 0,
				"last_column": 0,
				"last_line_exclusive": 0,
				"last_column_exclusive": 1
			}
		],
		[
			"=",
			"=",
			{
				"range": [
					2,
					3
				],
				"first_line": 0,
				"first_column": 2,
				"last_line": 0,
				"last_column": 2,
				"last_line_exclusive": 0,
				"last_column_exclusive": 3
			}
		],
		[
			"NUMBER",
			"42",
			{
				"range": [
					4,
					6
				],
				"first_line": 0,
				"first_column": 4,
				"last_line": 0,
				"last_column": 5,
				"last_line_exclusive": 0,
				"last_column_exclusive": 6
			}
		],
		[
			"TERMINATOR",
			"\n",
			{
				"range": [
					6,
					6
				],
				"first_line": 0,
				"first_column": 6,
				"last_line": 0,
				"last_column": 6,
				"last_line_exclusive": 0,
				"last_column_exclusive": 6
			}
		]
	]
}
