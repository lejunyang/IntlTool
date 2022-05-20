/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-01-25 11:01:11
 * @LastEditTime: 2022-05-19 22:08:09
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\src\pages\ManageFiles\index.tsx
 */
import { FC } from 'react';
import { Button } from 'antd';
// import { InboxOutlined } from '@ant-design/icons';
// import { DraggerProps } from 'antd/lib/upload';
// import { pick, debounce } from 'lodash';
import { AppState } from '../../@types';
import { Event } from '../../../electron/types';
import FileItem from './FileItem';

const Manage: FC<Pick<AppState, 'pageData'>> = props => {
  const {
    pageData,
    pageData: {
      remoteData: { files },
    },
  } = props;

  // const draggerProps: DraggerProps = {
  //   multiple: true,
  //   directory: true,
  //   accept: '.js,.ts,.jsx,.tsx',
  //   fileList: [], // 取消它自己的文件管理
  //   // beforeUpload返回false的话，那次触发的onChange file没有path和type
  //   // 如果选了多个文件，会依次触发onChange，只有最后一次onChange是全部的
  //   beforeUpload: file => {
  //     // Object.getOwnPropertyNames(file), file上它自己的属性只有uid。。。，直接这样传过去就没有其他属性了，需要复制
  //     // window.Main.sendFile(file);
  //     window.Main.addFile(pick(file, ['uid', 'name', 'path']));
  //     fetch();
  //     return false;
  //   },
  // };

  return (
    <div className="page-wrapper">
      <Button
        onClick={() => {
          window.Main.emit(Event.SelectFile, true);
          pageData.processing = true;
        }}
      >
        选择文件夹
      </Button>
      <Button
        onClick={() => {
          window.Main.emit(Event.SelectFile);
          pageData.processing = true;
        }}
      >
        选择文件
      </Button>
      {/* <Upload.Dragger {...draggerProps}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">点击选择或拖动至此</p>
        <p className="ant-upload-hint">点击上传只支持文件夹，拖动支持文件和文件夹</p>
      </Upload.Dragger> */}
      {!!files.length && (
        <Button
          onClick={() => {
            window.Main.emit(Event.ResetFiles);
            pageData.processing = true;
          }}
        >
          全部清空
        </Button>
      )}
      {!!files.length && (
        <Button
          onClick={() => {
            window.Main.emit(Event.RefreshFiles);
            pageData.processing = true;
          }}
        >
          刷新文件内容
        </Button>
      )}
      {files.map(file => (
        <FileItem file={file} pageData={pageData} key={file.uid} />
      ))}
    </div>
  );
};
export default Manage;
