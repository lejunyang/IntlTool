/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-01-25 11:01:11
 * @LastEditTime: 2022-05-19 11:39:29
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\src\pages\Manage\index.tsx
 */
import { FC } from 'react';
import { Upload } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { DraggerProps } from 'antd/lib/upload';
import { pick } from 'lodash';
import { AppState } from '../../@types';
import FileItem from './FileItem';

const Manage: FC<Pick<AppState, 'pageData'>> = props => {
  const {
    pageData,
    pageData: { files, processing },
  } = props;

  const draggerProps: DraggerProps = {
    multiple: true,
    directory: true,
    disabled: processing,
    accept: '.js,.ts,.jsx,.tsx',
    fileList: [], // 取消它自己的文件管理
    // beforeUpload返回false的话，那次触发的onChange file没有path和type
    // 如果选了多个文件，会依次触发onChange，只有最后一次onChange是全部的
    beforeUpload: file => {
      console.log('beforeUpload file', file);
      // console.log(
      //   'keys',
      //   Object.keys(file),
      //   'values',
      //   Object.values(file),
      //   'names',
      //   Object.getOwnPropertyNames(file)
      // );
      // file上它自己的属性只有uid。。。，直接这样传过去就没有其他属性了
      // window.Main.sendFile(file);
      window.Main.addFile(pick(file, ['uid', 'name', 'path']));
      pageData.downloading = true;
      return false;
    },
  };

  return (
    <div>
      <Upload.Dragger {...draggerProps}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">点击选择或拖动至此</p>
        <p className="ant-upload-hint">
          点击上传只支持文件夹，拖动支持文件和文件夹
        </p>
      </Upload.Dragger>
      {files.map(file => (
        <FileItem file={file} pageData={pageData} key={file.uid} />
      ))}
    </div>
  );
};
export default Manage;
