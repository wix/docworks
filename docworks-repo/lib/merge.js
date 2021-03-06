const {zipByKey, addRemoveLabels, hasLabel, copy, compareArraysAsSets} = require('./collection-utils')
const {loadPlugins, runPlugins} = require('./plugins')
const isEqual = require('lodash.isequal')

function serviceKey(service) {
  return service.memberOf?`${service.memberOf}.${service.name}`:service.name
}

function compareType(newType, repoType, messages, serviceKey, itemKey) {
  if (!isEqual(newType, repoType)) {
    if (itemKey)
      itemKey = ' ' + itemKey + ' '
    else
      itemKey = ' '
    messages.push(`Service ${serviceKey} has changed${itemKey}type`)
    return false
  }
  return true
}

function compareArrays(sNewArr, sRepoArr, messages, serviceKey, attribute) {
  let compareResult = compareArraysAsSets(sNewArr, sRepoArr)
  for (let item of compareResult.onlyIn1)
    messages.push(`Service ${serviceKey} has a new ${attribute} ${item}`)
  for (let item of compareResult.onlyIn2)
    messages.push(`Service ${serviceKey} ${attribute} ${item} was removed`)
  return compareResult.equal
}

function compareAttribute(sNewValue, sRepoValue, messages, key, attribute) {
  if (sNewValue !== sRepoValue) {
    messages.push(`Service ${key} has changed ${attribute}`)
    return false
  }
  return true
}

/*
/* unused legacy...
function compareDocs(newDocs, repoDocs, messages, key) {
  let summaryEqual = compareAttribute(newDocs.summary, repoDocs.summary, messages, key, 'summary')
  let descriptionEqual = compareAttribute(newDocs.description, repoDocs.description, messages, key, 'description')
  let linksEqual = compareArrays(newDocs.links, repoDocs.links, messages, key, 'link')
  return summaryEqual && descriptionEqual && linksEqual
}
*/

function mergeExample(newExample, repoExample, messages, key, plugins) {
  let titleEqual = compareAttribute(newExample.title, repoExample.title, messages, key, 'title')
  let bodyEqual = compareAttribute(newExample.body, repoExample.body, messages, key, 'body')
  let extraMerge = runPlugins(plugins, 'docworksMergeExample', newExample.extra || {}, repoExample.extra || {}, messages, key)
  let changed  = !titleEqual || !bodyEqual || extraMerge.changed

  const item = copy(newExample, {
    extra: extraMerge.merged
  })
  return {changed, item: item}
}

function mergeExamples(newExamples, repoExamples, messages, key, plugins) {
  let changed = newExamples.length !== repoExamples.length
  let examples = []
  for (let i = 0; i < Math.min(newExamples.length, repoExamples.length); i++) {
    let mergedExample = mergeExample(newExamples[i], repoExamples[i], messages, key + `[${i}]`, plugins)
    changed = changed || mergedExample.changed
    examples.push(mergedExample.item)
  }
  if (newExamples.length > repoExamples.length) {
    messages.push(`Service ${key} has ${newExamples.length - repoExamples.length} new examples`)
    examples = examples.concat(newExamples
      .slice(repoExamples.length)
      .map(_ => copy(_)))
  }
  else if (newExamples.length < repoExamples.length){
    messages.push(`Service ${key} has ${repoExamples.length - newExamples.length} examples removed`)
  }
  return {changed, examples}
}


function compareDocs2(newDocs, repoDocs, messages, key, plugins) {
  let summaryEqual = compareAttribute(newDocs.summary, repoDocs.summary, messages, key, 'summary')
  let descriptionEqual = compareAttribute(newDocs.description, repoDocs.description, messages, key, 'description')
  let linksEqual = compareArrays(newDocs.links, repoDocs.links, messages, key, 'link')
  let extraMerge = runPlugins(plugins, 'docworksMergeDocs', newDocs.extra || {}, repoDocs.extra || {}, messages, key + '.docs')
  let examplesMerge = mergeExamples(newDocs.examples, repoDocs.examples, messages, key + '.examples', plugins)
  let changed = !summaryEqual || !descriptionEqual || !linksEqual || extraMerge.changed || examplesMerge.changed

  let docs = copy(newDocs, {
    extra: extraMerge.merged,
    examples: examplesMerge.examples
  })
  return {changed, merged: docs}
}

function updateLabels(labels, changed) {
  return (changed && !hasLabel(labels, 'removed'))?
    addRemoveLabels(labels, 'changed', ['new', 'removed']):
    hasLabel(labels, 'removed')?
      addRemoveLabels(labels, ['new'], ['removed', 'changed']):
      addRemoveLabels(labels, [], ['new', 'removed', 'changed'])
}

function mergeProperty(newProperty, repoProperty, messages, key, plugins) {
  let changedType = !compareType(newProperty.type, repoProperty.type, messages, key)
  let changedGetter = !compareAttribute(newProperty.get, repoProperty.get, messages, key, 'getter')
  let changedSetter = !compareAttribute(newProperty.set, repoProperty.set, messages, key, 'setter')
  let defaultValue = !compareAttribute(newProperty.defaultValue, repoProperty.defaultValue, messages, key, 'default value')
  let docsMerge = compareDocs2(newProperty.docs, repoProperty.docs, messages, key, plugins)
  let extraMerge = runPlugins(plugins, 'docworksMergeProperty', newProperty.extra || {}, repoProperty.extra || {}, messages, key)

  let changed = changedType || changedGetter || changedSetter || defaultValue || docsMerge.changed || extraMerge.changed
  let item = copy(repoProperty, {
    labels: updateLabels(repoProperty.labels, changed),
    type: newProperty.type,
    get: newProperty.get,
    set: newProperty.set,
    defaultValue: newProperty.defaultValue,
    docs: docsMerge.merged,
    locations: newProperty.locations,
    extra: extraMerge.merged
  })
  delete item.srcDocs
  return {changed, item}
}

function mergeLists(newList, repoList, messages, sKey, itemName, mergeItem, plugins) {
  let zipped = zipByKey(newList, repoList, _ => _.name)
  let changed = false
  let merged = zipped.map(_ => {
    let newItem = _[0]
    let repoItem = _[1]
    if (newItem && repoItem) {
      let mergedItem = mergeItem(newItem, repoItem, messages, `${sKey} ${itemName} ${newItem.name}`, plugins)
      changed = changed || mergedItem.changed
      return mergedItem.item
    }
    else if (newItem) {
      let mergedItem = copy(newItem, {labels: addRemoveLabels(newItem.labels, 'new')})
      messages.push(`Service ${sKey} has a new ${itemName} ${mergedItem.name}`)
      changed = true
      return mergedItem
    }
    else {
      let mergedItem
      if (!repoItem.labels.find(_ => _ === 'removed')) {
        mergedItem = copy(repoItem, {labels: addRemoveLabels(repoItem.labels, 'removed', 'new')})
        messages.push(`Service ${sKey} ${itemName} ${mergedItem.name} was removed`)
        changed = true
        return mergedItem
      }
      else
        mergedItem = copy(repoItem)
      return mergedItem
    }
  })
  return {changed, merged}
}

function mergeParam(newParam, repoParam, messages, key) {
  let changedName = newParam.name !== repoParam.name
  if (changedName) {
    messages.push(`Service ${key} has changed param name from ${repoParam.name} to ${newParam.name}`)
  }
  let changedType = !compareType(newParam.type, repoParam.type, messages, key, `param ${newParam.name}`)
  let changedDoc = !compareAttribute(newParam.doc, repoParam.doc, messages, key, `param ${newParam.name} doc`)
  let changedOptional = !compareAttribute(newParam.optional, repoParam.optional, messages, key, `param ${newParam.name} doc`)

  let changed = changedName || changedType || changedDoc || changedOptional
  let item = copy(repoParam, {
    name: newParam.name,
    type: newParam.type,
    doc: newParam.doc,
    optional: newParam.optional
  })
  delete item.srcDoc

  return {changed, item}
}

function mergeParams(newParams, repoParams, messages, key) {
  let changed = newParams.length !== repoParams.length
  let params = []
  for (let i = 0; i < Math.min(newParams.length, repoParams.length); i++) {
    let mergedParam = mergeParam(newParams[i], repoParams[i], messages, key)
    changed = changed || mergedParam.changed
    params.push(mergedParam.item)
  }
  for (let i = newParams.length; i < repoParams.length; i++) {
    messages.push(`Service ${key} param ${repoParams[i].name} was removed`)
  }
  for (let i = repoParams.length; i < newParams.length; i++) {
    messages.push(`Service ${key} has a new param ${newParams[i].name}`)
    params.push(copy(newParams[i]))
  }
  return {changed, params}
}

function mergeOperation(newOperation, repoOperation, messages, key, plugins) {
  let paramsMerge = mergeParams(newOperation.params, repoOperation.params, messages, key)
  let changedReturn = !compareType(newOperation.ret.type, repoOperation.ret.type, messages, key, 'return')
  let changedDoc = !compareAttribute(newOperation.ret.doc, repoOperation.ret.doc, messages, key, 'return doc')
  let docsMerge = compareDocs2(newOperation.docs, repoOperation.docs, messages, key, plugins)
  let extraMerge = runPlugins(plugins, 'docworksMergeOperation', newOperation.extra || {}, repoOperation.extra || {}, messages, key)

  let changed = paramsMerge.changed || docsMerge.changed || changedReturn || changedDoc || extraMerge.changed
  let ret = copy(repoOperation.ret, {
    type: newOperation.ret.type,
    doc: newOperation.ret.doc
  })
  delete ret.srcDoc
  let item = copy(repoOperation, {
    params: paramsMerge.params,
    labels: updateLabels(repoOperation.labels, changed),
    docs: docsMerge.merged,
    locations: newOperation.locations,
    ret: ret,
    extra: extraMerge.merged
  })
  delete item.srcDocs
  return {changed, item}
}

function mergeMessageMember(newMessageMember, repoMessageMember, messages, key) {
  let changedType = !compareType(newMessageMember.type, repoMessageMember.type, messages, key)
  let docsChanged = !compareAttribute(newMessageMember.doc, repoMessageMember.doc, messages, key, 'doc')
  let optionalChanged = !compareAttribute(newMessageMember.optional, repoMessageMember.optional, messages, key, 'optional')

  let changed = changedType || docsChanged || optionalChanged
  let item = copy(repoMessageMember, {
    type: newMessageMember.type,
    doc: newMessageMember.doc,
    optional: newMessageMember.optional
  })
  delete item.docs
  delete item.srcDocs
  return {changed, item}
}

function mergeMessageMembers(newMembers, repoMembers, messages, sKey) {
  let zipped = zipByKey(newMembers, repoMembers, _ => _.name)
  let changed = false
  let merged = []
  zipped.forEach(_ => {
    let newItem = _[0]
    let repoItem = _[1]
    if (newItem && repoItem) {
      let mergedItem = mergeMessageMember(newItem, repoItem, messages, `${sKey} member ${newItem.name}`)
      changed = changed || mergedItem.changed
      merged.push(mergedItem.item)
    }
    else if (newItem) {
      let mergedItem = copy(newItem)
      messages.push(`Service ${sKey} has a new member ${mergedItem.name}`)
      changed = true
      merged.push(mergedItem)
    }
    else {
      let mergedItem
      mergedItem = copy(repoItem)
      messages.push(`Service ${sKey} member ${mergedItem.name} was removed`)
      changed = true
    }
  })
  return {changed, merged}
}

function mergeMessage(newMessage, repoMessage, messages, key, plugins) {
  let membersMerge = mergeMessageMembers(newMessage.members, repoMessage.members, messages, key)
  let docsMerge = compareDocs2(newMessage.docs, repoMessage.docs, messages, key, plugins)
  let extraMerge = runPlugins(plugins, 'docworksMergeMessage', newMessage.extra || {}, repoMessage.extra || {}, messages, key)

  let changed = membersMerge.changed || docsMerge.changed || extraMerge.changed
  let item = copy(repoMessage, {
    labels: updateLabels(repoMessage.labels, changed),
    members: membersMerge.merged,
    docs: docsMerge.merged,
    locations: newMessage.locations,
    extra: extraMerge.merged
  })
  delete item.srcDocs
  return {changed, item}
}

function mergeService(sNew, sRepo, messages, plugins) {
  let sKey = serviceKey(sNew)
  let mixesChanged = !compareArrays(sNew.mixes, sRepo.mixes, messages, sKey, 'mixes')
  let docsMerge = compareDocs2(sNew.docs, sRepo.docs, messages, sKey, plugins)
  let propertiesMerge = mergeLists(sNew.properties, sRepo.properties, messages, sKey, 'property', mergeProperty, plugins)
  let operationsMerge = mergeLists(sNew.operations, sRepo.operations, messages, sKey, 'operation', mergeOperation, plugins)
  let callbacksMerge = mergeLists(sNew.callbacks, sRepo.callbacks, messages, sKey, 'callback', mergeOperation, plugins)
  let messagesMerge = mergeLists(sNew.messages, sRepo.messages, messages, sKey, 'message', mergeMessage, plugins)
  let extraMerge = runPlugins(plugins, 'docworksMergeService', sNew.extra || {}, sRepo.extra || {}, messages, sKey)

  let changed = mixesChanged || docsMerge.changed || propertiesMerge.changed || operationsMerge.changed ||
    callbacksMerge.changed || messagesMerge.changed || extraMerge.changed
  const service = copy(sRepo, {
    labels: updateLabels(sRepo.labels, changed),
    mixes: sNew.mixes,
    docs: docsMerge.merged,
    location: sNew.location,
    properties: propertiesMerge.merged,
    operations: operationsMerge.merged,
    callbacks: callbacksMerge.merged,
    messages: messagesMerge.merged,
    extra: extraMerge.merged
  })
  delete service.srcDocs
  return service

}

function merge(newRepo, repo, pluginModules) {
  let zippedServices = zipByKey(newRepo, repo, serviceKey)
  let messages = []
  let plugins = loadPlugins(pluginModules)
  let updatedRepo = zippedServices.map(_ => {
    let sNew = _[0]
    let sRepo = _[1]
    if (sNew && sRepo) {
      return mergeService(sNew, sRepo, messages, plugins)
    }
    else if (sNew) {
      let newService = copy(sNew, {labels: addRemoveLabels(sNew.labels, 'new')})
      messages.push(`Service ${serviceKey(newService)} is new`)
      return newService
    }
    else {
      let removedService = copy(sRepo, {labels: addRemoveLabels(sRepo.labels, 'removed', 'new')})
      if (!sRepo.labels.find(_ => _ === 'removed'))
        messages.push(`Service ${serviceKey(removedService)} was removed`)
      return removedService
    }
  })
  return {repo: updatedRepo, messages}

}

module.exports = merge
