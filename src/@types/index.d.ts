/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-01-27 09:41:34
 * @LastEditTime: 2022-05-25 19:27:36
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\src\@types\index.d.ts
 */
import { TransferFile, IntlResult, Mode } from '../../electron/types';

export type AppState = {
  pathname: string;
  pageData: {
    processing: boolean;
    intlPrefixPattern: string; // ProcessCh使用
    existedIntlData: any;
    remoteData: {
      mode: Mode;
      prefixes: string[]; // Intl使用
      intlResult: IntlResult; // Intl使用
      allowedFileSuffix: string[]; // 文件使用
      excludedPaths: string[]; // 文件使用
      files: TransferFile[]; // Manage用
      commonIntlData: object;
    };
  };
};
