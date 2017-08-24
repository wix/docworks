export function zipByKey(arr1, arr2, makeKey) {
  let dict = {};
  let res = [];
  arr1.forEach(_1 => dict[makeKey(_1)] = _1);
  arr2.forEach(_2 => {
    if (dict[makeKey(_2)]) {
      res.push([dict[makeKey(_2)],_2]);
      delete dict[makeKey(_2)];
    }
    else {
      res.push([,_2]);
    }
  });
  for (let key in dict) {
    res.push([dict[key],]);
  }
  return res;
}

function addLabel(labels, label) {
  let newLabels = labels.slice();
  if (newLabels.indexOf(label) == -1)
    newLabels.push(label);
  return newLabels;
}

function copy() {
  return Object.assign({}, ...arguments);
}

function serviceKey(service) {
  return service.memberOf?`${service.memberOf}.${service.name}`:service.name;
}

export default function merge(newRepo, repo) {
  let zippedServices = zipByKey(newRepo, repo, serviceKey);
  let messages = [];
  let updatedRepo = zippedServices.map(_ => {
    if (_[0] && _[1]) {
      return copy(_[1]);
    }
    else if (_[0]) {
      let newService = copy(_[0], {labels: addLabel(_[0].labels, 'new')});
      messages.push(`Service ${serviceKey(newService)} is new`);
      return newService;
    }
    else {
      let removedService = copy(_[1], {labels: addLabel(_[1].labels, 'removed')});
      messages.push(`Service ${serviceKey(removedService)} was removed`);
      return removedService;
    }
  });
  return {repo: updatedRepo, messages}

}