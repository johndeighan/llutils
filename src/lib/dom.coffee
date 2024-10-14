# dom.coffee

import {
	undef, defined, notdefined, LOG, OL, range,
	} from '@jdeighan/llutils'
import {DOMParser, XMLSerializer} from 'xmldom'

# ---------------------------------------------------------------------------

export class VirtualDOM

	constructor: () ->

		@init()

	init: () ->

		@xmlDocument = new DOMParser().parseFromString("""
			<xml>
			</xml>
			""", 'text/xml')
		@docElem = @xmlDocument.documentElement

	addElement: (tag, hAttr={}) ->

		elem = @xmlDocument.createElement(tag)
		@docElem.appendChild(elem)
		return

	asString: () ->

		serializer = new XMLSerializer()
		return formatXML(serializer.serializeToString(@xmlDocument))

# ---------------------------------------------------------------------------
# tab = optional indent value, default is tab (\t)

export formatXML = (xmlStr, tab = '\t', nl = '\n') =>

	formatted = ''
	indent = ''
	lNodes = xmlStr.slice(1, -1).split(/>\s*</)
	if (lNodes[0][0] == '?')
		formatted += '<' + lNodes.shift() + '>' + nl
	for node in lNodes
		if (node[0] == '/')
			# --- decrease indent
			indent = indent.slice(tab.length)
		formatted += indent + '<' + node + '>' + nl
		if ((node[0] != '/') \
				&& (node[node.length - 1] != '/') \
				&& (node.indexOf('</') == -1))
			# --- increase indent
			indent += tab
	return formatted.trim()

# ---------------------------------------------------------------------------

export VDOM = new VirtualDOM()
