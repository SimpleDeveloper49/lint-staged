'use strict'

const appRoot = require('app-root-path')
const npmWhich = require('npm-which')(process.cwd())
const checkPkgScripts = require('./checkPkgScripts')

// Find and load the package.json at the root of the project.
const pkg = require(appRoot.resolve('package.json')) // eslint-disable-line import/no-dynamic-require
const debug = require('debug')('lint-staged:find-bin')

const cache = new Map()

module.exports = function findBin(cmd) {
  debug('Resolving binary for command `%s`', cmd)

  /*
   *  Try to locate the binary in node_modules/.bin and if this fails, in
   *  $PATH.
   *
   *  This allows to use linters installed for the project:
   *
   *  "lint-staged": {
   *    "*.js": "eslint"
   *  }
   */
  const [binName, ...args] = cmd.split(' ')

  if (cache.has(binName)) {
    debug('Resolving binary for `%s` from cache', binName)
    return { bin: cache.get(binName), args }
  }

  try {
    /* npm-which tries to resolve the bin in local node_modules/.bin */
    /* and if this fails it look in $PATH */
    const bin = npmWhich.sync(binName)
    debug('Binary for `%s` resolved to `%s`', cmd, bin)
    cache.set(binName, bin)
    return { bin, args }
  } catch (err) {
    // throw helpful error if matching script is present in package.json
    checkPkgScripts(pkg, cmd, binName, args)
    throw new Error(`${binName} could not be found. Try \`npm install ${binName}\`.`)
  }
}
