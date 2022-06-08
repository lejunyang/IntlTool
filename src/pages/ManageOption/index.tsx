/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-01-29 17:08:10
 * @LastEditTime: 2022-06-08 15:46:03
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\src\pages\ManageOption\index.tsx
 */
import { FC, useEffect } from 'react';
import { Button, Select, Form, Switch, Input, notification } from 'antd';
import { Event } from '../../../electron/types';
import { AppState } from '../../@types';
import { omit } from 'lodash';

const ManageOption: FC<Pick<AppState, 'pageData'>> = ({
  pageData,
  pageData: {
    remoteData: { options },
  },
}) => {
  const [form] = Form.useForm();
  const formatAfterTransformValue = Form.useWatch('formatAfterTransform', form); // 当该字段更新时刷新
  useEffect(() => {
    form.setFieldsValue({ ...options, formatOptions: JSON.stringify(options.formatOptions, null, 2) });
  }, [options]);
  return (
    <div className="page-wrapper">
      <Form form={form}>
        <div style={{ marginBottom: 24 }}>
          注：Intl的格式为l1.l2().l3()，其中l2和l3一定是函数调用，l1为变量或者this，或者不写也可以（不写就只有两个调用）它们仅支持设置为字母
        </div>
        <Form.Item
          name="l1"
          initialValue={options.nameMap.l1}
          label="l1"
          normalize={val => val?.replace(/[^a-zA-Z]/g, '')}
        >
          <Input allowClear />
        </Form.Item>
        <Form.Item
          name="l2"
          initialValue={options.nameMap.l2}
          label="l2"
          rules={[{ required: true }]}
          normalize={val => val?.replace(/[^a-zA-Z]/g, '')}
        >
          <Input allowClear />
        </Form.Item>
        <Form.Item
          name="l3"
          initialValue={options.nameMap.l3}
          label="l3"
          rules={[{ required: true, pattern: /\w+/ }]}
          normalize={val => val?.replace(/[^a-zA-Z]/g, '')}
        >
          <Input allowClear />
        </Form.Item>
        <Form.Item name="allowedFileSuffix" initialValue={options.allowedFileSuffix} label="允许的文件格式" tooltip="在选择文件前设置有效，将仅能选择已设置的文件格式">
          <Select mode="tags" />
        </Form.Item>
        <Form.Item name="excludedPaths" initialValue={options.excludedPaths} label="排除的文件路径" tooltip="在选择文件前设置有效，将排除路径中有包含设置内容的文件">
          <Select mode="tags" />
        </Form.Item>
        <Form.Item
          valuePropName="checked"
          name="requirePrefix"
          initialValue={options.requirePrefix}
          label="intl编码是否需要前缀"
          tooltip="开启此项后会出现设置前缀菜单，所有intl的编码必须有那里设置的前缀，否则视为错误项"
        >
          <Switch />
        </Form.Item>
        <Form.Item
          valuePropName="checked"
          name="formatAfterTransform"
          initialValue={options.formatAfterTransform}
          label="生成的代码是否使用prettier美化"
          tooltip="生成的代码指将中文转为intl后的代码，仅对React代码和Vue中的script代码有效"
        >
          <Switch />
        </Form.Item>
        {formatAfterTransformValue && (
          <Form.Item
            name="formatOptions"
            initialValue={JSON.stringify(options.formatOptions, null, 2)}
            label="prettier选项"
            rules={[
              {
                validator: (_, val) => {
                  try {
                    if (!val?.trim()) return Promise.reject(new Error('prettier选项必须为JSON对象'));
                    const result = JSON.parse(val.trim());
                    if (!result || typeof result !== 'object' || result instanceof Array)
                      return Promise.reject(new Error('prettier选项必须为JSON对象'));
                    return Promise.resolve();
                  } catch (e) {
                    e.message = `prettier选项必须为JSON对象，${e.message}`;
                    return Promise.reject(e);
                  }
                },
              },
            ]}
          >
            <Input.TextArea autoSize={{ minRows: 5 }} />
          </Form.Item>
        )}
      </Form>
      <Button
        onClick={() => {
          form
            .validateFields()
            .then(values => {
              console.log('values', values);
              pageData.processing = true;
              window.Main.emit(Event.SetModeOptions, {
                ...omit(values, ['l1', 'l2', 'l3']),
                ...(values.formatAfterTransform ? { formatOptions: JSON.parse(values.formatOptions) } : {}),
                nameMap: { l1: values.l1, l2: values.l2, l3: values.l3 },
              });
              notification.success({ message: '设置成功' })
            })
            .catch(errorInfo => {
              if (errorInfo.errorFields) form.scrollToField(errorInfo.errorFields[0].name);
            });
        }}
      >
        设置
      </Button>
      <pre>{JSON.stringify(options, null, 2)}</pre>
    </div>
  );
};

export default ManageOption;
