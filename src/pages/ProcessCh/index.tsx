/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-01-25 11:01:11
 * @LastEditTime: 2022-02-11 17:07:19
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\src\pages\ProcessCh\index.tsx
 */
import { Button, Input, Radio, Modal } from 'antd';
import { useEffect, useState, FC } from 'react';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { Event, TransferFile } from '../../../electron/types';
import CodeDiff from '../../components/CodeDiff';
import { AppState } from '../../@types';

const options = [
  { label: 'side-by-side', value: 'side-by-side' },
  { label: 'line-by-line', value: 'line-by-line' },
];

const ProcessCh: FC<Pick<AppState, 'pageData'>> = ({
  pageData,
  pageData: { intlPrefixPattern, processing, files },
}) => {
  const [outputFormat, setOutputFormat] = useState<'side-by-side' | 'line-by-line'>('side-by-side');

  const patch = files.reduce((result, file) => result + (file.diffPatchOfChTransform || ''), '');

  console.log('patch', patch);

  useEffect(() => {
    return window.Main.on(Event.ProcessChEnd, (_files: TransferFile[]) => {
      console.log('_files', _files);
      pageData.files = _files;
      pageData.processing = false;
    });
  }, []);
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
          disabled={processing}
          value={intlPrefixPattern}
          onChange={e => {
            pageData.intlPrefixPattern = e.target.value;
          }}
        />
        <Button
          disabled={processing}
          onClick={() => {
            pageData.processing = true;
            window.Main.emit(Event.StartProcessCh, intlPrefixPattern);
          }}
        >
          开始处理
        </Button>
      </div>
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
      <CodeDiff patch={patch} />
      {/* {files.map(file => {
        if (file.parseError) {
          return (
            <div>
              {file.path}:{file.parseError}
            </div>
          );
        } else if (!file.chTransformedContent) return null;
        return (
          <CodeDiff
            filename={file.path}
            oldStr={file.content}
            newStr={file.chTransformedContent}
            outputFormat={outputFormat}
          />
        );
      })} */}
    </div>
  );
};
export default ProcessCh;
