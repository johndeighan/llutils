# rule-ex.coffee

import {
	undef, defined, notdefined, OL, ML, hasKey,
	isString, isInteger, isArray,
	assert, croak,
	} from '@jdeighan/llutils'
import {MultiMap} from '@jdeighan/llutils/multi-map'

raisedDot = '•'
export phi = 'Φ'

# ---------------------------------------------------------------------------
#     class RuleEx
# ---------------------------------------------------------------------------

export class RuleEx

	@nextID: 0
	@resetNextID: () =>
		@nextID = 0
		return
	@getNextID: () =>
		id = @nextID
		@nextID += 1
		return id

	@mm: new MultiMap(3)
	@getNew: (hRule, src, pos=0) =>
		obj = @mm.get([hRule, src, pos])
		if defined(obj)
			return obj
		else
			obj = new RuleEx(hRule, src, pos)
			@mm.set [hRule, src, pos], obj
			return obj

	constructor: (@hRule, @src, @pos=0) ->

		@id = RuleEx.getNextID()

		checkRule(@hRule, @id)

		# --- Copy fields from hRule to this object
		@type = @hRule.type
		@head = @hRule.head
		@lParts = @hRule.lParts

		assert isInteger(@src), "Not an int: #{OL(@src)}"
		@maxpos = @lParts.length

	nextPart: () ->     # --- may return undef

		return @lParts[@pos]

	getInc: () ->

		assert (@pos+1 <= @maxpos), "Can't inc #{ML(this)}"
		return RuleEx.getNew(@hRule, @src, @pos+1)

	asString: () ->

		return "[#{@id}] #{ruleAsString(@hRule, @pos)} / #{@src}"

# ---------------------------------------------------------------------------

export terminal = (value) ->

	assert [
		isString(value),
		(value.length == 1),
		], "Bad terminal: #{OL(value)}"
	return {
		type: 'terminal'
		value
		}

# ---------------------------------------------------------------------------

export nonterminal = (name) ->

	assert isString(name), "bad nonterminal: #{OL(name)}"
	return {
		type: 'nonterminal'
		value: name
		}

# ---------------------------------------------------------------------------

export checkRule = (hRule, id=1) ->

	assert [
		(hRule.type == "rule"),
		hasKey(hRule, 'head'),
		isString(hRule.head),
#		(hRule.head != phi) || (id == 0),
		hasKey(hRule, 'lParts'),
		isArray(hRule.lParts),
		], "Bad rule: #{OL(hRule)}"
	return

# ---------------------------------------------------------------------------

export ruleAsString = (hRule, pos=undef) ->

	lRHS = hRule.lParts.map(
		(hPart) =>
			switch hPart.type
				when "terminal"
					return "\"#{hPart.value}\""
				when "nonterminal"
					return "#{hPart.value}"
		)
	if defined(pos)
		lRHS.splice pos, 0, raisedDot
	rhs = lRHS.join(" ")
	return "#{hRule.head} -> #{rhs}"
