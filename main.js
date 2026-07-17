// LaTeX Formula Studio —— 主进程
const { app, BrowserWindow, ipcMain, dialog, clipboard, nativeImage } = require('electron');
const fs = require('fs');
const path = require('path');

let win = null;
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
  });
}

function createWindow() {
  win = new BrowserWindow({
    width: 1080,
    height: 860,
    minWidth: 880,
    minHeight: 620,
    frame: false,                 // 自绘苹果风标题栏
    backgroundColor: '#f5f5f7',
    show: false,
    title: 'LaTeX 公式生成器',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  win.once('ready-to-show', () => win.show());

  win.on('maximize', () => win.webContents.send('win:maximized', true));
  win.on('unmaximize', () => win.webContents.send('win:maximized', false));

  // ---- 沙盒冒烟测试钩子（仅测试用，不影响正常使用）----
  if (process.env.SMOKE_TEST) {
    const logs = [];
    const wc = win.webContents;
    wc.on('console-message', (e, level, message) => {
      logs.push('[console] ' + (message !== undefined ? message : JSON.stringify(e)));
    });
    const shot = async (name) => {
      const img = await wc.capturePage();
      fs.writeFileSync('/tmp/' + name, img.toPNG());
      console.log('SHOT_OK ' + name);
    };
    wc.on('did-finish-load', () => {
      setTimeout(async () => {
        try {
          await shot('smoke1.png');
          // 填入复杂公式并滚动到编辑/输出区（打开源码抽屉）
          await wc.executeJavaScript(`
            (() => {
              const mf = document.getElementById('mf');
              mf.value = '\\int_{a}^{b} \\frac{f(x)}{\\sqrt{1+x^2}} \\,\\mathrm{d}x = \\sum_{n=0}^{\\infty} \\frac{c_n}{n!}';
              mf.dispatchEvent(new Event('input', {bubbles: true}));
              document.getElementById('btnSrc').click();
              document.getElementById('out').scrollIntoView({block: 'center'});
              document.querySelector('.workspace').scrollTop -= 120;
            })();
          `);
          await new Promise(r => setTimeout(r, 600));
          await shot('smoke2.png');
          // 深色模式 + 回顶部
          await wc.executeJavaScript(`
            document.getElementById('btnTheme').click();
            document.querySelector('.workspace').scrollTop = 0;
          `);
          await new Promise(r => setTimeout(r, 500));
          await shot('smoke3.png');
          // 交互逻辑断言
          const testRes = await wc.executeJavaScript(`
            (() => {
              const out = [];
              const mf = document.getElementById('mf');
              mf.focus();
              mf.setValue('');
              document.querySelectorAll('.chip')[0].click();
              out.push(['chip_insert', mf.value.indexOf('frac') !== -1]);
              document.querySelectorAll('#symGrid .sym')[0].click();
              out.push(['sym_insert', mf.value.indexOf('pm') !== -1]);
              const src = document.getElementById('srcEditor');
              src.value = 'E = mc^2';
              src.dispatchEvent(new Event('input', {bubbles: true}));
              out.push(['src_sync', mf.value.indexOf('mc') !== -1]);
              out.push(['output', document.getElementById('out').textContent.indexOf('mc') !== -1]);
              document.querySelectorAll('#libSeg button')[1].click();
              const exItem = document.querySelector('.lib-item');
              exItem.click();
              out.push(['example_load', mf.value.indexOf('a') !== -1 && mf.value.indexOf('c^2') !== -1]);
              return JSON.stringify(out);
            })();
          `);
          console.log('LOGIC_TEST ' + testRes);
          // 占位方框视觉验证：清空后仅插入分式模板
          await wc.executeJavaScript(`
            (() => {
              const mf = document.getElementById('mf');
              mf.setValue(''); mf.blur();
              document.querySelectorAll('.chip')[0].click();
              document.getElementById('editCard').scrollIntoView({block: 'center'});
            })();
          `);
          await new Promise(r => setTimeout(r, 500));
          await shot('smoke4.png');
        } catch (err) {
          console.log('SMOKE_ERR ' + err.message);
        }
        if (logs.length) console.log(logs.join('\n'));
        console.log('SMOKE_DONE');
        app.exit(0);
      }, 1500);
    });
  }
}

// ---- 窗口控制 IPC ----
ipcMain.on('win:minimize', () => win && win.minimize());
ipcMain.on('win:toggle-maximize', () => {
  if (!win) return;
  if (win.isMaximized()) win.unmaximize(); else win.maximize();
});
ipcMain.on('win:close', () => win && win.close());

// ---- 导出预览区为 PNG ----
ipcMain.handle('export:png', async (e, rect) => {
  if (!win) return { saved: false };
  try {
    const img = await win.webContents.capturePage(rect);
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: '导出公式图片',
      defaultPath: path.join(app.getPath('pictures'), '公式.png'),
      filters: [{ name: 'PNG 图片', extensions: ['png'] }]
    });
    if (canceled || !filePath) return { saved: false };
    fs.writeFileSync(filePath, img.toPNG());
    return { saved: true, path: filePath };
  } catch (err) {
    return { saved: false, error: err.message };
  }
});

// ---- 复制预览区为图片到剪贴板 ----
ipcMain.handle('copy:image', async (e, rect) => {
  if (!win) return false;
  try {
    const img = await win.webContents.capturePage(rect);
    clipboard.writeImage(nativeImage.createFromBuffer(img.toPNG()));
    return true;
  } catch (err) {
    return false;
  }
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
