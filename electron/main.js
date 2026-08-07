const { app, BrowserWindow, shell, Menu } = require('electron')
const path = require('path')

/** Electron 主进程：加载打包好的 dist/index.html，渲染为窗口应用 */
function createWindow() {
  const win = new BrowserWindow({
    width: 420,
    height: 820,
    minWidth: 360,
    minHeight: 640,
    autoHideMenuBar: true,
    backgroundColor: '#ffffff',
    icon: path.join(__dirname, '..', 'public', 'icons', 'icon.ico'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  // 外链统一走系统浏览器（防止 PWA/网页里点击外链弹出新窗口）
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url)
    return { action: 'deny' }
  })

  // 加载生产构建（路径相对于打包后的 electron 目录）
  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  Menu.setApplicationMenu(null)
}

app.whenReady().then(createWindow)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})