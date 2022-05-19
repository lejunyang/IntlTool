/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-01-27 09:41:34
 * @LastEditTime: 2022-01-29 15:18:00
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\src\@types\index.d.ts
 */
import { TransferFile, IntlResult } from '../../electron/types';

export type AppState = {
  pathname: string;
  pageData: {
    processing: boolean;
    fileTransfering: boolean;
    // Manage用
    files: TransferFile[];
    // ProcessCh使用
    intlPrefixPattern: string;
    remoteData: {
      prefixes: string[]; // Intl使用
      intlResult: IntlResult; // Intl使用
      allowedFileSuffix: string[]; // 文件使用
      excludedPaths: string[]; // 文件使用
    };
  };
};
