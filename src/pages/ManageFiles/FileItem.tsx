/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-01-28 14:56:29
 * @LastEditTime: 2022-05-19 21:00:34
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\src\pages\ManageFiles\FileItem.tsx
 */
import { FC } from 'react';
import { Popconfirm, Button } from 'antd';
import { LinkOutlined, DeleteOutlined } from '@ant-design/icons';
import { Event, TransferFile } from '../../../electron/types';
import { AppState } from '../../@types';

const FileItem: FC<Pick<AppState, 'pageData'> & { file: TransferFile }> = ({ file, pageData }) => {
  const { path } = file;
  return (
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
            onClick={() => window.Main.emit(Event.LaunchEditor, path)}
          >
            {path}
          </a>
          <span className="ant-upload-list-item-card-actions">
            <Popconfirm
              title="确定删除？"
              onConfirm={() => {
                window.Main.removeFile(file);
                pageData.processing = true;
              }}
            >
              <Button title="删除文件" type="text" size="small">
                <DeleteOutlined />
              </Button>
            </Popconfirm>
          </span>
        </span>
      </div>
    </div>
  );
};

export default FileItem;
