/* eslint-disable no-case-declarations */
/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-06-06 14:02:59
 * @LastEditTime: 2022-06-08 11:04:07
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\src\pages\ImportIntlData\index.tsx
 */
import { useState, FC } from 'react';
import { Button, Input, notification, Divider, Modal } from 'antd';
import { AppState } from '../../@types';
import { Event, Mode } from '../../../electron/types';
import { reverseObject, flattenObject } from '../../utils';

const TextArea = Input.TextArea;
const ImportIntlData: FC<Pick<AppState, 'pageData'>> = ({
  pageData,
  pageData: {
    existedIntlData,
    remoteData: { mode, commonIntlData },
  },
}) => {
  const [input, setInput] = useState('');
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
    <div className="page-wrapper">
      <Button onClick={() => {
        const titleMap = {
          [Mode.HzeroIntlReact]: "每一行为一条数据\nprefix code description\n它们之间可以用空白字符或逗号分隔",
          [Mode.VueI18N]: "JSON数据",
          [Mode.UmiIntlReact]: "扁平JS对象，每个key都是完整的code"
        };
        const contentMap = {
          [Mode.HzeroIntlReact]: "prefix.common button.create 新建\nprefix.common,button.add,添加",
          [Mode.VueI18N]: {
            common: {
              button: {
                create: '新建',
                total: '共{num}条',
              }
            }
          },
          [Mode.UmiIntlReact]: {
            'common.button.create': '新建',
            'common.text.total': '共{num}条',
          }
        };
        Modal.info({
          title: <pre>
            {titleMap[mode]}
          </pre>,
          content: <pre>
            {typeof contentMap[mode] === 'string' ? contentMap[mode] : JSON.stringify(contentMap[mode], null, 2)}
          </pre>,
        })
      }}>查看当前模式的数据格式</Button>
      <Divider orientation="left">导入通用Intl数据</Divider>
      <div>
        通用的Intl数据，在将中文转为intl的时候，比如要将“新建”文本转为intl，然后如果在通用的Intl数据当中存在'button.create': '新建'，则会直接使用它的编码'button.create'，而不是使用预先设置的prefix
      </div>
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
          pageData.processing = true;
          const inputProcessed = commonInput.trim();
          let intlData = {};
          switch (mode) {
            case Mode.HzeroIntlReact:
              const lines = inputProcessed.split('\n');
              lines.forEach(line => {
                let intlLine: string[];
                if (line.includes(',')) intlLine = line.split(',').map(i => i.trim());
                else intlLine = line.split(/\s/).map(i => i.trim());
                if (intlLine.length < 3) return;
                intlData[`${intlLine[0]}.${intlLine[1]}`] = intlLine[2];
              })
              break;
            case Mode.VueI18N:
              intlData = flattenObject(JSON.parse(inputProcessed));
              break;
            case Mode.UmiIntlReact:
              // eslint-disable-next-line no-eval
              intlData = eval(`(${inputProcessed})`)
              break;
          }
          window.Main.emit(Event.SetCommonIntlData, reverseObject(intlData));
          notification.success({ message: '导入成功' });
        }}
      >
        覆盖导入
      </Button>
      <Button onClick={() => {
        Modal.info({
          content: <pre>
            {JSON.stringify(commonIntlData, null, 2)}
          </pre>
        })
      }}>查看已导入的通用数据</Button>
      <>
        {mode !== Mode.HzeroIntlReact && (
          <>
            <Divider orientation="left">导入项目里的Intl数据</Divider>
            <div>导入项目里的Intl数据，之后在扫描Intl中将会与该数据合并导出</div>
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
                notification.success({ message: '导入成功' });
              }}
            >
              覆盖导入
            </Button>
            <Button onClick={() => {
              Modal.info({
                content: <pre>
                  {JSON.stringify(existedIntlData, null, 2)}
                </pre>
              })
            }}>查看已导入的项目数据</Button>
          </>
        )}
      </>
    </div>
  );
};

export default ImportIntlData;
