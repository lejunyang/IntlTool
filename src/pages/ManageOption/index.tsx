/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-01-29 17:08:10
 * @LastEditTime: 2022-05-19 19:19:16
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\src\pages\ManageOption\index.tsx
 */
import { FC } from 'react';
import { Button, Select, Form } from 'antd';
import { Event } from '../../../electron/types';
import { AppState } from '../../@types';

const ManageOption: FC<Pick<AppState, 'pageData'>> = ({
  pageData: {
    remoteData: {
      allowedFileSuffix = [],
      excludedPaths = [],
    },
  },
}) => {
  console.log('allowedFileSuffix', allowedFileSuffix);
  console.log('excludedPaths', excludedPaths);
  const [form] = Form.useForm();
  return (
    <div className="page-wrapper" spellCheck={false}>
      <Form form={form}>
        <Form.Item name="allowedFileSuffix" initialValue={allowedFileSuffix} label="允许的文件格式">
          <Select mode="tags" />
        </Form.Item>
        <Form.Item name="excludedPaths" initialValue={excludedPaths} label="排除的文件路径">
          <Select mode="tags" />
        </Form.Item>
      </Form>
      <Button
        onClick={() => {
          window.Main.emit(Event.SetAllowedFileSuffix, form.getFieldValue('allowedFileSuffix'));
          window.Main.emit(Event.SetExcludedPaths, form.getFieldValue('excludedPaths'));
        }}
      >
        设置
      </Button>
      <div>
        <div>允许的文件格式</div>
        {allowedFileSuffix.map(p => (
          <div key={p}>{p}</div>
        ))}
        <div>排除的文件路径</div>
        {excludedPaths.map(p => (
          <div key={p}>{p}</div>
        ))}
      </div>
    </div>
  );
};

export default ManageOption;
