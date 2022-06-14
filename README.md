# As-Of-Yet Untitled Recursive To-Do checker for obsidian

idk what to call this i'm sorry :(

anyways, you don't need to configure anything. just enable the plugin, reload obsidian, and click on a task with subtasks and everything underneath it will magically be ticked off as done!

this plugin requires `obsidian-dataview`.

## to build

`npm run dev` will start an esbuild daemon that recompiles the plugin every time you make a change.

`npm run build` builds it once.

## what the hell is `copy.ps1` ?!

i've modified the `esbuild.config.mjs` to run this script after each build. as the name suggests, it copies `manifest.json` and `main.js` into a vault of your choosing after compilation[^1].

[^1]: make sure you change the `$vaultdir` variable before running `npm run dev` or `npm run build` !!
