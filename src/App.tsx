/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-01-20 10:11:01
 * @LastEditTime: 2022-05-25 21:42:19
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\src\App.tsx
 */
import { useEffect } from 'react';
import ProLayout, { RouteContext, RouteContextType } from '@ant-design/pro-layout';
import { notification, Tooltip, Spin, Radio, Modal } from 'antd';
import { useReactive } from 'ahooks';
import getSettings from './pageSettings';
import './styles/index.less';
import { AppState } from './@types/index';
import { Event, Message } from '../electron/types';

export function App() {
  const state = useReactive<AppState>({
    pathname: '/manage/file',
    pageData: {
      processing: true,
      intlPrefixPattern: '$9{replace}[-, .]$12{toLowerCamel}',
      remoteData: {
        mode: 'React',
        files: [],
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
      console.log('UpdateRemoteData', data);
      state.pageData.remoteData = data;
      state.pageData.processing = false;
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

  useEffect(() => {
    window.Main.emit(Event.GetRemoteData);
  }, []);

  return (
    <div style={{ height: '100vh' }}>
      <ProLayout
        {...getSettings(state)}
        menuExtraRender={() => (
          <div className="flex item-center">
            <div>模式：</div>
            <Radio.Group
              value={state.pageData.remoteData.mode}
              disabled={state.pageData.processing}
              onChange={({ target: { value } }) => {
                const change = () => {
                  state.pageData.processing = true;
                  window.Main.emit(Event.SwitchMode, value);
                  state.pageData.remoteData.mode = value;
                };
                if (state.pageData.remoteData.files.length) {
                  Modal.confirm({
                    title: '切换模式后会清空当前数据，是否确定？',
                    onOk: change,
                  });
                } else change();
              }}
              optionType="button"
              options={[
                { label: 'React', value: 'React' },
                { label: 'Vue', value: 'Vue' },
              ]}
            />
          </div>
        )}
        location={{
          pathname: state.pathname,
        }}
        menuItemRender={(item, dom) => (
          <Tooltip title={item.tooltip} placement="topRight">
            <a
              onClick={() => {
                state.pathname = item.path || '/manage/file';
              }}
            >
              {dom}
            </a>
          </Tooltip>
        )}
      >
        <RouteContext.Consumer>
          {(value: RouteContextType) => {
            const Component = value.currentMenu?.component;
            if (Component) {
              return (
                <Spin spinning={state.pageData.processing}>
                  <Component pageData={state.pageData} />
                </Spin>
              );
            }
          }}
        </RouteContext.Consumer>
      </ProLayout>
    </div>
  );
}
