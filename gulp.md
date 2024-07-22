Using gulp
==========

Verify node, npm, npx and coffee are installed:

```bash
$ node --version
$ npm --version
$ npx --version
$ coffee --version
```

Install gulp CLI globally and gulp locally:

```bash
$ npm install -g gulp-cli
$ npm install -D gulp
$ gulp --version
```

Create file `gulpfile.coffee`:

```coffee
{src, dest, series, parallel} = require('gulp')

exports.hello = (cb) =>
	console.log "Hello"
	cb()
```

Test:

```bash
$ gulp hello
```

Produces output:

```bash
$ gulp hello
[06:34:43] Loaded external module: coffeescript/register
[06:34:43] Using gulpfile ~\llutils\gulpfile.coffee
[06:34:43] Starting 'hello'...
Hello
[06:34:43] Finished 'hello' after 3.17 ms
```

Install some plugins:

```bash
$ npm install -D gulp-rename
```
