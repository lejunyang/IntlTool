/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-05-26 14:24:46
 * @LastEditTime: 2023-07-19 16:01:14
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \IntlTool\electron\traverse\vueTransformCh.ts
 */
import { AST } from 'vue-eslint-parser';
import { parseVueFile, parseJSCode } from '../parse';
import { getVueTemplateChToIntlVisitor, getChToIntlVisitor } from './visitor';
import { generateAndFormat, format } from '../generate';
import traverse from '@babel/traverse';
import { createTwoFilesPatch } from 'diff';
import { ProcessFile, IntlOptions } from '../types';

const { traverseNodes } = AST;

// 在不同的uniapp预编译块中定义相同的变量导致js报错。。。想到的解决方法是提取出这些东西，单独处理
// 无法解决。。也尝试了babel errorRecovery，虽然能cover住，但是traverse的时候仍会抛出错误
export function transformVueCh(file: ProcessFile, options: IntlOptions) {
  const { prefix = '' } = options;
  parseVueFile(file, true);
  if (file.parseError) return;
  // 遍历vue的template
  // ...有些没有template的vue文件，然后下面也没进去，直接在外面赋一次值吧
  file.chTransformedContent = file.content;
  file.chTransformedInfo = [];
  if (file.vueParseResult?.templateBody) {
    file.vueParseResult.templateBody.isRootTemplate = true; // 用于确定这个template是根结点，因为字符串替换是在离开template进行的
    traverseNodes(file.vueParseResult.templateBody, getVueTemplateChToIntlVisitor(file, options));
  }
  // 遍历vue的script，这部分用babel处理，有多个script标签的情况。。。。
  const scripts = file.chTransformedContent.match(/<script.*?>([\s\S]*?)<\/script>/g) || [];
  scripts.forEach(script => {
    const scriptCode = (script.match(/<script.*?>([\s\S]+?)<\/script>/) || [])[1];
    if (scriptCode) {
      try {
        // 去掉uniappt条件编译注释，为这段代码套上一个{}，防止babel编译报错（有写了几个条件编译，然后定义了相同的变量的情况。。），后面再把//TEMP以及花括号去掉
        // 。。。有例外情况，因为条件编译可以在任何位置，不是所有地方都能直接塞一个代码块的，比如methods里面，本身不是代码块的地方不能塞代码块
        // 如果匹配的内容里面最后一个非空字符串是逗号，那就不替换了

        // 这个还是有bug，如果条件编译有嵌套，匹配到的标签会错误
        // scriptCode = scriptCode.replace(/(\/\/.*?#ifn?def.*)([\s\S]*?)(\/\/.*?#endif)/g, (_match, p1, p2, p3) => {
        //   if (p2.trim().endsWith(',')) return p1 + p2 + p3;
        //   else return `${p1}\r\n{//TEMP${p2}\r\n}//TEMP\r\n${p3}`;
        // });
        const scriptParseResult = parseJSCode(scriptCode);
        if (scriptParseResult.parseError) {
          file.parseError = scriptParseResult.parseError;
          console.error({ message: `${file.path}解析Vue script时发生错误`, error: file.parseError });
          return;
        }

        traverse<ProcessFile>(
          scriptParseResult,
          getChToIntlVisitor({ prefix, nameMap: options.nameMap, filepath: file.path }),
          undefined,
          file
        );
        const scriptStartTag = script.replace(/(<script.*?>)[\s\S]*?<\/script>/, '$1');
        file.chTransformedContent = file.chTransformedContent!.replace(
          script,
          `${scriptStartTag}\r\n${generateAndFormat(scriptParseResult, {
            ...options,
            filepath: options?.filepath.replace('.vue', '.js'), // vue改为js，防止prettier无法正确格式化
          })}\r\n</script>`
        );
        // .replace(/\r\n{\s*\/\/TEMP/g, '')
        // .replace(/}\s*\/\/TEMP\r\n/g, '');
      } catch (e) {
        const error = { ...e, message: `${file.path}解析Vue script时发生致命错误` + e.message, stack: e.stack };
        console.error(error);
      }
    }
  });
  // 让script和style缩进
  if (options.formatAfterTransform && options.formatOptions?.vueIndentScriptAndStyle) {
    file.chTransformedContent = format(file.chTransformedContent, options);
  }
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
