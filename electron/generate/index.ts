/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2021-12-24 17:28:17
 * @LastEditTime: 2022-05-26 16:24:23
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\electron\generate\index.ts
 */
import template from '@babel/template';
import babelGenerate from '@babel/generator';
import { generate } from 'escodegen';
import type { Node, StringLiteral, TemplateLiteral, Expression, ObjectExpression } from '@babel/types';
import type { ESLintStringLiteral, Node as ESNode } from 'vue-eslint-parser/ast/nodes';
import { stringLiteral, objectProperty, objectExpression, isStringLiteral, isTemplateLiteral, isNode, isExpression } from '@babel/types';
import { format, Options } from 'prettier';
import { isESLintStringLiteral, toBabelLiteral } from '../utils/astUtils';

/**
 * 生成l1.l2().l3()的intl AST节点，l1、l2、l3的名字由参数nameMap确定，默认为intl.get().d()
 * @param getString
 * @param dValue 字符串或AST字符串字面量节点
 * @param nameMap l1.l2().l3()，它们三个名字的映射
 */
export function generateIntlNode(
  getString: string,
  dValue: string | StringLiteral | TemplateLiteral | ESLintStringLiteral,
  nameMap = { l1: 'intl', l2: 'get', l3: 'd' }
): Expression {
  let getParam: ObjectExpression;
  if (typeof dValue === 'string') {
    dValue = stringLiteral(dValue.trim());
  } else if (isStringLiteral(dValue) || isESLintStringLiteral(dValue)) {
    dValue.value = dValue.value.trim();
  } else if (isTemplateLiteral(dValue)) {
    // d里面使用了模板字符串且有表达式时，需要生成对应的get参数
    const properties = dValue.expressions.map((expr, index) =>
      objectProperty(stringLiteral(`nameMe${index}`), isExpression(expr) ? expr : toBabelLiteral(expr))
    );
    getParam = properties.length ? objectExpression(properties) : null;
    // 以下是提取模板字符串里的普通字符串，不要了
    // // 首尾trim，不能直接对quasis首尾进行trim，需要判断该部分字符串是否真的是在首尾
    // // 比如`${a} 11 ${c} 22 ${b}`这种情况，11左边的空格和22右边的空格可不能直接拿掉
    // const qFirst = dValue.quasis[0];
    // const qLast = dValue.quasis[dValue.quasis.length - 1];
    // const eFirst = dValue.expressions[0];
    // const eLast = dValue.expressions[dValue.expressions.length - 1];
    // if (qFirst && (!eFirst || qFirst.start! < eFirst.start!)) {
    //   qFirst.value.cooked = qFirst.value.cooked?.trimStart(); // trimStart是es2019的
    //   qFirst.value.raw = qFirst.value.raw.trimStart();
    // }
    // // 当quasis数组长度大于1时，判断expressions里面有没有，没有的话就是纯字符串，直接trimEnd，有的话判断quasis的最后一项是不是在expressions最后一项的后面
    // if (qFirst !== qLast && (!eLast || qLast.start! > eLast.start!)) {
    //   qLast.value.cooked = qLast.value.cooked?.trimEnd();
    //   qLast.value.raw = qLast.value.raw.trimEnd();
    // }
  }
  const build = template.expression(`
    ${nameMap.l1}.${nameMap.l2}(%%getString%%${getParam ? ', %%getParam%%' : ''}).${nameMap.l3}(%%dValue%%)
  `);
  return build({
    getString: stringLiteral(getString),
    getParam,
    dValue,
  });
}

/**
 * 根据节点的不同，调用不同的函数将节点变为代码
 * @param node babel的Node节点或estree节点
 */
export function generateCode(node: Node | ESNode): string {
  if (!node) return '';
  else if (isNode(node)) return babelGenerate(node).code;
  else return generate(node);
}

/**
 * 将babel节点转换为代码，并用prettier格式化
 * @param node babel节点
 * @param formatOptions prettier format选项
 */
export function generateAndFormat(node: Node, formatOptions?: Options): string {
  const { code } = babelGenerate(node, {
    // 默认babel/generator使用jsesc来将非ascii字符转换，会把中文字符转成了unicode，关掉
    jsescOption: {
      minimal: true,
    },
  });
  return format(code, {
    parser: 'typescript', // parser根据语言必传
    semi: true,
    singleQuote: true,
    arrowParens: 'avoid',
    printWidth: 120,
    endOfLine: 'crlf',
    ...(formatOptions || {}),
  });
}