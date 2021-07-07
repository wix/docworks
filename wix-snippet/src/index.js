let path = require('path')
let fs = require('fs')
let logger = console
const {Example} = require('docworks-model')

exports.setSnippetsDir = function(value) {
  // jsdoc with requizzle loads the modules twice - so the only way to move config between the two runs is using global
  global.wixJsDocPluginSnippetsDir = value
}

exports.setLogger = function(value) {
  logger = value
}

exports.init = function(param) {
  exports.setSnippetsDir(param)
}

let reportedConfigError = false
exports.defineTags = function(dictionary) {
  dictionary.defineTag('snippet', {
    mustHaveValue : true,
    canHaveType: false,
    canHaveName : true,
    onTagged: function(doclet, tag) {
      if (!global.wixJsDocPluginSnippetsDir) {
        if (!reportedConfigError) {
          logger.error('ERROR: The Wix Snippet jsdoc plugin requires a configuration of snippets dir')
          reportedConfigError = true
        }
        return
      }
      let snippet = tag.value
      let p = path.join(global.wixJsDocPluginSnippetsDir, snippet.name)
      try {
        let contents = fs.readFileSync(p, 'utf8')
        const description = snippet.description?`<description>${snippet.description}</description>`:''
        doclet.examples = doclet.examples || []
        doclet.examples.push(`<caption>${snippet.defaultvalue}</caption>${description}\n${contents}`)
      } catch(error) {
        if (error.code === 'ENOENT')
          logger.error('ERROR: The @snippet tag - file \'' + p + '\' not found. File: ' + doclet.meta.filename)
        else
          logger.error(error)
      }
    }
  })
}

exports.extendDocworksKey = 'description'

const exampleDescription = /<caption>([\s\S]*)<\/caption><description>([\s\S]*)<\/description>\n([\s\S]*)/
exports.extendDocworksDocsExample = function(doclet, example) {
  let found = exampleDescription.exec(doclet)
  if (found) {
    const newExample = Example(example.title, found[3])
    return {extraValue: found[2], element: newExample}
  }
  else
    return undefined
}

exports.docworksMergeExample = function(newExampleExtra, repoExampleExtra) {
  let changed = newExampleExtra !== repoExampleExtra
  return {changed, value: newExampleExtra}
  // if (!newExampleExtra && !repoExampleExtra)
  //   return {changed: false};
  // else if (!repoExampleExtra && !!newExampleExtra)
  //   return {changed: true, value: newExampleExtra};
  // else if (!!repoExampleExtra && !newExampleExtra)
  //   return {changed: true, value: undefined};
  // else {
  //   return {
  //     changed: newExampleExtra.description !== repoExampleExtra.description ||
  //      newExampleExtra.body !== repoExampleExtra.body,
  //     value: newExampleExtra
  //   }
  // }
}
