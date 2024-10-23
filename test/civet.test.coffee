# civet.test.coffee

import * as lib from '@jdeighan/llutils/civet'
Object.assign(global, lib)
import * as lib2 from '@jdeighan/llutils/utest'
Object.assign(global, lib2)

# ---------------------------------------------------------------------------
#symbol "execCivet(str)"    # --- execute civet code

equal await execCivet('x = 42'), 42
equal await execCivet('x = "Hello World"'), "Hello World"
fails () => await execCivet("not real JS code +")

# ---------------------------------------------------------------------------

(() =>
	u = new UnitTester()
	u.transformValue = (str) ->
		result = await execCivet(str)
		return result

	u.equal """
		x = 42
		2 * x
		""", 84
	)()
