/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-01-25 10:52:47
 * @LastEditTime: 2022-06-08 14:58:20
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\src\pageSettings.tsx
 */
import type { BasicLayoutProps } from '@ant-design/pro-layout/lib/BasicLayout';
import { SlidersOutlined, ItalicOutlined } from '@ant-design/icons';
import ManageFiles from './pages/ManageFiles';
import ProcessCh from './pages/ProcessCh';
import ManagePrefixes from './pages/ManagePrefixes';
import ScanIntl from './pages/ScanIntl';
import { AppState } from './@types/index';
import ManageOption from './pages/ManageOption';
import ImportIntlData from './pages/ImportIntlData';

/**
 * 生成ProLayout的属性设置
 */
export default (state: AppState) =>
  ({
    title: 'Intl Tool',
    navTheme: 'light',
    menu: { defaultOpenAll: true, ignoreFlatMenu: true },
    route: {
      path: '/',
      routes: [
        {
          path: '/manage',
          name: '基础设置',
          icon: <SlidersOutlined />,
          routes: [
            {
              path: '/manage/file',
              name: '文件管理',
              component: ManageFiles,
              tooltip: '管理已经选择的文件，后续的处理均是对此处选择的文件进行处理，可以多次选择或者重复选择',
            },
            {
              path: '/manage/options',
              name: '选项设置',
              component: ManageOption,
            },
          ],
        },
        {
          path: '/intl',
          name: '处理Intl',
          icon: <ItalicOutlined />,
          routes: [
            {
              path: '/intl/manage-prefixes',
              name: '设置前缀',
              component: ManagePrefixes,
              tooltip: '为intl.get设置前缀，以便于扫描后的结果统计，在扫描Intl前设置才有效',
              hide: !state.pageData.remoteData.options.requirePrefix,
            },
            {
              path: '/intl/import-intl',
              name: '导入已有Intl数据',
              component: ImportIntlData,
              tooltip: '导入已有的Intl数据，在扫描Intl中导出时会与该数据合并',
            },
            {
              path: '/intl/scan',
              name: '扫描Intl',
              component: ScanIntl,
            },
            {
              path: '/intl/process-ch',
              name: '中文转Intl',
              component: ProcessCh,
              tooltip: '扫描代码中的中文，将其替换为intl格式',
            },
          ].filter(r => r.hide === undefined || !r.hide),
        },
      ],
    },
    location: {
      pathname: '/manage/file',
    },
  } as BasicLayoutProps);
