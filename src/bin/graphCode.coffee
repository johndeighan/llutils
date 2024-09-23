# graphCode.coffee

import pathLib from 'node:path'

import {undef, defined, OL, LOG, nonEmpty} from '@jdeighan/llutils'
import {
	isFile, allFilesMatching,
	fileExt, fileStub, relpath,
	} from '@jdeighan/llutils/fs'
import {analyzeCoffeeFile} from '@jdeighan/llutils/llcoffee'
import {analyzePeggyFile} from '@jdeighan/llutils/peggy'
import {DiGraph} from '@jdeighan/llutils/digraph'

# ---------------------------------------------------------------------------

graph = new DiGraph {
	normalize: ((relPath) => fileStub(relPath))
	filterDep: ((dep) =>
		dep.startsWith('@jdeighan/llutils') || dep.startsWith('src/lib/')
		)
	}

for {relPath} from allFilesMatching('src/lib/**/*.coffee')
	if relPath.startsWith('test/')
		continue
	lDeps = analyzeCoffeeFile(relPath).lDependencies
	graph.add(relPath, lDeps, {nodeType: 'lib'})

for {relPath} from allFilesMatching('src/bin/**/*.coffee')
	if relPath.startsWith('test/')
		continue
	lDeps = analyzeCoffeeFile(relPath).lDependencies
	graph.add(relPath, lDeps, {nodeType: 'bin'})

for {relPath} from allFilesMatching('**/*.peggy')
	if relPath.startsWith('test/')
		continue
	lDeps = analyzePeggyFile(relPath).lDependencies
	if nonEmpty(lDeps)
		LOG "ANALYZE: #{relPath}"
		LOG "   DEPS: #{OL(lDeps)}"
	graph.add(relPath, lDeps, {nodeType: 'peggy'})

graph.dump({
	sortKeys: true
	maxWidth: 1
	})


if graph.hasCycle()
	LOG "GRAPH HAS CYCLE"
else
	LOG "OK"
	graph.render('./graph.svg', 'dot')
