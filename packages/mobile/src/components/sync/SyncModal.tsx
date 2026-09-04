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
  Laptop,
  Check,
  Zap,
  FolderDown,
  Database,
  Camera,
  Radio,
  QrCode,
  Search,
  ClipboardPaste
} from 'lucide-react';
import { useBrainStore } from '../../store/useBrainStore';
import { p2pSyncService, SyncStatus } from '../../services/mobileP2PSyncService';
import { decodeSyncQRPayload } from '@axon/shared';
import { QRScannerModal } from './QRScannerModal';

export const SyncModal: React.FC = () => {
  const {
    isSyncOpen,
    neurons,
    transactions,
    shifts,
    canvasCards,
    canvasConnections,
    savingsGoals,
    bankDeposits,
    setSyncOpen,
    exportVaultJSON,
    loadVaultFullState,
  } = useBrainStore();

  const [copied, setCopied] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [pairingKey, setPairingKey] = useState<string>(p2pSyncService.getPairingKey());
  const [remoteHost, setRemoteHost] = useState<string>(
    localStorage.getItem('axon_remote_ip') || '192.168.148.152'
  );

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [syncState, setSyncState] = useState<SyncStatus>(p2pSyncService.getStatus());
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const savedKey = p2pSyncService.getPairingKey();
    if (savedKey) setPairingKey(savedKey);

    const unsubscribe = p2pSyncService.subscribe((status) => {
      setSyncState(status);
      if (status.remoteIp) setRemoteHost(status.remoteIp);
      if (status.pairingKey) setPairingKey(status.pairingKey);
    });
    return () => unsubscribe();
  }, [isSyncOpen]);

  if (!isSyncOpen) return null;

  const handleKeyChange = (val: string) => {
    const cleaned = val.toUpperCase().trim();
    setPairingKey(cleaned);
    p2pSyncService.setPairingKey(cleaned);
  };

  const handlePasteKey = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        handleKeyChange(text);
      }
    } catch {
      // ignore
    }
  };

  const handlePingDesktop = async () => {
    setIsTesting(true);
    setTestResult(null);
    p2pSyncService.setRemoteIp(remoteHost);
    p2pSyncService.setPairingKey(pairingKey);

    const res = await p2pSyncService.pingDesktop(remoteHost, pairingKey);
    setIsTesting(false);

    if (res.ok) {
      setTestResult({
        ok: true,
        message: `🟢 Компьютер найден! (${res.info?.app || 'Nyron'} Desktop, IP: ${res.info?.ip || remoteHost})`,
      });
    } else {
      setTestResult({
        ok: false,
        message: `🔴 Не удалось связаться с ${remoteHost}:49200. ${res.error || 'Проверьте, что приложение на ПК открыто.'}`,
      });
    }
    setTimeout(() => setTestResult(null), 5000);
  };

  const handleAutoDiscover = async () => {
    setIsSearching(true);
    setTestResult(null);
    const res = await p2pSyncService.autoDiscoverDesktop([
      remoteHost,
      '192.168.148.152',
      '192.168.137.1',
      '192.168.43.1',
    ]);
    setIsSearching(false);

    if (res.ok && res.ip) {
      setRemoteHost(res.ip);
      setTestResult({
        ok: true,
        message: `🟢 Компьютер успешно найден в сети! Адрес: ${res.ip}`,
      });
    } else {
      setTestResult({
        ok: false,
        message: '🔴 Компьютер не найден автоматически. Отсканируйте QR-код на экране ПК или введите IP вручную.',
      });
    }
    setTimeout(() => setTestResult(null), 5000);
  };

  const handleStartRealSync = async () => {
    p2pSyncService.setRemoteIp(remoteHost);
    p2pSyncService.setPairingKey(pairingKey);

    await p2pSyncService.syncWithDesktop(
      () => ({
        neurons,
        transactions,
        shifts,
        canvasCards,
        canvasConnections,
        savingsGoals,
      }),
      (mergedVault) => {
        loadVaultFullState(mergedVault);
      },
      (successMsg) => {
        setImportStatus(`✅ ${successMsg}`);
        setTimeout(() => setImportStatus(null), 4000);
      }
    );
  };

  // Handle QR scan detection
  const handleQRDetected = async (decodedText: string) => {
    setIsScannerOpen(false);
    const payload = decodeSyncQRPayload(decodedText);

    if (!payload) {
      setImportError('QR-код не содержит параметров синхронизации Nyron.');
      setTimeout(() => setImportError(null), 4000);
      return;
    }

    if (payload.key) {
      handleKeyChange(payload.key);
    }

    if (payload.ips && payload.ips.length > 0) {
      setRemoteHost(payload.ips[0]);
    }

    setImportStatus('⚡ Подключение по QR-коду и синхронизация...');

    const res = await p2pSyncService.connectWithQRPayload(
      payload,
      () => ({
        neurons,
        transactions,
        shifts,
        canvasCards,
        canvasConnections,
        savingsGoals,
      }),
      (mergedVault) => {
        loadVaultFullState(mergedVault);
      },
      (msg) => {
        setImportStatus(`✅ ${msg}`);
        setTimeout(() => setImportStatus(null), 4000);
      }
    );

    if (!res.success) {
      setImportError(res.error || 'Не удалось подключиться к ПК по QR-коду.');
      setTimeout(() => setImportError(null), 5000);
    }
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
    setImportStatus('Резервная копия сохранена в Загрузки.');
    setTimeout(() => setImportStatus(null), 4000);
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
        if (parsed && typeof parsed === 'object') {
          loadVaultFullState(parsed);
          setImportStatus(`Успешно восстановлено ${parsed.neurons?.length || 0} заметок!`);
        } else {
          setImportError('Неверный формат файла хранилища.');
        }
      } catch {
        setImportError('Ошибка чтения JSON файла.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 select-none animate-fade-in"
        onClick={() => setSyncOpen(false)}
      >
        <div
          className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-white/[0.12] overflow-hidden shadow-2xl bg-[#14151c] flex flex-col max-h-[92vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-[#111217]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#38bdf8]/15 border border-[#38bdf8]/30 flex items-center justify-center text-[#38bdf8]">
                <Wifi size={17} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>Синхронизация с ПК</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-mono font-bold">
                    P2P Direct
                  </span>
                </h3>
                <p className="text-[10px] text-[#94a3b8] font-mono">
                  Связь по QR-коду, Wi-Fi или Точке доступа
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

          {/* Body */}
          <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
            {/* ═════════ 1. BIG PRIMARY ACTION: SCAN QR CODE ═════════ */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1a1e36] to-[#121422] border border-[#38bdf8]/40 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <QrCode size={16} className="text-[#38bdf8]" />
                  <span>Самый простой способ: по QR-коду</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#38bdf8]/20 text-[#38bdf8] text-[9px] font-bold">
                  Без ввода IP
                </span>
              </div>

              <p className="text-[11px] text-[#cbd5e1] leading-relaxed">
                Откройте меню <b>«Синхронизация»</b> на компьютере и наведите камеру на большой QR-код на мониторе.
              </p>

              <button
                onClick={() => setIsScannerOpen(true)}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#6366f1] hover:opacity-95 active:scale-[0.99] text-[#0a0b10] font-extrabold text-xs shadow-lg shadow-[#38bdf8]/20 flex items-center justify-center gap-2 transition-all"
              >
                <Camera size={16} />
                <span>Сканировать QR-код с экрана ПК</span>
              </button>
            </div>

            {/* ═════════ 2. MANUAL IP & NETWORK MODES ═════════ */}
            <div className="p-4 rounded-2xl bg-[#141522] border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Radio size={14} className="text-[#a78bfa]" />
                  <span>Ручное подключение (IP и PIN-код)</span>
                </span>
                <button
                  onClick={handleAutoDiscover}
                  disabled={isSearching}
                  className="text-[10px] text-[#38bdf8] hover:underline flex items-center gap-1 font-semibold disabled:opacity-50"
                >
                  {isSearching ? <RefreshCw size={11} className="animate-spin" /> : <Search size={11} />}
                  <span>Найти ПК в сети</span>
                </button>
              </div>

              {/* Quick Network Preset Buttons */}
              <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                <button
                  onClick={() => setRemoteHost('192.168.148.152')}
                  className="px-2 py-1.5 rounded-lg bg-black/40 border border-white/[0.08] hover:border-[#38bdf8]/40 text-[10px] text-[#cbd5e1] text-center truncate"
                  title="Текущая сеть Wi-Fi"
                >
                  📶 Wi-Fi 148.152
                </button>
                <button
                  onClick={() => setRemoteHost('192.168.43.1')}
                  className="px-2 py-1.5 rounded-lg bg-black/40 border border-white/[0.08] hover:border-[#38bdf8]/40 text-[10px] text-[#cbd5e1] text-center truncate"
                  title="Раздача с телефона"
                >
                  📱 Хотспот 43.1
                </button>
                <button
                  onClick={() => setRemoteHost('192.168.137.1')}
                  className="px-2 py-1.5 rounded-lg bg-black/40 border border-white/[0.08] hover:border-[#38bdf8]/40 text-[10px] text-[#cbd5e1] text-center truncate"
                  title="Хотспот с компьютера Windows"
                >
                  💻 Хотспот 137.1
                </button>
              </div>

              {/* IP Input */}
              <div className="space-y-1">
                <label className="text-[10px] text-[#64748b] block uppercase tracking-wider font-mono">
                  IP-адрес компьютера
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={remoteHost}
                    onChange={(e) => setRemoteHost(e.target.value)}
                    placeholder="192.168.148.152 или 192.168.1.15"
                    className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/[0.1] text-xs text-white font-mono placeholder:text-[#64748b] focus:outline-none focus:border-[#38bdf8]"
                  />
                  <button
                    onClick={handlePingDesktop}
                    disabled={isTesting}
                    className="px-3.5 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-xs font-bold text-white transition-all border border-white/[0.08] shrink-0"
                  >
                    {isTesting ? <RefreshCw size={12} className="animate-spin" /> : 'Тест'}
                  </button>
                </div>
              </div>

              {/* Pairing PIN Input */}
              <div className="space-y-1">
                <label className="text-[10px] text-[#64748b] block uppercase tracking-wider font-mono">
                  Секретный PIN сопряжения с экрана ПК
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={pairingKey}
                    onChange={(e) => handleKeyChange(e.target.value)}
                    placeholder="NYRON-XXXX-YYYY"
                    className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/[0.1] text-xs text-[#f59e0b] font-mono font-bold tracking-wider placeholder:text-[#64748b] focus:outline-none focus:border-[#f59e0b]"
                  />
                  <button
                    onClick={handlePasteKey}
                    className="px-3 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-xs font-semibold text-white transition-all border border-white/[0.08] flex items-center gap-1 shrink-0"
                    title="Вставить из буфера обмена"
                  >
                    <ClipboardPaste size={13} />
                    <span>Вставить</span>
                  </button>
                </div>
              </div>

              {testResult && (
                <div
                  className={`p-2.5 rounded-xl text-xs flex items-center gap-2 font-medium ${
                    testResult.ok
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                  }`}
                >
                  {testResult.ok ? <CheckCircle2 size={14} className="shrink-0" /> : <AlertCircle size={14} className="shrink-0" />}
                  <span className="leading-tight">{testResult.message}</span>
                </div>
              )}

              {/* Big Sync Button */}
              <button
                onClick={handleStartRealSync}
                disabled={syncState.state === 'syncing' || syncState.state === 'connecting'}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#7c5cff] via-[#6366f1] to-[#38bdf8] hover:opacity-95 active:scale-[0.99] disabled:opacity-50 text-white font-extrabold text-xs shadow-lg shadow-[#7c5cff]/25 flex items-center justify-center gap-2 transition-all"
              >
                {syncState.state === 'syncing' || syncState.state === 'connecting' ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Синхронизация данных с компьютером...</span>
                  </>
                ) : (
                  <>
                    <Zap size={14} className="text-amber-300 fill-amber-300" />
                    <span>Синхронизировать сейчас (1 нажатие)</span>
                  </>
                )}
              </button>

              {syncState.errorMessage && (
                <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{syncState.errorMessage}</span>
                </div>
              )}
            </div>

            {/* ═════════ 3. ETERNAL OFFLINE BACKUP ═════════ */}
            <div className="p-4 rounded-2xl bg-[#141522] border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Shield size={14} className="text-emerald-400" />
                  <span>Офлайн резервное хранилище</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">100% Offline</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={handleExport}
                  className="p-3 rounded-xl bg-black/40 border border-white/[0.08] hover:border-emerald-500/40 transition-all text-left flex items-center gap-2 active:scale-95 group"
                >
                  <FolderDown size={16} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <h5 className="text-xs font-bold text-white">Экспорт .json</h5>
                    <p className="text-[9px] text-[#64748b]">Сохранить в Файлы</p>
                  </div>
                </button>

                <label className="p-3 rounded-xl bg-black/40 border border-white/[0.08] hover:border-[#38bdf8]/40 transition-all text-left flex items-center gap-2 active:scale-95 group cursor-pointer">
                  <Database size={16} className="text-[#38bdf8] group-hover:scale-110 transition-transform" />
                  <div>
                    <h5 className="text-xs font-bold text-white">Импорт .json</h5>
                    <p className="text-[9px] text-[#64748b]">Восстановить</p>
                  </div>
                  <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                </label>
              </div>

              {importStatus && (
                <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2 font-medium">
                  <CheckCircle2 size={14} className="shrink-0" />
                  <span>{importStatus}</span>
                </div>
              )}

              {importError && (
                <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{importError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-3.5 border-t border-white/[0.08] bg-[#0e0f13] text-[10px] text-[#64748b] flex items-center justify-between font-mono">
            <span>{neurons.length} заметок в базе</span>
            <span>Прямое P2P сопряжение</span>
          </div>
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleQRDetected}
      />
    </>
  );
};
