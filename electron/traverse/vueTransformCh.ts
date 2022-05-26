/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-05-26 14:24:46
 * @LastEditTime: 2022-05-26 19:36:07
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\electron\traverse\vueTransformCh.ts
 */
import { AST } from 'vue-eslint-parser';
import { parseVueFile, parseJSCode } from '../parse';
import { getVueTemplateChToIntlVisitor, getChToIntlVisitor } from './visitor';
import { generateAndFormat } from '../generate';
import traverse from '@babel/traverse';
import { createPatch } from 'diff';
import { ProcessFile } from '../types';
import { omit } from 'lodash';

const { traverseNodes } = AST;

export function transformVueCh(file: ProcessFile, prefix = '') {
  if (!file.vueParseResult) parseVueFile(file);
  if (file.parseError) return;
  // 遍历vue的template
  traverseNodes(file.vueParseResult.templateBody, getVueTemplateChToIntlVisitor(file, prefix));
  // 遍历vue的script，这部分用babel处理
  const scriptCode = (file.chTransformedContent.match(/<script.*>([\s\S]+)<\/script>/) || [])[1];
  if (scriptCode) {
    try {
      const scriptParseResult = parseJSCode(scriptCode);
      if (!scriptParseResult.parseError) {
        traverse(scriptParseResult, getChToIntlVisitor(prefix, { l1: 'this', l2: 'intl', l3: 'd' }));
        file.chTransformedContent = file.chTransformedContent.replace(
          /(<script.*>)([\s\S]+)<\/script>/,
          `$1\r\n${generateAndFormat(scriptParseResult)}\r\n</script>`
        );
      } else {
        file.parseError = scriptParseResult.parseError;
        console.error(file.parseError);
        return;
      }
    } catch (e) {
      file.parseError = JSON.stringify(omit(e, ['clone'])); // omit以便于拿到Error的继承属性message，stack等
      console.error(file.parseError);
    }
  }
  file.diffPatchOfChTransform = createPatch(file.path, file.content, file.chTransformedContent, '', '');
}
