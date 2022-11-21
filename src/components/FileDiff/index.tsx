/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-05-27 15:41:11
 * @LastEditTime: 2022-11-21 14:36:38
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\src\components\FileDiff\index.tsx
 */
import { Button, Modal, Table } from 'antd';
import { useState, FC, memo, useMemo } from 'react';
import { parseDiff, Diff } from 'react-diff-view';
import { Event, ProcessFile } from '../../../electron/types';
import { FileTextOutlined } from '@ant-design/icons';
import 'react-diff-view/style/index.css';
import './index.less';

const FileDiff: FC<{ file: ProcessFile; showContent: boolean; outputFormat: 'split' | 'unified' | 'table' }> = ({
  file,
  showContent,
  outputFormat = 'split',
}) => {
  const [show, setShow] = useState(showContent);
  const diffFiles = useMemo(
    () => parseDiff(file.diffPatchOfChTransform, { nearbySequences: 'zip' }),
    [file.diffPatchOfChTransform]
  );
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
        <div className="flex gap-small item-center" title={file.path} style={{ maxWidth: 'calc(100% - 160px)' }}>
          <FileTextOutlined />
          <div className="text-ellipsis">{file.path}</div>
        </div>
        <div className="file-diff-buttons" title="">
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
      <div>{show && outputFormat !== 'table' && diffFiles.map(renderFile)}</div>
      {outputFormat === 'table' && show && (
        <div>
          <Table
            dataSource={file.chTransformedInfo}
            columns={[
              { dataIndex: 'original', title: '替换前' },
              { dataIndex: 'replace', title: '替换后' },
            ]}
            pagination={{
              showTotal: total => `共 ${total} 条`,
            }}
          />
        </div>
      )}
    </div>
  );
};
export default memo(FileDiff);
