const _ = require('lodash')

const createPosOrder = () => {
    let count = 0
    return () => {
        return {pos: ++count}
    }
}

const createOrderedPropertiesPosObj = (orderedPropertiesArr, objToMerge) => {
    const pos = createPosOrder()
    const orderedObj = orderedPropertiesArr.reduce((spec, property) => {
        spec[property] = pos()
        return spec
    }, {})
    return _.merge(orderedObj, objToMerge)
}

const docSpec = createOrderedPropertiesPosObj(['summary', 'description', 'links', 'examples', 'extra'], {
    description: {multiLine: true},
    examples: createOrderedPropertiesPosObj(['title', 'body', 'extra'], {
        body: {multiLine: true}
    })
})

const locationSpec = createOrderedPropertiesPosObj(['fileName'])

const propertySpec = createOrderedPropertiesPosObj(['name', 'labels', 'get', 'set', 'type',
    'defaultValue', 'locations', 'docs', 'srcDocs', 'extra'], {
    locations: locationSpec,
    docs: docSpec,
    srcDocs: docSpec
})

const paramSpec = createOrderedPropertiesPosObj(['name', 'type', 'doc', 'srcDoc', 'optional', 'defaultValue', 'spread'])

const operationSpec = createOrderedPropertiesPosObj(['name', 'labels', 'nameParams', 'params', 'ret', 'locations',
    'docs', 'srcDocs', 'extra'], {
    params: paramSpec,
    locations: locationSpec,
    docs: docSpec,
    srcDocs: docSpec,
    ret: createOrderedPropertiesPosObj(['type', 'doc', 'srcDoc'])
})

const messageSpec = createOrderedPropertiesPosObj(['name', 'locations', 'docs', 'srcDocs', 'members', 'extra'], {
    locations: locationSpec,
    docs: docSpec,
    srcDocs: docSpec,
    members: createOrderedPropertiesPosObj(['name', 'type', 'doc', 'optional'])
})

const serviceSpec = createOrderedPropertiesPosObj([
    'name',
    'memberOf',
    'mixes',
    'labels',
    'location',
    'docs',
    'srcDocs',
    'properties',
    'operations',
    'callbacks',
    'messages',
    'extra'], {
    location: Object.assign({orderBy: 'name'}, locationSpec),
    docs: Object.assign({orderBy: 'name'}, docSpec),
    srcDocs: Object.assign({orderBy: 'name'}, docSpec),
    properties: Object.assign({orderBy: 'name'}, propertySpec),
    operations: Object.assign({orderBy: 'name'}, operationSpec),
    callbacks: Object.assign({orderBy: 'name'}, operationSpec),
    messages: Object.assign({orderBy: 'name'}, messageSpec),
})

module.exports = {
    serviceSpec
}
