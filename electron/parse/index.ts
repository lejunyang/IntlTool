/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2021-12-02 16:05:03
 * @LastEditTime: 2022-11-21 19:01:20
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\electron\parse\index.ts
 */
import { parse } from '@babel/parser';
import { ParseResult, VueParseResult, ProcessFile } from '../types';
import { parse as vueParse } from 'vue-eslint-parser';

export function parseJSCode(code: string): ParseResult {
  const ast: ParseResult = parse(code, {
    /**
     * 默认情况下，Babel总是在发现一些无效代码时抛出一个错误。
     * 当此选项设置为true时，它将存储解析错误并尝试继续解析无效的输入文件。
     * 生成的AST将有一个errors属性，表示所有解析错误的数组。
     * 请注意，即使启用了此选项，@babel/parser也可能抛出不可恢复的错误
     */
    errorRecovery: true,
    sourceType: 'module', // 不指定的话，有import等语句会报错
    plugins: ['decorators-legacy', 'jsx', 'typescript'], // 代码中有装饰器，需要decorators-legacy
  });
  if (ast.errors?.length > 0) {
    // @ts-ignore 这个error是Error对象，所以是有message的
    ast.parseError = ast.errors.map(error => `${error.code}: ${error.reasonCode}: ${error.message}`).join(', ');
  }
  return ast;
}

export function parseJSFile(file: ProcessFile) {
  try {
    const ast: ParseResult = parseJSCode(file.content);
    if (ast.parseError) {
      file.parseError = ast.parseError;
      console.error(`${file.path}发生Babel解析错误`, file.parseError);
    }
    file.parseResult = ast;
  } catch (e) {
    const error = { ...e, message: `${file.path}发生Babel解析致命错误${e.message}` };
    file.parseError = JSON.stringify(error);
    console.error(error);
  }
}

export function parseVueCode(code: string) {
  // 这个的js使用的是espree进行解析，其ecmaVersion默认用2017，2017居然连对象的展开运算符都不支持，2018才开始支持，无语了，es6(2015)支持的是数组展开
  const ast: VueParseResult = vueParse(code, { sourceType: 'module', ecmaVersion: 'latest' });
  if (ast.errors?.length) {
    ast.parseError = ast.errors!.map(error => `${error.code}: ${error.message}`).join(', ');
  }
  return ast;
}

export function parseVueFile(file: ProcessFile, ignoreScripts?: boolean) {
  try {
    const ast: VueParseResult = parseVueCode(ignoreScripts ? file.content.replace(/(<script.*?>[\s\S]*?<\/script>)/g, '') : file.content);
    if (ast.parseError) {
      file.parseError = ast.parseError;
      console.error(`${file.path}发生Vue解析错误`, file.parseError);
    }
    file.vueParseResult = ast;
  } catch (e) {
    const error = { ...e, message: `${file.path}发生Vue解析致命错误${e.message}` };
    file.parseError = JSON.stringify(error);
    console.error(error);
  }
}
