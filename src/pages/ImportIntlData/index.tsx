/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-06-06 14:02:59
 * @LastEditTime: 2022-06-06 16:49:42
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\src\pages\ImportIntlData\index.tsx
 */
import { useState, FC } from 'react';
import { Button, Input, notification } from 'antd';
import { AppState } from '../../@types';
import { Event, Mode } from '../../../electron/types';
import { reverseObject } from '../../utils';

const TextArea = Input.TextArea;
const ImportIntlData: FC<Pick<AppState, 'pageData'>> = ({
  pageData,
  pageData: {
    existedIntlData,
    remoteData: { mode, commonIntlData },
  },
}) => {
  const [input, setInput] = useState(existedIntlData);
  const [commonInput, setCommonInput] = useState('');
  const assertInput = (_input: string): boolean => {
    try {
      const inputProcessed = _input.trim();
      let intlData;
      switch (mode) {
        case Mode.VueI18N:
          if (!inputProcessed.startsWith('{') || !inputProcessed.endsWith('}')) throw new Error();
          JSON.parse(inputProcessed);
          break;
        case Mode.UmiIntlReact:
          if (!inputProcessed.startsWith('{') || !inputProcessed.endsWith('}')) throw new Error();
          // eslint-disable-next-line no-eval
          intlData = eval(`(${inputProcessed})`)
          if (intlData === 'null' || typeof intlData !== 'object') throw new Error();
          break;
      }
      return true;
    } catch (e) {
      notification.error({ message: '格式错误', description: e.toString() });
      console.error(e);
      return false;
    }
  }
  return (
    <div className="page-wrapper" spellCheck={false}>
      <div>
        当前模式的数据格式为：
        {mode === Mode.VueI18N && `{ "common": { "text": "中文" } }`}
        {mode === Mode.UmiIntlReact && `{ 'code.code1': '中文{var}', 'code.code2': '中文', }`}
      </div>
      <h2>
        导入通用的Intl数据，导入之后在将中文转为intl的时候，如果中文在通用的Intl数据当中，则会直接使用它的编码，而不是使用prefix
      </h2>
      <TextArea
        autoSize={{ minRows: 5 }}
        value={commonInput}
        onChange={e => {
          setCommonInput(e.target.value);
        }}
      />
      <Button
        onClick={() => {
          if (!assertInput(commonInput)) return;
          const inputProcessed = commonInput.trim();
          let intlData;
          switch (mode) {
            case Mode.VueI18N:
              intlData = JSON.parse(inputProcessed);
              // TODO 需要将该对象扁平化
              break;
            case Mode.UmiIntlReact:
              // eslint-disable-next-line no-eval
              intlData = eval(`(${inputProcessed})`)
              break;
          }
          pageData.processing = true;
          window.Main.emit(Event.SetCommonIntlData, reverseObject(intlData));
        }}
      >
        导入
      </Button>
      <div>
        {JSON.stringify(commonIntlData)}
      </div>
      <h2>设置已经整理的Intl数据，设置之后在扫描Intl中将会与该数据合并导出</h2>
      <TextArea
        autoSize={{ minRows: 5 }}
        value={input}
        onChange={e => {
          setInput(e.target.value);
        }}
      />
      <Button
        onClick={() => {
          if (!assertInput(input)) return;
          const inputProcessed = input.trim();
          let intlData;
          switch (mode) {
            case Mode.VueI18N:
              intlData = JSON.parse(inputProcessed);
              pageData.existedIntlData = intlData;
              break;
            case Mode.UmiIntlReact:
              // eslint-disable-next-line no-eval
              intlData = eval(`(${inputProcessed})`)
              pageData.existedIntlData = intlData;
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
