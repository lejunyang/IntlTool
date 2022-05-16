/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-01-25 10:52:47
 * @LastEditTime: 2022-02-11 17:28:17
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\src\pageSettings.tsx
 */
import type { BasicLayoutProps } from '@ant-design/pro-layout/lib/BasicLayout';
import { SlidersOutlined, ItalicOutlined } from '@ant-design/icons';
import Manage from './pages/Manage';
import ProcessCh from './pages/ProcessCh';
import ManagePrefixes from './pages/ManagePrefixes';
import ScanIntl from './pages/ScanIntl';

export default {
  title: 'Tool',
  navTheme: 'light',
  menu: { defaultOpenAll: true, ignoreFlatMenu: true },
  route: {
    path: '/',
    routes: [
      {
        path: '/manage',
        name: '文件管理',
        component: Manage,
        icon: <SlidersOutlined />,
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
          },
          {
            path: '/intl/process-ch',
            name: '处理中文',
            component: ProcessCh,
          },
          {
            path: '/intl/scan',
            name: '扫描Intl',
            component: ScanIntl,
          },
        ],
      },
    ],
  },
  location: {
    pathname: '/manage',
  },
} as BasicLayoutProps;
