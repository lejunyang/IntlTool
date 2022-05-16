/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2021-12-24 17:16:51
 * @LastEditTime: 2022-02-11 15:14:21
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\electron\traverse\visitor\index.ts
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
import { jsxExpressionContainer, isIdentifier, isObjectProperty, isVariableDeclaration } from '@babel/types';
import { generateIntlNode } from '../../generate';
import { containsCh, getStrOfStringNode } from '../../utils/stringUtils';
import { IntlCallExpression } from './IntlCallExpression';
import type { State } from '../../types';

// visitedNodeSet是不是没用啊？比较节点好像被替换掉了

/**
 * 用于将代码中的中文替换为intl的visitor
 * @param prefix intl.get中get里字符串的前缀
 * @returns
 */
export const getChToIntlVisitor = (prefix: string = '') => {
  const visitor: Visitor<State> = {
    // 为什么不用StringLiteral嵌套在VariableDeclarator里呢，因为除了const a = 'bbb'，还有const b = intl.get('dfs').d('dfas')，其中同样也有StringLiteral
    VariableDeclarator(path: NodePath<VariableDeclarator>, state: State) {
      const node = path.node.init;
      if (!containsCh(node)) return;
      state.visitedNodeSet?.add(node);
      path.get('init').replaceWith(generateIntlNode(prefix, node));
    },
    // 将jsx属性中的中文字符串替换为intl表达式
    JSXAttribute(path: NodePath<JSXAttribute>, state: State) {
      const node = path.node.value;
      if (!containsCh(node)) return;
      state.visitedNodeSet?.add(node);
      path.get('value').replaceWith(jsxExpressionContainer(generateIntlNode(prefix, node)));
    },
    // 将jsx children中的中文字符串替换为intl表达式
    JSXText(path: NodePath<JSXText>) {
      const value = path.node.value;
      if (!containsCh(value)) return;
      // JSXText是直接将它自己这个path替换，那个value已经没有path了
      path.replaceWith(jsxExpressionContainer(generateIntlNode(prefix, value)));
    },
    // 对象键值
    ObjectProperty(path: NodePath<ObjectProperty>, state: State) {
      const node = path.node.value;
      if (!containsCh(node)) return;
      state.visitedNodeSet?.add(node);
      // 忽略permissionList里的{ code: '', type: '', meaning: '' }
      // path.container包含所有同级节点，在这里就是对象里的所有键值对
      if (
        isIdentifier(path.node.key, { name: 'meaning' }) &&
        path.container instanceof Array &&
        path.container.find(i => isObjectProperty(i) && isIdentifier(i.key, { name: 'code' }))
      )
        return;
      path.get('value').replaceWith(generateIntlNode(prefix, node));
    },
    // 数组
    ArrayExpression(path: NodePath<ArrayExpression>, state: State) {
      const elements = path.node.elements;
      const elementPaths = path.get('elements');
      elements.forEach((e, index) => {
        if (!containsCh(e)) return;
        state.visitedNodeSet?.add(e);
        elementPaths[index].replaceWith(generateIntlNode(prefix, e));
      });
    },
    /*
		ArrowFunctionExpression处理这样的，usePageTitle(() => 'aa')
		不考虑下面这样的以及一般的function
		() => {
			return 'bbb';
		}
		因为写出了函数体一般都不会直接返回字面量
	*/
    ArrowFunctionExpression(path: NodePath<ArrowFunctionExpression>, state: State) {
      const node = path.node.body;
      if (!containsCh(node)) return;
      state.visitedNodeSet?.add(node);
      path.get('body').replaceWith(generateIntlNode(prefix, node));
    },
    // 只处理单个函数调用的参数，其他情况的调用者callee不是Identifier，比如intl.get.d的callee就是MemberExpression
    CallExpression(path: NodePath<CallExpression>, state: State) {
      if (!isIdentifier(path.node.callee)) return;
      const args = path.node.arguments;
      const argumentsPaths = path.get('arguments');
      args.forEach((a, index) => {
        if (!containsCh(a)) return;
        state.visitedNodeSet?.add(a);
        argumentsPaths[index].replaceWith(generateIntlNode(prefix, a));
      });
    },
  };
  return visitor;
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
