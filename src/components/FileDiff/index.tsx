/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-05-27 15:41:11
 * @LastEditTime: 2022-11-17 11:38:40
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\src\components\FileDiff\index.tsx
 */
import { Button, Modal } from 'antd';
import { useState, FC, memo } from 'react';
import { parseDiff, Diff } from 'react-diff-view';
import { Event, ProcessFile } from '../../../electron/types';
import { FileTextOutlined } from '@ant-design/icons';
import 'react-diff-view/style/index.css';
import './index.less';

const FileDiff: FC<{ file: ProcessFile; showContent: boolean; outputFormat: 'split' | 'unified' }> = ({
  file,
  showContent,
  outputFormat = 'split',
}) => {
  const [show, setShow] = useState(showContent);
  const diffFiles = show && parseDiff(file.diffPatchOfChTransform, { nearbySequences: 'zip' });
  const renderFile = ({ newPath, type, hunks }) => (
    <Diff key={newPath} viewType={outputFormat} diffType={type} hunks={hunks}></Diff>
  );
  return (
    <div className="file-diff">
      <div
        className="file-diff-header cursor-pointer"
        title={show ? '点击折叠' : '点击展开'}
        onClick={() => {
          setShow(!show);
        }}
      >
        <div
          className="flex gap-small item-center"
          title={file.path}
          style={{ maxWidth: 'calc(100% - 198px)' }}
        >
          <FileTextOutlined />
          <div className="text-ellipsis">{file.path}</div>
        </div>
        <div className="file-diff-buttons" title="">
          <Button
            size="small"
            onClick={e => {
              e.stopPropagation();
              Modal.info({
                title: '替换前包含中文的表达式',
                content: (
                  <ul style={{ paddingInlineStart: 20 }}>
                    {file.chTransformed
                      .split('$||$')
                      .filter(i => i.trim())
                      .map(i => (
                        <li>{i}</li>
                      ))}
                  </ul>
                ),
              });
            }}
          >
            查看
          </Button>
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
export default memo(FileDiff);
