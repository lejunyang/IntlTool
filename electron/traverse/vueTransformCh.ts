/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-05-26 14:24:46
 * @LastEditTime: 2022-05-27 15:31:29
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\electron\traverse\vueTransformCh.ts
 */
import { AST } from 'vue-eslint-parser';
import { parseVueFile, parseJSCode } from '../parse';
import { getVueTemplateChToIntlVisitor, getChToIntlVisitor } from './visitor';
import { generateAndFormat } from '../generate';
import traverse from '@babel/traverse';
import { createTwoFilesPatch } from 'diff';
import { ProcessFile } from '../types';

const { traverseNodes } = AST;

// 目前遇到的问题还有，在不同的uniapp预编译块中定义相同的变量导致js报错。。。想到的解决方法是提取出这些东西，单独处理
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
          traverse<ProcessFile>(
            scriptParseResult,
            getChToIntlVisitor(prefix, { l1: 'this', l2: 'intl', l3: 'd' }),
            null,
            file
          );
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
  // 这个createTwoFilesPatch，如果传的文件名是一样的，开头会多一句Index: 文件名。。。我不理解，手动把它去掉
  // 另外，分割线那一行也不要
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
