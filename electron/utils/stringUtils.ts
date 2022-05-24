/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-01-17 13:41:26
 * @LastEditTime: 2022-05-16 17:52:36
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\electron\utils\stringUtils.ts
 */
import type { StringLiteral, TemplateLiteral } from '@babel/types';
import { isStringLiteral, isTemplateLiteral } from '@babel/types';
import { isESLintStringLiteral } from './astUtils';

/**
 * @param input 字符串或AST字符串字面量节点或模板字符字面量节点，其他类型会直接返回false
 * @returns 是否包含中文
 */
export function containsCh(input?: any): input is string | StringLiteral | TemplateLiteral {
  const reg = /[\u4e00-\u9fa5]/;
  if (typeof input === 'string') {
    return reg.test(input);
  } else if (isStringLiteral(input) || isESLintStringLiteral(input)) {
    return reg.test(input.value);
  } else if (isTemplateLiteral(input)) {
    return !!input.quasis.find(t => reg.test(t.value.cooked ?? ''));
  }
  return false;
}

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
    .replace(/([A-Z])/, (_, match: string) => match.toLowerCase());
}
