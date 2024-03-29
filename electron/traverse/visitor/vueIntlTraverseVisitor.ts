/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-05-24 14:33:35
 * @LastEditTime: 2023-02-02 11:57:14
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\electron\traverse\visitor\vueIntlTraverseVisitor.ts
 */
import type { Visitor } from 'vue-eslint-parser/ast/traverse';
import type {
  Node,
  ESLintStringLiteral,
  ESLintCallExpression,
  ESLintTemplateLiteral,
  ESLintObjectExpression,
} from 'vue-eslint-parser/ast/nodes';
import {
  isIdentifier,
  isStringLiteral,
  isTemplateLiteral,
  isMemberExpression,
  isCallExpression,
  isObjectExpression,
} from '@babel/types';
import { isESLintStringLiteral, isSingleStrArg, isStringNode } from '../../utils/astUtils';
import { processTemplateLiteral } from './intlTraverseVisitor';
import type { IntlItem, ProcessFile } from '../../types';
import { manager } from '../../Manager';

/**
 * 检查get里面是否仅有一个参数且为字符串，或者有两个参数，第二个为对象表达式
 * @param args
 * @returns
 */
function isIntlArgs(
  args: ESLintCallExpression['arguments']
): args is
  | [ESLintStringLiteral | ESLintTemplateLiteral]
  | [ESLintStringLiteral | ESLintTemplateLiteral, ESLintObjectExpression] {
  if (args.length === 1) return isStringNode(args[0]);
  else if (args.length === 2) return isStringNode(args[0]) && isObjectExpression(args[1]);
  return false;
}

/**
 * 用于统计Vue代码中的intl的visitor
 * @param options l1,l2,l3代表了调用者的名字及顺序，例如this.intl('xx').d('yy')，l1就是this，l2就是intl。如果不传l1，那就是在template里面，intl().d()
 * @returns
 */
export const getVueIntlTraverseVisitor = (
  file: ProcessFile,
  options: {
    l3: string;
    l2: string;
    l1?: string;
  } = { l3: 'd', l2: 'intl' }
) => {
  // visitorKeys指明要继续traverse每个类型下的哪些节点，默认已经定义了一些，就不用自己传了
  return {
    enterNode: (node: Node) => {
      // node可能为空，比如没有template的vue代码（微笑
      if (node?.type !== 'CallExpression') return;
      const dArgs = node.arguments;
      // 检查d里面是否仅有一个参数且为字符串
      if (!isSingleStrArg(dArgs)) return;
      const dCallee = node.callee; // callee，调用者，函数调用括号前面的内容
      // 检查是否为成员表达式，且调用方式为xx.yy()，而不是xx['yy']()
      if (!isMemberExpression(dCallee, { computed: false })) return;
      // 检查是不是xx.yy()中的yy是不是'd'
      if (!isIdentifier(dCallee.property, { name: options.l3 })) return;
      const intlCallExpression = dCallee.object; // xx.d()中的xx
      // 检查上面的xx是否为函数调用，即yy().d()
      if (!isCallExpression(intlCallExpression)) return;
      const intlArgs = (intlCallExpression as ESLintCallExpression).arguments;
      // 检查intl里面是否仅有一个参数且为字符串，或者有两个参数，第二个为对象表达式
      if (!isIntlArgs(intlArgs)) return;
      const intlCallee = intlCallExpression.callee;
      // 如果没有设置l1，那就不检查l1，这里只需再检查第二个调用者的名字，即yy().d()中的yy，可能是yy().d()，也可能是xx.yy().d()，但是不检查xx
      if (!options.l1) {
        if (isIdentifier(intlCallee) && intlCallee.name !== options.l2) return;
        if (isMemberExpression(intlCallee) && !isIdentifier(intlCallee.property, { name: options.l2 })) return;
      } else if (options.l1) {
        // 检查是否为成员表达式，且调用方式为xx.yy().d()，而不是xx['yy']().d()
        if (!isMemberExpression(intlCallee, { computed: false })) return;
        // 检查xx.intl().d()中的intl
        if (!isIdentifier(intlCallee.property, { name: options.l2 })) return;
        // 检查this.intl().d()中的this，this是特殊的ThisExpression，不是Identifier
        if (options.l1 === 'this' && intlCallee.object.type !== 'ThisExpression') return;
        else if (options.l1 !== 'this' && !isIdentifier(intlCallee.object, { name: options.l1 })) return;
      }

      const result: IntlItem = { get: '', d: '', code: '', error: '', paths: [] };
      const dTemplateLiteral = dArgs[0];
      // 普通字符串字面量
      if (isStringLiteral(dTemplateLiteral) || isESLintStringLiteral(dTemplateLiteral))
        result.d = dTemplateLiteral.value;
      // 模板字符串字面量
      else if (isTemplateLiteral(dTemplateLiteral)) {
        const temp = processTemplateLiteral(dTemplateLiteral, 'd', intlArgs[1]);
        if (temp.error) result.error += temp.error;
        result.d = temp.content;
      }

      const intlTemplateLiteral = intlArgs[0];
      if (isStringLiteral(intlTemplateLiteral) || isESLintStringLiteral(intlTemplateLiteral))
        result.code = intlTemplateLiteral.value;
      else if (isTemplateLiteral(intlTemplateLiteral)) {
        const temp = processTemplateLiteral(intlTemplateLiteral, 'get', {});
        if (temp.error) result.error += temp.error;
        result.code = temp.content;
      }
      if (!result.code.match(/^[\w.-]+$/)) result.error += '编码只能由字母、数字、小数点、横杠和下划线组成；';
      result.get = result.code;
      result.error = result.error.substring(0, result.error.length - 1); // 去除最后的一个分号
      result.path = `${file.path}:${node.loc.start.line}:${node.loc.start.column}`; // 加上path，行，列，以方便定位
      result.paths.push(result.path);
      manager.addIntlItem(result);
    },
    leaveNode: () => {},
  } as Visitor;
};
