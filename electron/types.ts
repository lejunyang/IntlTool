/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-01-14 17:23:24
 * @LastEditTime: 2022-06-06 15:29:36
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\electron\types.ts
 */
import type { ParseResult as BabelParseResult } from '@babel/parser';
import type { File as BabelFile } from '@babel/types';
import { AST } from 'vue-eslint-parser';
import { Options as PrettierOptions } from 'prettier';

export type Message = {
  type: 'error' | 'warning' | 'success' | 'info';
  message: string;
  description?: string;
};

export type IntlItem = {
  code: string; // 完整的code
  get: string;
  d: string;
  error?: string;
  prefix?: string;
  path?: string;
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
  path: string;
  uid: string;
};

export type TransferFile = BasicFile & {
  content: string;
  chTransformedContent?: string;
  diffPatchOfChTransform?: string;
  isChTransformed?: boolean; // 因为prettier会对代码格式化，没法判断是否是改了intl，故加一个变量
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
  AddFile = 'add-file',
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
  SetAllowedFileSuffix = 'set-allowed-suffixes',
  SetExcludedPaths = 'set-excluded-paths',
  Message = 'message', // 后端向前端发送消息
  LaunchEditor = 'launch-editor', // 打开编辑器
  DownloadIntlResult = 'download-intl-result',
  SelectFile = 'select-file',
  SetCommonIntlData = 'set-common-intl-data',
}

export enum Mode {
  HzeroIntlReact = 'HzeroIntlReact',
  VueI18N = 'VueI18N',
  UmiIntlReact = 'UmiIntlReact',
}

export type NameMap = {
  l1?: string;
  l2: string;
  l3: string;
};

export type NameMapRe = {
  l1: string;
  l2: string;
  l3: string;
};

export type IntlOptions = {
  prefix: string;
  nameMap: NameMapRe;
  ignorePrefix?: boolean;
  formatAfterTransform?: boolean;
  formatOptions?: PrettierOptions;
  commonIntlData?: object;
};
