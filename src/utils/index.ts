/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-01-29 14:33:40
 * @LastEditTime: 2022-02-17 17:13:51
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

export function copy(text: string) {
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
