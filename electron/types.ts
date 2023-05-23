/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-01-14 17:23:24
 * @LastEditTime: 2022-11-21 16:08:47
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\electron\types.ts
 */
import type { ParseResult as BabelParseResult } from '@babel/parser';
import type { File as BabelFile } from '@babel/types';
import type { AST } from 'vue-eslint-parser';
import type { Options as PrettierOptions } from 'prettier';

export type Message = {
  type: 'error' | 'warning' | 'success' | 'info';
  message: string;
  description?: string;
};

export type IntlItem = {
  code: string; // 完整的code
  get: string;
  d: string;
  error: string;
  prefix?: string;
  path?: string; // 当前项所在的文件路径
  paths?: string[]; // 所有该编码所在项的文件路径
};

export type IntlResult = IntlItem[];

export type StringObject = { [key: string]: string };

export type State = {
  vars?: StringObject;
  path?: string;
};

export type ParseResult = BabelParseResult<BabelFile> & {
  parseError?: string;
};

export type VueParseResult = AST.ESLintProgram & {
  parseError?: string;
};

export type BasicFile = {
  name?: string;
  content: string;
  path: string;
  uid: string;
};

export type ReplaceAction = {
  replace: string;
  original: string;
  location: string; // original的位置
  start: number | null | undefined; // original代表的字符串在文件中的索引位置
  end: number | null | undefined;
}

export type TransferFile = BasicFile & {
  chTransformedContent?: string;
  diffPatchOfChTransform?: string;
  chTransformedInfo: ReplaceAction[]; // 用给前端表格展示的
  parseError?: string;
  intlResult?: IntlResult;
};

export type ProcessFile = TransferFile &
  State & {
    parseResult?: ParseResult;
    vueParseResult?: VueParseResult;
  };

export enum Event {
  SwitchMode = 'switch-mode', // 切换模式
  GetRemoteData = 'get-remote-data',
  UpdateRemoteData = 'update-remote-data',
  // AddFile = 'add-file',
  RemoveFile = 'remove-file',
  ResetFiles = 'reset-files', // 清空文件
  RefreshFiles = 'refresh-files', // 刷新文件内容
  StartProcessCh = 'start-process-ch',
  ReplaceProcessedFile = 'replace-processed-file', // 确认更改转换过的文件内容
  ReplaceAllProcessedFile = 'replace-all-processed-file',
  GetFilesSync = 'get-files-sync',
  ScanIntl = 'scan-intl',
  ReScanIntl = 're-scan-intl', // 刷新文件并重新扫描intl
  SetPrefixes = 'set-prefixes',
  Message = 'message', // 后端向前端发送消息
  LaunchEditor = 'launch-editor', // 打开编辑器
  DownloadIntlResult = 'download-intl-result',
  SelectFile = 'select-file',
  SetCommonIntlData = 'set-common-intl-data',
  SetModeOptions = 'set-mode-options',
}

export enum Mode {
  HzeroIntlReact = 'HzeroIntlReact',
  VueI18N = 'VueI18N',
  UmiIntlReact = 'UmiIntlReact',
}

export type NameMap = {
  l1: string;
  l2: string;
  l3: string;
};

export type ModeOptions = {
  nameMap: NameMap;
  requirePrefix?: boolean;
  formatAfterTransform?: boolean;
  formatOptions?: PrettierOptions;
  commonIntlData?: object;
  allowedFileSuffix?: string[];
  excludedPaths?: string[];
};

export type IntlOptions = ModeOptions & {
  prefix: string;
  filepath: string;
};
