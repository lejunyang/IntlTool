/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-01-17 13:41:26
 * @LastEditTime: 2022-05-16 17:52:36
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\electron\utils\stringUtils.ts
 */
import type { StringLiteral, TemplateLiteral, TemplateElement, Expression, TSType } from '@babel/types';
import { isStringLiteral, isTemplateLiteral } from '@babel/types';

/**
 * 检查expr是否为字符串字面量或模板字符串节点
 * @param args
 * @returns
 */
export function isStringNode(expr?: any): expr is StringLiteral | TemplateLiteral {
  return isStringLiteral(expr) || isTemplateLiteral(expr);
}

/**
 * @param node
 * @returns 返回字符串节点或模板字符串节点里的纯文本，若为模板字符串节点则忽略里面的表达式
 */
export function getStrOfStringNode(node: any): string {
  if (isStringLiteral(node)) {
    return node.value;
  } else if (isTemplateLiteral(node)) {
    return node.quasis.map(t => t.value.cooked).join('');
  }
  return '';
}

type TemplatePart = (TemplateElement | Expression | TSType)[];

/**
 * 在模板字符串节点中，expressions数组里是表达式或变量，quasis数组里是被表达式分隔开来的字符串
 * `abc${d}1234${e}ff`，以这个为例，expressions里会有两项（d e 两个变量），quasis里有三项（abc 1234 ff）
 * 它们里面的先后由start确定，start代表该节点在对应代码行的起始位置
 * @param template 模板字符串节点
 * @returns 将模板字符串节点的expressions数组和quasis数组按start顺序组合在一起
 */
export function getTemplatePartsInOrder(template: TemplateLiteral): TemplatePart {
  let exprIndex = 0;
  let quasisIndex = 0;
  const end = template.quasis.length + template.expressions.length;
  const result: TemplatePart = [];
  while (exprIndex + quasisIndex < end) {
    const qNow = template.quasis[quasisIndex];
    const eNow = template.expressions[exprIndex];
    // 当eNow是undefined时候，说明expressions已经取完了，可以直接push qNow；同理qNow是undefined则直接到else
    if (!eNow || qNow?.start! <= eNow?.start!) {
      result.push(qNow);
      quasisIndex++;
    } else {
      result.push(eNow);
      exprIndex++;
    }
  }
  return result;
}

/**
 * @param input 字符串或AST字符串字面量节点或模板字符字面量节点，其他类型会直接返回false
 * @returns 是否包含中文
 */
export function containsCh(input?: any): input is string | StringLiteral | TemplateLiteral {
  const reg = /[\u4e00-\u9fa5]/;
  if (typeof input === 'string') {
    return reg.test(input);
  } else if (isStringLiteral(input)) {
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
