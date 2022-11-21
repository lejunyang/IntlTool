/* eslint-disable @typescript-eslint/no-unused-vars */
/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2021-12-24 17:16:51
 * @LastEditTime: 2022-11-21 15:16:40
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\electron\traverse\visitor\chToIntlVisitor.ts
 */
import type { Visitor, NodePath } from '@babel/traverse';
import type {
  VariableDeclarator,
  JSXAttribute,
  JSXText,
  ObjectProperty,
  ArrayExpression,
  ArrowFunctionExpression,
  CallExpression,
} from '@babel/types';
import {
  jsxExpressionContainer,
  isIdentifier,
  isObjectProperty,
  isMemberExpression,
  isCallExpression,
  isJSXIdentifier,
} from '@babel/types';
import { generateCode, generateIntlNode } from '../../generate';
import type { ProcessFile, IntlOptions } from '../../types';
import { getCallStr, isIdentifierPlus, containsCh } from '../../utils/astUtils';

/**
 * 用于将代码中的中文替换为intl的visitor
 * @param prefix intl.get中get里字符串的前缀
 * @returns
 */
export const getChToIntlVisitor = (options: IntlOptions) => {
  const { prefix, nameMap, commonIntlData } = options;
  const callExpressionBlackList = [
    [nameMap.l2, nameMap.l3].join('.'),
    'console.log',
    'console.info',
    'console.error',
    'console.warn',
    'alert',
  ]; // 函数调用表达式，callee的黑名单
  const visitor: Visitor<ProcessFile> = {
    // 为什么不用StringLiteral嵌套在VariableDeclarator里呢，因为除了const a = 'bbb'，还有const b = intl.get('dfs').d('dfas')，其中同样也有StringLiteral
    VariableDeclarator(path: NodePath<VariableDeclarator>, state) {
      const node = path.node.init;
      if (!containsCh(node)) return;
      const replaceNode = generateIntlNode(prefix, node, nameMap, commonIntlData);
      state.chTransformedItems.push(generateCode(replaceNode));
      path.get('init').replaceWith(replaceNode);
      state.chOriginalItems.push({ start: node.start, end: node.end, str: generateCode(node) });
    },
    // 赋值表达式
    AssignmentExpression(path, state) {
      const node = path.node.right;
      if (!containsCh(node)) return;
      const replaceNode = generateIntlNode(prefix, node, nameMap, commonIntlData);
      state.chTransformedItems.push(generateCode(replaceNode));
      path.get('right').replaceWith(replaceNode);
      state.chOriginalItems.push({ start: node.start, end: node.end, str: generateCode(node) });
    },
    // 将jsx属性中的中文字符串替换为intl表达式
    JSXAttribute(path: NodePath<JSXAttribute>, state) {
      const node = path.node.value;
      if (!containsCh(node)) return;
      // 忽略O2design中filterHandler里的中文
      if (isJSXIdentifier(path.node.name, { name: 'filterHandler' })) {
        const jsxNameNode = (path.parentPath.get('name') as unknown as NodePath<Node>).node;
        if (isJSXIdentifier(jsxNameNode) && jsxNameNode.name.startsWith('O2Column')) return;
      }
      const replaceNode = jsxExpressionContainer(generateIntlNode(prefix, node, nameMap, commonIntlData));
      state.chTransformedItems.push(generateCode(replaceNode));
      path.get('value').replaceWith(replaceNode);
      state.chOriginalItems.push({ start: node.start, end: node.end, str: generateCode(node) });
    },
    // 将jsx children中的中文字符串替换为intl表达式
    JSXText(path: NodePath<JSXText>, state) {
      const value = path.node.value;
      if (!containsCh(value)) return;
      // JSXText是直接将它自己这个path替换，那个value已经没有path了
      const replaceNode = jsxExpressionContainer(generateIntlNode(prefix, value, nameMap, commonIntlData));
      state.chTransformedItems.push(generateCode(replaceNode));
      path.replaceWith(replaceNode);
      state.chOriginalItems.push({ start: path.node.start, end: path.node.end, str: value });
    },
    // jsx表达式
    JSXExpressionContainer(path, state) {
      const node = path.node.expression;
      if (!containsCh(node)) return;
      const replaceNode = generateIntlNode(prefix, node, nameMap, commonIntlData);
      state.chTransformedItems.push(generateCode(replaceNode));
      path.get('expression').replaceWith(replaceNode);
      state.chOriginalItems.push({ start: node.start, end: node.end, str: generateCode(node) });
    },
    // 对象键值
    ObjectProperty(path: NodePath<ObjectProperty>, state) {
      const node = path.node.value;
      if (!containsCh(node)) return;
      // 忽略permissionList里的{ code: '', type: '', meaning: '' }
      // path.container包含所有同级节点，在这里就是对象里的所有键值对
      if (
        isIdentifier(path.node.key, { name: 'meaning' }) &&
        path.container instanceof Array &&
        path.container.find(i => isObjectProperty(i) && isIdentifier(i.key, { name: 'code' }))
      )
        return;
      // 下面这一段是为了防止在generateIntlNode的时候，getParam添加了一个含有中文值的对象，然后又会触发到ObjectProperty，就死循环了
      if (isCallExpression(path.parentPath?.parent)) {
        // path.parentPath.parent存在的话就是get调用表达式，可能为intl.get('')，可能为intl('')
        const callExpr = path.parentPath.parent.callee;
        // 为intl.get('')，同样的，l1需要考虑为this的情况。。。
        if (
          isMemberExpression(callExpr) &&
          isIdentifierPlus(callExpr.object, { name: nameMap.l1 }) &&
          isIdentifier(callExpr.property, { name: nameMap.l2 })
        )
          return;
        // 为intl('')
        if (isIdentifier(callExpr, { name: nameMap.l2 })) return;
      }
      const replaceNode = generateIntlNode(prefix, node, nameMap, commonIntlData);
      state.chTransformedItems.push(generateCode(replaceNode));
      path.get('value').replaceWith(replaceNode);
      state.chOriginalItems.push({ start: node.start, end: node.end, str: generateCode(node) });
    },
    // 数组
    ArrayExpression(path: NodePath<ArrayExpression>, state) {
      const elements = path.node.elements;
      const elementPaths = path.get('elements');
      elements.forEach((e, index) => {
        if (!containsCh(e)) return;
        const replaceNode = generateIntlNode(prefix, e, nameMap, commonIntlData);
        state.chTransformedItems.push(generateCode(replaceNode));
        elementPaths[index].replaceWith(replaceNode);
        state.chOriginalItems.push({ start: e.start, end: e.end, str: generateCode(e) });
      });
    },
    /*
		ArrowFunctionExpression处理这样的，usePageTitle(() => 'aa')
		不考虑下面这样的以及一般的function
	  */
    ArrowFunctionExpression(path: NodePath<ArrowFunctionExpression>, state) {
      const node = path.node.body;
      if (!containsCh(node)) return;
      const replaceNode = generateIntlNode(prefix, node, nameMap, commonIntlData);
      state.chTransformedItems.push(generateCode(replaceNode));
      path.get('body').replaceWith(replaceNode);
      state.chOriginalItems.push({ start: node.start, end: node.end, str: generateCode(node) });
    },
    /**
     * () => {
     *  return 'bbb';
     * }
     */
    ReturnStatement(path, state) {
      const node = path.node.argument;
      if (!containsCh(node)) return;
      const replaceNode = generateIntlNode(prefix, node, nameMap, commonIntlData);
      state.chTransformedItems.push(generateCode(replaceNode));
      path.get('argument').replaceWith(replaceNode);
      state.chOriginalItems.push({ start: node.start, end: node.end, str: generateCode(node) });
    },
    // 当调用者callee是成员表达式，且名字在黑名单里则不访问，比如intl.get.d的callee就是MemberExpression，然后d在黑名单里，console.log也是成员访问
    CallExpression(path: NodePath<CallExpression>, state) {
      if (
        isMemberExpression(path.node.callee) &&
        isIdentifier(path.node.callee.property) &&
        callExpressionBlackList.find(i => getCallStr(path.node.callee).endsWith(i))
      )
        return;
      const args = path.node.arguments;
      const argumentsPaths = path.get('arguments');
      args.forEach((a, index) => {
        if (!containsCh(a)) return;
        const replaceNode = generateIntlNode(prefix, a, nameMap, commonIntlData);
        state.chTransformedItems.push(generateCode(replaceNode));
        argumentsPaths[index].replaceWith(replaceNode);
        state.chOriginalItems.push({ start: a.start, end: a.end, str: generateCode(a) });
      });
    },
    // 针对new Error('中文')的情况
    NewExpression(path, state) {
      if (!isIdentifier(path.node.callee, { name: 'Error' })) return;
      const args = path.node.arguments;
      const argumentsPaths = path.get('arguments');
      args.forEach((a, index) => {
        if (!containsCh(a)) return;
        const replaceNode = generateIntlNode(prefix, a, nameMap, commonIntlData);
        state.chTransformedItems.push(generateCode(replaceNode));
        argumentsPaths[index].replaceWith(replaceNode);
        state.chOriginalItems.push({ start: a.start, end: a.end, str: generateCode(a) });
      });
    },
  };
  return visitor;
};
