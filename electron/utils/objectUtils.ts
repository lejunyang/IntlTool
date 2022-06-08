/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-05-24 19:32:28
 * @LastEditTime: 2022-06-08 10:28:16
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\electron\utils\objectUtils.ts
 */
export function shallowEqual<T extends object>(actual: object, expected: T): actual is T {
  const keys = Object.keys(expected);
  for (const key of keys) {
    if (actual[key] !== expected[key]) {
      return false;
    }
  }
  return true;
}

/**
 * 将{ a: 'b' }变为{ b: 'a' }，对象中只有值为字符串才会变成key
 */
export function reverseObject(obj: object): { [key: string]: string } {
  const result = {};
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      result[obj[key]] = key;
    }
  }
  return result;
}

/**
 * 将{ 'b2c': { a: "123", b: { c:'bc' } } }扁平为{ 'b2c.a': '123', 'b2c.b.c': 'bc'}，只有字符串值会扁平
 */
export function flattenObject(obj: object): { [key: string]: string } {
  const result = {};
  const traverse = (_obj: object, path: string) => {
    for (const key in _obj) {
      const value = _obj[key];
      if (!value) continue;
      if (typeof value === 'string') {
        result[path ? `${path}.${key}` : key] = value;
      } else if (typeof value === 'object') {
        traverse(value, path ? `${path}.${key}` : key);
      }
    }
  };
  if (obj && typeof obj === 'object') traverse(obj, '');
  return result;
}
