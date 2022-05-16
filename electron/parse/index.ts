/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2021-12-02 16:05:03
 * @LastEditTime: 2022-01-27 16:14:41
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\electron\parse\index.ts
 */
import { parse } from '@babel/parser';
import { ParseResult } from '../types';

export default function parseCode(code: string): ParseResult {
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
