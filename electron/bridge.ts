/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-01-20 10:11:01
 * @LastEditTime: 2022-05-19 22:17:46
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\electron\bridge.ts
 */
import { contextBridge, ipcRenderer } from 'electron';
import { Event, BasicFile, ProcessFile } from './types';

export const api = {
  emit: (event: Event, data?: any) => {
    // JSON转换一次，因为如果直接传输Proxy会报错
    if (data) ipcRenderer.send(event, JSON.parse(JSON.stringify(data)));
    else ipcRenderer.send(event)
  },

  emitSync: (event: Event, data?: any) => {
    if (data) ipcRenderer.sendSync(event, JSON.parse(JSON.stringify(data)));
    else ipcRenderer.sendSync(event);
  },

  addFile: (file: BasicFile) => {
    ipcRenderer.send(Event.AddFile, file);
  },

  getFiles: (): ProcessFile[] => {
    return ipcRenderer.sendSync(Event.GetFilesSync);
  },

  /**
   * 在渲染进程上注册监听函数
   * @param channel
   * @param callback
   * @returns 返回用于取消监听的函数
   */
  on: (channel: Event, callback: Function) => {
    const listener = (_: any, data: any) => callback(data);
    ipcRenderer.on(channel, listener);
    return () => {
      ipcRenderer.off(channel, listener);
    };
  },
};

contextBridge.exposeInMainWorld('Main', api);
