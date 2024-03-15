function intersectionA(array1: any[], array2: any[]): any[] {
  return array1.filter(function (n) {
    return array2.indexOf(n) != -1;
  });
}

function intersectionB(arrayA: any[], arrayB: any[]): any[] {
  return arrayA.filter(function (n) {
    return arrayB.indexOf(n) != -1;
  });
}
