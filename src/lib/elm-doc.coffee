# elm-doc.coffee

import {
	undef, defined, notdefined, assert, croak,
	hasKey, keys,
	isTAML, fromTAML, OL, isEmpty, nonEmpty,
	isString, isHash, isArray, escapeStr,
	} from '@jdeighan/llutils'
import {SectionMap} from '@jdeighan/llutils/section-map'

# ---------------------------------------------------------------------------
#
# An Elm AST has the following types:
#    module
#       name
#       lFuncDefs
#    funcDef
#       name
#       lParms    - an array of identifiers
#       lStmts
#    funcApply
#       name
#       lArgs
#    const
#       value
# ---------------------------------------------------------------------------

export class ElmDocument extends SectionMap

	constructor: (@outfile=undef) ->

		super ['header', 'imports', 'code']

		@hImports = {}  # --- symbols that must be imported

		@section('imports').converter = (block) =>
			return @importStr()

		@section('imports').add 'imports' # --- shouldn't be needed

		@hDefinedFuncs = {}  # --- {<name>: <arity>, ... }

	# ..........................................................

	addImport: (name, lArgs) ->

		assert defined(hSymbols[name]), "Unknown symbol: #{OL(name)}"
		{lib, lTypes} = hSymbols[name]
		numArgs = lTypes.length
		assert (lArgs.length == lTypes.length),
				"arity mismatch in #{OL(name)}"

		if hasKey(@hImports, lib)
			lSymbols = @hImports[lib]
			if !lSymbols.includes(name)
				lSymbols.push name
		else
			@hImports[lib] = [name]
		return

	# ..........................................................

	getStmt: (hStmt) ->

		assert isHash(hStmt), "stmt not a hash: #{OL(hStmt)}"
		switch hStmt.type

			when 'funcApply'
				{name, lArgs} = hStmt
				if isString(lArgs)
					lArgs = [lArgs]

				# --- Add import, if needed
				@addImport name, lArgs

				lParts = [name]
				for arg in lArgs
					if isString(arg)
						str = escapeStr arg, {
							"\r": '\\r'
							"\n": '\\n'
							"\t": '\\t'
							}
						lParts.push "\"#{str}\""
					else
						croak "Not implemented"
				return lParts.join ' '

			when 'const'
				{value} = hStmt
				return OL(value)

			else
				croak "Not a stmt: #{OL(hStmt)}"
		return

	# ..........................................................

	addFuncDef: (hAST, level) ->

		assert isHash(hAST), "Not a hash: #{OL(hAST)}"
		assert (hAST.type == 'funcDef'), "Not a function def"
		{name, lParms, lStmts} = hAST
		assert nonEmpty(name), "Empty name: #{OL(name)}"
		assert !hasKey(@hDefinedFuncs, name),
				"Function #{OL(name)} is already defined"
		@hDefinedFuncs[name] = lParms.length

		@section('code').add level, "#{name} ="
		for hStmt in lStmts
			@section('code').add level+1, @getStmt(hStmt)
		return

	# ..........................................................

	addModule: (hAST) ->

		if isTAML(hAST)
			hAST = fromTAML(hAST)
		assert isHash(hAST), "Not a hash: #{OL(hAST)}"
		assert (hAST.type == 'module'), "Not a module"
		{name, lFuncDefs} = hAST
		assert nonEmpty(name), "Empty module name: #{OL(name)}"
		@section('header').add "module #{name} exposing(main)\n"

		for hDef in lFuncDefs
			@addFuncDef hDef, 0
		return

	# ..........................................................

	importStr: () ->

		lLines = []
		for lib in keys(@hImports)
			lSymbols = @hImports[lib]
			str = lSymbols.join ','
			lLines.push "import #{lib} exposing(#{str})"
		return lLines.join("\n") + "\n"

# ---------------------------------------------------------------------------

hTypes = {
	attr:  'Element.Attribute'
	lAttr: 'list Element.Attribute'
	lElem: 'list Element.Element'
	}

mapType = (str) =>
	if defined(hTypes[str])
		return hTypes[str]
	else
		return str

hKnownSymbols = {
	Element: [
		['layout',      ['lAttr', 'lElem']]
		['text',        ['String']]
		['row',         []]
		['width',       ['Int']]
		['centerX',     []]
		['centerY',     []]
		['spacing',     ['Int']]
		['padding',     ['Int']]
		['el',          ['lAttr']]
		['rgb255',      ['Int','Int','Int']]
		['alignRight',  []]
		['alignLeft',   []]
		['alignCenter', []]
		]
	}

hSymbols = {}
for lib in keys(hKnownSymbols)
	for [name, lTypes] in hKnownSymbols[lib]
		hSymbols[name] = {
			lib
			lTypes: lTypes.map mapType
			}
