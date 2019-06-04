#!/usr/bin/env node
import 'babel-polyfill';
let tmp = require('tmp-promise');
let extractComparePush = require('../dist/extract-compare-push').default;
const localDocworks = require('../dist/local-docworks').default;
let validate = require('../dist/validate').default;
let optimist = require('optimist');
let {resolveAndInitPlugins} = require('../dist/plugins');
import runTern from '../dist/run-tern';

if (process.argv.length < 3) {
  printUsage();
  process.exit(1);
}

let command = process.argv[2];

if (command === 'ecp') {
  ecp();
}
else if (command === 'validate' || command === 'val') {
  validateCommand();
}
else if (command === 'tern') {
  tern();
}
else if (command === 'local') {
    ldw();
}
else {
  printUsage(1);
  process.exit(1);
}

function printUsage() {
  console.log('Usage: ' + optimist.$0 + ' [command] [options...]');
  console.log('');
  console.log('Commands:');
  console.log('  ecp              extract, compare and push docs from sources to a docs git repository');
  console.log('  val | validate   validate the jsDoc annotations');
  console.log('  tern             generate tern file from docworks repo');
  console.log('  local            extract, compare and copy output to a local directory');
}


function ecp() {
  let argv = optimist
    .usage('Usage: $0 ecp -r [remote repo] [-b [remote branch]] -s [local sources] -p [file pattern] [--plug [plugin]] [--dryrun]')
    .demand(  'r')
    .alias(   'r', 'remote')
    .describe('r', 'remote repository to merge docs into')
    .alias(   'b', 'branch')
    .describe('b', 'branch on the remote repository to work with')
    .demand(  'fs')
    .alias(   'fs', 'sources')
    .describe('fs', 'one or more folders containing the source files to extract docs from')
    .alias(   'fx', 'excludes')
    .describe('fx', 'one or more folders to exclude (including their children) from extracting docs')
    .default( 'fp', ".+\\.js?$")
    .alias(   'fp', 'pattern')
    .describe('fp', 'file pattern, defaults to ".+\\.js$"')
    .demand(  'p')
    .alias(   'p', 'project')
    .describe('p', 'project folder name in the docs repo')
    .describe('plug', 'a module name that is a jsdoc or docworks plugin')
    .describe('dryrun', 'dry run - do not push to remote repo')
    .parse(process.argv.slice(3));

  let remote = argv.remote;
  let branch = argv.branch;
  let sources = argv.sources;
  let excludes = argv.excludes?(Array.isArray(argv.excludes)?argv.excludes:[argv.excludes]):[];
  let pattern = argv.pattern;
  let project = argv.project;
  let dryrun = !!argv.dryrun;
  let plugins = resolveAndInitPlugins(argv.plug);

  tmp.dir().then(o => {
    return extractComparePush(remote, branch, o.path, project, {"include": sources, "includePattern": pattern, "exclude": excludes}, plugins, dryrun);
  })
    .catch(() => {
      process.exit(1);
    });
}

function validateCommand() {
  let argv = optimist
    .usage('Usage: $0 validate -fs [local sources] -p [file pattern] -fp [file pattern]')
    .demand('fs')
    .alias('fs', 'sources')
    .describe('fs', 'folder containing the source files to extract docs from')
    .default('fp', ".+\\.js?$")
    .alias('fp', 'pattern')
    .describe('fp', 'file pattern, defaults to ".+\\.js$"')
    .alias('plug', 'jsdocplugin')
    .describe('plug', 'a module name that is a jsdoc plugin')
    .parse(process.argv.slice(3));

  let sources = argv.sources;
  let pattern = argv.pattern;
  let plugins = resolveAndInitPlugins(argv.jsdocplugin);

  if (!validate({"include": sources, "includePattern": pattern}, plugins))
    process.exit(1);
}

function tern() {
  const cmdDefinition = optimist
    .usage('Usage: $0 tern (-r [remote repo] | -s [services repo] ) -u [base url] -n [api name] -o [output file]')
    .alias(   'r', 'remote')
    .describe('r', 'remote repository to read docworks services files from')
    .alias(   'l', 'local')
    .describe('l', 'folder containing docwork service files')
    .demand(  'u')
    .alias(   'u', 'url')
    .describe('u', 'base url for the urls generated in tern')
    .demand(  'n')
    .alias(   'n', 'name')
    .describe('n', 'API name')
    .demand(  'o')
    .alias(   'o', 'out')
    .describe('o', 'output file')
    .describe('plug', 'a module name that is a docworks tern plugin');
  let argv = cmdDefinition
    .argv;

  let remote = argv.remote;
  let local = argv.local;
  let baseUrl = argv.url;
  let apiName = argv.name;
  let outputFileName = argv.out;
  let plugins = resolveAndInitPlugins(argv.plug);

  if (!remote && !local || (!!remote && !!local)) {
    console.log(cmdDefinition.help());
    process.exit(1);
  }

  return runTern(remote, local, baseUrl, apiName, outputFileName, plugins)
    .catch(() => {
      process.exit(1);
    });
}

function ldw() {
    let argv = optimist
        .usage('Usage: $0 local -r [remote repo] -d [local directory] -s [local sources] -p [file pattern] [--plug [plugin]] [--dryrun]')
        .demand(  'r')
        .alias(   'r', 'remote')
        .describe('r', 'remote repository to merge docs into')
        .demand(  'd')
        .alias(   'd', 'dist')
        .describe('d', 'local directory to output docs into')
        .demand(  'fs')
        .alias(   'fs', 'sources')
        .describe('fs', 'one or more folders containing the source files to extract docs from')
        .alias(   'fx', 'excludes')
        .describe('fx', 'one or more folders to exclude (including their children) from extracting docs')
        .default( 'fp', ".+\\.js?$")
        .alias(   'fp', 'pattern')
        .describe('fp', 'file pattern, defaults to ".+\\.js$"')
        .demand(  'p')
        .alias(   'p', 'project')
        .describe('p', 'project folder name in the docs repo')
        .describe('plug', 'a module name that is a jsdoc or docworks plugin')
        .describe('dryrun', 'dry run - do not push to remote repo')
        .parse(process.argv.slice(3));

    const remote = argv.remote;
    const dist = argv.dist;
    const sources = argv.sources;
    const excludes = argv.excludes?(Array.isArray(argv.excludes)?argv.excludes:[argv.excludes]):[];
    const pattern = argv.pattern;
    const project = argv.project;
    const dryrun = !!argv.dryrun;
    const plugins = resolveAndInitPlugins(argv.plug);

    tmp.dir()
        .then(wd => {
          return localDocworks(remote, dist, wd.path, project, {"include": sources, "includePattern": pattern, "exclude": excludes}, plugins, dryrun);
        })
        .catch(() => {
            process.exit(1);
        });
}
