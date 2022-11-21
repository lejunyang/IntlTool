/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-01-29 14:33:40
 * @LastEditTime: 2022-11-18 17:30:16
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\src\utils\index.ts
 */

const input = document.createElement('textarea');
export function execCopy(text: string) {
  input.setAttribute('style', 'position:fixed;top:0;opacity:0;pointer-events:none;');
  input.value = text;
  document.body.appendChild(input);
  input.select();
  const success = document.execCommand('copy');
  input.remove();
  return success;
}

export function copy(text: string | undefined | null) {
  if (text == null) return false;
  if (navigator.clipboard) return navigator.clipboard.writeText(text);
  else return execCopy(text);
}

export function parseCss(cssJson: string) {
  try {
    const css = JSON.parse(cssJson);
    const result = {};
    for (const key in css) {
      if (/\d+/.test(key)) continue;
      else if (
        [
          'cssText',
          'length',
          'parentRule',
          'cssFloat',
          'getPropertyPriority',
          'getPropertyValue',
          'item',
          'removeProperty',
          'setProperty',
        ].includes(key)
      )
        continue;
      result[key] = css[key];
    }
    return result;
  } catch (e) {
    console.error(e);
    return e.toString();
  }
}

export * from '../../electron/utils/objectUtils';
/**
 * 加了下面的代码之后发现渲染进程报错，process is not defined，查看报错代码是babel用到了process.env
 * 嗯。。containsCh之前是写在stringUtils，里面确实引入了babel。。这个函数还是移到astUtils里去吧
 */
export * from '../../electron/utils/stringUtils';