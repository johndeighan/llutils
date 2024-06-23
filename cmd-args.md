Using @jdeighan/llutils/cmd-args
================================

SYNOPSIS:

```coffee
import {getArgs} from '@jdeighan/llutils/cmd-args'

hArgs = getArgs(undef, {
	_: [1,1]
	b: 'boolean'
	c: 'boolean'
	type: 'string'
	})

{_, c, type} = hArgs
[dirname] = _
```

If the script if invoked with:

```bash
$ runscript -c -type="a word" c:/Users/johnd
```

Variable dirname will be "c:/Users/johnd"
Variable b will be false
Variable c will be true
Variable type will be "a word"

Errors Reported
---------------

There must be exactly one non-option
	(options are recognized by a leading '-' char)
Option `type` must be followed by '=' and a string, e.g.
	-type=mixed
	-type="some type"
Options `b` and `c` are booleans, i.e. no "=something" may
  follow it. Boolean options are false by default, but set
  true if they appear on the command line. Also, they may be
  combined, e.g.
  	 -bc   will result in both b and c being true

Available types
---------------

'boolean'
'string'
'number'
'integer'
