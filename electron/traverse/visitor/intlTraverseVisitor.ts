/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2021-12-24 17:16:51
 * @LastEditTime: 2022-05-24 21:10:20
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\electron\traverse\visitor\intlTraverseVisitor.ts
 */
import type { Visitor, NodePath, VisitNodeFunction } from '@babel/traverse';
import type { ESLintObjectExpression, ESLintTemplateLiteral } from 'vue-eslint-parser/ast/nodes';
import type { TemplateLiteral, CallExpression, StringLiteral, ObjectExpression } from '@babel/types';
import {
  getStrOfStringNode,
  getTemplatePartsInOrder,
  isStringNode,
  isSingleStrArg,
  isESLintProperty,
} from '../../utils/astUtils';
import {
  isIdentifier,
  isStringLiteral,
  isTemplateLiteral,
  isMemberExpression,
  isCallExpression,
  isObjectExpression,
  isObjectProperty,
  isTemplateElement,
  isVariableDeclaration,
} from '@babel/types';
import { generateCode } from '../../generate';
import type { State, StringObject, IntlItem } from '../../types';
import { manager } from '../../Manager';

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
  args: ObjectExpression | ESLintObjectExpression;
}

interface ProcessContent {
  content: string;
  error?: string;
}

type ProcessParams = getProcessParams | dProcessParams;

/**
 * 处理intl.get.d中get或d里面的模板字符串所代表的AST节点
 * @param template 模板字符串节点
 * @param type 'get'或'd'
 * @param args 若为get，传入程序一开始定义的变量对象Map，若为d，传入get第二个参数的节点
 * @returns
 */
export function processTemplateLiteral<T extends ProcessParams['type']>(
  template: TemplateLiteral | ESLintTemplateLiteral,
  type: T,
  args?: Extract<ProcessParams, { type: T }>['args']
): ProcessContent {
  const result: ProcessContent = { content: '', error: '' };
  // 表达式为空说明就是一个纯模板字符串字面量，不用再处理
  if (template.expressions.length === 0) {
    result.content = getStrOfStringNode(template);
  } else {
    const parts = getTemplatePartsInOrder(template);
    parts.forEach(i => {
      if (isTemplateElement(i)) {
        result.content += i.value.cooked ?? '';
      } else {
        if (isIdentifier(i)) {
          if (type === 'd') {
            if (args) {
              let varNameFind = false;
              (args as ObjectExpression | ESLintObjectExpression).properties.forEach(objProp => {
                // ObjectExpression的properties有三种可能，ObjectProperty对象属性，SpreadElement展开表达式，ObjectMethod对象方法，我们需要的是ObjectProperty
                // 如果是ES的Property，它不能是对象方法
                if (
                  isObjectProperty(objProp, { computed: false }) ||
                  isESLintProperty(objProp, { computed: false, method: false })
                ) {
                  // 查找对象中的值和模板字符串中变量名相同的。支持缩写属性，缩写的属性同样有key和value
                  if (isIdentifier(objProp.value, { name: i.name }) && isIdentifier(objProp.key)) {
                    result.content += `{${objProp.key.name}}`;
                    varNameFind = true;
                  }
                }
              });
              if (!varNameFind) result.error += `d里面有模板字符串变量'${i.name}'，但get的第二个参数缺少该变量；`;
            } else {
              result.error += `d里面有模板字符串变量'${i.name}'，但get未传第二个参数；`;
            }
          } else if (type === 'get') {
            // 此时args代表文件里的常量组成的对象
            if (args) {
              const value = (args as StringObject)[i.name];
              if (value) {
                result.content += value;
              } else {
                result.error += `get模板字符串里的变量只能使用常量，而代码最外层缺少对应常量'${i.name}'；`;
              }
            } else result.error += `缺少代码文件最外层常量的对象Map；`;
          }
        } else {
          // expressions里面如果不是Identifier那就是表达式了
          const code = generateCode(i);
          result.error += `模板字符串中出现表达式'${code}'；`;
          console.log('模板字符串中出现表达式：', code);
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

  const result: IntlItem = { get: '', d: '', code: '', error: '' };
  const dTemplateLiteral = dArgs[0];
  // 普通字符串字面量
  if (isStringLiteral(dTemplateLiteral)) result.d = dTemplateLiteral.value;
  // 模板字符串字面量
  else if (isTemplateLiteral(dTemplateLiteral)) {
    const temp = processTemplateLiteral(dTemplateLiteral, 'd', getArgs[1]);
    if (temp.error) result.error += temp.error;
    result.d = temp.content;
  }

  const getTemplateLiteral = getArgs[0];
  if (isStringLiteral(getTemplateLiteral)) result.code = getTemplateLiteral.value;
  else {
    const temp = processTemplateLiteral(getTemplateLiteral, 'get', state.vars);
    if (temp.error) result.error += temp.error;
    result.code = temp.content;
  }
  for (const prefix of manager.getPrefixes()) {
    const reg = new RegExp(prefix);
    const matchResult = result.code.match(reg);
    if (matchResult) {
      result.prefix = matchResult[0].substring(0, matchResult[0].length - 1);
      result.get = result.code.replace(reg, '');
      break;
    } else result.get = result.code;
  }
  if (!result.prefix) result.error += '没有设定前缀；';
  result.error = result.error.substring(0, result.error.length - 1); // 去除最后的一个分号
  result.path = `${state.path}:${node.loc.start.line}:${node.loc.start.column}`; // 加上path，行，列，以方便定位
  manager.addIntlItem(result);
};

/**
 * 用于统计代码中的intl的visitor
 */
export const getIntlTraverseVisitor = () => {
  return {
    Program(path, state) {
      path.node.body.forEach(statement => {
        if (isVariableDeclaration(statement)) {
          statement.declarations.forEach(v => {
            if (!isIdentifier(v.id)) return;
            const str = getStrOfStringNode(v.init);
            if (str && state.vars) state.vars[v.id.name] = str;
          });
        }
      });
    },
    CallExpression: IntlCallExpression,
  } as Visitor<State>;
};
