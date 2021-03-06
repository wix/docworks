const {handleMeta, handleType, typeContext, handleDoc} = require( './jsdoc-handler-shared')
const {Message, MessageMember, JsDocError} = require('docworks-model')
const handlePlugins = require('./docworks-plugins')

const groupByName = (groups, message) => {
    if (!message)
        return groups
    if (groups[message.name])
        groups[message.name].push(message)
    else
        groups[message.name] = [message]
    return groups
}

const handleProp = (find, onError, context) => (prop) => {
    return MessageMember(prop.name,
        handleType(prop.type, find, onError, context),
        prop.description, prop.optional
    )
}

const processMessages = (find, onError, plugins) => (messages) => {
    if (messages.length > 0) {
        let message = messages[0]
        let members = (message.properties || [])
            .map(handleProp(find, onError, typeContext('Message', message.name, 'property', message.memberof, handleMeta(message.meta))))

        if (messages.length > 1)
            onError(JsDocError(`Message ${message.name} is defined two or more times`, messages.map(mes => handleMeta(mes.meta))))

        const messageElement = Message(message.name, [], members, messages.map(mes => handleMeta(mes.meta)), handleDoc(message, plugins))
        return handlePlugins(plugins, 'extendDocworksMessage', message, messageElement)
    }
}

function handleMessages(find, service, onError, plugins) {
    let typedefs = find({kind: 'typedef', memberof: service.longname})
    if (!typedefs)
        return []

    let messages = typedefs.filter((_) => !(_.type && _.type.names && _.type.names[0] === 'function'))
    messages = messages.filter(_ => !_.mixed)

    let groups = messages.reduce(groupByName, {})
    return Object.keys(groups)
        .map((group) => groups[group])
        .map(processMessages(find, onError, plugins))

}

module.exports = handleMessages
