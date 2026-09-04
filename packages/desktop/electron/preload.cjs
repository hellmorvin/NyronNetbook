const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  getLocalIp: () => ipcRenderer.invoke('get-local-ip'),
  
  // Eternal Vault Persistence (Safe from app deletion/uninstallation)
  saveVaultToFilesystem: (vaultData) => ipcRenderer.invoke('save-vault-backup', vaultData),
  loadVaultFromFilesystem: () => ipcRenderer.invoke('load-vault-backup'),
  getVaultInfo: () => ipcRenderer.invoke('get-vault-info'),
  openVaultFolder: () => ipcRenderer.invoke('open-vault-folder'),
  
  // Local Sync Server
  getSyncServerStatus: () => ipcRenderer.invoke('get-sync-server-status'),
  getAllNetworkInterfaces: () => ipcRenderer.invoke('get-all-network-interfaces'),
  setSyncPairingKey: (key) => ipcRenderer.invoke('set-sync-pairing-key', key),
  onVaultSyncedFromRemote: (callback) => {
    const handler = (_, data) => callback(data);
    ipcRenderer.on('vault-synced-from-remote', handler);
    return () => ipcRenderer.removeListener('vault-synced-from-remote', handler);
  },

  isElectron: true,
});

