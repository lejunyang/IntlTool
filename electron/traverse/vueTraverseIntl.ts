/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-05-24 20:53:09
 * @LastEditTime: 2022-11-18 18:11:55
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\electron\traverse\vueTraverseIntl.ts
 */
import { AST } from 'vue-eslint-parser';
import { parseVueFile } from '../parse';
import { getVueIntlTraverseVisitor } from './visitor';
import { IntlOptions, ProcessFile } from '../types';

const { traverseNodes } = AST;

export function traverseVueIntl(file: ProcessFile, options: IntlOptions) {
  parseVueFile(file);
  if (file.parseError) return;
  try {
    // 遍历vue的template
    // 如果vue文件没有template，那么node是null。。。vue-eslint-parser的traverseNodes里面也没有对null做防范。。
    if (file.vueParseResult?.templateBody)
      traverseNodes(
        file.vueParseResult.templateBody,
        getVueIntlTraverseVisitor(file, { l2: options.nameMap.l2, l3: options.nameMap.l1 })
      );
    // 遍历vue的script
    file.vueParseResult?.body.forEach(node => {
      if (!node) return;
      traverseNodes(node, getVueIntlTraverseVisitor(file, options.nameMap));
    });
  } catch (e) {
    console.error(`${file.path}遍历Vue中的intl时发生错误:`, e);
  }
}
