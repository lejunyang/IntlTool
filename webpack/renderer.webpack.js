/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-01-20 10:11:01
 * @LastEditTime: 2022-06-09 11:23:30
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\webpack\renderer.webpack.js
 */

// 渲染线程webpack配置
module.exports = {
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.less'],
  },
  module: {
    rules: [
      {
        test: /\.(js|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        loader: 'file-loader',
        options: {
          name: '[path][name].[ext]',
        },
      },
      {
        test: /\.css$/i,
        use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
      },
      {
        test: /\.less$/i,
        use: [
          {
            loader: 'style-loader', // creates style nodes from JS strings
          },
          {
            loader: 'css-loader', // translates CSS into CommonJS
          },
          {
            loader: 'less-loader', // compiles Less to CSS
            options: {
              lessOptions: {
                javascriptEnabled: true, // 没有这个antd-pro编辑报错
              },
            },
          },
        ],
      },
    ],
  },
};
