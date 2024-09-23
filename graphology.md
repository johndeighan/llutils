graphology
==========

```coffee
import Graph from 'graphology'
import {
	hasCycle, topologicalSort,
	} from 'graphology-dag';

graph = new Graph({
	allowSelfLoops: false
	multi: false
	type: 'directed'
	})

# --- Add nodes
graph.addNode 'A'
graph.addNode 'B'
graph.addNode 'C'

# --- Add edges
graph.addEdge 'A', 'B'
graph.addEdge 'B', 'C'

# --- Test if a graph has a particular node
if graph.hasNode('A')
	LOG "Yes"
else
	LOG "No"

# --- Get number of outgoing edges
LOG "Node 'A' has degree #{graph.outDegree('A')}"

# --- Test if a leaf node
if (graph.outDegree('C') == 0)
	LOG "'C' is a leaf node"
else
	LOG "'C' is not a leaf node"

# --- Get all node labels
lNodes = graph.nodes()

# --- Get all outgoing edges for a node
func = (edge, attr, src, dest) => return dest
lDestNodes = graph.mapOutEdges(node, func)
```
