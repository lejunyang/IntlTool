/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-05-26 14:24:46
 * @LastEditTime: 2022-05-26 23:45:14
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

const { traverseNodes } = AST;

export function transformVueCh(file: ProcessFile, prefix = '') {
  if (!file.vueParseResult) parseVueFile(file);
  if (file.parseError) return;
  // 遍历vue的template
  // ...有些没有template的vue文件，然后下面也没进去，直接在外面赋一次值吧
  file.chTransformedContent = file.content;
  if (file.vueParseResult.templateBody)
    traverseNodes(file.vueParseResult.templateBody, getVueTemplateChToIntlVisitor(file, prefix));
  // 遍历vue的script，这部分用babel处理  有多标签的情况。。。。
  const scripts = file.chTransformedContent.match(/<script.*?>([\s\S]*?)<\/script>/g) || [];
  scripts.forEach(script => {
    let scriptCode = (script.match(/<script>([\s\S]+?)<\/script>/) || [])[1];
    if (scriptCode) {
      try {
        // 去掉uniapp预编译注释，防止babel编译报错，后面再把//TEMP去掉
        scriptCode = scriptCode.replace(/(<!--.+-->)/g, '//TEMP$1');
        const scriptParseResult = parseJSCode(scriptCode);
        if (!scriptParseResult.parseError) {
          traverse(scriptParseResult, getChToIntlVisitor(prefix, { l1: 'this', l2: 'intl', l3: 'd' }));
          const scriptStartTag = script.replace(/(<script.*?>)[\s\S]*?<\/script>/, '$1');
          file.chTransformedContent = file.chTransformedContent
            .replace(script, `${scriptStartTag}\r\n${generateAndFormat(scriptParseResult)}\r\n</script>`)
            .replace(/\/\/TEMP/g, '');
        } else {
          file.parseError = scriptParseResult.parseError;
          console.error(file.parseError);
          return;
        }
      } catch (e) {
        const error = { ...e, message: e.message, path: file.path };
        console.log('scriptCode', scriptCode);
        file.parseError = JSON.stringify(error);
        console.error(file.parseError);
      }
    }
  });
  file.diffPatchOfChTransform = createPatch(file.path, file.content, file.chTransformedContent, '', '');
}
