/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-01-29 17:08:10
 * @LastEditTime: 2022-02-11 17:04:56
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
  pageData: {
    remoteData: { prefixes },
  },
}) => {
  const [input, setInput] = useState(prefixes.join('\n') || '');
  return (
    <div className="page-wrapper" spellCheck={false}>
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
        }}
      >
        设置前缀
      </Button>
      <div>
        {prefixes.map(p => (
          <div>{p}</div>
        ))}
      </div>
    </div>
  );
};

export default ManagePrefixes;
