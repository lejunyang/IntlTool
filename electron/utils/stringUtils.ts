/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-01-17 13:41:26
 * @LastEditTime: 2023-02-07 22:20:03
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\electron\utils\stringUtils.ts
 */
export function replace(input: string, searchValue: string | RegExp, replaceValue: string): string {
  return input.replace(searchValue, replaceValue);
}

/**
 * 转小驼峰，-_后面的小写字母变为大写，然后首字母小写，如Abc_dFF-uio变为abcDFFUio
 * @param input
 * @returns
 */
export function toLowerCamel(input: string): string {
  return input
    .replace(/[-_]([a-z])/g, (_, match: string) => match.toUpperCase())
    .replace(/^([A-Z])/, (_, match: string) => match.toLowerCase());
}

export function getFileNameAndToLowerCamel(input: string): string {
  return toLowerCamel(input.replace(/\..*$/, ''));
}

/**
 *
 * @param columns null和undefined会被忽略
 * @returns 将若干列组装为一行csv字符串，特殊字符会用csv的规则转义
 */
export function getCSVLine(...columns: (string | null | undefined)[]): string {
  const escapedColumns = columns
    .filter(i => i != null)
    .map(c => {
      c = c!.replace(/"/g, '""'); // 当列中的字符串有"，它需要写为""
      if (c.match(/[",\n]/)) c = `"${c}"`; // 当一列中的字符串有",\n时，这一列需要被""括起来
      return c;
    });
  return escapedColumns.join(',') + '\n';
}
