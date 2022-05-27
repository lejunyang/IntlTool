/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-01-17 13:41:26
 * @LastEditTime: 2022-05-27 17:27:02
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\electron\utils\stringUtils.ts
 */
import type { StringLiteral, TemplateLiteral, ConditionalExpression, BinaryExpression } from '@babel/types';
import type { ESLintStringLiteral } from 'vue-eslint-parser/ast/nodes';
import { isStringLiteral, isTemplateLiteral, isConditionalExpression, isBinaryExpression } from '@babel/types';
import { isESLintStringLiteral } from './astUtils';
import { generateCode } from '../generate';

/**
 * @param input 字符串或AST字符串字面量节点或模板字符字面量节点，如果是三元表达式或二元表达式，会转换为代码并判断其中是否有中文，其他情况直接返回false
 * @returns 是否包含中文
 */
export function containsCh(
  input?: any
): input is string | StringLiteral | ESLintStringLiteral | TemplateLiteral | ConditionalExpression | BinaryExpression {
  const reg = /[\u4e00-\u9fa5]/;
  if (typeof input === 'string') {
    return reg.test(input);
  } else if (isStringLiteral(input) || isESLintStringLiteral(input)) {
    return reg.test(input.value);
  } else if (isTemplateLiteral(input)) {
    return !!input.quasis.find(t => reg.test(t.value.cooked ?? ''));
  } else if (isConditionalExpression(input) || isBinaryExpression(input)) {
    return containsCh(generateCode(input));
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
