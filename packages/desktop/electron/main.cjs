const { app, BrowserWindow, globalShortcut, nativeImage, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const os = require('os');
const crypto = require('crypto');

// Prevent GPU cache conflicts on Windows
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');

let mainWindow = null;

// ═══════════════════════════════════════════════════════════════════════════════
// 1. ETERNAL VAULT STORAGE (SURVIVES APP DELETION & UNINSTALLATION)
// ═══════════════════════════════════════════════════════════════════════════════
function getVaultDirPath() {
  const documentsDir = app.getPath('documents');
  return path.join(documentsDir, 'NeironoNotebook_Vault');
}

function ensureVaultDirs() {
  const vaultDir = getVaultDirPath();
  const notesDir = path.join(vaultDir, 'notes');
  const backupsDir = path.join(vaultDir, 'backups');
  const canvasesDir = path.join(vaultDir, 'canvases');

  if (!fs.existsSync(vaultDir)) fs.mkdirSync(vaultDir, { recursive: true });
  if (!fs.existsSync(notesDir)) fs.mkdirSync(notesDir, { recursive: true });
  if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
  if (!fs.existsSync(canvasesDir)) fs.mkdirSync(canvasesDir, { recursive: true });

  return { vaultDir, notesDir, backupsDir, canvasesDir };
}

function sanitizeFileName(name) {
  return (name || 'Untitled')
    .replace(/[\\/:*?"<>|]+/g, '_')
    .trim()
    .substring(0, 100);
}

function saveVaultToFilesystem(vaultData) {
  try {
    const { vaultDir, notesDir, backupsDir } = ensureVaultDirs();
    const vaultFile = path.join(vaultDir, 'vault_state.json');

    // 1. Write main state JSON
    const stateWithMeta = {
      ...vaultData,
      _savedAt: new Date().toISOString(),
      _version: '1.1.0',
      _vaultLocation: vaultDir,
    };
    fs.writeFileSync(vaultFile, JSON.stringify(stateWithMeta, null, 2), 'utf8');

    // 2. Write individual markdown note files (human-readable & editable)
    if (Array.isArray(vaultData.neurons)) {
      vaultData.neurons.forEach((n) => {
        const fileName = `${sanitizeFileName(n.title || 'Untitled')}_${n.id.substring(0, 6)}.md`;
        const notePath = path.join(notesDir, fileName);

        const frontmatter = [
          '---',
          `id: "${n.id}"`,
          `title: "${(n.title || '').replace(/"/g, '\\"')}"`,
          `tags: [${(n.tags || []).map((t) => `"${t}"`).join(', ')}]`,
          `created_at: "${n.frontmatter?.created_at || new Date().toISOString()}"`,
          `updated_at: "${n.frontmatter?.updated_at || new Date().toISOString()}"`,
          `folder: "${n.filePath ? path.dirname(n.filePath) : ''}"`,
          '---',
          '',
          n.content || '',
        ].join('\n');

        fs.writeFileSync(notePath, frontmatter, 'utf8');
      });
    }

    // 3. Create timestamped backup snapshot (keep last 15)
    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupsDir, `backup_${timestampStr}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(stateWithMeta, null, 2), 'utf8');

    // Clean old backups if > 15
    const backupFiles = fs
      .readdirSync(backupsDir)
      .filter((f) => f.startsWith('backup_') && f.endsWith('.json'))
      .map((f) => ({
        name: f,
        fullPath: path.join(backupsDir, f),
        time: fs.statSync(path.join(backupsDir, f)).mtimeMs,
      }))
      .sort((a, b) => b.time - a.time);

    if (backupFiles.length > 15) {
      backupFiles.slice(15).forEach((oldFile) => {
        try {
          fs.unlinkSync(oldFile.fullPath);
        } catch {}
      });
    }

    return {
      success: true,
      vaultDir,
      notesCount: vaultData.neurons ? vaultData.neurons.length : 0,
      timestamp: Date.now(),
    };
  } catch (err) {
    console.error('Error saving vault to filesystem:', err);
    return { success: false, error: err.message };
  }
}

function loadVaultFromFilesystem() {
  try {
    const { vaultDir, backupsDir } = ensureVaultDirs();
    const vaultFile = path.join(vaultDir, 'vault_state.json');

    if (fs.existsSync(vaultFile)) {
      const content = fs.readFileSync(vaultFile, 'utf8');
      const data = JSON.parse(content);
      return { success: true, data, vaultDir };
    }

    // Try finding newest backup if main state file is missing
    const backupFiles = fs
      .readdirSync(backupsDir)
      .filter((f) => f.startsWith('backup_') && f.endsWith('.json'))
      .map((f) => ({
        fullPath: path.join(backupsDir, f),
        time: fs.statSync(path.join(backupsDir, f)).mtimeMs,
      }))
      .sort((a, b) => b.time - a.time);

    if (backupFiles.length > 0) {
      const newestBackup = backupFiles[0].fullPath;
      const content = fs.readFileSync(newestBackup, 'utf8');
      const data = JSON.parse(content);
      return { success: true, data, vaultDir, restoredFromBackup: true };
    }

    return { success: false, error: 'Хранилище пока не содержит сохраненных данных' };
  } catch (err) {
    console.error('Error loading vault from filesystem:', err);
    return { success: false, error: err.message };
  }
}

function getVaultInfo() {
  try {
    const { vaultDir, notesDir, backupsDir } = ensureVaultDirs();
    const vaultFile = path.join(vaultDir, 'vault_state.json');
    const exists = fs.existsSync(vaultFile);

    let notesCount = 0;
    if (fs.existsSync(notesDir)) {
      notesCount = fs.readdirSync(notesDir).filter((f) => f.endsWith('.md')).length;
    }

    let backupCount = 0;
    if (fs.existsSync(backupsDir)) {
      backupCount = fs.readdirSync(backupsDir).filter((f) => f.endsWith('.json')).length;
    }

    let lastSaved = null;
    if (exists) {
      lastSaved = fs.statSync(vaultFile).mtimeMs;
    }

    return {
      vaultDir,
      exists,
      notesCount,
      backupCount,
      lastSaved,
    };
  } catch (err) {
    return {
      vaultDir: getVaultDirPath(),
      exists: false,
      notesCount: 0,
      backupCount: 0,
      lastSaved: null,
      error: err.message,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. LOCAL SYNC SERVER (PHONE ↔ PC BIDIRECTIONAL FAST SYNC)
// ═══════════════════════════════════════════════════════════════════════════════
let syncServer = null;
const SYNC_PORT = 49200;
let activePairingKey = '';

function getAllNetworkInterfaces() {
  const interfaces = os.networkInterfaces();
  const list = [];

  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        const lower = name.toLowerCase();
        let type = 'other';
        let isVirtual = false;
        let label = name;

        if (
          lower.includes('vethernet') ||
          lower.includes('virtualbox') ||
          lower.includes('vmware') ||
          lower.includes('wsl') ||
          lower.includes('hyper-v') ||
          lower.includes('tailscale') ||
          lower.includes('zerotier') ||
          lower.includes('docker')
        ) {
          type = 'virtual';
          isVirtual = true;
          label = `${name} (Виртуальный адаптер)`;
        } else if (
          lower.includes('wi-fi') ||
          lower.includes('wifi') ||
          lower.includes('беспровод') ||
          lower.includes('wireless') ||
          lower.includes('wlan')
        ) {
          type = 'wifi';
          label = `${name} (Беспроводная сеть Wi-Fi)`;
        } else if (
          lower.includes('hotspot') ||
          lower.includes('точка') ||
          lower.includes('direct') ||
          net.address.startsWith('192.168.137.')
        ) {
          type = 'hotspot';
          label = `${name} (Точка доступа / Hotspot)`;
        } else if (lower.includes('ethernet') || lower.includes('сеть') || lower.includes('eth')) {
          type = 'ethernet';
          label = `${name} (Проводная сеть Ethernet)`;
        }

        list.push({
          name,
          address: net.address,
          type,
          label,
          isVirtual,
        });
      }
    }
  }

  // Priority sorting: Wi-Fi (1), Hotspot (2), Ethernet (3), Other (4), Virtual (5)
  list.sort((a, b) => {
    const priority = { wifi: 1, hotspot: 2, ethernet: 3, other: 4, virtual: 5 };
    return (priority[a.type] || 4) - (priority[b.type] || 4);
  });

  return list;
}

function getLocalIpAddress() {
  const list = getAllNetworkInterfaces();
  const nonVirtual = list.find((i) => !i.isVirtual);
  if (nonVirtual) return nonVirtual.address;
  if (list.length > 0) return list[0].address;
  return '127.0.0.1';
}

function startSyncServer() {
  if (syncServer) return;

  syncServer = http.createServer((req, res) => {
    // Enable CORS for mobile app & webviews
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Pairing-Key');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://localhost:${SYNC_PORT}`);
    const clientKey = (req.headers['x-pairing-key'] || url.searchParams.get('key') || '')
      .toString()
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
    const cleanExpectedKey = activePairingKey.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Ping endpoint
    if (url.pathname === '/api/sync/ping' && req.method === 'GET') {
      const isKeyValid = cleanExpectedKey ? clientKey === cleanExpectedKey : true;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: 'ok',
          app: 'Nyron',
          device: 'Desktop',
          version: '1.1.0',
          ip: getLocalIpAddress(),
          allIps: getAllNetworkInterfaces().map((i) => i.address),
          interfaces: getAllNetworkInterfaces(),
          hostname: os.hostname(),
          isKeyValid,
          hasKeyConfigured: !!cleanExpectedKey,
          time: Date.now(),
        })
      );
      return;
    }

    // Get current vault endpoint
    if (url.pathname === '/api/sync/vault' && req.method === 'GET') {
      if (cleanExpectedKey && clientKey !== cleanExpectedKey) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Требуется верный PIN-код сопряжения' }));
        return;
      }
      const result = loadVaultFromFilesystem();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      return;
    }

    // Sync / Post vault endpoint
    if (url.pathname === '/api/sync/vault' && req.method === 'POST') {
      if (cleanExpectedKey && clientKey !== cleanExpectedKey) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Требуется верный PIN-код сопряжения' }));
        return;
      }
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });

      req.on('end', () => {
        try {
          const remotePayload = JSON.parse(body);
          const currentVaultRes = loadVaultFromFilesystem();
          const currentVault = currentVaultRes.success ? currentVaultRes.data : {};

          // Intelligent merge:
          // Merge neurons
          const mergedNeuronsMap = new Map();
          const currentNeurons = currentVault.neurons || [];
          const remoteNeurons = remotePayload.neurons || [];

          currentNeurons.forEach((n) => mergedNeuronsMap.set(n.id, n));
          remoteNeurons.forEach((rn) => {
            const existing = mergedNeuronsMap.get(rn.id);
            if (!existing) {
              mergedNeuronsMap.set(rn.id, rn);
            } else {
              const remoteTime = new Date(rn.frontmatter?.updated_at || 0).getTime();
              const localTime = new Date(existing.frontmatter?.updated_at || 0).getTime();
              if (remoteTime >= localTime) {
                mergedNeuronsMap.set(rn.id, rn);
              }
            }
          });

          // Merge transactions
          const txMap = new Map();
          (currentVault.transactions || []).forEach((t) => txMap.set(t.id, t));
          (remotePayload.transactions || []).forEach((t) => txMap.set(t.id, t));

          // Merge shifts
          const shiftMap = new Map();
          (currentVault.shifts || []).forEach((s) => shiftMap.set(s.date || s.id, s));
          (remotePayload.shifts || []).forEach((s) => shiftMap.set(s.date || s.id, s));

          // Merge canvas cards & connections
          const cardMap = new Map();
          (currentVault.canvasCards || []).forEach((c) => cardMap.set(c.id, c));
          (remotePayload.canvasCards || []).forEach((c) => cardMap.set(c.id, c));

          const mergedState = {
            ...currentVault,
            ...remotePayload,
            neurons: Array.from(mergedNeuronsMap.values()),
            transactions: Array.from(txMap.values()),
            shifts: Array.from(shiftMap.values()),
            canvasCards: Array.from(cardMap.values()),
            canvasConnections: remotePayload.canvasConnections || currentVault.canvasConnections || [],
            savingsGoals: remotePayload.savingsGoals || currentVault.savingsGoals || [],
            bankDeposits: remotePayload.bankDeposits || currentVault.bankDeposits || [],
          };

          // Save merged state to eternal filesystem vault
          saveVaultToFilesystem(mergedState);

          // Broadcast to Desktop UI window so changes appear in real time
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('vault-synced-from-remote', mergedState);
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              success: true,
              message: 'Хранилище успешно объединено и сохранено',
              mergedNeuronsCount: mergedState.neurons.length,
              mergedTransactionsCount: mergedState.transactions.length,
              vault: mergedState,
            })
          );
        } catch (err) {
          console.error('Error handling sync POST:', err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
  });

  syncServer.on('error', (err) => {
    console.warn(`Sync server port ${SYNC_PORT} error:`, err.message);
  });

  syncServer.listen(SYNC_PORT, '0.0.0.0', () => {
    console.log(`NeironoNotebook Local Sync Server running on http://${getLocalIpAddress()}:${SYNC_PORT}`);
  });
}

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

ipcMain.handle('window-is-maximized', () => {
  return (mainWindow && !mainWindow.isDestroyed()) ? mainWindow.isMaximized() : false;
});

ipcMain.handle('get-local-ip', () => {
  return getLocalIpAddress();
});

// IPC Handlers for Eternal Vault Filesystem Persistence
ipcMain.handle('save-vault-backup', (_, vaultData) => {
  return saveVaultToFilesystem(vaultData);
});

ipcMain.handle('load-vault-backup', () => {
  return loadVaultFromFilesystem();
});

ipcMain.handle('get-vault-info', () => {
  return getVaultInfo();
});

ipcMain.handle('open-vault-folder', () => {
  const vaultDir = getVaultDirPath();
  ensureVaultDirs();
  shell.openPath(vaultDir);
  return vaultDir;
});

ipcMain.handle('get-all-network-interfaces', () => {
  return getAllNetworkInterfaces();
});

ipcMain.handle('set-sync-pairing-key', (_, key) => {
  activePairingKey = (key || '').toString();
  return true;
});

ipcMain.handle('get-sync-server-status', () => {
  return {
    isRunning: syncServer !== null,
    port: SYNC_PORT,
    ip: getLocalIpAddress(),
    allIps: getAllNetworkInterfaces().map((i) => i.address),
    interfaces: getAllNetworkInterfaces(),
    vaultDir: getVaultDirPath(),
    pairingKey: activePairingKey,
  };
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1050,
    minHeight: 700,
    backgroundColor: '#181818',
    frame: false,
    title: 'Nyron',
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
  startSyncServer();
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
