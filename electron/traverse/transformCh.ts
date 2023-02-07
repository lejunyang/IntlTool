/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-01-17 15:27:55
 * @LastEditTime: 2023-02-07 22:39:15
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\electron\traverse\transformCh.ts
 */
import traverse from '@babel/traverse';
import { createTwoFilesPatch } from 'diff';
import type { State, ProcessFile, IntlOptions } from '../types';
import { parseJSFile } from '../parse';
import { getChToIntlVisitor } from './visitor';
import { generateAndFormat } from '../generate';

/**
 * 遍历React代码文件，将其中的中文转变为intl格式
 */
export function transformCh(
  file: ProcessFile,
  options: IntlOptions
) {
  parseJSFile(file);
  if (file.parseError) return;
  file.chTransformedContent = file.content;
  file.chTransformedInfo = [];
  traverse<State>(file.parseResult, getChToIntlVisitor(options), undefined, file);
  file.chTransformedContent = generateAndFormat(file.parseResult!, options);
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
