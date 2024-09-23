# log-all-dependencies.coffee

import pathLib from 'node:path'

import {
	undef, defined, notdefined, OL, LOG, nonEmpty,
	assert, croak,
	} from '@jdeighan/llutils'
import {
	isFile, allFilesMatching,
	fileExt, fileStub, relpath,
	} from '@jdeighan/llutils/fs'
import {analyzeCoffeeFile} from '@jdeighan/llutils/llcoffee'
import {analyzePeggyFile} from '@jdeighan/llutils/peggy'
import {DiGraph} from '@jdeighan/llutils/digraph'

# ---------------------------------------------------------------------------

filePath = process.argv[2]
assert defined(filePath), "Missing file path"

graph = new DiGraph {
	normalize: ((relPath) => fileStub(relPath))
	filterDep: ((dep) =>
		dep.startsWith('@jdeighan/llutils')
		)
	}

lPatterns = [
	[/src\/lib\/\w+\.coffee$/, 'lib']
	[/src\/bin\/\w+\.coffee$/, 'bin']
	[/\.coffee$/, 'other']
	]
for [regexp, nodeType] in lPatterns
	if filePath.match regexp
		lDeps = analyzeCoffeeFile(filePath).lDependencies
		graph.add(filePath, lDeps, {nodeType})
		break

graph.dump()
graph.forEachNode ((node) => LOG node), 'noTrans'
