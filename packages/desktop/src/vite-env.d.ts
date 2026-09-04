/// <reference types="vite/client" />

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  const src: string;
  export default src;
}

declare module '*.webp' {
  const src: string;
  export default src;
}

interface Window {
  electronAPI?: {
    minimize?: () => void;
    maximize?: () => void;
    close?: () => void;
    isMaximized?: () => Promise<boolean>;
    getLocalIp?: () => Promise<string>;
    saveVaultToFilesystem?: (data: any) => Promise<{ success: boolean; vaultDir?: string; notesCount?: number; timestamp?: number; error?: string }>;
    loadVaultFromFilesystem?: () => Promise<{ success: boolean; data?: any; vaultDir?: string; restoredFromBackup?: boolean; error?: string }>;
    getVaultInfo?: () => Promise<{ vaultDir: string; exists: boolean; notesCount: number; backupCount: number; lastSaved: number | null }>;
    openVaultFolder?: () => Promise<string>;
    getSyncServerStatus?: () => Promise<{ isRunning: boolean; port: number; ip: string; allIps?: string[]; interfaces?: Array<{ name: string; address: string; type: string; label: string; isVirtual: boolean }>; vaultDir: string; pairingKey?: string }>;
    getAllNetworkInterfaces?: () => Promise<Array<{ name: string; address: string; type: string; label: string; isVirtual: boolean }>>;
    setSyncPairingKey?: (key: string) => Promise<boolean>;
    onVaultSyncedFromRemote?: (callback: (data: any) => void) => () => void;
    isElectron?: boolean;
  };
}

