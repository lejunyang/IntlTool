/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-02-11 16:21:54
 * @LastEditTime: 2022-05-16 17:17:43
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\src\components\Button\index.tsx
 */
import React, { FC, useState } from 'react';
import { Button, ButtonProps } from 'antd';

// antd的Button不支持传入一个async onClick自动加loading，于是套一层加上这个特性
const LoadingButton: FC<
  Omit<ButtonProps, 'onClick'> & {
    onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => Promise<any> | void;
  }
> = props => {
  const { onClick, children, ...otherProps } = props;
  const [loading, setLoading] = useState(false);
  return (
    <Button
      {...otherProps}
      loading={loading}
      onClick={e => {
        if (!onClick) return;
        const isAsync = onClick.constructor.name === 'AsyncFunction';
        // 如果不是async的话那就别loading了，因为同步代码先执行，后出loading
        if (!isAsync) {
          return onClick(e);
        }
        setLoading(true);
        const promise = onClick(e);
        if (promise) {
          promise.then(() => {
            setLoading(false);
          }).catch(() => {
            setLoading(false);
          });
        }
      }}
    >
      {children}
    </Button>
  );
};

export default LoadingButton;
