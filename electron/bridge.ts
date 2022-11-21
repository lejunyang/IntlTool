/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-01-20 10:11:01
 * @LastEditTime: 2022-11-18 18:09:24
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\electron\bridge.ts
 */
import { contextBridge, ipcRenderer } from 'electron';
import { Event, ProcessFile } from './types';

export const api = {
  emit: (event: Event, data?: any) => {
    ipcRenderer.send(event, data);
  },

  emitSync: (event: Event, data?: any) => {
    ipcRenderer.sendSync(event, data);
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
