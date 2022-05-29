/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-01-25 11:01:11
 * @LastEditTime: 2022-05-29 15:50:46
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\src\pages\ProcessCh\index.tsx
 */
import { Button, Input, Radio, Modal } from 'antd';
import { useState, FC } from 'react';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { Event } from '../../../electron/types';
import FileDiff from '../../components/FileDiff';
import { AppState } from '../../@types';

const options = [
  { label: 'side-by-side', value: 'split' },
  { label: 'line-by-line', value: 'unified' },
];

const ProcessCh: FC<Pick<AppState, 'pageData'>> = ({
  pageData,
  pageData: {
    intlPrefixPattern,
    remoteData: { files },
  },
}) => {
  const [outputFormat, setOutputFormat] = useState<'split' | 'unified'>('split');

  const transformedFiles = files.filter(file => file.isChTransformed);

  return (
    <div className="page-wrapper">
      <div className="line-input-button">
        <Input
          addonBefore="PrefixPattern"
          addonAfter={
            <Button
              type="text"
              // 不设置这些，按钮会把addon撑高，而比输入框高一点
              style={{ height: '100%', border: 'none' }}
              onClick={() => {
                Modal.info({
                  content: String.raw`假设path为C:\Users\Lenovo Thinkbook 16P\Desktop\Projects\o2\o2-console-share\packages\o2-product\src\routes\PlatformBrand\index.js
我们需要某些文件夹名作为前缀，而且需要处理
假设我们需要o2.product.platformBrand，那么prefixPattern为设为 $9{replace}[-, .]$12{toLowerCamel}
其中$9代表path中的位置，即o2-product，{function}表示调用内置的工具函数s
这里这个replace将o2-product转化为o2.product，toLowerCamel将PlatformBrand转为小驼峰
处理函数后面跟着的方括号是额外向处理函数传递的参数，写不写根据你调用的函数
方括号里的字符串会以逗号split并trim处理，上面就相当于调用StringUtils.replace($9, '-', '.')
注意参数数量需要是和对应函数匹配的，否则不调用。如果这个函数本身需要额外的参数却没有传递，也不会调用
除了上述特殊被匹配的字符，prefixPattern中的其他字符均会保留`,
                });
              }}
            >
              <QuestionCircleOutlined />
            </Button>
          }
          value={intlPrefixPattern}
          onChange={e => {
            pageData.intlPrefixPattern = e.target.value;
          }}
        />
        <Button
          onClick={() => {
            pageData.processing = true;
            window.Main.emit(Event.StartProcessCh, intlPrefixPattern);
          }}
        >
          开始扫描
        </Button>
        {!!transformedFiles.length && (
          <Button
            onClick={() => {
              Modal.confirm({
                content: '确定全部替换？',
                onOk: () => {
                  pageData.processing = true;
                  window.Main.emit(Event.ReplaceAllProcessedFile);
                },
              });
            }}
          >
            全部替换
          </Button>
        )}
      </div>
      {!!transformedFiles.length && (
        <div>
          <Radio.Group
            options={options}
            onChange={e => {
              setOutputFormat(e.target.value);
            }}
            value={outputFormat}
            optionType="button"
          />
        </div>
      )}
      {transformedFiles.map((file, index) => (
        <FileDiff file={file} showContent={index < 5} key={file.path} outputFormat={outputFormat} />
      ))}
    </div>
  );
};

export default ProcessCh;
