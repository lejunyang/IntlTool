/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-01-20 10:11:01
 * @LastEditTime: 2022-06-06 13:49:25
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\src\App.tsx
 */
import { useEffect } from 'react';
import ProLayout, { RouteContext, RouteContextType } from '@ant-design/pro-layout';
import { notification, Tooltip, Spin, Modal, Select } from 'antd';
import { useReactive } from 'ahooks';
import getSettings from './pageSettings';
import './styles/index.less';
import { AppState } from './@types/index';
import { Event, Message, Mode } from '../electron/types';

const cacheMenus = (() => {
  const menus = [],
    map = {};
  return (currentMenu, pageData) => {
    if (!map[currentMenu.path]) {
      map[currentMenu.path] = true;
      menus.push(currentMenu);
    }
    return menus.map(menu => {
      const Com = menu.component;
      return (
        // 这些页面不能包裹memo，因为只传了pageData过去，修改子项无法引起更新
        <div className={currentMenu.path === menu.path ? '' : 'hide'} key={menu.path}>
          {Com && <Com pageData={pageData} />}
        </div>
      );
    });
  };
})();

export function App() {
  const state = useReactive<AppState>({
    pathname: '/manage/file',
    pageData: {
      processing: true,
      intlPrefixPattern: '',
      existedIntlData: '',
      remoteData: {
        mode: Mode.HzeroIntlReact,
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
        console.log(data.type, data.message);
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
            <Select
              value={state.pageData.remoteData.mode}
              onChange={value => {
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
              options={[
                { label: 'Hzero-Intl', value: Mode.HzeroIntlReact },
                { label: 'Vue-i18n', value: Mode.VueI18N },
                { label: 'Umi-Intl', value: Mode.UmiIntlReact }
              ]} />
          </div>
        )}
        location={{
          pathname: state.pathname,
        }}
        menuItemRender={(item, dom) => (
          <Tooltip title={item.tooltip} placement="topRight" mouseEnterDelay={0.2}>
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
            return (
              <Spin spinning={state.pageData.processing}>
                {cacheMenus(value.currentMenu, state.pageData)}
              </Spin>
            );
          }}
        </RouteContext.Consumer>
      </ProLayout>
    </div>
  );
}
