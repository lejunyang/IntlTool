/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-05-25 21:44:23
 * @LastEditTime: 2022-11-21 11:14:21
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\electron\traverse\visitor\vueChToIntlVisitor.ts
 */
import type { Visitor } from 'vue-eslint-parser/ast/traverse';
// import { isTemplateLiteral } from '@babel/types';
import { isVLiteral, isVText, isVExpressionContainer, isVElement, containsCh } from '../../utils/astUtils';
import type { ProcessFile } from '../../types';
import { generateCode } from '../../generate';

export const getVueTemplateChToIntlVisitor = (file: ProcessFile, prefix = '') => {
  file.chTransformedContent = file.content;
  // 由于是直接使用字符串进行替换，原AST上的range代表的index在进行一次替换后就有偏差了。。后面的节点index位置全是错的，直接爆炸
  // 用leftStartIndex标明最左边的进行过替换的节点开始位置，其后面的节点全部都要重算index，其前面的不用。indexAcc表示增加的长度
  // let indexAcc = 0,
  //   leftStartIndex = Number.MAX_SAFE_INTEGER;
  // const getCorrectIndex = (index: number) => (index > leftStartIndex ? index + indexAcc : index);

  // 上面这个废弃，有bug
  // 我下面的VElement的遍历方式，会提前遍历到childrent里面的text，比如<p><div>我</div>文字</p>，就是先访问到p里面的“文字”，然后再从traverse进入到div，这样的顺序就乱了，indexAcc变得不可信
  // 故不再进行实时替换，而是存下来，在leave template的时候排个序，根据节点位置从头替换过去
  const replaceActions: { rangeStart: number; replaceStr: string; rangeEnd: number }[] = [];
  return {
    enterNode(node) {
      let replaceStr: string;
      switch (node.type) {
        case 'VAttribute':
          if (node.directive) {
            // 目前先不考虑 :attr="`中文`"，:option="{ a: '中文' }"这样的情况
            // const expr = node.value.expression;
            // if (isTemplateLiteral(expr) && containsCh(expr)) {
            //   replaceStr =
            // }
          } else {
            // 不是v指令的情况（缩写也算指令），检查其值是否包含中文
            if (!isVLiteral(node.value) || !containsCh(node.value.value)) return;
            replaceStr = `:${node.key.name}="intl('${prefix}').d('${node.value.value.trim()}')"`;
            replaceActions.push({ rangeStart: node.range[0], replaceStr, rangeEnd: node.range[1] });
          }
          break;
        case 'VElement':
          /**
           * VElement的children有三种情况，纯文本，表达式，VElement
           * 处理逻辑是这样的，从头遍历过去，当遇到有中文的纯文本时开始，后续的纯文本和表达式放到一起作为一个intl
           * 遍历时遇到VElement则重新开始children里新的intl，该VElement不需要考虑（因为后续遍历还会进到它里面，它自己显然需要单独处理）
           * 有些情况下会问题，如<div>1、{{a}}中文</div>，显然中文前面的节点都被忽略了，暂时不考虑这样的 = =
           */
          {
            let rangeStart: number | null,
              intlArg = {},
              dStr = '';
            node.children.forEach((child, index) => {
              // 如果rangeStart有值了那就不用考虑它是否含有中文，因为有这种情况<div>中文{{a}}5555</div>
              if (isVText(child) && (containsCh(child.value) || rangeStart)) {
                if (!rangeStart) rangeStart = child.range[0];
                dStr += child.value.trim();
              } else if (
                rangeStart &&
                isVExpressionContainer(child) &&
                child.expression &&
                (node.children.length === 1 || index !== node.children.length - 1)
              ) {
                // FIXME 有个bug，把最后一个表达式忽略了
                // 如果它是children里的最后一个且为表达式，那就不计入了（除非只有一个节点），毕竟前面的就已经可以组成intl，没必要带上后面的表达式
                const exprCode = generateCode(child.expression);
                dStr += `\${${exprCode}}`;
                intlArg[`nameMe${index}`] = exprCode;
              }
              if (rangeStart && (index === node.children.length - 1 || isVElement(child))) {
                // 到达结尾或者遇到VElement，进行替换，并重新计算intl
                const intlArgStr = JSON.stringify(intlArg).replaceAll('"', '');
                replaceStr = `{{ intl('${prefix}'${intlArgStr === '{}' ? '' : `, ${intlArgStr}`}).d(\`${dStr}\`) }}`;
                const rangeEnd = index === node.children.length - 1 ? child.range[1] : child.range[0];
                replaceActions.push({ rangeStart, replaceStr, rangeEnd });
                replaceStr = '';
                rangeStart = null;
                intlArg = {};
                dStr = '';
              }
            });
          }
          break;
      }
    },
    leaveNode(node) {
      if (node?.type !== 'VElement' || node.name !== 'template') return;
      if (replaceActions.length) {
        file.chOriginalItems = file.chOriginalItems.concat(
          replaceActions.map(action => ({
            start: action.rangeStart,
            end: action.rangeEnd,
            str: file.content.substring(action.rangeStart, action.rangeEnd),
          }))
        );
        file.chTransformedItems = file.chTransformedItems.concat(replaceActions.map(action => action.replaceStr));
      } else return;
      replaceActions.sort((a, b) => a.rangeStart - b.rangeStart);
      let indexAcc = 0;
      replaceActions.forEach(action => {
        file.chTransformedContent =
          file.chTransformedContent!.slice(0, action.rangeStart + indexAcc) +
          action.replaceStr +
          file.chTransformedContent!.slice(action.rangeEnd + indexAcc);
        indexAcc += action.replaceStr.length - action.rangeEnd + action.rangeStart;
      });
    },
  } as Visitor;
};
