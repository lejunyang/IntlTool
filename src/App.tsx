/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-01-20 10:11:01
 * @LastEditTime: 2022-02-11 17:38:52
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
import { Event } from '../electron/types';

export function App() {
  const state = useReactive<AppState>({
    pathname: '/manage',
    pageData: {
      files: [],
      processing: false,
      downloading: true,
      intlPrefixPattern: '$9{replace}[-, .]$12{toLowerCamel}',
      remoteData: {
        prefixes: [],
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
    return window.Main.on(Event.Message, data => {
      if (notification[data?.type]) {
        notification[data.type](data);
      }
    });
  }, []);

  useDebounceEffect(
    () => {
      if (state.pageData.downloading) {
        state.pageData.files = window.Main.getFiles();
        state.pageData.downloading = false;
        console.log('files', state.pageData.files);
      }
    },
    [state.pageData.downloading],
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
