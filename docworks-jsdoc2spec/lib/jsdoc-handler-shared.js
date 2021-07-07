const {Void, Location, JsDocError, GeneticType, Docs, Example} = require('docworks-model')
const handlePlugins = require('./docworks-plugins')

function handleMeta(meta) {
  return Location(meta.filename)
}

const builtInTypes = {
  'string': 'string',
  'String': 'string',
  'boolean': 'boolean',
  'Boolean': 'boolean',
  'number': 'number',
  'Number': 'number',
  'Date': 'Date',
  'Array': 'Array',
  'Function': 'Function',
  'function': 'Function',
  'Promise': 'Promise',
  'Object': 'Object',
  'any': 'any',
  'Any': 'any',
  'void': Void
}

/**
 *
 * @param kind - member, operation, message
 * @param name - the name
 * @param part - param, return, empty
 * @param defaultScope - the default lookup scope for relative type references
 * @param location - Location obj
 * @returns {{kind: *, name: *, part: *, location: *}}
 */
function typeContext(kind, name, part, defaultScope, location) {
  return {
    kind, name, part, defaultScope, location
  }
}

function convertToTilde(longname) {
  let tokens = longname.split('.')
  let namespaces = tokens.slice(0, -1)
  let name = tokens.slice(-1)
  return `${namespaces.join('.')}~${name[0]}`
}

const testGeneric = /([^,<>]+)\.<([^,]+)>$/
function handleType(type, find, onError, context) {
  if (!type || !type.names)
    return Void

  let typeNames = type.names

  let handleTypeName = (name) => {
    name = name.trim().replace('~', '.')
    name = name.replace(/^\[ '/, '').replace(/' \]$/, '') // hack to fix type names like "[ 'Promise' ] / [ 'Array' ]" which i couldn't yet find the source for
    let generic = testGeneric.exec(name)
    if (generic) {
      return GeneticType(handleTypeName(generic[1]),
        generic[2].split(',').map(handleTypeName)
      )
    }
    let typeByFullPath = find({longname: name})
    let typeByFullPathWithTilde = find({longname: convertToTilde(name)})
    let typeByRelativePath = find({name: name})
      .filter((aType) => aType.memberof === context.defaultScope)
    let builtInType = builtInTypes[name]

    if (typeByFullPath.length === 0 && typeByFullPathWithTilde.length === 0 && typeByRelativePath.length === 0 && !builtInType) {
      let paddedPart = context.part + (context.part?' ':'')
      onError(JsDocError(`${context.kind} ${context.name} has an unknown ${paddedPart}type ${name}`, [context.location]))
    }
    if (typeByFullPath.length === 0 && typeByRelativePath.length === 1)
      return `${context.defaultScope}.${name}`
    if (builtInType)
      return builtInType
    return name
  }

  if (find) {
    typeNames = typeNames.map(handleTypeName)
  }

  if (typeNames.length == 1) {
    return typeNames[0]
  }
  else {
    return typeNames
  }
}

const exampleCaption = /<caption>(.*)<\/caption>([\s\S]*)/
function handleDoc(doclet, plugins) {
  let rawExamples = doclet.examples || []
  let examples = rawExamples.map((ex) => {
    let found = exampleCaption.exec(ex)
    let example
    if (found) {
      example = Example(found[1], found[2].trim())
    }
    else
      example = Example(undefined, ex)

    return handlePlugins(plugins, 'extendDocworksDocsExample', ex, example)
  })
  const docs = Docs(doclet.summary, doclet.description || doclet.classdesc, doclet.see?doclet.see:[], examples)
  return handlePlugins(plugins, 'extendDocworksDocs', doclet, docs)
}


module.exports = {
  handleMeta,
  typeContext,
  handleType,
  handleDoc
}
