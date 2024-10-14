  // dom.coffee
import {
  undef,
  defined,
  notdefined,
  LOG,
  OL,
  range
} from '@jdeighan/llutils';

import {
  DOMParser,
  XMLSerializer
} from 'xmldom';

// ---------------------------------------------------------------------------
export var VirtualDOM = class VirtualDOM {
  constructor() {
    this.init();
  }

  init() {
    this.xmlDocument = new DOMParser().parseFromString(`<xml>
</xml>`, 'text/xml');
    return this.docElem = this.xmlDocument.documentElement;
  }

  addElement(tag, hAttr = {}) {
    var elem;
    elem = this.xmlDocument.createElement(tag);
    this.docElem.appendChild(elem);
  }

  asString() {
    var serializer;
    serializer = new XMLSerializer();
    return formatXML(serializer.serializeToString(this.xmlDocument));
  }

};

// ---------------------------------------------------------------------------
// tab = optional indent value, default is tab (\t)
export var formatXML = (xmlStr, tab = '\t', nl = '\n') => {
  var formatted, i, indent, lNodes, len, node;
  formatted = '';
  indent = '';
  lNodes = xmlStr.slice(1, -1).split(/>\s*</);
  if (lNodes[0][0] === '?') {
    formatted += '<' + lNodes.shift() + '>' + nl;
  }
  for (i = 0, len = lNodes.length; i < len; i++) {
    node = lNodes[i];
    if (node[0] === '/') {
      // --- decrease indent
      indent = indent.slice(tab.length);
    }
    formatted += indent + '<' + node + '>' + nl;
    if ((node[0] !== '/') && (node[node.length - 1] !== '/') && (node.indexOf('</') === -1)) {
      // --- increase indent
      indent += tab;
    }
  }
  return formatted.trim();
};

// ---------------------------------------------------------------------------
export var VDOM = new VirtualDOM();

//# sourceMappingURL=dom.js.map
