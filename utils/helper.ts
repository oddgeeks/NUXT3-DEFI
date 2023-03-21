export const indexSorter = (aIndex: number, bIndex: number) => {
  if (aIndex === -1 && bIndex === -1) {
    return 0; // fallback to other sorting criteria
  } else if (aIndex === -1) {
    return 1; // b comes first if a is not in the priority list
  } else if (bIndex === -1) {
    return -1; // a comes first if b is not in the priority list
  } else {
    return aIndex - bIndex; // sort by the index in the priority list
  }
};

export function sortByMany<T>(
  items: T[],
  callback: ((a: T, b: T) => number)[]
) {
  return items.sort(function (a, b) {
    var result = 0;
    for (var i = 0; i < callback.length; i++) {
      var func = callback[i];
      result = func(a, b);
      if (result !== 0) {
        break;
      }
    }
    return result;
  });
}
