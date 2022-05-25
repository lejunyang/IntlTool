/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-01-29 17:08:10
 * @LastEditTime: 2022-05-25 20:22:22
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\src\pages\ManageOption\index.tsx
 */
import { FC, useEffect } from 'react';
import { Button, Select, Form } from 'antd';
import { Event } from '../../../electron/types';
import { AppState } from '../../@types';

const ManageOption: FC<Pick<AppState, 'pageData'>> = ({
  pageData,
  pageData: {
    remoteData: { allowedFileSuffix = [], excludedPaths = [] },
  },
}) => {
  const [form] = Form.useForm();
  useEffect(() => {
    form.setFieldsValue({ allowedFileSuffix, excludedPaths });
  }, [allowedFileSuffix, excludedPaths]);
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
          pageData.processing = true;
          // JSON转换一次，因为如果直接传输Proxy会报错
          window.Main.emit(
            Event.SetAllowedFileSuffix,
            JSON.parse(JSON.stringify(form.getFieldValue('allowedFileSuffix')))
          );
          window.Main.emit(Event.SetExcludedPaths, JSON.parse(JSON.stringify(form.getFieldValue('excludedPaths'))));
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
