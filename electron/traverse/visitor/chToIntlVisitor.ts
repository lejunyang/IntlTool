/* eslint-disable @typescript-eslint/no-unused-vars */
/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2021-12-24 17:16:51
 * @LastEditTime: 2022-06-06 11:20:19
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
import { jsxExpressionContainer, isIdentifier, isObjectProperty, isMemberExpression, isCallExpression } from '@babel/types';
import { generateIntlNode } from '../../generate';
import { containsCh } from '../../utils/stringUtils';
import type { ProcessFile, TraverseOptions } from '../../types';
import { isIdentifierPlus } from '../../utils/astUtils';

/**
 * 用于将代码中的中文替换为intl的visitor
 * @param prefix intl.get中get里字符串的前缀
 * @returns
 */
export const getChToIntlVisitor = (options: TraverseOptions) => {
  const { prefix, nameMap } = options;
  const callExpressionBlackList = ['log', nameMap.l3]; // 函数调用表达式，callee的黑名单
  const visitor: Visitor<ProcessFile> = {
    // 为什么不用StringLiteral嵌套在VariableDeclarator里呢，因为除了const a = 'bbb'，还有const b = intl.get('dfs').d('dfas')，其中同样也有StringLiteral
    VariableDeclarator(path: NodePath<VariableDeclarator>, state) {
      const node = path.node.init;
      if (!containsCh(node)) return;
      path.get('init').replaceWith(generateIntlNode(prefix, node, nameMap));
      state.isChTransformed = true;
    },
    // 赋值表达式
    AssignmentExpression(path, state) {
      const node = path.node.right;
      if (!containsCh(node)) return;
      path.get('right').replaceWith(generateIntlNode(prefix, node, nameMap));
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
    // jsx表达式
    JSXExpressionContainer(path, state) {
      const node = path.node.expression;
      if (!containsCh(node)) return;
      path.get('expression').replaceWith(generateIntlNode(prefix, node, nameMap));
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
    // 当调用者callee是成员表达式，且名字在黑名单里则不访问，比如intl.get.d的callee就是MemberExpression，然后d在黑名单里，console.log也是成员访问
    CallExpression(path: NodePath<CallExpression>, state) {
      if (
        isMemberExpression(path.node.callee) &&
        isIdentifier(path.node.callee.property) &&
        callExpressionBlackList.includes(path.node.callee.property.name)
      )
        return;
      const args = path.node.arguments;
      const argumentsPaths = path.get('arguments');
      args.forEach((a, index) => {
        if (!containsCh(a)) return;
        argumentsPaths[index].replaceWith(generateIntlNode(prefix, a, nameMap));
        state.isChTransformed = true;
      });
    },
    // 针对new Error('中文')的情况
    NewExpression(path, state) {
      if (!isIdentifier(path.node.callee, { name: 'Error' })) return;
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