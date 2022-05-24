/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-05-24 19:32:28
 * @LastEditTime: 2022-05-24 19:33:05
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\electron\utils\objectUtils.ts
 */
export function shallowEqual<T extends object>(
  actual: object,
  expected: T,
): actual is T {
  const keys = Object.keys(expected);
  for (const key of keys) {
    if (actual[key] !== expected[key]) {
      return false;
    }
  }
  return true;
}
