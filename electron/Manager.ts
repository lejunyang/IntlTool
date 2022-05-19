/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-01-20 22:37:59
 * @LastEditTime: 2022-05-19 11:05:33
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\electron\Manager.ts
 */
import { omit } from 'lodash';
import { ProcessFile, TransferFile, IntlItem, BasicFile, IntlResult } from './types';
import { transformCh, traverseIntl } from './traverse';
import * as StringUtils from './utils/stringUtils';

export default class Manager {
  private filesUIDSet: Set<string> = new Set(); // 用于避免文件重复
  private files: ProcessFile[] = [];
  private prefixes: string[] = ['^hzero.common.', '^o2.2[cb].\\w+.\\w+.', '^o2.\\w+.\\w+.'];

  private intlCodeMap: Map<string, IntlItem> = new Map(); // 用于避免intl code重复
  private intlResult: IntlResult = [];

  addIntlItem(item: IntlItem) {
    if (this.intlCodeMap.has(item.code)) {
      if (this.intlCodeMap.get(item.code).d !== item.d) {
        item.error = 'code重复，但中文不一致';
        this.intlResult.unshift(item);
      } else if (!this.intlCodeMap.get(item.code).prefix && item.prefix) {
        // code一致且中文一致的，且原来没有prefix，更新prefix
        const index = this.intlResult.findIndex(i => i.code === item.code && i.d === item.d);
        this.intlResult[index] = item;
        this.intlCodeMap.set(item.code, item);
      }
    } else {
      // 把有错误的放在前面
      if (item.error) this.intlResult.unshift(item);
      else this.intlResult.push(item);
      this.intlCodeMap.set(item.code, item);
    }
  }

  reset() {
    this.files = [];
  }

  addFile(file: ProcessFile) {
    Object.assign(file, {
      vars: {},
      intlResult: [],
    });
    if (this.filesUIDSet.has(file.uid)) {
      const index = this.files.findIndex(f => f.uid === file.uid);
      this.files[index] = file;
      return;
    }
    this.filesUIDSet.add(file.uid);
    this.files.push(file);
  }

  removeFile(file: BasicFile) {
    const index = this.files.findIndex(f => f.uid === file.uid);
    if (index >= 0) {
      this.files.splice(index, 1);
    }
  }

  getFiles(): TransferFile[] {
    return this.files
      .map(file => {
        file.parseError = file.parseResult?.parseError || undefined;
        return omit(file, ['vars', 'parseResult']);
      })
      .sort((f1, f2) => {
        // 有parseError的排在前面，intlResult的intlItem里有error的在前面
        if (f1.parseError || f2.parseError) return (f1.parseError ?? '') < (f2.parseError ?? '') ? -1 : 1;
        else return f1.path < f2.path ? -1 : 1;
      });
  }

  setPrefixes(prefixString: string) {
    this.prefixes = prefixString.split(/\r?\n/).flatMap(p => {
      const result = p.trim();
      if (result) return [result];
      else return [];
    });
  }

  getPrefixes() {
    return this.prefixes;
  }

  getRemoteData() {
    return {
      prefixes: this.prefixes,
      intlResult: this.intlResult,
      // files: this.getFiles(),
    };
  }

  private allowedFileSuffix: Set<string> = new Set(['.js', '.ts', '.tsx', '.jsx']);

  isFileAllowed(filePath: string): boolean {
    const type = filePath.substring(filePath.lastIndexOf('.'));
    return this.allowedFileSuffix.has(type);
  }

  /**
   * 假设path为C:\Users\Lenovo Thinkbook 16P\Desktop\Projects\o2\o2-console-share\packages\o2-product\src\routes\PlatformBrand\index.js
   * 我们需要某些文件夹名作为前缀，而且需要处理
   * 假设我们需要o2.product.platformBrand，那么prefixPattern为设为 $9{replace}[-, .]$12{toLowerCamel}
   * 其中$9代表path中的位置，即o2-product，{function}表示调用内置的工具函数
   * 这里这个replace将o2-product转化为o2.product，toLowerCamel将PlatformBrand转为小驼峰
   * 处理函数后面跟着的方括号是额外向处理函数传递的参数，写不写根据你调用的函数
   * 方括号里的字符串会以逗号split并trim处理，上面就相当于调用StringUtils.replace($9, '-', '.')
   * 注意参数数量需要是和对应函数匹配的，否则不调用。如果这个函数本身需要额外的参数却没有传递，也不会调用
   * 除了上述特殊被匹配的字符，prefixPattern中的其他字符均会保留
   */
  processAllCh(prefixPattern?: string) {
    this.files.forEach(file => {
      const paths = file.path.split(/\\|\//);
      const prefix = prefixPattern.replace(
        /\$(\d+)(?:{(\w+)})?(?:\[(.+)\])?/g,
        (str, pathIndex?: string, funcName?: string, params?: string) => {
          const p = paths[+pathIndex];
          // 没有正确的path则直接返回匹配的字符串
          if (p) {
            // 检查传过来的funcName是否在内置的StringUtils里面
            if (funcName && StringUtils[funcName] instanceof Function) {
              if (!params) {
                // 没有写额外参数，检查这个需要调用的函数的参数数量是否为1
                if (StringUtils[funcName].length === 1) return StringUtils[funcName](p);
                else {
                  throw {
                    type: 'error',
                    message: `错误: ${funcName}需要${StringUtils[funcName].length - 1}个额外参数，但并没有传递参数`,
                  };
                }
              } else {
                const args = params.split(',').map(param => param.trim());
                if (args.length === StringUtils[funcName].length - 1) return StringUtils[funcName](p);
                else
                  throw {
                    type: 'error',
                    message: `错误: 传给${funcName}的额外参数数量为${args.length}，应为${
                      StringUtils[funcName].length - 1
                    }个`,
                  };
              }
            } else return p;
          } else return str;
        }
      );
      transformCh(file, prefix);
    });
  }

  traverseAllIntl() {
    this.files.forEach(file => {
      traverseIntl(file);
    });
  }

  checkDupIntls() {
    const map = new Map<
      string,
      {
        d: string;
        originalIntl: IntlItem;
      }
    >();
    this.files.forEach(file => {
      file.intlResult?.forEach(item => {
        const temp = map.get(item.get);
        // 本来有error的不统计
        if (!item.error && temp?.d !== item.d) {
          temp.originalIntl.error = 'duplicate';
          item.error = 'duplicate';
        } else {
          map.set(item.get, { d: item.d, originalIntl: item });
        }
      });
    });
  }
}
export const manager = new Manager();
