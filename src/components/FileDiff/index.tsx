/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-05-27 15:41:11
 * @LastEditTime: 2022-05-27 18:04:13
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\src\components\FileDiff\index.tsx
 */
import { Button, Modal } from 'antd';
import { useState, FC } from 'react';
import { parseDiff, Diff } from 'react-diff-view';
import { Event, ProcessFile } from '../../../electron/types';
import { FileTextOutlined } from '@ant-design/icons';
import 'react-diff-view/style/index.css';

const FileDiff: FC<{ file: ProcessFile; showContent: boolean }> = ({ file, showContent }) => {
  const [show, setShow] = useState(showContent);
  const diffFiles = show && parseDiff(file.diffPatchOfChTransform, { nearbySequences: 'zip' });
  const renderFile = ({ newPath, type, hunks }) => (
    <Diff key={newPath} viewType="split" diffType={type} hunks={hunks}></Diff>
  );
  return (
    <div className="file-diff">
      <div
        className="file-diff-header cursor-pointer"
        onClick={() => {
          setShow(!show);
        }}
      >
        <div
          className="flex gap-small item-center"
          title={show ? '点击折叠' : '点击展开'}
          style={{ maxWidth: 'calc(100% - 160px)' }}
        >
          <FileTextOutlined />
          <div className="text-ellipsis">{file.path}</div>
        </div>
        <div className="file-diff-buttons">
          <Button
            size="small"
            onClick={e => {
              e.stopPropagation();
              Modal.confirm({
                content: '确定替换该文件内容？',
                onOk: () => {
                  window.Main.emit(Event.ReplaceProcessedFile, file.uid);
                },
              });
            }}
          >
            替换
          </Button>
          <Button
            size="small"
            onClick={e => {
              e.stopPropagation();
              window.Main.emit(Event.LaunchEditor, file.path);
            }}
          >
            打开该文件
          </Button>
        </div>
      </div>
      <div>{show && diffFiles.map(renderFile)}</div>
    </div>
  );
};
export default FileDiff;
