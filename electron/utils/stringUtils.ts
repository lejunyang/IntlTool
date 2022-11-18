/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-01-17 13:41:26
 * @LastEditTime: 2022-11-18 14:58:04
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\electron\utils\stringUtils.ts
 */
import type { StringLiteral, TemplateLiteral, ConditionalExpression, BinaryExpression, LogicalExpression } from '@babel/types';
import type { ESLintStringLiteral } from 'vue-eslint-parser/ast/nodes';
import { isStringLiteral, isTemplateLiteral, isConditionalExpression } from '@babel/types';
import { isESLintStringLiteral } from './astUtils';

/**
 * @param input 字符串或AST字符串字面量节点、模板字符字面量节点、二元（仅限+ && || ??）、三元表达式，判断其中是否有中文，其他情况直接返回false
 * @returns 是否包含中文
 */
export function containsCh(
  input?: any
): input is string | StringLiteral | ESLintStringLiteral | TemplateLiteral | ConditionalExpression | BinaryExpression | LogicalExpression {
  const reg = /[\u4e00-\u9fa5]/;
  if (typeof input === 'string') {
    return reg.test(input);
  } else if (isStringLiteral(input) || isESLintStringLiteral(input)) {
    return reg.test(input.value);
  } else if (isTemplateLiteral(input)) {
    return !!input.quasis.find(t => reg.test(t.value.cooked ?? ''));
  } else if (isConditionalExpression(input)) {
    return containsCh(input.consequent) || containsCh(input.alternate) || containsCh(input.test);
  } else if (['BinaryExpression', 'LogicalExpression'].includes(input?.type) && ['+', '&&', '||', '??'].includes(input?.operator)) {
    return containsCh(input.left) || containsCh(input.right);
  } return false;
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
    .replace(/^([A-Z])/, (_, match: string) => match.toLowerCase());
}

/**
 * 将若干列组装为一行csv字符串，特殊字符会用csv的规则转义
 */
export function getCSVLine(...columns: string[]): string {
  const escapedColumns = columns.map(c => {
    c = c.replace(/"/g, '""'); // 当列中的字符串有"，它需要写为""
    if (c.match(/[",\n]/)) c = `"${c}"`; // 当一列中的字符串有",\n时，这一列需要被""括起来
    return c;
  })
  return escapedColumns.join(',') + '\n';
}