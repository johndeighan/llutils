// getdep.js

function getDependencies (hDep) {

	let setDependencies = new Set();
	let setKeys = new Set(Object.keys(hDep));
	while (setDependencies.size < setKeys.size) {

		// --- get a new key whose dependencies
		//     have all been added
		let ok = undefined;
		for (item from setKeys.values()) {
			if (!setDependencies.has(item)
					&& hDep[item].isSubsetOf(setDependencies))
				setDependencies.add foundKey
				ok = true
				break
			}
		if (!ok) throw new Error("Circular dependencies");
		}
	return Array.from setDependencies.values()
	}
