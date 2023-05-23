/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-11-21 15:51:16
 * @LastEditTime: 2022-11-21 15:52:37
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\src\utils\render.tsx
 */
import React from 'react';
import { notification } from 'antd';
import { copy } from '.';
import { Event } from '../../electron/types';

export function filePathRender(path: string | undefined | null, copyContent?: string) {
  return (
    <a
      style={{
        display: 'block',
      }}
      onClick={() => {
        if (copyContent && copy(copyContent)) notification.success({ message: `已复制 ${copyContent}` });
        if (path) window.Main.emit(Event.LaunchEditor, path);
      }}
    >
      {path}
    </a>
  );
}
