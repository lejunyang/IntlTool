/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-01-20 22:37:59
 * @LastEditTime: 2023-06-08 11:01:11
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \IntlTool\electron\Manager.ts
 */
import { omit } from 'lodash';
import type { Options as PrettierOptions } from 'prettier';
import { BasicFile, ProcessFile, TransferFile, IntlItem, IntlResult, Mode, ModeOptions } from './types';
import { transformCh, transformVueCh, traverseIntl, traverseVueIntl } from './traverse';
import * as StringUtils from './utils/stringUtils';
import { readFile } from './utils/fileUtils';
import { parseJSFile, parseVueFile } from './parse';
import { TranslateParam, defaultTranslatorConfigMap, translate } from './translator';

export default class Manager {
  private commonOptions = {
    excludedPaths: ['node_modules', '/lib/', '\\lib\\', '.umi', '/dist/', '\\dist\\', '\\demo\\', '/demo/'],
    requirePrefix: false,
    formatAfterTransform: true,
    commonIntlData: {},
    formatOptions: {
      semi: true,
      singleQuote: true,
      arrowParens: 'avoid',
      printWidth: 120,
      endOfLine: 'crlf',
      vueIndentScriptAndStyle: true,
    } as PrettierOptions,
    translatorConfigMap: JSON.parse(JSON.stringify(defaultTranslatorConfigMap)),
  };

  private modeMap: { [mode: string]: ModeOptions } = {
    [Mode.HzeroIntlReact]: {
      ...this.commonOptions,
      nameMap: { l1: 'intl', l2: 'get', l3: 'd' },
      allowedFileSuffix: ['.js', '.ts', '.tsx', '.jsx'],
      requirePrefix: true,
    },
    [Mode.VueI18N]: {
      ...this.commonOptions,
      nameMap: { l1: '', l2: 'intl', l3: 'd' },
      allowedFileSuffix: ['.vue'],
      warningWhenUsedInMultiFiles: true,
      customValidate: `return intlItem.code.split('.').length !== 4 ? '多语言编码必须为4段' : ''`,
    },
    [Mode.UmiIntlReact]: {
      ...this.commonOptions,
      nameMap: { l1: 'intl', l2: 'get', l3: 'd' },
      allowedFileSuffix: ['.js', '.ts', '.tsx', '.jsx'],
    },
  };

  private mode = Mode.HzeroIntlReact;

  getMode() {
    return this.mode;
  }

  switchMode(mode: any) {
    if (this.modeMap[mode]) {
      this.mode = mode;
      this.resetAll();
    } else {
      console.error(`模式${mode}不存在`);
    }
  }

  setOptionValue(key: string, value: any) {
    if (this.modeMap[this.mode][key]) {
      this.modeMap[this.mode][key] = value;
    } else {
      console.error(`选项${key}不存在`);
    }
  }

  setOptions(options: ModeOptions) {
    if (!options || typeof options !== 'object') return;
    this.modeMap[this.mode] = {
      ...this.modeMap[this.mode],
      ...options,
    };
  }

  getAllowedFileSuffix(): string[] {
    return this.modeMap[this.mode].allowedFileSuffix || [];
  }

  getExcludedPaths(): string[] {
    return this.modeMap[this.mode].excludedPaths || [];
  }

  isPathAllowed(path: string): boolean {
    return !this.getExcludedPaths().some(ex => path.includes(ex));
  }

  isFileAllowed(filePath: string): boolean {
    const type = filePath.substring(filePath.lastIndexOf('.'));
    return this.getAllowedFileSuffix().includes(type) && this.isPathAllowed(filePath);
  }

  private filesUIDSet: Set<string> = new Set(); // 用于避免文件重复
  private files: ProcessFile[] = [];

  addFile(file: BasicFile) {
    if (!this.isFileAllowed(file.path)) return;
    const processFile: ProcessFile = { ...file, vars: {}, chTransformedInfo: [] };
    if (this.filesUIDSet.has(processFile.uid)) {
      const index = this.files.findIndex(f => f.uid === processFile.uid);
      this.files[index] = processFile;
      return;
    }
    this.filesUIDSet.add(processFile.uid);
    this.files.push(processFile);
  }

  removeFile(uid: string) {
    const index = this.files.findIndex(f => f.uid === uid);
    if (index >= 0) {
      this.files.splice(index, 1);
      this.filesUIDSet.delete(uid);
    }
  }

  refreshFiles() {
    this.files.forEach(file => {
      file.content = readFile(file.path);
      if (file.path.endsWith('vue')) parseVueFile(file);
      else parseJSFile(file);
      file.chTransformedContent = '';
      file.diffPatchOfChTransform = '';
      file.chTransformedInfo = [];
    });
  }

  resetAll() {
    this.files = [];
    this.filesUIDSet.clear();
    this.resetIntl();
  }

  getFileByUid(uid: string): ProcessFile | undefined {
    return this.files.find(f => f.uid === uid);
  }

  getOriginalFiles(): ProcessFile[] {
    return this.files;
  }

  getFiles(): TransferFile[] {
    return this.files
      .map(file => omit(file, ['vars', 'parseResult', 'vueParseResult']))
      .sort((f1, f2) => {
        // 有parseError的排在前面
        if (f1.parseError || f2.parseError) return (f1.parseError ?? '') > (f2.parseError ?? '') ? -1 : 1;
        else if (f1.path.length !== f2.path.length) return f1.path.length - f2.path.length;
        else return f1.path < f2.path ? -1 : 1;
      });
  }

  private prefixes: string[] = [
    '^o2.common.',
    '^hzero.common.',
    '^o2.2[cb].\\w+.\\w+.',
    '^o2.\\w+.\\w+.',
    '^hzero.c7nProUI.',
    '^hzero.c7nUI.',
    '^hzero.hzeroUI.',
  ];

  setPrefixes(prefixString: string) {
    this.prefixes = prefixString.split(/\r?\n/).flatMap(p => {
      const result = p.trim();
      try {
        // 通过new测试能否转为正则，比如new RegExp('^*')是非法的
        // eslint-disable-next-line no-new
        new RegExp(result);
        if (result) return [result];
        else return [];
      } catch (e) {
        console.error(`${result}不能转为正则，请检查`);
        return [];
      }
    });
  }

  getPrefixes() {
    return this.prefixes;
  }

  private intlCodeMap: Map<string, IntlItem> = new Map(); // 用于避免intl code重复
  private intlDupSet: Set<string> = new Set(); // 用于防止'code重复，但中文不一致'错误项重复
  private intlResult: IntlResult = [];

  resetIntl() {
    this.intlCodeMap.clear();
    this.intlDupSet.clear();
    this.intlResult = [];
  }

  addIntlItem(item: IntlItem) {
    if (this.intlCodeMap.has(item.code)) {
      if (this.intlCodeMap.get(item.code)!.d !== item.d && !this.intlDupSet.has(item.code + item.error)) {
        item.error = 'code重复，但中文不一致;';
        this.intlResult.unshift(item);
        this.intlDupSet.add(item.code + item.error);
      } else if (!this.intlCodeMap.get(item.code)!.prefix && item.prefix) {
        // code一致且中文一致的，且原来没有prefix，更新prefix
        const index = this.intlResult.findIndex(i => i.code === item.code && i.d === item.d);
        this.intlResult[index] = item;
        this.intlCodeMap.set(item.code, item);
      }
      const existItem = this.intlCodeMap.get(item.code);
      if (existItem && item.path && !existItem.paths.includes(item.path)) {
        existItem.paths.push(item.path);
      }
    } else {
      // 把有错误的放在前面
      if (item.error) this.intlResult.unshift(item);
      else this.intlResult.push(item);
      this.intlCodeMap.set(item.code, item);
    }
  }

  getIntlResult() {
    const options = this.modeMap[this.mode];
    let validateFunc: Function | null;
    try {
      // eslint-disable-next-line no-new-func
      validateFunc = options.customValidate ? new Function('intlItem', options.customValidate) : null;
    } catch (e) {
      console.error('尝试创建Intl校验函数失败，请检查函数体内容！', e);
      return this.intlResult;
    }
    return this.intlResult.map(intl => {
      if (validateFunc) {
        try {
          intl.error += validateFunc({ ...intl, paths: [...intl.paths] }) || '';
        } catch (e) {
          console.error('Intl校验函数执行错误', e);
        }
      }
      return intl;
    });
  }

  getRemoteData() {
    return {
      mode: this.mode,
      prefixes: this.getPrefixes(),
      intlResult: this.getIntlResult(),
      files: this.getFiles(),
      options: this.modeMap[this.mode],
    };
  }

  /**
   * 假设path为C:\Users\Lenovo Thinkbook 16P\Desktop\Projects\o2\o2-console-share\packages\o2-product\src\routes\PlatformBrand\index.js
   * 我们需要某些文件夹名作为前缀，而且需要处理
   * 假设我们需要o2.product.platformBrand，那么prefixPattern为设为 $8{replace}[-, .].$11{toLowerCamel}
   * 其中$8代表path中的位置，即o2-product，{function}表示调用内置的工具函数
   * 这里这个replace将o2-product转化为o2.product，toLowerCamel将PlatformBrand转为小驼峰
   * 处理函数后面跟着的方括号是额外向处理函数传递的参数，写不写根据你调用的函数
   * 方括号里的字符串会以逗号split并trim处理，上面就相当于调用StringUtils.replace($9, '-', '.')
   * 注意参数数量需要是和对应函数匹配的，否则不调用。如果这个函数本身需要额外的参数却没有传递，也不会调用
   * 除了上述特殊被匹配的字符，prefixPattern中的其他字符均会保留
   */
  processAllCh(prefixPattern = '') {
    this.files.forEach(file => {
      const paths = file.path.split(/\\|\//);
      const prefix = prefixPattern.replace(
        /\$(\d+)(?:{(\w+)})?(?:\[(.+)\])?/g,
        (str, pathIndex?: string, funcName?: string, params?: string) => {
          const p = pathIndex ? paths[+pathIndex] : '';
          // 没有正确的path则直接返回匹配的字符串
          if (p) {
            // 检查传过来的funcName是否在内置的StringUtils里面
            if (funcName && StringUtils[funcName] instanceof Function) {
              if (!params) {
                // 没有写额外参数，检查这个需要调用的函数的参数数量是否为1
                if (StringUtils[funcName].length === 1) return StringUtils[funcName](p);
                else {
                  console.error(`错误: ${funcName}需要${StringUtils[funcName].length - 1}个额外参数，但并没有传递参数`);
                }
              } else {
                const args = params.split(',').map(param => param.trim());
                if (args.length === StringUtils[funcName].length - 1) return StringUtils[funcName](p, ...args);
                else
                  console.error(
                    `错误: 传给${funcName}的额外参数数量为${args.length}，应为${StringUtils[funcName].length - 1}个`
                  );
              }
            } else return p;
          } else return str;
        }
      );
      const options = { prefix, ...this.modeMap[this.mode], filepath: file.path };
      if (file.path.endsWith('vue')) transformVueCh(file, options);
      else transformCh(file, options);
    });
  }

  traverseAllIntl() {
    this.resetIntl();
    this.files.forEach(file => {
      const options = { prefix: '', ...this.modeMap[this.mode], filepath: file.path };
      if (file.path.endsWith('vue')) traverseVueIntl(file, options);
      else traverseIntl(file, options);
    });
  }

  async translateIntlItem(intlCode: string, translator: TranslateParam['name']) {
    const item = this.intlResult.find(i => i.code === intlCode);
    if (!item) return;
    const result = await translate({ from: 'zh-CN', to: 'en', text: item.d, name: translator });
    item.en_US = result?.trans.paragraphs.join('');
  }

  /** ------ 翻译相关 -------- */
  async translateAll(param: Pick<TranslateParam, 'name'>) {
    const options = this.modeMap[this.mode];
    const config = options.translatorConfigMap?.[param.name];
    if (!config) {
      console.error(`缺少${param.name}翻译源相关配置`);
      return;
    } else {
      const defaultConfig = defaultTranslatorConfigMap[param.name];
      const valid = Object.keys(defaultConfig).every(key => {
        return config[key] != null && config[key] !== '';
      });
      if (!valid) {
        console.error(`${param.name}翻译源缺少相关配置`, `请检查${Object.keys(defaultConfig).join(',')}`);
        return;
      }
    }
    for (const i of this.intlResult) {
      if (i.error) return;
      await translate({ name: param.name, config, from: 'zh-CN', to: 'en', text: i.d })
        .then(result => {
          console.log('result', result);
          if (result) i.en_US = result.trans.paragraphs.join('');
          // 检查一下翻译后是否丢失了变量占位符
          const intlVarPlaceholder = i.d.match(/{[a-zA-Z0-9]+}/g);
          if (intlVarPlaceholder && result) {
            intlVarPlaceholder.forEach(p => {
              if (!i.en_US?.includes(p)) {
                i.error += `翻译后缺失变量占位符${p}；`;
              }
            });
          }
        })
        .catch(e => {
          console.error(`翻译"${i.code}"时发生错误`, e.message);
        });
    }
  }
  /** ------ 翻译相关 -------- */
}
export const manager = new Manager();
