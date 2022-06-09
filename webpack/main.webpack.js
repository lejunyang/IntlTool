/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-01-20 10:11:01
 * @LastEditTime: 2022-06-09 11:28:16
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\webpack\main.webpack.js
 */

// 主线程webpack配置
module.exports = {
  resolve: {
    extensions: ['.ts', '.js'],
  },
  entry: './electron/main.ts',
  module: {
    rules: [
      {
        test: /\.node$/,
        use: 'node-loader',
      },
      {
        test: /\.(m?js|node)$/,
        parser: { amd: false },
        use: {
          /**
           * 在代码生成那里使用prettier之后下面的loader编译就报错
           * Error: Module build failed (from ./node_modules/@marshallofsound/webpack-asset-relocator-loader/dist/index.js)
           * SyntaxError
           * 在https://github.com/electron-userland/electron-forge/issues/2154 找到新的loader，换上
           */
          // loader: '@marshallofsound/webpack-asset-relocator-loader',
          loader: '@timfish/webpack-asset-relocator-loader',
          options: {
            outputAssetBase: 'native_modules',
          },
        },
      },
      {
        test: /\.(js|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
};
