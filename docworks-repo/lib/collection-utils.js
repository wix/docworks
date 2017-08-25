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

export function addUniqueToArray(arr, item) {
  let newLabels = arr.slice();
  if (newLabels.indexOf(item) == -1)
    newLabels.push(item);
  return newLabels;
}

export function copy() {
  return Object.assign({}, ...arguments);
}

export function compareArraysAsSets(arr1, arr2) {
  let set1 = new Set(arr1);
  let set2 = new Set(arr2);
  let res = {equal: true, onlyIn1: [], onlyIn2: []};

  for (let item of set1)
    if (!set2.has(item))
      res.onlyIn1.push(item);

  for (let item of set2)
    if (!set1.has(item))
      res.onlyIn2.push(item);

  res.equal = res.onlyIn1.length + res.onlyIn2.length === 0;
  return res;
}