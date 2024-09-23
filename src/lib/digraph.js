// digraph.coffee
import Graph from 'graphology';

import {
  hasCycle,
  topologicalSort
} from 'graphology-dag';

import {
  undef,
  defined,
  notdefined,
  isEmpty,
  nonEmpty,
  keys,
  hasKey,
  OL,
  LOG,
  identityFunc,
  isString,
  isArray,
  isHash,
  assert,
  croak,
  getOptions
} from '@jdeighan/llutils';

import {
  execCmd
} from '@jdeighan/llutils/exec-utils';

import {
  fileExt,
  withExt,
  barf
} from '@jdeighan/llutils/fs';

// ---------------------------------------------------------------------------
export var DiGraph = class DiGraph {
  constructor(hOptions = {}) {
    var i, len, ref, style, type;
    ({
      normalize: this.normalize,
      filterDep: this.filterDep,
      debug: this.debug,
      hStyles: this.hStyles
    } = getOptions(hOptions, {
      normalize: identityFunc,
      filterDep: ((dep) => {
        return true;
      }),
      debug: false,
      hStyles: {}
    }));
    ref = keys(this.hStyles);
    // --- convert all styles to strings
    for (i = 0, len = ref.length; i < len; i++) {
      type = ref[i];
      style = this.hStyles[type];
      if (isHash(style)) {
        this.hStyles[type] = this.attrStr(style);
      }
    }
    this.graph = new Graph({
      allowSelfLoops: false,
      multi: false,
      type: 'directed'
    });
  }

  // ..........................................................
  attrStr(h) {
    var lParts;
    lParts = keys(h).map((key) => {
      return `${key}=${h[key]}`;
    });
    return ` [${lParts.join(', ')}]`;
  }

  // ..........................................................
  // --- filePath is the file that should be output,
  //        e.g. "myfile.svg" or "myfile.png"
  //     the file extension is the type of image file desired
  render(filePath, layout = undef) {
    var dotPath, type;
    type = fileExt(filePath).substring(1);
    LOG(`type = ${OL(type)}`);
    if (defined(layout)) {
      LOG(`layout = ${OL(layout)}`);
    }
    dotPath = withExt(filePath, '.dot');
    this.barfDotProgram(dotPath);
    if (defined(layout)) {
      execCmd(`dot -T${type} -K${layout} ${dotPath} > ${filePath}`);
    } else {
      execCmd(`dot -T${type} ${dotPath} > ${filePath}`);
    }
  }

  // ..........................................................
  add(item, lDeps = [], hAttr = {}) {
    var dep, i, len, ndep, node;
    // --- 2nd parameter may be a simple string
    //     if there's only one dependency
    node = this.normalize(item, 'key');
    assert(isString(node), `node not a string: ${OL(node)}`);
    if (isString(lDeps)) {
      lDeps = [lDeps];
    } else {
      assert(isArray(lDeps), `not an array: ${OL(lDeps)}`);
    }
    this.graph.mergeNode(node, hAttr);
    for (i = 0, len = lDeps.length; i < len; i++) {
      dep = lDeps[i];
      if (this.filterDep(dep)) {
        ndep = this.normalize(dep, 'dep');
        this.graph.mergeNode(ndep, {
          nodeType: 'lib'
        });
        this.graph.mergeEdge(node, ndep);
      }
    }
    if (this.debug) {
      this.dump();
    }
    return this; // allow chaining
  }

  
    // ..........................................................
  hasCycle() {
    return hasCycle(this.graph);
  }

  // ..........................................................
  numNodes() {
    return this.graph.order;
  }

  // ..........................................................
  numEdges() {
    return this.graph.size;
  }

  // ..........................................................
  // --- callback gets (node, nodeType, lDeps)
  forEachNode(func, hOptions = {}) {
    var i, lDeps, lNodes, len, noTrans, node, sortDeps, sortKeys;
    ({sortKeys, sortDeps, noTrans} = getOptions(hOptions, {
      sortKeys: true,
      sortDeps: false,
      noTrans: false // --- else only non-transitive
    }));
    lNodes = this.graph.nodes();
    if (sortKeys) {
      lNodes.sort();
    }
    for (i = 0, len = lNodes.length; i < len; i++) {
      node = lNodes[i];
      if (noTrans) {
        lDeps = this.follows(node);
      } else {
        lDeps = this.getOutNodes(node);
      }
      if (sortDeps) {
        lDeps.sort();
      }
      func(node, this.graph.getNodeAttributes(node), lDeps);
    }
  }

  // ..........................................................
  dump(hOptions = {}) {
    var maxWidth;
    ({maxWidth} = getOptions(hOptions, {
      maxWidth: 64
    }));
    LOG("DEPENDENCIES:");
    this.forEachNode(((node, hAttr, lDeps) => {
      var dep, i, len, nodeType, totLen;
      nodeType = hAttr.nodeType;
      if (isEmpty(lDeps)) {
        return LOG(`\t${node}: {}`);
      } else {
        totLen = 0;
        for (i = 0, len = lDeps.length; i < len; i++) {
          dep = lDeps[i];
          totLen += dep.length;
        }
        if (totLen < maxWidth) {
          return LOG(`\t${node} { ${lDeps.join(', ')} }`);
        } else {
          return LOG(`\t${node} \n\t${lDeps.join('\n\t')}\n`);
        }
      }
    }));
  }

  // ..........................................................
  getBuildOrder(hOptions = {}) {
    var lDeps, noTrans;
    ({noTrans} = getOptions(hOptions, {
      noTrans: false
    }));
    if (noTrans) {
      lDeps = [];
      this.forEachNode(((node, hAttr) => {
        var nodeType;
        nodeType = hAttr.nodeType;
        return lDeps.push(node);
      }), 'notrans');
      return lDeps;
    } else {
      // --- returns an array
      return topologicalSort(this.graph).reverse();
    }
  }

  // ..........................................................
  dotProgram() {
    var lLines;
    lLines = ["digraph {"];
    this.forEachNode(((node, hAttr) => {
      var i, lFollows, len, node2, nodeType, results, style;
      ({nodeType} = hAttr);
      style = this.hStyles[nodeType];
      if (nonEmpty(style)) {
        lLines.push(`\t\"${node}\"${style}`);
      }
      lFollows = this.follows(node);
      if (lFollows.length === 1) {
        return lLines.push(`\t\"${node}\" -> \"${lFollows[0]}\"`);
      } else if (lFollows.length > 1) {
        results = [];
        for (i = 0, len = lFollows.length; i < len; i++) {
          node2 = lFollows[i];
          results.push(lLines.push(`\t\"${node}\" -> \"${node2}\"`));
        }
        return results;
      }
    }));
    lLines.push("\t}");
    return lLines.join("\n");
  }

  // ..........................................................
  barfDotProgram(filePath) {
    var program;
    assert(defined(filePath), "Missing filePath");
    program = this.dotProgram();
    barf(program, filePath);
  }

  // ..........................................................
  isLeafNode(node) {
    return this.graph.outDegree(node) === 0;
  }

  // ..........................................................
  getOutNodes(node) {
    return this.graph.mapOutEdges(node, (edge, attr, src, dest) => {
      return dest;
    });
  }

  // ..........................................................
  follows(node) {
    var i, j, lFullPaths, lPath, len, len1, pos, setFollows;
    lFullPaths = this.getFullPathsFor(node);
    setFollows = new Set();
    for (i = 0, len = lFullPaths.length; i < len; i++) {
      lPath = lFullPaths[i];
      setFollows.add(lPath[1]);
    }
    for (j = 0, len1 = lFullPaths.length; j < len1; j++) {
      lPath = lFullPaths[j];
      pos = 2;
      while (pos < lPath.length) {
        setFollows.delete(lPath[pos]);
        pos += 1;
      }
    }
    return Array.from(setFollows);
  }

  // ..........................................................
  getFullPathsFor(node) {
    var lDeps, lPathList;
    assert(this.graph.hasNode(node), `Not a node: ${OL(node)}`);
    lDeps = this.getOutNodes(node);
    lPathList = lDeps.map((s) => {
      return [node, s];
    });
    this.extendPaths(lPathList);
    return lPathList;
  }

  // ..........................................................
  extendPaths(lPathList) {
    var end, lDeps, lExtended, lPath, pos;
    pos = 0;
    while (pos < lPathList.length) {
      lPath = lPathList[pos];
      end = lPath.at(-1);
      if (this.isLeafNode(end)) {
        pos += 1;
      } else {
        lDeps = this.getOutNodes(end);
        lExtended = lDeps.map((node) => {
          return lPath.concat([node]);
        });
        lPathList.splice(pos, 1, ...lExtended);
        pos += lDeps.length;
      }
    }
  }

};

//# sourceMappingURL=digraph.js.map
