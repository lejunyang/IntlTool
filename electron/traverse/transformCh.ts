/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-01-17 15:27:55
 * @LastEditTime: 2022-01-29 14:16:34
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\electron\traverse\transformCh.ts
 */
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import { format } from 'prettier';
import { createPatch } from 'diff';
import type { State, ProcessFile } from '../types';
import { parseJSFile } from '../parse';
import { getChToIntlVisitor } from './visitor';

/**
 * 遍历React代码文件，将其中的中文转变为intl格式
 * @param file
 * @param prefix intl.get中编码使用的前缀
 */
export function transformCh(file: ProcessFile, prefix: string = '') {
  if (!file.parseResult) parseJSFile(file);
  if (file.parseError) return;
  traverse<State>(file.parseResult, getChToIntlVisitor(prefix), undefined, file);
  const { code } = generate(file.parseResult, {
    // 默认babel/generator使用jsesc来将非ascii字符转换，会把中文字符转成了unicode，关掉
    jsescOption: {
      minimal: true,
    },
  });
  // file.chTransformedContent = code;
  file.chTransformedContent = format(code, {
    parser: 'typescript', // parser必传
    semi: true,
    singleQuote: true,
    arrowParens: 'avoid',
    printWidth: 120,
    endOfLine: 'crlf',
  });
  file.diffPatchOfChTransform = createPatch(file.path, file.content, file.chTransformedContent, '', '');
}
