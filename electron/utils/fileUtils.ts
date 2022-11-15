/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-05-24 10:48:17
 * @LastEditTime: 2022-08-23 16:51:52
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\electron\utils\fileUtils.ts
 */
import fs from 'fs';
import path from 'path';

export function readFile(path: string) {
  try {
    // 不指定编码读出来的是Buffer类型
    return fs.readFileSync(path, 'utf-8').replace(/(?<!\r)\n/g, '\r\n'); // 统一替换为crlf，防止后续diff时因为这个而全篇不一样
  } catch (e) {
    console.error(e);
    return '';
  }
}

/**
 * 遍历文件夹，访问其中的文件，也可以直接访问文件
 * @param _path 文件或文件夹路径
 * @param options 
 */
export function traversePath(
  _path: string,
  options?: {
    isPathAllowed?: (path: string) => boolean;
    fileCallback?: (file: { uid: string; content: string; path: string }) => any;
  }
) {
  const pStat = fs.statSync(_path);
  const fileCallback =
    options?.fileCallback instanceof Function
      ? (ino, p) => {
          options.fileCallback({
            uid: String(ino), // stat.uid是userId， ino才能代表文件
            content: readFile(p),
            path: p.replace(/\\/g, '/'),
          });
        }
      : () => {};
  if (pStat.isFile()) {
    fileCallback(pStat.ino, _path);
    return;
  }
  if (!pStat.isDirectory()) return;
  const files = fs.readdirSync(_path);
  files.forEach(fileOrDir => {
    const p = path.join(_path, fileOrDir);
    if (options?.isPathAllowed instanceof Function && !options.isPathAllowed(p)) return;
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      traversePath(p, options);
    }
    if (stat.isFile()) fileCallback(stat.ino, p);
  });
}

export function traversePaths(_paths: string[], options?: Parameters<typeof traversePath>[1]) {
  _paths.forEach(p => traversePath(p, options));
}
