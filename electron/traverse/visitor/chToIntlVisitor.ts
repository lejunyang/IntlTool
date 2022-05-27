/* eslint-disable @typescript-eslint/no-unused-vars */
/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2021-12-24 17:16:51
 * @LastEditTime: 2022-05-27 14:35:07
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
import { jsxExpressionContainer, isIdentifier, isObjectProperty } from '@babel/types';
import { generateIntlNode } from '../../generate';
import { containsCh } from '../../utils/stringUtils';
import type { ProcessFile } from '../../types';

/**
 * 用于将代码中的中文替换为intl的visitor
 * @param prefix intl.get中get里字符串的前缀
 * @returns
 */
export const getChToIntlVisitor = (prefix: string = '', nameMap?: Parameters<typeof generateIntlNode>[2]) => {
  const visitor: Visitor<ProcessFile> = {
    // 为什么不用StringLiteral嵌套在VariableDeclarator里呢，因为除了const a = 'bbb'，还有const b = intl.get('dfs').d('dfas')，其中同样也有StringLiteral
    VariableDeclarator(path: NodePath<VariableDeclarator>, state) {
      const node = path.node.init;
      if (!containsCh(node)) return;
      path.get('init').replaceWith(generateIntlNode(prefix, node, nameMap));
      state.isChTransformed = true;
    },
    // 将jsx属性中的中文字符串替换为intl表达式
    JSXAttribute(path: NodePath<JSXAttribute>, state) {
      const node = path.node.value;
      if (!containsCh(node)) return;
      path.get('value').replaceWith(jsxExpressionContainer(generateIntlNode(prefix, node, nameMap)));
      state.isChTransformed = true;
    },
    // 将jsx children中的中文字符串替换为intl表达式
    JSXText(path: NodePath<JSXText>, state) {
      const value = path.node.value;
      if (!containsCh(value)) return;
      // JSXText是直接将它自己这个path替换，那个value已经没有path了
      path.replaceWith(jsxExpressionContainer(generateIntlNode(prefix, value, nameMap)));
      state.isChTransformed = true;
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
      path.get('value').replaceWith(generateIntlNode(prefix, node, nameMap));
      state.isChTransformed = true;
    },
    // 数组
    ArrayExpression(path: NodePath<ArrayExpression>, state) {
      const elements = path.node.elements;
      const elementPaths = path.get('elements');
      elements.forEach((e, index) => {
        if (!containsCh(e)) return;
        elementPaths[index].replaceWith(generateIntlNode(prefix, e, nameMap));
        state.isChTransformed = true;
      });
    },
    /*
		ArrowFunctionExpression处理这样的，usePageTitle(() => 'aa')
		不考虑下面这样的以及一般的function
	  */
    ArrowFunctionExpression(path: NodePath<ArrowFunctionExpression>, state) {
      const node = path.node.body;
      if (!containsCh(node)) return;
      path.get('body').replaceWith(generateIntlNode(prefix, node, nameMap));
      state.isChTransformed = true;
    },
    /**
     * () => {
		 *  return 'bbb';
     * }
     */
    ReturnStatement(path, state) {
      const node = path.node.argument;
      if (!containsCh(node)) return;
      path.get('argument').replaceWith(generateIntlNode(prefix, node, nameMap));
      state.isChTransformed = true;
    },
    // 只处理单个函数调用的参数，其他情况的调用者callee不是Identifier，比如intl.get.d的callee就是MemberExpression
    CallExpression(path: NodePath<CallExpression>, state) {
      if (!isIdentifier(path.node.callee)) return;
      const args = path.node.arguments;
      const argumentsPaths = path.get('arguments');
      args.forEach((a, index) => {
        if (!containsCh(a)) return;
        argumentsPaths[index].replaceWith(generateIntlNode(prefix, a, nameMap));
        state.isChTransformed = true;
      });
    },
  };
  return visitor;
};