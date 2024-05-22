Create library llutils
======================

Make sure `nodejs` and `git` are installed.

```bash
$ mkdir <newlib>
$ cd <newlib>
$ mkdir src test src/bin src/lib
$ git init
$ npm init -y
$ npm install -D coffeescript ava
$ npm install glob peggy n-readlines yaml
```

Create file `llutils.coffee` (see source code)

Change `package.json` file to:

```json
{
	"name": "@jdeighan/llutils",
	"version": "1.0.0",
	"scripts": {
		"test": "echo \"Error: no test specified\" && exit 1"
	},
	"keywords": ["coffeescript","javascript","peggy"],
	"author": "John Deighan",
	"license": "MIT",
	"description": "compile coffee and peggy files",
	"devDependencies": {
		"ava": "^6.1.3",
		"coffeescript": "^2.7.0"
	}
}
```

Add file `.npmrc`:

```text
engine-strict=true
# --- loglevel can be silent or warn
loglevel=silent
```

Add file `.gitignore`:

```text
logs/
node_modules/
typings/
*.tsbuildinfo
.npmrc
.gitignore
/build
/public
/dist

# dotenv environment variables file
.env
.env.test

test/temp*.*
/.svelte-kit
```

