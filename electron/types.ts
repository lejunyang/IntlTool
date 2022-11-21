/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-01-14 17:23:24
 * @LastEditTime: 2022-11-18 18:02:31
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
  content: string
  path: string;
  uid: string;
};

export type TransferFile = BasicFile & {
  chTransformedContent?: string;
  diffPatchOfChTransform?: string;
  chOriginalItems: ({ start: number | null | undefined, end: number | null | undefined, str: string })[];
  chTransformedItems: string[]; // 转换后的代码
  chTransformedInfo?: ({ original: string, replace: string })[]; // 用给前端表格展示的
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
