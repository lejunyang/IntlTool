/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-01-20 10:11:01
 * @LastEditTime: 2022-01-28 10:56:08
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\webpack\rules.webpack.js
 */
module.exports = [
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
       * 在https://github.com/electron-userland/electron-forge/issues/2154找到新的loader，换上
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
];
