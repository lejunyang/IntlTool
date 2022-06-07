/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-06-07 16:42:58
 * @LastEditTime: 2022-06-07 17:25:35
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\tests\testReact.tsx
 */
import React from 'react'

const intl = {
  get: (code: string, params?: object) => ({ d: (str: string) => code + str + params })
};

export function App() {
  const simpleVar = '测试';
  const obj = {
    name: simpleVar ? '以' : 'or',
    or: "你" || "我",
    and: '啊？？' && "....",
  }
  console.log("不会管log里的中文")
  const testIntlParams = () => {
    intl.get('page.register.fileUploadSuccess', { fileName: obj.name }).d(`${obj.name} 文件上传成功`);
    intl.get('page.register.fileUploadSuccess2', { simpleVar }).d(`${simpleVar} 文件上传成功`);
  }
  if (obj.name === "居然还有用中文常量做判断的") {
    console.log('...');
  }
  switch (obj.name) {
    case "中文case？？？":
      break;
  }

  return (
    <>
    <div onClick={testIntlParams} title="中文属性">
      {intl.get('simple').d('简单')}啊哈
      </div>
      <div>
        空白字符行为 &nbsp;&nbsp;
        空白字符行为
      </div>
    </>
  )
}