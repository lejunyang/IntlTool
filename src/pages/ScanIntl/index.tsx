/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-01-29 14:24:21
 * @LastEditTime: 2022-05-16 23:30:15
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\src\pages\ScanIntl\index.tsx
 */
import { Table, Tooltip, Form, Select, Input } from 'antd';
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
      copy(record[key]);
    },
  };
};

const filePathRender = (path: string) => {
  return (
    <span>
      <a onClick={() => window.Main.emit(Event.LaunchEditor, path)}>
        {path}
      </a>
    </span>
  );
};

const errorRender = (text: string, record: IntlRecord) => {
  return (
    <Tooltip title={filePathRender(record.path)}>
      <span className={record.error ? 'error-intl-table-cell' : ''}>{text}</span>
    </Tooltip>
  );
};

const Intl: FC<Pick<AppState, 'pageData'>> = ({ pageData, pageData: { files } }) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, update] = useState(1); // 用于刷新页面
  const [form] = Form.useForm();
  const data = files.flatMap(file => {
    const { excludedPrefixes = [], prefix = '', get = '', d = '' } = form.getFieldsValue(true);
    return file.intlResult.filter(
      item =>
        (!item.prefix || !excludedPrefixes.includes(item.prefix)) &&
        (item.prefix || '').includes(prefix) &&
        item.get.includes(get) &&
        item.d.includes(d)
    );
  });
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
      title: '中文',
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

  return (
    <div className="page-wrapper">
      <Button
        onClick={async () => {
          const files = window.Main.emitSync(Event.ScanIntlSync);
          console.log('ScanIntlSync files', files);
          pageData.files = files;
        }}
      >
        开始扫描
      </Button>
      <div className="flex gap-normal">
        <Form form={form} name="query-fields" className="flex-1" layout="inline" initialValues={{ excludedPrefixes: ['hzero.common'] }}>
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
          <Form.Item name="d" label="中文">
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
        title={() => <strong title="单元格双击可以复制">Intl扫描结果</strong>}
        columns={columns}
        dataSource={data}
        rowSelection={rowSelection}
      />
    </div>
  );
};

export default Intl;
