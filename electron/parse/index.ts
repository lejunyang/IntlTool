/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2021-12-02 16:05:03
 * @LastEditTime: 2022-11-18 18:04:27
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\electron\parse\index.ts
 */
import { parse } from '@babel/parser';
import { ParseResult, VueParseResult, ProcessFile } from '../types';
import { parse as vueParse } from 'vue-eslint-parser';

export function parseJSCode(code: string): ParseResult {
  const ast: ParseResult = parse(code, {
    errorRecovery: true, // 默认转换错误直接报错，加上此选项则不会，而是返回错误
    sourceType: 'module', // 不指定的话，有import等语句会报错
    plugins: ['decorators-legacy', 'jsx', 'typescript'], // 代码中有装饰器，需要decorators-legacy
  });
  if (ast.errors?.length > 0) {
    ast.parseError = ast.errors.map(error => `${error.code}: ${error.reasonCode}`).join(', ');
  }
  return ast;
}

export function parseJSFile(file: ProcessFile) {
  try {
    const ast: ParseResult = parseJSCode(file.content);
    if (ast.parseError) {
      file.parseError = ast.parseError;
      console.error(file.parseError);
    }
    file.parseResult = ast;
  } catch (e) {
    const error = { ...e, message: e.message, path: file.path };
    file.parseError = JSON.stringify(error);
    console.error(file.parseError);
  }
}

export function parseVueCode(code: string) {
  // 这个的js使用的是espree进行解析，其ecmaVersion默认用2017，2017居然连对象的展开运算符都不支持，2018才开始支持，无语了，es6(2015)支持的是数组展开
  const ast: VueParseResult = vueParse(code, { sourceType: 'module', ecmaVersion: 'latest' });
  if (ast.errors?.length) {
    ast.parseError = ast.errors!.map(error => `${error.code}: ${error.message}`).join(', ');
    console.error(ast.parseError);
  }
  return ast;
}

export function parseVueFile(file: ProcessFile) {
  try {
    const ast: VueParseResult = parseVueCode(file.content);
    if (ast.parseError) {
      file.parseError = ast.parseError;
      console.error(file.parseError);
    }
    file.vueParseResult = ast;
  } catch (e) {
    const error = { ...e, message: e.message, path: file.path };
    file.parseError = JSON.stringify(error);
    console.error(file.parseError);
  }
}
