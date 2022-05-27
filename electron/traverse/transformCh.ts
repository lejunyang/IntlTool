/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-01-17 15:27:55
 * @LastEditTime: 2022-05-27 15:21:33
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\electron\traverse\transformCh.ts
 */
import traverse from '@babel/traverse';
import { createTwoFilesPatch } from 'diff';
import type { State, ProcessFile } from '../types';
import { parseJSFile } from '../parse';
import { getChToIntlVisitor } from './visitor';
import { generateAndFormat } from '../generate';

/**
 * 遍历React代码文件，将其中的中文转变为intl格式
 * @param file
 * @param prefix intl.get中编码使用的前缀
 */
export function transformCh(file: ProcessFile, prefix: string = '') {
  if (!file.parseResult) parseJSFile(file);
  if (file.parseError) return;
  traverse<State>(file.parseResult, getChToIntlVisitor(prefix), undefined, file);
  file.chTransformedContent = generateAndFormat(file.parseResult);
  file.diffPatchOfChTransform = createTwoFilesPatch(
    file.path,
    file.path,
    file.content,
    file.chTransformedContent,
    '',
    ''
  );
  file.diffPatchOfChTransform = file.diffPatchOfChTransform.split('\n').slice(2).join('\n');
}
