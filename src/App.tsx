/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-01-20 10:11:01
 * @LastEditTime: 2022-05-19 19:26:11
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\src\App.tsx
 */
import { useEffect } from 'react';
import ProLayout, { RouteContext, RouteContextType } from '@ant-design/pro-layout';
import { notification } from 'antd';
import { useReactive, useDebounceEffect } from 'ahooks';
import config from './pageSettings';
import './styles/index.less';
import { AppState } from './@types/index';
import { Event, Message } from '../electron/types';

export function App() {
  const state = useReactive<AppState>({
    pathname: '/manage/file',
    pageData: {
      files: [],
      processing: false,
      fileTransfering: true,
      intlPrefixPattern: '$9{replace}[-, .]$12{toLowerCamel}',
      remoteData: {
        prefixes: [],
        intlResult: [],
        allowedFileSuffix: [],
        excludedPaths: [],
      },
    },
  });

  // 订阅更新数据的事件
  useEffect(() => {
    return window.Main.on(Event.UpdateRemoteData, data => {
      state.pageData.remoteData = data;
    });
  }, []);

  // 订阅消息提醒的事件
  useEffect(() => {
    return window.Main.on(Event.Message, (data: Message) => {
      if (notification[data?.type]) {
        notification[data.type](data);
      }
    });
  }, []);

  useDebounceEffect(
    () => {
      if (state.pageData.fileTransfering) {
        state.pageData.files = window.Main.getFiles();
        state.pageData.fileTransfering = false;
        console.log('files', state.pageData.files);
      }
    },
    [state.pageData.fileTransfering],
    { wait: 1000 }
  );

  useEffect(() => {
    window.Main.emit(Event.GetRemoteData);
  }, []);

  return (
    <div style={{ height: '100vh' }}>
      <ProLayout
        {...config}
        location={{
          pathname: state.pathname,
        }}
        menuItemRender={(item, dom) => (
          <a
            onClick={() => {
              state.pathname = item.path || '/manage';
            }}
          >
            {dom}
          </a>
        )}
      >
        <RouteContext.Consumer>
          {(value: RouteContextType) => {
            const Component = value.currentMenu?.component;
            if (Component) {
              return <Component pageData={state.pageData} />;
            }
          }}
        </RouteContext.Consumer>
      </ProLayout>
    </div>
  );
}
