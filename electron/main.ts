/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-01-20 10:11:01
 * @LastEditTime: 2022-05-16 23:31:56
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\electron\main.ts
 */
import { app, BrowserWindow, ipcMain } from 'electron';
import fs from 'fs';
// import path from 'path';
import { Event, ProcessFile, BasicFile } from './types';
import { manager } from './Manager';
import launchEditor from './utils/launchEditor';

let mainWindow: BrowserWindow | null;

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

// const assetsPath =
//   process.env.NODE_ENV === 'production'
//     ? process.resourcesPath
//     : app.getAppPath()

function createWindow() {
  mainWindow = new BrowserWindow({
    // icon: path.join(assetsPath, 'assets', 'icon.png'),
    width: 1100,
    height: 700,
    // backgroundColor: '#191622',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function updateRemoteData() {
  mainWindow.webContents.send(Event.UpdateRemoteData, manager.getRemoteData());
}

function sendMessage(data) {
  mainWindow.webContents.send(Event.Message, data);
}

async function registerListeners() {
  /**
   * This comes from bridge integration, check bridge.ts
   */
  ipcMain.on('message', (_, message) => {
    console.log(message);
  });

  ipcMain.on(Event.AddFile, (_, file: ProcessFile) => {
    if (!manager.isFileAllowed(file.name)) return;
    console.log('receive file', JSON.stringify(file));
    const stat = fs.statSync(file.path);
    if (stat.isFile()) {
      Object.assign(file, {
        content: fs.readFileSync(file.path, 'utf-8').replace(/(?<!\r)\n/g, '\r\n'), // 统一替换为crlf，防止后续diff时因为这个而全篇不一样
      });
      manager.addFile(file);
    }
  });

  ipcMain.on(Event.RemoveFile, (_, file: BasicFile) => {
    manager.removeFile(file);
  });

  ipcMain.on(Event.GetFilesSync, event => {
    event.returnValue = manager.getFiles();
  });

  // ipcMain.on('selected-paths', (_, paths: string[]) => {
  //   function traverseDir(dir: string) {
  //     const files = fs.readdirSync(dir);
  //     console.log('接收到的目录', dir);
  //     files.forEach(fileOrDir => {
  //       console.log('目录下的子目录或文件', fileOrDir);
  //       const p = path.join(dir, fileOrDir);
  //       console.log('join', p);
  //       const stat = fs.statSync(p);
  //       if (stat.isDirectory()) {
  //         traverseDir(p);
  //       }
  //       if (stat.isFile() && manager.isFileAllowed(fileOrDir)) {
  //         // 不指定编码读出来的是Buffer类型
  //         manager.pushFile(fs.readFileSync(p, 'utf-8'));
  //       }
  //     });
  //   }

  //   paths.forEach(p => {
  //     const stat = fs.statSync(p);
  //     if (stat.isDirectory()) {
  //       traverseDir(p);
  //     }
  //     if (stat.isFile() && manager.isFileAllowed(p)) {
  //       manager.pushFile(fs.readFileSync(p, 'utf-8'), stat.uid);
  //     }
  //   });

  // });

  ipcMain.on(Event.GetRemoteData, updateRemoteData);

  ipcMain.on(Event.StartProcessCh, (_, prefixPattern?: string) => {
    try {
      manager.processAllCh(prefixPattern);
    } catch (e) {
      sendMessage(e);
    }
    mainWindow.webContents.send(Event.ProcessChEnd, manager.getFiles());
  });

  ipcMain.on(Event.SetPrefixes, (_, data: string) => {
    manager.setPrefixes(data);
    updateRemoteData();
  });

  ipcMain.on(Event.ScanIntlSync, event => {
    manager.traverseAllIntl();
    event.returnValue = manager.getFiles();
  });

  ipcMain.on(Event.LaunchEditor, (_, path: string) => {
    const info = path.split(':'); // 注意，虽然文件夹和文件名不能包含:，但是C:/xxx磁盘是天生自带冒号的。。
    console.log('LaunchEditor path', path, ' filePath', info.slice(0, info.length - 2).join(''));
    if (info.length) launchEditor(info.slice(0, info.length - 2).join(''), info[info.length - 2], info[info.length - 1]);
    else launchEditor(path, 1, 1);
  })
}

app
  .on('ready', createWindow)
  .whenReady()
  .then(registerListeners)
  .catch(e => console.error(e));

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
