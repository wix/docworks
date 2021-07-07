const tmp = require('tmp-promise')
const extractComparePush = require('./extract-compare-push')
const localDocworks = require('./local-docworks')
const validate = require('./validate')
const optimist = require('optimist')
const {resolveAndInitPlugins} = require('./plugins')
const runTern = require('./run-tern')
const runDts = require('./run-dts')
const castArray_ = require('lodash/castArray')
const isString_ = require('lodash/isString')

function docworks() {
  if (process.argv.length < 3) {
    printUsage()
    process.exit(1)
  }

  const command = process.argv[2]
  const cliArgs = process.argv.slice(3)

  if (command === 'ecp') {
    return ecp()
  } else if (command === 'validate' || command === 'val') {
    return validateCommand()
  } else if (command === 'tern') {
    return tern()
  } else if (command === 'dts') {
    return dts()
  } else if (command === 'local') {
    return ldw()
  } else {
    printUsage(1)
    process.exit(1)
  }

  /* eslint-disable no-console */
  function printUsage() {
    console.log('Usage: ' + optimist.$0 + ' [command] [options...]')
    console.log('')
    console.log('Commands:')
    console.log('  dts              generate dts file from docworks repo')
    console.log('  ecp              extract, compare and push docs from sources to a docs git repository')
    console.log('  local            extract, compare and copy output to a local directory')
    console.log('  tern             generate tern file from docworks repo')
    console.log('  val | validate   validate the jsDoc annotations')
  }

  /* eslint-enable no-console */

  function ecp() {
    const commandConfig = optimist
      .usage('Usage: $0 ecp -r [remote repo] [-b [remote branch]] -fs [local sources] -fp [file pattern] [-ed [enrichment docs directory]] [--plug [plugin]] [--dryrun]')
      .alias('r', 'remote')
      .describe('r', 'remote repository to merge docs into')
      .alias('b', 'branch')
      .describe('b', 'branch on the remote repository to work with')
      .alias('fs', 'sources')
      .describe('fs', 'one or more folders containing the source files to extract docs from')
      .alias('fx', 'excludes')
      .describe('fx', 'one or more folders to exclude (including their children) from extracting docs')
      .alias('fp', 'pattern')
      .describe('fp', 'file pattern, defaults to ".+\\.js$"')
      .alias('p', 'project')
      .describe('p', 'project folder name in the docs repo')
      .describe('ed', 'project enrichment docs relative directory')
      .describe('plug', 'a module name that is a jsdoc or docworks plugin')
      .describe('dryrun', 'dry run - do not push to remote repo')
      .describe('config', 'js/json file to load configurations from')

    const argv = commandConfig.parse(cliArgs)

    const config = argv.config
      ? Object.assign(require(argv.config), argv)
      : argv

    if (!config.remote || !config.sources || !config.project) {
      commandConfig.showHelp()
      process.exit(1)
    }

    return tmp
      .dir()
      .then(({ path: tmpWorkingDir }) => {
      return extractComparePush({
          remoteRepo: config.remote,
          remoteBranch: config.branch,
          workingDir: tmpWorkingDir,
          projectSubdir: config.project,
          jsDocSources: {
            include: config.sources,
            includePattern: config.pattern || '.+\\.js?$',
            exclude: [].concat(config.excludes),
          },
          plugins: resolveAndInitPlugins(config.plug),
          enrichmentDocsDir: config.ed,
          dryrun: !!config.dryrun,
      })
    })
      .catch(() => {
        process.exit(1)
      })
  }

  function validateCommand() {
    let commandConfig = optimist
      .usage('Usage: $0 validate -fs [local sources] -p [file pattern] -fp [file pattern]')
      .alias('fs', 'sources')
      .describe('fs', 'folder containing the source files to extract docs from')
      .alias('fx', 'excludes')
      .describe('fx', 'one or more folders to exclude (including their children) from extracting docs')
      .alias('fp', 'pattern')
      .describe('fp', 'file pattern, defaults to ".+\\.js$"')
      .describe('plug', 'a module name that is a jsdoc plugin')
      .describe('config', 'js/json file to load configurations from')

    const argv = commandConfig.parse(cliArgs)

    const config = argv.config
      ? Object.assign(require(argv.config), argv)
      : argv

    if (!config.sources) {
      commandConfig.showHelp()
      process.exit(1)
  }

    const jsDocSources = {
      include: config.sources,
      includePattern: config.pattern || '.+\\.js?$',
      exclude: [].concat(config.excludes),
    }
    const plugins = resolveAndInitPlugins(config.plug)

    if (!validate(jsDocSources, plugins)) process.exit(1)
  }

  function tern() {
    const cmdDefinition = optimist
      .usage('Usage: $0 tern (-r [remote repo] [-b [remote branch]] | -l [local services folder] ) -u [base url] -n [api name] -o [output file]')
      .alias('r', 'remote')
      .describe('r', 'remote repository to read docworks services files from')
      .alias('b', 'branch')
      .describe('b', 'branch on the remote repository to fetch the docs from')
      .alias('l', 'local')
      .describe('l', 'folder containing docwork service files')
      .demand('u')
      .alias('u', 'url')
      .describe('u', 'base url for the urls generated in tern')
      .demand('n')
      .alias('n', 'name')
      .describe('n', 'API name')
      .demand('o')
      .alias('o', 'out')
      .describe('o', 'output file')
      .describe('plug', 'a module name that is a docworks tern plugin')
    let argv = cmdDefinition
      .argv

    let remote = argv.remote
    let branch = argv.branch
    let local = argv.local
    let baseUrl = argv.url
    let apiName = argv.name
    let outputFileName = argv.out
    let plugins = resolveAndInitPlugins(argv.plug)

    if (!remote && !local || (!!remote && !!local)) {
      // eslint-disable-next-line no-console
      console.log(cmdDefinition.help())
      process.exit(1)
    }

    return runTern({remote, branch, local, baseUrl, apiName, outputFileName, plugins})
      .catch(() => {
        process.exit(1)
      })
  }

  function dts() {
    const cmdDefinition = optimist
      .usage('Usage: $0 dts (-r [remote repo] | -l [local services folder] ) -o [output file] -d [output dir] -i [service name]')
      .alias('r', 'remote')
      .describe('r', 'remote repository to read docworks services files from')
      .alias('l', 'local')
      .describe('l', 'folder containing docwork service files')
      .demand('o')
      .alias('o', 'out')
      .describe('o', 'output file')
      .alias('d', 'dir')
      .describe('d', 'output dir')
      .alias('M', 'ignoreModule')
      .describe('i', 'ignores a module and does not include it in the output. -M can be specified multiple times')
      .alias('N', 'ignoreNamespace')
      .describe('i', 'ignores a namespace and does not include it in the output. -N can be specified multiple times')

    const argv = cmdDefinition
      .argv

    const remote = argv.remote
    const local = argv.local
    const run$wFixer = !!argv.wixselector
    const outputFileName = argv.out
    const outputDirName = argv.dir || ''
    const summaryTemplate = argv.summaryTemplate
    const ignoredModules = isString_(argv.ignoreModule) ? castArray_(argv.ignoreModule) : []
    const ignoredNamespaces = isString_(argv.ignoreNamespace) ? castArray_(argv.ignoreNamespace) : []

    if (!remote && !local || (!!remote && !!local)) {
      // eslint-disable-next-line no-console
      console.log(cmdDefinition.help())
      process.exit(1)
    }

    return runDts(
      outputFileName,
      outputDirName,
      { remote, local, run$wFixer, summaryTemplate, ignoredModules, ignoredNamespaces }
    )
      .catch(() => {
        process.exit(1)
      })
  }

  function ldw() {
    let commandConfig = optimist
      .usage('Usage: $0 local -r [remote repo] -d [local directory] -fs [local sources] -fp [file pattern] -p [project name] [-ed [enrichment docs directory]] [--plug [plugin]]')
      .alias('r', 'remote')
      .describe('r', 'remote repository to merge docs into')
      .alias('b', 'branch')
      .describe('b', 'branch on the remote repository to work with')
      .alias('d', 'dist')
      .describe('d', 'local directory to output docs into')
      .alias('fs', 'sources')
      .describe('fs', 'one or more folders containing the source files to extract docs from')
      .alias('fx', 'excludes')
      .describe('fx', 'one or more folders to exclude (including their children) from extracting docs')
      .alias('fp', 'pattern')
      .describe('fp', 'file pattern, defaults to ".+\\.js$"')
      .alias('p', 'project')
      .describe('p', 'project folder name in the docs repo')
      .describe('ed', 'project enrichment docs relative directory')
      .describe('plug', 'a module name that is a jsdoc or docworks plugin')
      .describe('config', 'js/json file to load configurations from')

    const argv = commandConfig.parse(cliArgs)

    const config = argv.config
      ? Object.assign(require(argv.config), argv)
      : argv

    if (!config.remote || !config.dist || !config.sources || !config.project) {
      commandConfig.showHelp()
      process.exit(1)
    }

    return tmp
      .dir()
      .then(({ path: tmpWorkingDir }) => {
        return localDocworks({
          remoteRepo: config.remote,
          branch: config.branch,
          outputDirectory: config.dist,
          tmpDir: tmpWorkingDir,
          projectDir: config.project,
          jsDocSources: {
            include: config.sources,
            includePattern: config.pattern || '.+\\.js?$',
            exclude: [].concat(config.excludes),
          },
          plugins: resolveAndInitPlugins(config.plug),
          enrichmentDocsDir: config.ed,
          dryrun: !!config.dryrun,
        })
      })
      .catch(() => {
        process.exit(1)
      })
  }
}

module.exports = docworks
