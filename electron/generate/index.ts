/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2021-12-24 17:28:17
 * @LastEditTime: 2022-01-29 14:10:34
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\electron\generate\index.ts
 */
import template from '@babel/template';
import type { StringLiteral, TemplateLiteral, Expression } from '@babel/types';
import { stringLiteral, isStringLiteral, isTemplateLiteral } from '@babel/types';

/**
 * 生成intl.get('').d('')的AST节点
 * @param getString
 * @param dValue 字符串或AST字符串字面量节点
 * @param getParam 可选，当d里面使用了模板字符串变量时，get需要传第二个参数
 */
export function generateIntlNode(
  getString: string,
  dValue: string | StringLiteral | TemplateLiteral,
  getParam?: Object
): Expression {
  const build = template.expression(`
    intl.get(%%getString%%${getParam ? ',' + JSON.stringify(getParam) : ''}).d(%%dValue%%)
  `);
  if (typeof dValue === 'string') {
    dValue = stringLiteral(dValue.trim());
  } else if (isStringLiteral(dValue)) {
    dValue.value = dValue.value.trim();
  } else if (isTemplateLiteral(dValue)) {
    // 首尾trim，不能直接对quasis首尾进行trim，需要判断该部分字符串是否真的是在首尾
    // 比如`${a} 11 ${c} 22 ${b}`这种情况，11左边的空格和22右边的空格可不能直接拿掉
    const qFirst = dValue.quasis[0];
    const qLast = dValue.quasis[dValue.quasis.length - 1];
    const eFirst = dValue.expressions[0];
    const eLast = dValue.expressions[dValue.expressions.length - 1];
    if (qFirst && (!eFirst || qFirst.start! < eFirst.start!)) {
      qFirst.value.cooked = qFirst.value.cooked?.trimStart(); // trimStart是es2019的
      qFirst.value.raw = qFirst.value.raw.trimStart();
    }
    // 当quasis数组长度大于1时，判断expressions里面有没有，没有的话就是纯字符串，直接trimEnd，有的话判断quasis的最后一项是不是在expressions最后一项的后面
    if (qFirst !== qLast && (!eLast || qLast.start! > eLast.start!)) {
      qLast.value.cooked = qLast.value.cooked?.trimEnd();
      qLast.value.raw = qLast.value.raw.trimEnd();
    }
  }
  return build({
    getString: stringLiteral(getString),
    dValue,
  });
}
