import {Void, Location, JsDocError, GeneticType} from 'docworks-model';

export function handleMeta(meta) {
    return Location(meta.filename, meta.lineno);
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
    'Promise': 'Promise'
};

/**
 *
 * @param kind - member, operation, message
 * @param name - the name
 * @param part - param, return, empty
 * @param defaultScope - the default lookup scope for relative type references
 * @param location - Location obj
 * @returns {{kind: *, name: *, part: *, location: *}}
 */
export function typeContext(kind, name, part, defaultScope, location) {
    return {
        kind, name, part, defaultScope, location
    }
}

const testGeneric = /([^,<>]+)\.<([^,]+)>$/;
export function handleType(type, find, onError, context) {
    if (!type || !type.names)
        return Void;

    let typeNames = type.names;

    var handleTypeName = (name) => {
        name = name.trim();
        let generic = testGeneric.exec(name);
        if (generic) {
            return GeneticType(handleTypeName(generic[1]),
                generic[2].split(',').map(handleTypeName)
            );
        }
        let typeByFullPath = find({longname: name});
        let typeByRelativePath = find({name: name})
            .filter((aType) => aType.memberof === context.defaultScope);
        let builtInType = builtInTypes[name];

        if (typeByFullPath.length === 0 && typeByRelativePath.length === 0 && !builtInType) {
            let paddedPart = context.part + (context.part?" ":"");
            onError(JsDocError(`${context.kind} ${context.name} has an unknown ${paddedPart}type ${name}`, [context.location]));
        }
        if (typeByFullPath.length === 0 && typeByRelativePath.length === 1)
            return `${context.defaultScope}.${name}`;
        if (builtInType)
            return builtInType;
        return name;
    };

    if (find) {
        typeNames = typeNames.map(handleTypeName)
    }

    if (typeNames.length == 1) {
        return typeNames[0];
    }
    else {
        return typeNames;
    }
}
