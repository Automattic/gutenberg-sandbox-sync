# Gutenberg -> Sandbox Sync

This is a PoC, based on [calypso apps' sync](https://github.com/Automattic/wp-calypso/tree/trunk/apps#building).

This script syncs your local/dev gutenberg instance with your sandbox, so you can test your changes almost in real time.

## How to use

1. In the `gutenberg` folder run `npm run dev`
2. `clone` this repo in a different folder
3. `npm i`
4. Run `node . --localPath=<path to local gutenberg> --watch`

## How it works

The input is the local `gutenberg` path. The script is gonna sync the `build` folder to your sandbox folder (`~/public_html/wp-content/plugins/gutenberg-core/v<version number from gutenberg's package.json>`).

## Arguments

`--localPath`:  the path to your local `gutenberg`

`--watch`: keep watching for changes in the `build` folder

`--version`: the target version folder - the default is the version from gutenberg's `package.json`

## Example

Having this file structure:
* `/home/user/`
   * `gutenberg`
   * `gutenberg-sandbox-sync`
   
1. In `/home/user/gutenberg` run `npm run dev`
2. In `/home/user/gutenberg-sandbox-sync` run `node . --watch --localPath='../gutenberg'`
3. Now make changes to the local files and they'll be synced to your sandbox

*Remember to sandbox the site you'll for testing.
