/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-01-29 14:24:21
 * @LastEditTime: 2022-05-16 18:03:03
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\src\pages\ScanIntl\index.tsx
 */
import { Table, Tooltip } from 'antd';
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

const errorRender = (text: string, record: IntlRecord) => {
  return (
    <Tooltip title={record.error ? `${record.path}: ${record.error}` : null}>
      <span className={record.error ? 'error-intl-table-cell' : ''}>{text}</span>
    </Tooltip>
  );
};

const Intl: FC<Pick<AppState, 'pageData'>> = ({ pageData, pageData: { files } }) => {
  const data = files.flatMap(file => file.intlResult);
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
