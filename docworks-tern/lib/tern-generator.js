
const builtInTypes = {
  'string': 'string',
  'boolean': 'bool',
  'number': 'number',
  'Object': 'obj',
  'Date': '+Date' // date is redundant here - it is only here for clarity
};

export function typeTern(type) {
  if (typeof type === 'string') {
    if (builtInTypes[type])
      return builtInTypes[type];
    else
      return `+${type}`;
  }
  else if (typeof type === 'object') {
    if (type.name && type.name === 'Array') {
      return `[${type.typeParams[0]}]`;
    }
  }
}

export function propTern(service, prop, urlGenerator) {
  let tern = {};
  tern[prop.name] = {
      "!type": typeTern(prop.type),
      "!doc": prop.srcDocs.summary,
      "!url": urlGenerator(service.name, prop.name)
    };

  return tern;
}

export function operationTern(service, operation, urlGenerator) {
  let tern = {};
  let params = '';
  if (operation.params && operation.params.length)
    params = operation.params.map(param => `${param.name}: ${typeTern(param.type)}`).join(', ');
  tern[operation.name] = {
    "!type": `fn(${params})`,
    "!doc": operation.srcDocs.summary,
    "!url": urlGenerator(service.name, operation.name)
  };

  return tern;
}