/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-01-20 10:11:01
 * @LastEditTime: 2022-11-18 16:49:24
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\src\App.tsx
 */
import { useEffect } from 'react';
import ProLayout, { RouteContext, RouteContextType } from '@ant-design/pro-layout';
import { InfoCircleOutlined } from '@ant-design/icons';
import { notification, Tooltip, Spin, Modal, Select } from 'antd';
import { useReactive } from 'ahooks';
import getSettings from './pageSettings';
import './styles/index.less';
import { AppState } from './@types/index';
import { Event, Message, Mode } from '../electron/types';

const cacheMenus = (() => {
  const menus = [] as any[],
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
      existedIntlData: {},
      remoteData: {
        mode: Mode.HzeroIntlReact,
        files: [],
        prefixes: [],
        intlResult: [],
        options: {
          nameMap: { l1: 'intl', l2: 'get', l3: 'd' },
          allowedFileSuffix: ['.js', '.ts', '.tsx', '.jsx'],
          excludedPaths: ['node_modules', 'lib'],
          formatAfterTransform: true,
          commonIntlData: {},
        }
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
    <div style={{ height: '100vh' }} spellCheck={false}>
      <ProLayout
        {...getSettings(state)}
        menuExtraRender={() => (
          <div className="flex item-center">
            <div>模式：</div>
            <Select
              disabled={state.pageData.processing}
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
            <Tooltip title="模式间的区别">
              <InfoCircleOutlined style={{ marginLeft: 10 }} onClick={() => {
                Modal.info({
                  width: 920,
                  content: <pre>
                    Hzero Intl格式，即intl.get(code, params).d()，其导出格式为csv，默认开启requirePrefix<br />
                    Vue i18n格式，intl(code, params).d()或this.intl().d()，导出格式为JSON<br />
                    Umi Intl格式，目前并没有直接支持其intl.formatMessage格式，而是需要通过工具函数改为intl.get.d，其导出格式为JS对象
                  </pre>
                })
              }} />
            </Tooltip>
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
