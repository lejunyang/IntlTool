/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-01-20 10:11:01
 * @LastEditTime: 2022-01-26 16:32:55
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\webpack\renderer.webpack.js
 */
module.exports = {
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.less'],
  },
  module: {
    rules: require('./rules.webpack'),
  },
};
