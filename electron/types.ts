/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-01-14 17:23:24
 * @LastEditTime: 2022-02-11 17:59:10
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\electron\types.ts
 */
import type { ParseResult as BabelParseResult } from '@babel/parser';
import type { File as BabelFile } from '@babel/types';
// import { RcFile } from 'antd/lib/upload';

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
  intlResult?: IntlResult;
  path?: string;
};

export type ParseResult = BabelParseResult<BabelFile> & {
  parseError?: string;
};

export type BasicFile = {
  name: string;
  path: string;
  uid: string;
};

export type TransferFile = BasicFile & {
  content: string;
  chTransformedContent?: string;
  diffPatchOfChTransform?: string;
  parseError?: string;
  intlResult?: IntlResult;
};

export type ProcessFile = TransferFile &
  State & {
    parseResult?: ParseResult;
  };

export enum Event {
  GetRemoteData = 'get-remote-data',
  UpdateRemoteData = 'update-remote-data',
  AddFile = 'add-file',
  RemoveFile = 'remove-file',
  StartProcessCh = 'start-process-ch',
  ProcessChEnd = 'process-ch-end',
  GetFilesSync = 'get-files-sync',
  ScanIntlSync = 'scan-intl',
  SetPrefixes = 'set-prefixes',
  Message = 'message', // 后端向前端发送消息
  LaunchEditor = 'launch-editor', // 打开编辑器
}
