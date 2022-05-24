/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2021-12-02 16:05:03
 * @LastEditTime: 2022-05-24 23:12:30
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\electron\parse\index.ts
 */
import { parse } from '@babel/parser';
import { ParseResult, VueParseResult } from '../types';
import { parse as vueParse } from 'vue-eslint-parser';

export function parseJSCode(code: string): ParseResult {
  const ast: ParseResult = parse(code, {
    errorRecovery: true, // 默认转换错误直接报错，加上此选项则不会，而是返回错误
    sourceType: 'module', // 不指定的话，有import等语句会报错
    plugins: ['decorators-legacy', 'jsx', 'typescript'], // 代码中有装饰器，需要decorators-legacy
  });
  if (ast.errors?.length > 0) {
    ast.parseError = ast.errors
      .map(error => `${error.code}: ${error.reasonCode}`)
      .join(', ');
    console.error(ast.parseError);
  }
  return ast;
}

export function parseVueCode(code: string) {
  let ast: VueParseResult;
  try {
    // 这个的js使用的是espree进行解析，其ecmaVersion默认用2017，2017居然连对象的展开运算符都不支持，2018才开始支持，无语了，es6(2015)支持的是数组展开
    ast = vueParse(code, { sourceType: 'module', ecmaVersion: 'latest' });
  } catch (error) {
    // 有些报错它是直接抛出来，不是放到errors里。。
    console.error(JSON.stringify(error));
    return JSON.stringify(error);
  }
  if (ast.errors?.length > 0) {
    ast.parseError = ast.errors.map(error => `${error.code}: ${error.message}`).join(', ');
    console.error(ast.parseError);
  }
  return ast;
}
