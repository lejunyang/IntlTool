/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2021-12-03 17:46:10
 * @LastEditTime: 2022-05-16 21:56:14
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\electron\traverse\visitor\IntlCallExpression.ts
 */
import type { CallExpression, StringLiteral, ObjectExpression } from '@babel/types';
import {
  TemplateLiteral,
  isIdentifier,
  isStringLiteral,
  isMemberExpression,
  isCallExpression,
  isObjectExpression,
  isObjectProperty,
  isTemplateElement,
} from '@babel/types';
import type { VisitNodeFunction, NodePath } from '@babel/traverse';
import { getStrOfStringNode, getTemplatePartsInOrder, isStringNode } from '../../utils/stringUtils';
import type { State, StringObject, IntlItem } from '../../types';
import { manager } from '../../Manager';

/**
 * 检查CallExpression的arguments是否为仅包含一个参数，且为字符串字面量或模板字符串
 * @param args CallExpression.arguments
 * @returns
 */
function isSingleStrArg(args: CallExpression['arguments']): args is [StringLiteral | TemplateLiteral] {
  return args.length === 1 && isStringNode(args[0]);
}

/**
 * 检查get里面是否仅有一个参数且为字符串，或者有两个参数，第二个为对象表达式
 * @param args
 * @returns
 */
function isIntlGetArgs(
  args: CallExpression['arguments']
): args is [StringLiteral | TemplateLiteral] | [StringLiteral | TemplateLiteral, ObjectExpression] {
  if (args.length === 1) return isStringNode(args[0]);
  else if (args.length === 2) return isStringNode([args[0]]) && isObjectExpression(args[1]);
  return false;
}

interface getProcessParams {
  type: 'get';
  args: StringObject;
}

interface dProcessParams {
  type: 'd';
  args: ObjectExpression;
}

type ProcessParams = getProcessParams | dProcessParams;

/**
 * 处理intl.get.d中get或d里面的模板字符串所代表的AST节点
 * @param template 模板字符串节点
 * @param type 'get'或'd'
 * @param args 若为get，传入程序一开始定义的变量对象Map，若为d，传入get第二个参数的节点
 * @returns
 */
function processTemplateLiteral<T extends ProcessParams['type']>(
  template: TemplateLiteral,
  type: T,
  args?: Extract<ProcessParams, { type: T }>['args']
): string {
  let result = '';
  // 表达式为空说明就是一个纯模板字符串字面量，不用再处理
  if (template.expressions.length === 0) {
    result = getStrOfStringNode(template);
  } else {
    const parts = getTemplatePartsInOrder(template);
    parts.forEach(i => {
      if (isTemplateElement(i)) {
        result += i.value.cooked ?? '';
      } else {
        if (isIdentifier(i)) {
          if (type === 'd') {
            if (args) {
              let varNameFind = false;
              (args as ObjectExpression).properties.forEach(objProp => {
                // ObjectExpression的properties有三种可能，ObjectProperty对象属性，SpreadElement展开表达式，ObjectMethod对象方法
                if (isObjectProperty(objProp)) {
                  // 查找对象中的值和模板字符串中变量名相同的。支持缩写属性，缩写的属性同样有key和value
                  if (isIdentifier(objProp.value, { name: i.name }) && isIdentifier(objProp.key)) {
                    result += `{${objProp.key.name}}`;
                    varNameFind = true;
                  }
                }
              });
              if (!varNameFind) result += `$!d里面有模板字符串变量'${i.name}'，但get的第二个参数缺少该变量`;
            } else {
              result += `$!d里面有模板字符串变量'${i.name}'，但get未传第二参`;
            }
          } else if (type === 'get') {
            if (args) {
              const value = (args as StringObject)[i.name];
              if (value) {
                result += value;
              } else {
                result += `$!global里缺少对应变量'${i.name}'`;
              }
            } else result += `$!缺少global变量的对象Map`;
          }
        } else {
          // expressions里面如果不是Identifier那就是表达式了
          result += '$!不允许表达式';
        }
      }
    });
  }
  return result;
}

export const IntlCallExpression: VisitNodeFunction<State, CallExpression> = (
  path: NodePath<CallExpression>,
  state: State
) => {
  const { node } = path;
  const dArgs = node.arguments;
  // 检查d里面是否仅有一个参数且为字符串
  if (!isSingleStrArg(dArgs)) return;
  const dCallee = node.callee; // callee，调用者，函数调用括号前面的内容
  // 检查是否为成员表达式，且调用方式为xx.yy()，而不是xx['yy']()
  if (!isMemberExpression(dCallee, { computed: false })) return;
  // 检查是不是xx.yy()中的yy是不是'd'
  if (!isIdentifier(dCallee.property, { name: 'd' })) return;
  const intlGetCallExpression = dCallee.object; // xx.d()中的xx
  // 检查上面的xx是否为函数调用，即yy().d()
  if (!isCallExpression(intlGetCallExpression)) return;
  const getArgs = intlGetCallExpression.arguments;
  // 检查get里面是否仅有一个参数且为字符串，或者有两个参数，第二个为对象表达式
  if (!isIntlGetArgs(getArgs)) return;
  const intlGetCallee = intlGetCallExpression.callee;
  // 检查是否为成员表达式，且调用方式为xx.yy().d()，而不是xx['yy']().d()
  if (!isMemberExpression(intlGetCallee, { computed: false })) return;
  // 检查xx.get().d()中的get
  if (!isIdentifier(intlGetCallee.property, { name: 'get' })) return;
  // 检查intl.get().d()中的intl
  if (!isIdentifier(intlGetCallee.object, { name: 'intl' })) return;

  const result: IntlItem = { get: '', d: '' };
  const dTemplateLiteral = dArgs[0];
  // 普通字符串字面量
  if (isStringLiteral(dTemplateLiteral)) result.d = dTemplateLiteral.value;
  // 模板字符串字面量
  else {
    const temp = processTemplateLiteral(dTemplateLiteral, 'd', getArgs[1]);
    if (temp.startsWith('$!')) result.error = temp.substring(2);
    else result.d = temp;
  }

  const getTemplateLiteral = getArgs[0];
  if (isStringLiteral(getTemplateLiteral)) result.get = getTemplateLiteral.value;
  else {
    const temp = processTemplateLiteral(getTemplateLiteral, 'get', state.vars);
    if (temp.startsWith('$!')) result.error = temp.substring(2);
    else result.get = temp;
  }
  manager.getPrefixes().forEach(prefix => {
    if (result.get.startsWith(prefix)) {
      result.prefix = prefix;
      result.get = result.get.replace(prefix + '.', '');
    }
  });
  result.path = `${state.path}:${node.loc.start.line}:${node.loc.start.column}`; // 加上path，行，列，以方便定位
  // 把有错误的放在前面
  if (result.error) {
    state.intlResult?.unshift(result);
  } else state.intlResult?.push(result);
};
