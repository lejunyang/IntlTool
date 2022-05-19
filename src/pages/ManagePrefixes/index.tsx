/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-01-29 17:08:10
 * @LastEditTime: 2022-05-19 21:10:58
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\src\pages\ManagePrefixes\index.tsx
 */
import { useState, FC } from 'react';
import { Button, Input } from 'antd';
import { Event } from '../../../electron/types';
import { AppState } from '../../@types';

const TextArea = Input.TextArea;
const ManagePrefixes: FC<Pick<AppState, 'pageData'>> = ({
  pageData,
  pageData: {
    remoteData: { prefixes },
  },
}) => {
  const [input, setInput] = useState(prefixes.join('\n') || '');
  return (
    <div className="page-wrapper" spellCheck={false}>
      前缀使用正则进行替换
      <TextArea
        autoSize={{ minRows: 5 }}
        value={input}
        onChange={e => {
          setInput(e.target.value);
        }}
      />
      <Button
        onClick={() => {
          window.Main.emit(Event.SetPrefixes, input);
          pageData.processing = true;
        }}
      >
        设置前缀
      </Button>
      <div>
        {prefixes.map(p => (
          <div key={p}>{p}</div>
        ))}
      </div>
    </div>
  );
};

export default ManagePrefixes;
