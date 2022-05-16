/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-01-28 14:56:29
 * @LastEditTime: 2022-02-11 17:24:04
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\src\pages\Manage\FileItem.tsx
 */
import { FC } from 'react';
import { Popconfirm, Spin, Button } from 'antd';
import { LinkOutlined, DeleteOutlined } from '@ant-design/icons';
import { TransferFile } from '../../../electron/types';
import { AppState } from '../../@types';

const FileItem: FC<Pick<AppState, 'pageData'> & { file: TransferFile }> = ({
  file,
  pageData: { downloading, processing },
}) => {
  const { path } = file;
  return (
    <Spin spinning={downloading}>
      <div className="ant-upload-list-item ant-upload-list-item-done ant-upload-list-item-list-type-text">
        <div className="ant-upload-list-item-info">
          <span className="ant-upload-span">
            <div className="ant-upload-text-icon">
              <LinkOutlined />
            </div>
            <a
              target="_blank"
              rel="noopener noreferrer"
              className="ant-upload-list-item-name"
              title={path}
              // 这个ant-upload-list-item-name里面有overflow省略号，但是它的宽度包含了后面的icon，直接来一个padding right
              style={{ paddingRight: '30px' }}
            >
              {path}
            </a>
            <span className="ant-upload-list-item-card-actions">
              <Popconfirm
                title="确定删除？"
                onConfirm={() => {
                  window.Main.removeFile(file);
                }}
              >
                <Button disabled={processing} title="删除文件" type="text" size="small">
                  <DeleteOutlined />
                </Button>
              </Popconfirm>
            </span>
          </span>
        </div>
      </div>
    </Spin>
  );
};

export default FileItem;
