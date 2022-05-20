## Electron + TypeScript + Babel + React  + Antd

一个用于扫描处理Intl的工具，扫描支持各种格式的intl，如：
```js
intl.get('xxx').d('ddd');
const prefix = 'prefix.';
const a = 1;
intl.get(`${prefix}xxx`, { a }).d(`ddd${a}`)
```
由于是使用`babel`在语法树的层面对调用表达式进行检测，所以不用考虑注释，字符串不会有引号的问题，不会有代码格式的问题。

代码中有对模板字符串的检测逻辑：
- `get`中的模板字符串支持插入变量，但该变量必须在该文件的最外层定义，并且为字符串常量
- `d`中的模板字符串同样支持插入变量，根据`intl`的使用规范，`d`中插入了变量，必须在`get`中的第二个参数提供该变量，这同样在代码中有检测
模板字符串中不允许使用表达式，这是没有意义的

## Installation

Use a package manager of your choice (npm, yarn, etc.) in order to install all dependencies

```bash
yarn
```

## Usage

Just run `start` script.

```bash
yarn start
```

## Packaging

To generate the project package based on the OS you're running on, just run:

```bash
yarn package
```

## Contributing

Pull requests are always welcome 😃.

## License

[MIT](https://choosealicense.com/licenses/mit/)
