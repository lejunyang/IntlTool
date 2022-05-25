/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-05-24 16:40:17
 * @LastEditTime: 2022-05-25 11:52:12
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\electron\utils\astUtils.ts
 */
import type {
  ESLintStringLiteral,
  ESLintCallExpression,
  ESLintTemplateLiteral,
  ESLintTemplateElement,
  ESLintExpression,
  ESLintProperty
} from 'vue-eslint-parser/ast/nodes';
import type { StringLiteral, TemplateLiteral, TemplateElement, Expression, TSType, CallExpression } from '@babel/types';
import { isStringLiteral, isTemplateLiteral } from '@babel/types';
import { shallowEqual } from './objectUtils';

/**
 * 根据babael的说明，babel的ast节点对标准的estree进行了改造，以下仅列举几点
 * Literal token is replaced with StringLiteral, NumericLiteral, BigIntLiteral, BooleanLiteral, NullLiteral, RegExpLiteral
 * Property token is replaced with ObjectProperty and ObjectMethod
 * ClassMethod, ObjectProperty, and ObjectMethod value property's properties in FunctionExpression is coerced/brought into the main method node.
 * vue-eslint-parser的ast就是基于estree，所以针对不同的node写函数进行判断，其他的用babel的就行
 */


export function isESLintStringLiteral(node: any, value?: string): node is ESLintStringLiteral {
  return node?.type === 'Literal' && typeof node?.value === 'string' && (!value || value === node.value);
}

export function isESLintProperty(node: any, opt?: object): node is ESLintProperty {
  return node?.type === 'Property' && (!opt || shallowEqual(node, opt));
}

/**
 * 检查node是否为字符串字面量或模板字符串节点
 */
export function isStringNode(node: any): node is ESLintStringLiteral | StringLiteral | TemplateLiteral {
  if (isESLintStringLiteral(node)) return true;
  else return isStringLiteral(node) || isTemplateLiteral(node);
}

/**
 * @param node
 * @returns 返回字符串节点或模板字符串节点里的纯文本，若为模板字符串节点则忽略里面的表达式
 */
export function getStrOfStringNode(node: any): string {
  if (!node) return '';
  if (isStringLiteral(node) || isESLintStringLiteral(node)) {
    return node.value;
  } else if (isTemplateLiteral(node)) {
    return node.quasis.map(t => t.value.cooked).join('');
  }
  return '';
}

type TemplatePart = (TemplateElement | ESLintTemplateElement | Expression | ESLintExpression | TSType)[];

/**
 * 在模板字符串节点中，expressions数组里是表达式或变量，quasis数组里是被表达式分隔开来的字符串
 * `abc${d}1234${e}ff`，以这个为例，expressions里会有两项（d e 两个变量），quasis里有三项（abc 1234 ff）
 * 它们里面的先后由start确定，start代表该节点在对应代码行的起始位置
 * @param template 模板字符串节点
 * @returns 将模板字符串节点的expressions数组和quasis数组按start顺序组合在一起
 */
export function getTemplatePartsInOrder(template: TemplateLiteral | ESLintTemplateLiteral): TemplatePart {
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
 * 检查CallExpression的arguments是否为仅包含一个参数，且为字符串字面量或模板字符串
 * @param args CallExpression.arguments
 * @returns
 */
export function isSingleStrArg(
  args: CallExpression['arguments'] | ESLintCallExpression['arguments']
): args is [StringLiteral | TemplateLiteral] | [ESLintStringLiteral] {
  return args.length === 1 && isStringNode(args[0]);
}

