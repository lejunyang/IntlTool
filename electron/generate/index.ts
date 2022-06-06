/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2021-12-24 17:28:17
 * @LastEditTime: 2022-06-02 17:43:05
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\electron\generate\index.ts
 */
import template from '@babel/template';
import babelGenerate from '@babel/generator';
import { generate } from 'escodegen';
import type {
  Node,
  StringLiteral,
  TemplateLiteral,
  Expression,
  ObjectExpression,
  ConditionalExpression,
  BinaryExpression,
  LogicalExpression,
} from '@babel/types';
import type { ESLintStringLiteral, Node as ESNode } from 'vue-eslint-parser/ast/nodes';
import {
  stringLiteral,
  objectProperty,
  objectExpression,
  isStringLiteral,
  isTemplateLiteral,
  isNode,
  isExpression,
  templateElement,
  templateLiteral,
  isConditionalExpression,
  conditionalExpression,
  isLogicalExpression,
  logicalExpression,
  isBinaryExpression,
  binaryExpression,
} from '@babel/types';
import { format, Options } from 'prettier';
import { isESLintStringLiteral, toBabelLiteral } from '../utils/astUtils';
import { containsCh } from '../utils/stringUtils';

/**
 * 生成l1.l2().l3()的intl AST节点，l1、l2、l3的名字由参数nameMap确定，默认为intl.get().d()
 * @param getString
 * @param dValue 字符串或AST字符串字面量节点
 * @param nameMap l1.l2().l3()，它们三个名字的映射
 */
export function generateIntlNode(
  getString: string,
  dValue:
    | string
    | StringLiteral
    | TemplateLiteral
    | ESLintStringLiteral
    | ConditionalExpression
    | BinaryExpression
    | LogicalExpression,
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
  } else if (isBinaryExpression(dValue) || isLogicalExpression(dValue)) {
    // 如果是二元表达式或逻辑表达式，那么仍然返回它，尝试操作符两边的值转为intl
    const left = containsCh(dValue.left) ? generateIntlNode(getString, dValue.left, nameMap) : dValue.left;
    const right = containsCh(dValue.right) ? generateIntlNode(getString, dValue.right, nameMap) : dValue.right;
    return isBinaryExpression(dValue)
      ? binaryExpression(dValue.operator, left, right)
      : logicalExpression(dValue.operator, left as Expression, right);
  } else if (isConditionalExpression(dValue)) {
    // 如果是三元表达式 ? :  那么仍然返回三元表达式，尝试将后面的两个值转为intl
    const consequent = containsCh(dValue.consequent)
      ? generateIntlNode(getString, dValue.consequent, nameMap)
      : dValue.consequent;
    const alternate = containsCh(dValue.alternate)
      ? generateIntlNode(getString, dValue.alternate, nameMap)
      : dValue.alternate;
    return conditionalExpression(dValue.test, consequent, alternate);
  } else {
    // 其他情况则构造为一个模板字符串
    getParam = objectExpression([objectProperty(stringLiteral('nameMe'), dValue)]);
    // quais一定比expression的长度多一，最少开头和结尾？
    dValue = templateLiteral(
      [templateElement({ raw: '', cooked: '' }), templateElement({ raw: '', cooked: '' }, true)],
      [dValue]
    );
  }
  const build = template.expression(
    `${nameMap.l1}.${nameMap.l2}(%%getString%%${getParam ? ', %%getParam%%' : ''}).${nameMap.l3}(%%dValue%%)`
  );
  return build({
    getString: stringLiteral(getString),
    ...(getParam ? { getParam } : {}), // 如果build里面没写还传的话会报错
    dValue,
  });
}

/**
 * 根据节点的不同，调用不同的函数将节点变为代码
 * @param node babel的Node节点或estree节点
 */
export function generateCode(node: Node | ESNode): string {
  if (!node) return '';
  else if (isNode(node)) {
    // vue template里解析的node即使是babel Node，它的子结点也可能有各种Literal，真是吐了，比如LogicalExpression MemberExpression TemplateLiteral ConditionalExpression BinaryExpression
    // 所以曲线救国，直接catch转换方式
    try {
      const { code } = babelGenerate(node);
      return code;
    } catch (e) {
      return generate(node);
    }
  } else return generate(node);
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
    retainLines: true, // 尝试保留相同的行号
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
