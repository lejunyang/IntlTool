/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-01-20 10:11:01
 * @LastEditTime: 2022-01-26 14:56:34
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\src\@types\bridge.d.ts
 */
import { api } from '../../electron/bridge';

declare global {
  // eslint-disable-next-line
  interface Window {
    Main: typeof api;
  }
}
