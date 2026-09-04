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
import {
  decodeSyncQRPayload,
  isVaultQRPayload,
  decompressVaultFromQR,
  compressVaultForQR,
} from '@axon/shared';
import { QRScannerModal } from './QRScannerModal';
import { QRCodeView } from './QRCodeView';

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
    localStorage.getItem('axon_remote_ip') || '192.168.148.173'
  );

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [showMyQrModal, setShowMyQrModal] = useState(false);
  const [myQrString, setMyQrString] = useState<string>('');
  const [myQrSize, setMyQrSize] = useState<number>(0);
  const [isGeneratingMyQr, setIsGeneratingMyQr] = useState<boolean>(false);

  const [syncState, setSyncState] = useState<SyncStatus>(p2pSyncService.getStatus());
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [clipboardData, setClipboardData] = useState<string | null>(null);

  useEffect(() => {
    const savedKey = p2pSyncService.getPairingKey();
    if (savedKey) setPairingKey(savedKey);

    const unsubscribe = p2pSyncService.subscribe((status) => {
      setSyncState(status);
      if (status.remoteIp) setRemoteHost(status.remoteIp);
      if (status.pairingKey !== undefined) setPairingKey(status.pairingKey);
    });

    // Check if user already copied QR text from phone camera to clipboard
    if (isSyncOpen && typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
      navigator.clipboard.readText()
        .then((text) => {
          if (text) {
            const trimmed = text.trim();
            if (
              (trimmed.startsWith('{') && (trimmed.includes('"app"') || trimmed.includes('"ips"') || trimmed.includes('"neurons"'))) ||
              trimmed.startsWith('nyron://')
            ) {
              setClipboardData(trimmed);
            }
          }
        })
        .catch(() => {
          // ignore
        });
    }

    return () => unsubscribe();
  }, [isSyncOpen]);

  if (!isSyncOpen) return null;

  const handleKeyChange = (val: string) => {
    const trimmed = val.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('nyron://')) {
      handleQRDetected(trimmed);
      return;
    }
    const cleaned = val.toUpperCase().trim();
    setPairingKey(cleaned);
    p2pSyncService.setPairingKey(cleaned);
  };

  const handleRemoteHostChange = (val: string) => {
    const trimmed = val.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('nyron://')) {
      handleQRDetected(trimmed);
      return;
    }
    setRemoteHost(val);
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

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        setImportError('Буфер обмена пуст. Скопируйте QR-текст из камеры или приложения на ПК.');
        setTimeout(() => setImportError(null), 4000);
        return;
      }
      const trimmed = text.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('nyron://') || trimmed.includes('"ips"')) {
        handleQRDetected(trimmed);
      } else if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(trimmed)) {
        setRemoteHost(trimmed);
        setImportStatus(`Установлен IP компьютера: ${trimmed}`);
        setTimeout(() => setImportStatus(null), 3000);
      } else if (trimmed.startsWith('NYRON-') || /^[A-Z0-9-]{4,12}$/i.test(trimmed)) {
        handleKeyChange(trimmed);
        setImportStatus(`Установлен PIN сопряжения: ${trimmed}`);
        setTimeout(() => setImportStatus(null), 3000);
      } else {
        handleQRDetected(trimmed);
      }
    } catch {
      setImportError('Не удалось прочитать буфер. Разрешите доступ или вставьте данные в поле.');
      setTimeout(() => setImportError(null), 4000);
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
      '192.168.148.173',
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
        message: '🔴 Компьютер не найден автоматически. Отсканируйте QR-код на экране ПК или укажите IP вручную.',
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

  // Handle QR scan detection (both LAN Wi-Fi sync and Offline direct Vault)
  const handleQRDetected = async (decodedText: string) => {
    setIsScannerOpen(false);

    // 1. Direct Visual QR Vault (100% Offline, no Wi-Fi/network needed)
    if (isVaultQRPayload(decodedText)) {
      setImportStatus('⚡ Распаковка базы из QR-кода (Офлайн)...');
      try {
        const vault = await decompressVaultFromQR(decodedText);
        if (vault && (Array.isArray(vault.neurons) || vault.app === 'nyron-vault')) {
          loadVaultFullState(vault);
          const count = vault.neurons?.length || 0;
          setImportStatus(`🎉 База успешно перенесена по QR-коду! Загружено ${count} заметок (100% Офлайн).`);
          setTimeout(() => setImportStatus(null), 5000);
          return;
        } else {
          setImportError('Не удалось распознать структуру базы из QR-кода.');
          setTimeout(() => setImportError(null), 4000);
          return;
        }
      } catch (err: any) {
        setImportError(`Ошибка импорта QR: ${err.message}`);
        setTimeout(() => setImportError(null), 4000);
        return;
      }
    }

    // 2. Wi-Fi / Hotspot LAN Sync QR payload
    const payload = decodeSyncQRPayload(decodedText);
    if (!payload) {
      setImportError('QR-код не содержит параметров синхронизации Nyron.');
      setTimeout(() => setImportError(null), 4000);
      return;
    }

    if (payload.key !== undefined) {
      handleKeyChange(payload.key);
    }

    if (payload.ips && payload.ips.length > 0) {
      setRemoteHost(payload.ips[0]);
    }

    setImportStatus('⚡ Подключение по QR-коду и быстрая синхронизация...');

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

  const handleOpenMyQr = async () => {
    setIsGeneratingMyQr(true);
    setShowMyQrModal(true);
    try {
      const payload = {
        app: 'nyron-vault',
        v: '1.1.0',
        timestamp: Date.now(),
        neurons,
        transactions,
        shifts,
        canvasCards,
        canvasConnections,
        savingsGoals,
        bankDeposits,
      };
      const qrStr = await compressVaultForQR(payload);
      setMyQrString(qrStr);
      setMyQrSize(qrStr.length);
    } catch (e: any) {
      console.warn('Failed to generate my QR:', e);
    } finally {
      setIsGeneratingMyQr(false);
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
                Откройте меню <b>«Синхронизация»</b> на компьютере и наведите камеру на большой QR-код на мониторе или вставьте скопированный камерой текст.
              </p>

              {/* Clipboard Auto-Detection Banner if QR JSON is found in clipboard */}
              {clipboardData && (
                <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-between gap-2 animate-fade-in">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                    <span className="text-[11px] font-bold text-emerald-200 truncate">
                      В буфере найден QR-код ПК!
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      handleQRDetected(clipboardData);
                      setClipboardData(null);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500 text-black font-extrabold text-[10px] shrink-0 active:scale-95 shadow"
                  >
                    Подключить
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => setIsScannerOpen(true)}
                  className="w-full py-3 px-3 rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#6366f1] hover:opacity-95 active:scale-[0.99] text-[#0a0b10] font-extrabold text-xs shadow-lg shadow-[#38bdf8]/20 flex items-center justify-center gap-2 transition-all"
                >
                  <Camera size={16} />
                  <span>Сканировать QR с ПК</span>
                </button>

                <button
                  onClick={handlePasteFromClipboard}
                  className="w-full py-3 px-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] active:scale-[0.99] text-white font-bold text-xs border border-white/[0.12] flex items-center justify-center gap-2 transition-all"
                  title="Если вы отсканировали QR системной камерой телефона и нажали «Копировать»"
                >
                  <ClipboardPaste size={16} className="text-[#38bdf8]" />
                  <span>Вставить из буфера</span>
                </button>
              </div>
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
                  onClick={() => setRemoteHost('192.168.148.173')}
                  className="px-2 py-1.5 rounded-lg bg-black/40 border border-white/[0.08] hover:border-[#38bdf8]/40 text-[10px] text-[#cbd5e1] text-center truncate"
                  title="Текущая сеть Wi-Fi"
                >
                  📶 Wi-Fi 148.173
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
                    onChange={(e) => handleRemoteHostChange(e.target.value)}
                    placeholder="192.168.148.173 или 192.168.1.15"
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
                  PIN сопряжения (необязательно, если отключен на ПК)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={pairingKey}
                    onChange={(e) => handleKeyChange(e.target.value)}
                    placeholder="Необязательно (или PIN с экрана ПК)"
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

            {/* ═════════ 3. ETERNAL OFFLINE BACKUP & MY QR ═════════ */}
            <div className="p-4 rounded-2xl bg-[#141522] border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Shield size={14} className="text-emerald-400" />
                  <span>Офлайн резервное хранилище</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">100% Offline</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={handleOpenMyQr}
                  className="p-2.5 rounded-xl bg-black/40 border border-white/[0.08] hover:border-[#38bdf8]/40 transition-all text-left flex flex-col items-center text-center gap-1.5 active:scale-95 group"
                >
                  <QrCode size={18} className="text-[#38bdf8] group-hover:scale-110 transition-transform" />
                  <div>
                    <h5 className="text-[11px] font-bold text-white leading-tight">Мой QR базы</h5>
                    <p className="text-[8px] text-[#64748b]">Офлайн передача</p>
                  </div>
                </button>

                <button
                  onClick={handleExport}
                  className="p-2.5 rounded-xl bg-black/40 border border-white/[0.08] hover:border-emerald-500/40 transition-all text-left flex flex-col items-center text-center gap-1.5 active:scale-95 group"
                >
                  <FolderDown size={18} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <h5 className="text-[11px] font-bold text-white leading-tight">Экспорт .json</h5>
                    <p className="text-[8px] text-[#64748b]">Сохранить файл</p>
                  </div>
                </button>

                <label className="p-2.5 rounded-xl bg-black/40 border border-white/[0.08] hover:border-amber-500/40 transition-all text-left flex flex-col items-center text-center gap-1.5 active:scale-95 group cursor-pointer">
                  <Database size={18} className="text-amber-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <h5 className="text-[11px] font-bold text-white leading-tight">Импорт .json</h5>
                    <p className="text-[8px] text-[#64748b]">Восстановить</p>
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

      {/* My Vault QR Modal */}
      {showMyQrModal && (
        <div
          className="fixed inset-0 z-[65] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fade-in"
          onClick={() => setShowMyQrModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-white/[0.12] bg-[#141520] p-5 flex flex-col items-center text-center space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 text-white text-xs font-bold">
                <QrCode size={16} className="text-[#38bdf8]" />
                <span>Офлайн QR вашей базы</span>
              </div>
              <button
                onClick={() => setShowMyQrModal(false)}
                className="p-1 rounded-lg text-[#94a3b8] hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {isGeneratingMyQr ? (
              <div className="w-[220px] h-[220px] flex items-center justify-center">
                <RefreshCw size={28} className="animate-spin text-[#38bdf8]" />
              </div>
            ) : myQrString && myQrString.length <= 2400 ? (
              <div className="flex flex-col items-center gap-2">
                <QRCodeView value={myQrString} size={220} border={3} />
                <span className="text-[10px] text-emerald-400 font-mono font-bold">
                  ⚡ {neurons.length} заметок ({myQrSize} байт GZIP)
                </span>
              </div>
            ) : (
              <div className="w-[220px] h-[220px] flex flex-col items-center justify-center p-3 text-center border border-amber-500/30 rounded-2xl">
                <AlertCircle size={32} className="text-amber-400 mb-2" />
                <span className="text-xs font-bold text-white">База слишком велика для QR</span>
                <span className="text-[10px] text-[#94a3b8] mt-1">
                  Используйте экспорт .json или Wi-Fi синхронизацию
                </span>
              </div>
            )}

            <p className="text-[11px] text-[#94a3b8] leading-tight">
              Другой смартфон или ПК может отсканировать этот QR-код для мгновенного переноса данных без интернета и роутера.
            </p>

            <button
              onClick={() => setShowMyQrModal(false)}
              className="w-full py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-bold"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleQRDetected}
      />
    </>
  );
};
