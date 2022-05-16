/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-01-17 15:27:23
 * @LastEditTime: 2022-05-16 17:37:51
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\electron\traverse\traverseIntl.ts
 */
import traverse from '@babel/traverse';
// import type { NodePath } from '@babel/traverse';
// import type { StringLiteral, TemplateLiteral } from '@babel/types';
// import { containsCh, getStrOfStringNode } from '../utils/stringUtils';
import parse from '../parse';
import { getIntlTraverseVisitor } from './visitor';
import { State, ProcessFile } from '../types';

export default function traverseCode(file: ProcessFile) {
  if (!file.parseResult) {
    file.parseResult = parse(file.content);
  }
  if (file.parseResult.parseError) return;
  traverse<State>(file.parseResult, getIntlTraverseVisitor(), undefined, file);
  // const reCheckFunc = (path: NodePath<StringLiteral | TemplateLiteral>, state: State) => {
  //   if (state.visitedNodeSet && !state.visitedNodeSet.has(path.node) && containsCh(path.node)) {
  //     console.warn('检测到未处理的含有中文的节点: ', `'${getStrOfStringNode(path.node)}'`);
  //   }
  // };
  // traverse<State>(
  //   file.parseResult,
  //   {
  //     StringLiteral: reCheckFunc,
  //     TemplateLiteral: reCheckFunc,
  //   },
  //   undefined,
  //   file
  // );
}
