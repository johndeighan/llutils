// section-map.coffee
var isSectionName, isSetName;

import {
  undef,
  defined,
  notdefined,
  OL,
  isEmpty,
  nonEmpty,
  isString,
  isHash,
  isArray,
  isFunction,
  toBlock,
  assert,
  croak
} from '@jdeighan/llutils';

import {
  Section
} from '@jdeighan/llutils/section';

// ---------------------------------------------------------------------------
// --- NOTE: section names begin with a lower case letter
//           set names begin with an upper case letter
export var SectionMap = class SectionMap {
  constructor(tree, hReplacers = {}) {
    this.hReplacers = hReplacers;
    // --- tree is a tree of section/set names
    // --- hReplacers are callbacks that are called
    //        when a set or section is processed
    //        should be <name> -> <function>
    //     <name> can be a section name or a set name
    //     <function> should be <block> -> <block>
    this.checkTree(tree);
    this.checkReplacers(this.hReplacers);
    this.hSections = {}; // --- {section name: Section Object}
    this.hSets = {
      ALL: this.lFullTree // --- {set name: array of parts}
    };
    this.init(this.lFullTree);
  }

  // ..........................................................
  dump() {
    console.log(JSON.stringify(this.hSections, null, 3));
  }

  // ..........................................................
  init(lTree) {
    var firstItem, i, item, len;
    assert(isArray(lTree), "not an array");
    assert(nonEmpty(lTree), "empty array");
    firstItem = lTree[0];
    if (isSetName(firstItem)) {
      lTree = lTree.slice(1);
      this.mkSet(firstItem, lTree);
    }
    for (i = 0, len = lTree.length; i < len; i++) {
      item = lTree[i];
      if (isArray(item)) {
        this.init(item);
      } else if (isSectionName(item)) {
        this.mkSection(item);
      } else {
        assert(isString(item), `Bad item in tree: ${OL(item)}`);
      }
    }
  }

  // ..........................................................
  setReplacer(name, func) {
    this.section('name').converter = func;
  }

  // ..........................................................
  mkSet(name, lTree) {
    assert(isArray(lTree), "tree is not an array");
    assert(nonEmpty(lTree), "set without sections");
    assert(notdefined(this.hSets[name]), `set ${OL(name)} already exists`);
    this.hSets[name] = lTree;
  }

  // ..........................................................
  mkSection(name) {
    assert(notdefined(this.hSections[name]), "duplicate section name");
    this.hSections[name] = new Section(name, this.hReplacers[name]);
  }

  // ..........................................................
  getBlock(desc = 'ALL') {
    var block, item, lBlocks, replacer;
    if (!isString(desc) && !isArray(desc, 'allStrings')) {
      croak(`Bad desc: ${OL(desc)}`);
    }
    if (isSectionName(desc)) {
      // --- a section's getBlock() applies any replacer
      block = this.section(desc).getBlock();
    } else if (isSetName(desc)) {
      debugger;
      lBlocks = (function() {
        var i, len, ref, results;
        ref = this.hSets[desc];
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          item = ref[i];
          if (isArray(item)) {
            results.push(this.getBlock(item[0]));
          } else if (isString(item)) {
            results.push(this.getBlock(item));
          } else {
            results.push(croak(`Item in set ${desc} is not a string or array`));
          }
        }
        return results;
      }).call(this);
      // --- Remove undef blocks
      lBlocks = lBlocks.filter((block) => {
        return defined(block);
      });
      block = toBlock(lBlocks);
      replacer = this.hReplacers[desc];
      if (defined(replacer)) {
        block = replacer(block);
      }
    } else if (isString(desc)) {
      // --- a literal string
      block = desc;
    } else if (isArray(desc)) {
      lBlocks = (function() {
        var i, len, results;
        results = [];
        for (i = 0, len = desc.length; i < len; i++) {
          item = desc[i];
          results.push(this.getBlock(item));
        }
        return results;
      }).call(this);
      block = toBlock(lBlocks);
    } else {
      croak(`Bad arg: ${OL(desc)}`);
    }
    return block;
  }

  // ..........................................................
  // --- does NOT call any replacers, and skips literal strings
  //     so only useful for isEmpty() and nonEmpty()
  * allSections(desc = undef) {
    var i, item, j, len, len1, name, ref;
    if (notdefined(desc)) {
      desc = this.lFullTree;
    }
    if (isSectionName(desc)) {
      yield this.section(desc);
    } else if (isSetName(desc)) {
      ref = this.hSets[desc];
      for (i = 0, len = ref.length; i < len; i++) {
        name = ref[i];
        yield* this.allSections(name);
      }
    } else if (isArray(desc)) {
      for (j = 0, len1 = desc.length; j < len1; j++) {
        item = desc[j];
        yield* this.allSections(item);
      }
    }
  }

  // ..........................................................
  isEmpty(desc = undef) {
    var ref, sect;
    ref = this.allSections(desc);
    for (sect of ref) {
      if (sect.nonEmpty()) {
        return false;
      }
    }
    return true;
  }

  // ..........................................................
  nonEmpty(desc = undef) {
    var ref, sect;
    ref = this.allSections(desc);
    for (sect of ref) {
      if (sect.nonEmpty()) {
        return true;
      }
    }
    return false;
  }

  // ..........................................................
  section(name) {
    var sect;
    sect = this.hSections[name];
    assert(defined(sect), `No section named ${OL(name)}`);
    return sect;
  }

  // ..........................................................
  firstSection(name) {
    var lSubTree;
    assert(isSetName(name), `bad set name ${OL(name)}`);
    lSubTree = this.hSets[name];
    assert(defined(lSubTree), `no such set ${OL(name)}`);
    return this.section(lSubTree[0]);
  }

  // ..........................................................
  lastSection(name) {
    var lSubTree;
    assert(isSetName(name), `bad set name ${OL(name)}`);
    lSubTree = this.hSets[name];
    assert(defined(lSubTree), `no such set ${OL(name)}`);
    return this.section(lSubTree[lSubTree.length - 1]);
  }

  // ..........................................................
  checkTree(tree) {
    if (isString(tree)) {
      assert(isTAML(tree), "not TAML");
      this.lFullTree = fromTAML(tree);
    } else {
      this.lFullTree = tree;
    }
    assert(isArray(this.lFullTree), "not an array");
    assert(nonEmpty(this.lFullTree), "tree is empty");
    if (isSetName(this.lFullTree[0])) {
      croak("tree cannot begin with a set name");
    }
  }

  // ..........................................................
  checkReplacers(h) {
    var func, key;
    assert(isHash(h), "replacers is not a hash");
    for (key in h) {
      func = h[key];
      assert(isSetName(key) || isSectionName(key), "bad replacer key");
      assert(isFunction(func), `replacer for ${OL(key)} is not a function`);
    }
  }

};

// ---------------------------------------------------------------------------
isSectionName = (name) => {
  return isString(name) && name.match(/^[a-z][a-z0-9_-]*/);
};

// ---------------------------------------------------------------------------
isSetName = (name) => {
  return isString(name) && name.match(/^[A-Z][a-z0-9_-]*/);
};

//# sourceMappingURL=section-map.js.map
