import React, { useState, useEffect } from 'react';
import {
  Wifi,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  X,
  Shield,
  Smartphone,
  KeyRound,
  Lock,
  ArrowRight,
  AlertCircle,
  FolderOpen,
  Save,
  RotateCcw,
  Copy,
  Check,
  HardDrive
} from 'lucide-react';
import { useBrainStore } from '../../store/useBrainStore';
import { generatePairingKey } from '@axon/shared';

export const SyncModal: React.FC = () => {
  const {
    isSyncOpen,
    neurons,
    setSyncOpen,
    exportVaultJSON,
    loadVault,
    saveToEternalVault,
    loadFromEternalVault,
    openEternalVaultFolder,
    getEternalVaultInfo,
  } = useBrainStore();

  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedIp, setCopiedIp] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [pairingKey, setPairingKey] = useState<string>('');
  const [localIp, setLocalIp] = useState<string>('127.0.0.1');
  const [vaultInfo, setVaultInfo] = useState<{
    vaultDir: string;
    exists: boolean;
    notesCount: number;
    backupCount: number;
    lastSaved: number | null;
  } | null>(null);

  const [serverPort, setServerPort] = useState<number>(49200);
  const [vaultSaveStatus, setVaultSaveStatus] = useState<string | null>(null);
  const [remoteHost, setRemoteHost] = useState<string>('192.168.1.');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState<string>('');

  useEffect(() => {
    let savedKey = localStorage.getItem('nyron_p2p_pairing_key');
    if (!savedKey) {
      savedKey = generatePairingKey();
      localStorage.setItem('nyron_p2p_pairing_key', savedKey);
    }
    setPairingKey(savedKey);

    // Fetch local IP and server info
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.getLocalIp?.().then((ip) => {
        if (ip) setLocalIp(ip);
      }).catch(() => {});

      window.electronAPI.getSyncServerStatus?.().then((status) => {
        if (status) {
          if (status.ip) setLocalIp(status.ip);
          if (status.port) setServerPort(status.port);
        }
      }).catch(() => {});

      getEternalVaultInfo().then((info) => {
        if (info) setVaultInfo(info);
      }).catch(() => {});
    }
  }, [isSyncOpen, getEternalVaultInfo]);

  if (!isSyncOpen) return null;

  const handleRegenerateKey = () => {
    const newKey = generatePairingKey();
    setPairingKey(newKey);
    localStorage.setItem('nyron_p2p_pairing_key', newKey);
  };

  const copyPairingCode = () => {
    navigator.clipboard?.writeText(pairingKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const copyServerAddress = () => {
    const addr = `${localIp}:${serverPort}`;
    navigator.clipboard?.writeText(addr);
    setCopiedIp(true);
    setTimeout(() => setCopiedIp(false), 2000);
  };

  const handleManualSaveVault = async () => {
    setVaultSaveStatus('Сохранение резервной копии...');
    const res = await saveToEternalVault();
    if (res.success) {
      setVaultSaveStatus('Резервная копия успешно сохранена в Документы/NeironoNotebook_Vault!');
      const info = await getEternalVaultInfo();
      if (info) setVaultInfo(info);
    } else {
      setVaultSaveStatus(`Ошибка: ${res.error || 'Не удалось сохранить'}`);
    }
    setTimeout(() => setVaultSaveStatus(null), 4000);
  };

  const handleRestoreFromFolder = async () => {
    const confirm = window.confirm('Восстановить хранилище из вечной папки в Документах?');
    if (!confirm) return;
    setVaultSaveStatus('Восстановление данных...');
    const res = await loadFromEternalVault();
    if (res.success) {
      setVaultSaveStatus('Хранилище успешно восстановлено из вечной папки!');
    } else {
      setVaultSaveStatus(`Ошибка: ${res.error || 'Не удалось восстановить'}`);
    }
    setTimeout(() => setVaultSaveStatus(null), 4000);
  };

  const handleOpenFolder = async () => {
    await openEternalVaultFolder();
  };

  const handleExport = () => {
    const jsonStr = exportVaultJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nyron-notebook-vault-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setImportStatus('Снимок хранилища сохранен в JSON.');
    setTimeout(() => setImportStatus(null), 3000);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportStatus(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed.neurons)) {
          loadVault(parsed.neurons);
          setImportStatus(`Успешно загружено ${parsed.neurons.length} заметок.`);
        } else {
          setImportError('Неверный формат файла хранилища.');
        }
      } catch {
        setImportError('Ошибка чтения JSON файла.');
      }
    };
    reader.readAsText(file);
  };

  const handleStartP2PSync = async () => {
    setSyncStatus('syncing');
    setSyncMessage(`Подключение к ${remoteHost}...`);

    try {
      const host = remoteHost.includes(':') ? remoteHost : `${remoteHost}:49200`;
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 4000);
      const res = await fetch(`http://${host}/api/sync/ping`, { signal: ctrl.signal });
      clearTimeout(timeout);

      if (res.ok) {
        setSyncStatus('success');
        setSyncMessage(`Соединение установлено! Устройство в сети.`);
      } else {
        setSyncStatus('error');
        setSyncMessage(`Ошибка связи с ${host}: код ${res.status}`);
      }
    } catch (e: any) {
      setSyncStatus('error');
      setSyncMessage(`Устройство ${remoteHost} недоступно в локальной сети.`);
    }

    setTimeout(() => setSyncStatus('idle'), 4500);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fade-in"
      onClick={() => setSyncOpen(false)}
    >
      <div
        className="w-full max-w-xl rounded-3xl border border-white/[0.12] overflow-hidden shadow-2xl bg-[#14151c] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-[#111217]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#10b981]/15 border border-[#10b981]/30 flex items-center justify-center text-[#10b981]">
              <Wifi size={17} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Синхронизация & Вечное Хранилище</span>
                <span className="px-2 py-0.5 rounded-full bg-[#10b981]/20 text-[#10b981] text-[10px] font-mono font-bold">
                  P2P Local
                </span>
              </h3>
              <p className="text-[10px] text-[#94a3b8] font-mono">
                Связь с телефоном по Wi-Fi и защита от случайного удаления
              </p>
            </div>
          </div>
          <button
            onClick={() => setSyncOpen(false)}
            className="p-1.5 rounded-xl text-[#94a3b8] hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[78vh] overflow-y-auto">
          {/* ═════════ 1. ETERNAL VAULT SECTION ═════════ */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#121422] to-[#151728] border border-[#7c5cff]/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-[#7c5cff]" />
                <span className="text-xs font-bold text-white">
                  Вечная папка (Защита от удаления программы)
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#7c5cff]/20 text-[#a78bfa] text-[10px] font-mono font-bold">
                Всегда сохранено
              </span>
            </div>

            <p className="text-[11px] text-[#cbd5e1] leading-relaxed">
              Даже если программа будет удалена с компьютера, все заметки (<span className="text-white font-mono">.md</span>), финансы и холсты надежно сохранены в системной папке <span className="text-white font-semibold">«Документы/NeironoNotebook_Vault»</span>.
            </p>

            {vaultInfo && (
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.06] text-[11px] font-mono space-y-1 text-[#94a3b8]">
                <div className="flex justify-between items-center text-white">
                  <span className="truncate max-w-[320px]" title={vaultInfo.vaultDir}>
                    📁 {vaultInfo.vaultDir}
                  </span>
                  <span className="text-emerald-400 font-bold shrink-0">
                    {vaultInfo.notesCount} .md файлов
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-[#64748b]">
                  <span>История снимков: {vaultInfo.backupCount} версий</span>
                  {vaultInfo.lastSaved && (
                    <span>Сохранено: {new Date(vaultInfo.lastSaved).toLocaleTimeString('ru-RU')}</span>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleOpenFolder}
                className="flex-1 px-3 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border border-white/[0.08]"
              >
                <FolderOpen size={13} className="text-[#38bdf8]" />
                <span>Открыть в Проводнике</span>
              </button>

              <button
                onClick={handleManualSaveVault}
                className="px-3 py-2 rounded-xl bg-[#7c5cff] hover:bg-[#6c48ff] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#7c5cff]/20"
              >
                <Save size={13} />
                <span>Сделать снимок</span>
              </button>

              <button
                onClick={handleRestoreFromFolder}
                className="px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-[#94a3b8] hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-all border border-white/[0.06]"
                title="Восстановить состояние из папки Документы"
              >
                <RotateCcw size={13} />
                <span>Восстановить</span>
              </button>
            </div>

            {vaultSaveStatus && (
              <div className="p-2.5 rounded-xl bg-[#10b981]/15 border border-[#10b981]/30 text-xs text-[#10b981] flex items-center gap-2 font-medium">
                <CheckCircle2 size={13} className="shrink-0" />
                <span>{vaultSaveStatus}</span>
              </div>
            )}
          </div>

          {/* ═════════ 2. PHONE SYNC SECTION (LOCAL WI-FI) ═════════ */}
          <div className="p-4 rounded-2xl bg-[#141522] border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <Smartphone size={15} className="text-[#38bdf8]" />
                <span>Подключение с телефона (ПК ↔ Смартфон)</span>
              </h4>
              <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                Сервер активен (: {serverPort})
              </span>
            </div>

            <p className="text-[11px] text-[#94a3b8]">
              Откройте приложение на телефоне, перейдите в «Синхронизация» и введите локальный адрес компьютера или нажмите «Подключиться»:
            </p>

            {/* IP Address Bar */}
            <div className="p-3 rounded-xl bg-[#0e0f14] border border-white/[0.08] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#64748b] uppercase tracking-wider block font-mono">
                  Локальный адрес компьютера для телефона
                </span>
                <span className="font-mono text-sm font-black text-white tracking-wider">
                  {localIp}:{serverPort}
                </span>
              </div>
              <button
                onClick={copyServerAddress}
                className="px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-xs text-white transition-all font-semibold flex items-center gap-1.5 border border-white/[0.08]"
              >
                {copiedIp ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{copiedIp ? 'Скопировано!' : 'Копировать адрес'}</span>
              </button>
            </div>

            {/* Secret Pairing Key */}
            <div className="p-3 rounded-xl bg-[#0e0f14] border border-white/[0.08] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#64748b] uppercase tracking-wider block font-mono">
                  Секретный PIN-код сопряжения
                </span>
                <span className="font-mono text-sm font-bold text-[#f59e0b] tracking-wider">
                  {pairingKey}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRegenerateKey}
                  className="p-1.5 rounded-lg text-[#64748b] hover:text-white transition-colors"
                  title="Обновить ключ"
                >
                  <RefreshCw size={13} />
                </button>
                <button
                  onClick={copyPairingCode}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-xs text-white transition-all font-semibold flex items-center gap-1.5 border border-white/[0.08]"
                >
                  {copiedKey ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  <span>{copiedKey ? 'Скопировано!' : 'Копировать PIN'}</span>
                </button>
              </div>
            </div>

            {/* Direct Connect Input */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] text-[#94a3b8] block">Или проверьте доступность телефона по IP:</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={remoteHost}
                  onChange={(e) => setRemoteHost(e.target.value)}
                  placeholder="192.168.1.15"
                  className="flex-1 px-3 py-2 rounded-xl bg-[#0e0f14] border border-white/[0.08] text-xs text-white font-mono placeholder:text-[#64748b] focus:outline-none focus:border-[#7c5cff]"
                />
                <button
                  onClick={handleStartP2PSync}
                  disabled={syncStatus === 'syncing'}
                  className="px-4 py-2 rounded-xl bg-[#38bdf8] hover:bg-[#0284c7] text-[#0a0d14] text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {syncStatus === 'syncing' ? (
                    <RefreshCw size={13} className="animate-spin" />
                  ) : (
                    <ArrowRight size={13} />
                  )}
                  <span>{syncStatus === 'syncing' ? 'Проверка...' : 'Проверить связь'}</span>
                </button>
              </div>

              {syncMessage && (
                <div
                  className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                    syncStatus === 'error'
                      ? 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
                      : 'bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981]'
                  }`}
                >
                  {syncStatus === 'error' ? (
                    <AlertCircle size={13} className="shrink-0" />
                  ) : (
                    <CheckCircle2 size={13} className="shrink-0" />
                  )}
                  <span>{syncMessage}</span>
                </div>
              )}
            </div>
          </div>

          {/* ═════════ 3. OFFLINE BACKUP (JSON EXPORT/IMPORT) ═════════ */}
          <div className="space-y-2 pt-2 border-t border-white/[0.08]">
            <h4 className="text-xs font-semibold text-white">Офлайн резервный файл (.json)</h4>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={handleExport}
                className="p-3 rounded-xl bg-[#161720] border border-white/[0.08] hover:border-[#7c5cff]/40 transition-all text-left flex items-center gap-2.5 group"
              >
                <Download size={15} className="text-[#7c5cff] group-hover:scale-110 transition-transform" />
                <div>
                  <h5 className="text-xs font-medium text-white">Экспорт в JSON</h5>
                  <p className="text-[10px] text-[#64748b]">Скачать резервный файл</p>
                </div>
              </button>

              <label className="p-3 rounded-xl bg-[#161720] border border-white/[0.08] hover:border-[#10b981]/40 transition-all text-left flex items-center gap-2.5 group cursor-pointer">
                <Upload size={15} className="text-[#10b981] group-hover:scale-110 transition-transform" />
                <div>
                  <h5 className="text-xs font-medium text-white">Импорт из JSON</h5>
                  <p className="text-[10px] text-[#64748b]">Загрузить файл архива</p>
                </div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>

            {importStatus && (
              <div className="p-2.5 rounded-lg bg-[#10b981]/10 border border-[#10b981]/20 text-xs text-[#10b981] flex items-center gap-2">
                <CheckCircle2 size={13} className="shrink-0" />
                <span>{importStatus}</span>
              </div>
            )}

            {importError && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle size={13} className="shrink-0" />
                <span>{importError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/[0.08] bg-[#0e0f13] text-[10px] text-[#64748b] flex items-center justify-between font-mono">
          <div className="flex items-center gap-1.5">
            <Shield size={11} className="text-[#10b981]" />
            <span>Локальная сеть без облачных серверов</span>
          </div>
          <span>{neurons.length} заметок в базе</span>
        </div>
      </div>
    </div>
  );
};

