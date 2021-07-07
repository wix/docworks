const { includes, last, omit } = require('lodash')
const { transform } = require('@babel/core')
const defaultTransformConfigPath = require.resolve('./transform.config.js')

// jsdoc with requizzle loads the modules twice - so the only way to move config between the two runs is using global
if (!global.wixJsdocBabelExtensions)
global.wixJsdocBabelExtensions =['js']

function shouldProcessFile(filename, { extensions }) {
  return includes(extensions, last(filename.split('.')))
}

function processFile(source, options) {
  return transform(source, omit(options, 'extensions')).code
}

let doclets = {}
const handlers = {
  beforeParse: (event) => {
    const options = {
      extensions: global.wixJsdocBabelExtensions,
      filename: event.filename,
      configFile: defaultTransformConfigPath,
      babelrc: false
    }

    if (shouldProcessFile(event.filename, options)) {
      // eslint-disable-next-line no-param-reassign
      event.source = processFile(event.source, options, doclets)
    }
  }
}

function init(param) {
  global.wixJsdocBabelExtensions = param.split(',')
}

module.exports = {
  init,
  handlers
}
