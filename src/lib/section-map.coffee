# section-map.coffee

import {
	undef, defined, notdefined, OL, isEmpty, nonEmpty,
	isString, isHash, isArray, isFunction, toBlock,
	assert, croak,
	} from '@jdeighan/llutils'

import {Section} from '@jdeighan/llutils/section'

# ---------------------------------------------------------------------------

isSectionName = (name) =>

	return isString(name) && name.match(/^[a-z][a-z0-9_-]*/)

# ---------------------------------------------------------------------------

isSetName = (name) =>

	return isString(name) && name.match(/^[A-Z][a-z0-9_-]*/)

# ---------------------------------------------------------------------------

export class SectionMap

	constructor: (tree, @hReplacers={}) ->
		# --- tree is a tree of section/set names
		# --- hReplacers are callbacks that are called
		#        when a set or section is processed
		#        should be <name> -> <function>
		#     <name> can be a section name or a set name
		#     <function> should be <block> -> <block>

		@checkTree tree
		@checkReplacers @hReplacers

		@hSections = {}            # --- {section name: Section Object}
		@hSets = {ALL: @lFullTree} # --- {set name: array of parts}

		@init @lFullTree

	# ..........................................................

	dump: () ->

		console.log JSON.stringify(@hSections, null, 3)
		return

	# ..........................................................

	init: (lTree) ->

		assert isArray(lTree), "not an array"
		assert nonEmpty(lTree), "empty array"

		firstItem = lTree[0]
		if isSetName(firstItem)
			lTree = lTree.slice(1)
			@mkSet firstItem, lTree

		for item in lTree
			if isArray(item)
				@init item
			else if isSectionName(item)
				@mkSection item
			else
				assert isString(item), "Bad item in tree: #{OL(item)}"
		return

	# ..........................................................

	mkSet: (name, lTree) ->

		assert isArray(lTree), "tree is not an array"
		assert nonEmpty(lTree), "set without sections"
		assert notdefined(@hSets[name]), "set #{OL(name)} already exists"
		@hSets[name] = lTree
		return

	# ..........................................................

	mkSection: (name) ->

		assert notdefined(@hSections[name]), "duplicate section name"
		@hSections[name] = new Section(name, @hReplacers[name])
		return

	# ..........................................................

	getBlock: (desc='ALL') ->
		# ..........................................................
		# --- desc can be:
		#        a section name
		#        a set name
		#        an array of section or set names or literal strings
		#     i.e. it should NOT contain sub-arrays

		if ! isString(desc) && ! isArray(desc, 'allStrings')
			croak "Bad desc: #{OL(desc)}"

		if isSectionName(desc)
			# --- a section's getBlock() applies any replacer
			block = @section(desc).getBlock()
		else if isSetName(desc)
			lBlocks = for item in @hSets[desc]
				if isArray(item)
					@getBlock item[0]
				else if isString(item)
					@getBlock item
				else
					croak "Item in set #{desc} is not a string or array"

			# --- Remove undef blocks
			lBlocks = lBlocks.filter((block) => defined(block))

			block = toBlock(lBlocks)
			replacer = @hReplacers[desc]
			if defined(replacer)
				block = replacer(block)
		else if isString(desc)
			# --- a literal string
			block = desc
		else if isArray(desc)
			lBlocks = for item in desc
				@getBlock(item)
			block = toBlock(lBlocks)
		else
			croak "Bad arg: #{OL(desc)}"

		return block

	# ..........................................................
	# --- does NOT call any replacers, and skips literal strings
	#     so only useful for isEmpty() and nonEmpty()

	allSections: (desc=undef) ->

		if notdefined(desc)
			desc = @lFullTree

		if isSectionName(desc)
			yield @section(desc)
		else if isSetName(desc)
			for name in @hSets[desc]
				yield from @allSections(name)
		else if isArray(desc)
			for item in desc
				yield from @allSections(item)
		return

	# ..........................................................

	isEmpty: (desc=undef) ->

		for sect from @allSections(desc)
			if sect.nonEmpty()
				return false
		return true

	# ..........................................................

	nonEmpty: (desc=undef) ->

		for sect from @allSections(desc)
			if sect.nonEmpty()
				return true
		return false

	# ..........................................................

	section: (name) ->

		sect = @hSections[name]
		assert defined(sect), "No section named #{OL(name)}"
		return sect

	# ..........................................................

	firstSection: (name) ->

		assert isSetName(name), "bad set name #{OL(name)}"
		lSubTree = @hSets[name]
		assert defined(lSubTree), "no such set #{OL(name)}"
		return @section(lSubTree[0])

	# ..........................................................

	lastSection: (name) ->

		assert isSetName(name), "bad set name #{OL(name)}"
		lSubTree = @hSets[name]
		assert defined(lSubTree), "no such set #{OL(name)}"
		return @section(lSubTree[lSubTree.length - 1])

	# ..........................................................

	checkTree: (tree) ->

		if isString(tree)
			assert isTAML(tree), "not TAML"
			@lFullTree = fromTAML(tree)
		else
			@lFullTree = tree

		assert isArray(@lFullTree), "not an array"
		assert nonEmpty(@lFullTree), "tree is empty"
		if isSetName(@lFullTree[0])
			croak "tree cannot begin with a set name"
		return

	# ..........................................................

	checkReplacers: (h) ->

		assert isHash(h), "replacers is not a hash"
		for key,func of h
			assert isSetName(key) || isSectionName(key), "bad replacer key"
			assert isFunction(func),
					"replacer for #{OL(key)} is not a function"
		return
