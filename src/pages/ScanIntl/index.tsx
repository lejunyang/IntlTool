/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-01-29 14:24:21
 * @LastEditTime: 2022-05-19 19:53:01
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\src\pages\ScanIntl\index.tsx
 */
import { Table, Tooltip, Form, Select, Input, notification } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import type { ColumnType } from 'antd/lib/table';
import { useState, FC } from 'react';
import Button from '../../components/Button';
import { Event, IntlItem } from '../../../electron/types';
import { AppState } from '../../@types';
import { copy } from '../../utils';

type IntlRecord = IntlItem & {
  path?: string;
};

const generateOnCell = (record: IntlRecord, key: keyof IntlRecord) => {
  return {
    onDoubleClick: () => {
      if (copy(record[key])) notification.success({ message: '复制成功' });
    },
  };
};

const filePathRender = (path: string) => {
  return <a onClick={() => window.Main.emit(Event.LaunchEditor, path)}>{path}</a>;
};

const errorRender = (text: string, record: IntlRecord) => {
  return (
    <Tooltip
      title={() => (
        <div>
          <div>{record.error}</div>
          {filePathRender(record.path)}
        </div>
      )}
    >
      <span className={record.error ? 'text-red' : ''}>{text || record.error}</span>
    </Tooltip>
  );
};

const Intl: FC<Pick<AppState, 'pageData'>> = ({
  pageData: {
    remoteData: { intlResult },
  },
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, update] = useState(1); // 用于刷新页面
  const [form] = Form.useForm();
  const { excludedPrefixes = ['hzero.common'], prefix = '', get = '', d = '' } = form.getFieldsValue(true);
  const data = intlResult.filter(
    item =>
      (!item.prefix || !excludedPrefixes.includes(item.prefix)) &&
      (item.prefix || '').includes(prefix) &&
      item.get.includes(get) &&
      item.d.includes(d)
  );
  console.log('data', data);
  const errorLength = data.filter(item => item.error).length;
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);

  const columns: ColumnType<IntlRecord>[] = [
    {
      dataIndex: 'prefix',
      title: '前缀',
      onCell: record => {
        return generateOnCell(record, 'prefix');
      },
      render: errorRender,
    },
    {
      dataIndex: 'get',
      title: '编码',
      onCell: record => {
        return generateOnCell(record, 'get');
      },
      render: errorRender,
    },
    {
      dataIndex: 'd',
      title: '描述',
      onCell: record => {
        return generateOnCell(record, 'd');
      },
      render: errorRender,
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys: any) => {
      setSelectedRowKeys(selectedRowKeys);
    },
  };

  const getData = () => {
    let head = `模板代码,代码,语言,描述\n`;
    for (const item of data) {
      if (!item.error) head += `${item.prefix},${item.get},zh_CN,${item.d}\n`;
    }
    return head;
  };

  return (
    <div className="page-wrapper">
      <Button
        onClick={async () => {
          window.Main.emit(Event.ScanIntl);
        }}
      >
        开始扫描
      </Button>
      <div className="flex gap-normal">
        <Form
          form={form}
          name="query-fields"
          className="flex-1 row-gap-small"
          layout="inline"
          initialValues={{ excludedPrefixes: ['hzero.common'] }}
        >
          <Form.Item name="excludedPrefixes" label="排除的前缀" style={{ width: 250 }}>
            <Select mode="tags" allowClear>
              <Select.Option value="hzero.common">hzero.common</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="prefix" label="前缀">
            <Input onPressEnter={() => update(new Date().getTime())} />
          </Form.Item>
          <Form.Item name="get" label="编码">
            <Input onPressEnter={() => update(new Date().getTime())} />
          </Form.Item>
          <Form.Item name="d" label="描述">
            <Input onPressEnter={() => update(new Date().getTime())} />
          </Form.Item>
        </Form>
        <Button
          onClick={() => {
            form.resetFields();
            update(new Date().getTime());
          }}
        >
          重置
        </Button>
        <Button onClick={() => update(new Date().getTime())}>筛选</Button>
      </div>
      <Table
        title={() => (
          <span className="flex justify-between">
            <div>
              <strong>Intl扫描结果</strong>
              <Tooltip title="单元格双击可以复制，单击路径可以跳转，需要有vscode且注册了code命令">
                <QuestionCircleOutlined />
              </Tooltip>
              <Tooltip title="导出当前筛选出的数据，并过滤含有错误的条目">
                <Button
                  onClick={() => window.Main.emit(Event.DownloadIntlResult, getData())}
                  style={{ marginLeft: 15 }}
                >
                  导出
                </Button>
              </Tooltip>
            </div>
            <div>
              总计：{data.length}条； <strong className={errorLength ? "text-red" : ''}>错误：{errorLength}条</strong>
            </div>
          </span>
        )}
        rowKey="code"
        columns={columns}
        dataSource={data}
        rowSelection={rowSelection}
      />
    </div>
  );
};

export default Intl;
