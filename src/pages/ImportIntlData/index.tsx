/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-06-06 14:02:59
 * @LastEditTime: 2022-06-06 15:06:51
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\src\pages\ImportIntlData\index.tsx
 */
import { useState, FC } from 'react';
import { Button, Input, notification } from 'antd';
import { AppState } from '../../@types';
import { Mode } from '../../../electron/types';

const TextArea = Input.TextArea;
const ImportIntlData: FC<Pick<AppState, 'pageData'>> = ({
  pageData,
  pageData: {
    existedIntlData,
    remoteData: { mode },
  },
}) => {
  const [input, setInput] = useState(existedIntlData);
  return (
    <div className="page-wrapper" spellCheck={false}>
      设置已经整理的Intl数据，设置之后在扫描Intl中将会与该数据合并导出
      当前模式的数据格式为：
      {mode === Mode.VueI18N && `{ "common": { "text": "中文" } }`}
      {mode === Mode.UmiIntlReact && `{ 'code.code1': '中文{var}', 'code.code2': '中文', }`}
      <TextArea
        autoSize={{ minRows: 5 }}
        value={input}
        onChange={e => {
          setInput(e.target.value);
        }}
      />
      <Button
        onClick={() => {
          let inputProcessed = input.trim();
          switch (mode) {
            case Mode.VueI18N:
              if (!inputProcessed.startsWith('{') || !inputProcessed.endsWith('}')) {
                notification.error({ message: '格式错误' });
                return;
              }
              try {
                const intlData = JSON.parse(inputProcessed);
                pageData.existedIntlData = intlData;
              } catch (e) {
                notification.error({ message: '格式错误', description: e.toString() });
                console.error(e);
              }
              break;
            case Mode.UmiIntlReact:
              try {
                if (inputProcessed.startsWith('{') && inputProcessed.endsWith('}')) inputProcessed = `(${inputProcessed})`; // 对象需要套一层括号，否则会被eval认为是代码块
                else {
                  notification.error({ message: '格式错误' });
                  return;
                }
                // eslint-disable-next-line no-eval
                const intlData = eval(inputProcessed)
                if (intlData === 'null' || typeof intlData !== 'object') {
                  notification.error({ message: '格式错误' });
                  return;
                }
                pageData.existedIntlData = intlData;
              } catch (e) {
                notification.error({ message: '格式错误', description: e.toString() });
                console.error(e);
              }
              break;
          }
        }}
      >
        设置
      </Button>
      <div>
        {JSON.stringify(existedIntlData)}
      </div>
    </div>
  );
};

export default ImportIntlData;
