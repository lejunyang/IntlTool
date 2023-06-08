/* eslint-disable no-case-declarations */
/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-01-29 14:24:21
 * @LastEditTime: 2023-06-08 11:06:51
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \IntlTool\src\pages\ScanIntl\index.tsx
 */
import { Table, Tooltip, Form, Select, Input, notification, Modal } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import type { ColumnType } from 'antd/lib/table';
import { useState, FC } from 'react';
import { set, get as lodashGet } from 'lodash';
import Button from '../../components/Button';
import { Event, IntlItem, Mode } from '../../../electron/types';
import { AppState } from '../../@types';
import { asyncConfirm, copy, getCSVLine } from '../../utils';
import { filePathRender } from '../../utils/render';

type IntlRecord = IntlItem & {
  path?: string;
};

const generateOnCell = (record: IntlRecord, key: keyof IntlRecord) => {
  return {
    onDoubleClick: () => {
      if (copy(String(record[key]))) notification.success({ message: '复制成功' });
    },
  };
};

const excludedPrefixesDefault = ['hzero.common', 'hzero.c7nProUI', 'hzero.c7nUI', 'hzero.hzeroUI'];

const Intl: FC<Pick<AppState, 'pageData'>> = ({
  pageData,
  pageData: {
    existedIntlData,
    remoteData: { intlResult, mode, options },
  },
}) => {
  const errorRender = (text: string, record: IntlRecord) => {
    return (
      <Tooltip
        title={() => (
          <div>
            <div>{record.error}</div>
            {/* {filePathRender(record.path, record.code)} */}
            {Array.from(record.paths || []).map(p => filePathRender(p, record.code))}
          </div>
        )}
      >
        <span
          className={
            record.error
              ? 'text-red'
              : options.warningWhenUsedInMultiFiles && record.paths.length > 1
              ? 'text-warning'
              : ''
          }
        >
          {text || record.error}
        </span>
      </Tooltip>
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, update] = useState(1); // 用于刷新页面
  const [form] = Form.useForm();
  const { excludedPrefixes = excludedPrefixesDefault, prefix = '', get = '', d = '' } = form.getFieldsValue(true);
  const data = intlResult
    .filter(
      item =>
        (!item.prefix || !excludedPrefixes.includes(item.prefix)) &&
        (item.prefix || '').includes(prefix) &&
        item.get.includes(get) &&
        item.d.includes(d)
    )
    .sort((i, j) => {
      if (i.error || j.error) return j.error.length - i.error.length; // error更长的排在前面
      if (i.paths || j.paths) return j.paths.length - i.paths.length; // paths更长的排在前面
      return 0;
    });
  const errorLength = data.filter(item => item.error).length;
  const usedByMultiFileNum = data.filter(item => item.paths.length > 1).length;
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);

  let columns: (ColumnType<IntlRecord> | false)[] = [
    mode === Mode.HzeroIntlReact && {
      dataIndex: 'prefix',
      title: '前缀',
      onCell: record => {
        return generateOnCell(record, 'prefix');
      },
      render: errorRender,
    },
    {
      dataIndex: 'get',
      title: '编码',
      onCell: record => {
        return generateOnCell(record, 'get');
      },
      render: errorRender,
    },
    {
      dataIndex: 'd',
      title: '描述',
      onCell: record => {
        return generateOnCell(record, 'd');
      },
      render: errorRender,
    },
    data.some(i => i.en_US) && {
      dataIndex: 'en_US',
      title: '英文',
      onCell: record => {
        return generateOnCell(record, 'en_US');
      },
      render: errorRender,
    },
  ];
  columns = columns.filter(i => i);

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys: any) => {
      setSelectedRowKeys(selectedRowKeys);
    },
  };

  const getData = async () => {
    if (data.length === 0) {
      notification.info({ message: '没有数据可以导出' });
      return;
    }
    const result = existedIntlData || {};
    let isOverride = false;
    const checkOverride = () => {
      if (isOverride) {
        notification.warn({
          message: '在合并导入数据和扫描数据时，有一些导入数据中的条目将被覆盖，请前往控制台warnings和errors确认',
          description: '控制台打开方式：Views -> Toggle Developer Tools',
        });
      }
    };
    const chooseExportLang = () => {
      if (data.some(i => i.en_US)) {
        return asyncConfirm({
          cancelText: '英文',
          okText: '中文',
          title: '请选择导出语言',
        });
      }
    };
    const langChoice = [Mode.VueI18N, Mode.UmiIntlReact].includes(mode) && (await chooseExportLang());
    const getItemD = item => (langChoice === 'cancel' ? item.en_US || item.d : item.d);
    switch (mode) {
      case Mode.VueI18N:
        // 短的在前面，即可避免下面那个报错
        const sortedData = data.sort((i, j) => i.code.length - j.code.length);
        for (const item of sortedData) {
          const exsited = lodashGet(result, item.code);
          if (exsited && exsited !== getItemD(item)) {
            // exsited如果是对象，说明你code路径写太短了，少写了后面的编码，这会把整个对象都给覆盖掉的！
            console[typeof exsited === 'object' ? 'error' : 'warn'](
              `编码“${item.code}”已经存在值`,
              exsited,
              '它将被覆盖为:',
              getItemD(item)
            );
            console[typeof exsited === 'object' ? 'error' : 'warn'](
              '已经存在值如果是对象，说明你code编码写太短了，code长的先被扫到了，短的编码会把整个对象都给覆盖掉的！'
            );
            isOverride = true;
          }
          set(result, item.code, getItemD(item));
        }
        checkOverride();
        return JSON.stringify(result, null, 2);
      case Mode.UmiIntlReact:
        for (const item of data) {
          if (result[item.code] && result[item.code] !== getItemD(item)) {
            console.warn(`编码“${item.code}”已经存在值“${result[item.code]}”`, '它将被覆盖为:', getItemD(item));
            isOverride = true;
          }
          result[item.code] = getItemD(item);
        }
        checkOverride();
        return `export default ${JSON.stringify(result, null, 2)}`;
      case Mode.HzeroIntlReact:
        const choice = await asyncConfirm({
          cancelText: '旧版',
          okText: '新版',
          title: '请选择多语言导出模板',
          width: 600,
          content: (
            <>
              <p>
                旧版的hzero多语言模板的格式为：<strong>模板代码,代码,语言,描述</strong>
              </p>
              <p>
                新版的hzero多语言模板的格式为：<strong>模板代码,代码,描述(中文),描述(English)</strong>
              </p>
              <p>至于在哪个版本发生的变化不得而知，请前往“平台多语言”下载模板自行查看</p>
            </>
          ),
        });
        let head = choice === 'ok' ? `模板代码,代码,描述(中文),描述(英文)\n` : `模板代码,代码,语言,描述\n`;
        for (const item of data) {
          if (!item.error)
            head +=
              choice === 'ok'
                ? getCSVLine(item.prefix, item.get, item.d, item.en_US)
                : getCSVLine(item.prefix, item.get, 'zh_CN', item.d);
          if (choice !== 'ok' && item.en_US) {
            head += getCSVLine(item.prefix, item.get, 'en_US', item.en_US);
          }
        }
        return head;
    }
  };

  return (
    <div className="page-wrapper">
      {!data.length && (
        <Button
          onClick={async () => {
            window.Main.emit(Event.ScanIntl);
            pageData.processing = true;
          }}
        >
          开始扫描
        </Button>
      )}
      {!!data.length && (
        <Button
          onClick={async () => {
            window.Main.emit(Event.ReScanIntl);
            pageData.processing = true;
          }}
        >
          更新现有文件并重新扫描
        </Button>
      )}
      <div className="flex gap-normal">
        <Form
          form={form}
          name="query-fields"
          className="flex-1 row-gap-small"
          layout="inline"
          initialValues={{ excludedPrefixes: excludedPrefixesDefault }}
        >
          {mode === Mode.HzeroIntlReact && (
            <Form.Item name="excludedPrefixes" label="排除的前缀" style={{ width: 250 }} className="flex-1">
              <Select mode="tags" allowClear maxTagCount="responsive">
                <Select.Option value="hzero.common">hzero.common</Select.Option>
              </Select>
            </Form.Item>
          )}
          {mode === Mode.HzeroIntlReact && (
            <Form.Item name="prefix" label="前缀">
              <Input onPressEnter={() => update(Date.now())} />
            </Form.Item>
          )}
          <Form.Item name="get" label="编码">
            <Input onPressEnter={() => update(Date.now())} />
          </Form.Item>
          <Form.Item name="d" label="描述">
            <Input onPressEnter={() => update(Date.now())} />
          </Form.Item>
        </Form>
        <Button
          onClick={() => {
            form.resetFields();
            update(Date.now());
          }}
        >
          重置
        </Button>
        <Button onClick={() => update(Date.now())}>筛选</Button>
      </div>
      <Table
        title={() => (
          <span className="flex justify-between">
            <div>
              <strong>Intl扫描结果</strong>
              <Tooltip title="单元格双击可以复制，单击路径可以打开IDE跳转并复制完整code到剪贴板，跳转到IDE相应文件需要有已经打开了该IDE且打开了文件所在工程">
                <QuestionCircleOutlined />
              </Tooltip>
              <Tooltip title="导出当前筛选出的数据，并过滤含有错误的条目">
                <Button
                  onClick={async () => {
                    const data = await getData();
                    data && window.Main.emit(Event.DownloadIntlResult, data);
                  }}
                  style={{ marginLeft: 15 }}
                >
                  导出
                </Button>
              </Tooltip>
              {!!data.length && (
                <Tooltip title="翻译前需要在设置里配置相应apiKey，必应不用；翻译可能导致文本中的变量占位符出现问题，程序会检查一遍，将有问题的标注出来">
                  <Button
                    onClick={async () => {
                      let choice;
                      Modal.confirm({
                        content: (
                          <>
                            选择翻译源：
                            <Select
                              style={{ width: '230px' }}
                              options={[
                                { value: 'bing', label: '必应（免费）' },
                                { value: 'caiyun', label: '彩云小译' },
                                {
                                  value: 'google',
                                  label: '谷歌',
                                },
                                {
                                  value: 'baidu',
                                  label: '百度',
                                },
                                {
                                  value: 'tecent',
                                  label: '腾讯',
                                },
                                {
                                  value: 'youdao',
                                  label: '有道',
                                },
                              ]}
                              onChange={val => {
                                choice = val;
                              }}
                            ></Select>
                          </>
                        ),
                        onOk() {
                          if (choice) {
                            window.Main.emit(Event.TranslateAll, choice);
                            pageData.processing = true;
                          } else {
                            return Promise.reject(new Error('请选择翻译源'));
                          }
                        },
                      });
                    }}
                    style={{ marginLeft: 15 }}
                  >
                    全部翻译
                  </Button>
                </Tooltip>
              )}
            </div>
            <div>
              总计：{data.length}条；
              {options.warningWhenUsedInMultiFiles && (
                <span className={usedByMultiFileNum ? 'text-warning' : ''}>
                  在多个文件重复使用的编码数量：{usedByMultiFileNum}条；
                </span>
              )}
              <strong className={errorLength ? 'text-red' : ''}>错误：{errorLength}条</strong>
            </div>
          </span>
        )}
        rowKey="path"
        columns={columns as ColumnType<IntlRecord>[]}
        dataSource={data}
        rowSelection={rowSelection}
      />
    </div>
  );
};

export default Intl;
