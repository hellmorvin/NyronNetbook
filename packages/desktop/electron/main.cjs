const { app, BrowserWindow, globalShortcut, nativeImage, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Prevent GPU cache conflicts on Windows
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');

let mainWindow = null;

const iconPath = path.join(__dirname, 'icon.png');
const appIcon = fs.existsSync(iconPath) ? nativeImage.createFromPath(iconPath) : path.join(__dirname, '../public/logo.png');

if (process.platform === 'win32') {
  if (app.isPackaged) {
    app.setAppUserModelId('com.nyronnotebook.app');
  } else {
    app.setAppUserModelId(process.execPath);
  }
}
app.setName('NyronNotebook');

// IPC Handlers for Custom Window Controls
ipcMain.on('window-minimize', () => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.close();
});

const os = require('os');

ipcMain.handle('window-is-maximized', () => {
  return (mainWindow && !mainWindow.isDestroyed()) ? mainWindow.isMaximized() : false;
});

ipcMain.handle('get-local-ip', () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1050,
    minHeight: 700,
    backgroundColor: '#181818',
    frame: false,
    title: 'NyronNotebook',
    icon: appIcon,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      devTools: !app.isPackaged,
    },
  });

  if (typeof mainWindow.setIcon === 'function' && appIcon) {
    mainWindow.setIcon(appIcon);
  }

  // Security: Disable DevTools shortcuts in production
  if (app.isPackaged) {
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow.webContents.closeDevTools();
    });
  }

  const distPath = path.join(__dirname, '../dist/index.html');

  if (fs.existsSync(distPath)) {
    mainWindow.loadFile(distPath).catch((err) => {
      console.warn('Could not load dist/index.html:', err);
    });
  } else {
    mainWindow.loadURL('http://localhost:3000').catch((err) => {
      console.warn('Could not load localhost:3000:', err);
    });
  }

  // Register shortcut for live refresh and block devtools in production
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (input.key === 'F5' || (input.control && input.key.toLowerCase() === 'r')) {
        mainWindow.reload();
      }
      if (app.isPackaged) {
        if (
          input.key === 'F12' ||
          (input.control && input.shift && (input.key.toLowerCase() === 'i' || input.key.toLowerCase() === 'j')) ||
          (input.control && input.key.toLowerCase() === 'u')
        ) {
          event.preventDefault();
        }
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
