// 预加载脚本：向渲染进程暴露受控 API
const { contextBridge, ipcRenderer, clipboard } = require('electron');

contextBridge.exposeInMainWorld('api', {
  minimize: () => ipcRenderer.send('win:minimize'),
  toggleMaximize: () => ipcRenderer.send('win:toggle-maximize'),
  close: () => ipcRenderer.send('win:close'),
  onMaximized: (cb) => ipcRenderer.on('win:maximized', (e, v) => cb(v)),
  copyText: (t) => clipboard.writeText(t),
  exportPNG: (rect) => ipcRenderer.invoke('export:png', rect),
  copyImage: (rect) => ipcRenderer.invoke('copy:image', rect)
});
