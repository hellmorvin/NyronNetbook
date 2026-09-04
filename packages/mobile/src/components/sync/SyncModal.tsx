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
  Database
} from 'lucide-react';
import { useBrainStore } from '../../store/useBrainStore';
import { p2pSyncService, SyncStatus } from '../../services/mobileP2PSyncService';
import { generatePairingKey } from '@axon/shared';

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
  const [pairingKey, setPairingKey] = useState<string>('');
  const [remoteHost, setRemoteHost] = useState<string>(
    localStorage.getItem('axon_remote_ip') || '192.168.1.'
  );

  const [syncState, setSyncState] = useState<SyncStatus>(p2pSyncService.getStatus());
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    let savedKey = localStorage.getItem('nyron_p2p_pairing_key');
    if (!savedKey) {
      savedKey = generatePairingKey();
      localStorage.setItem('nyron_p2p_pairing_key', savedKey);
    }
    setPairingKey(savedKey);

    const unsubscribe = p2pSyncService.subscribe((status) => {
      setSyncState(status);
    });
    return () => unsubscribe();
  }, [isSyncOpen]);

  if (!isSyncOpen) return null;

  const handleRegenerateKey = () => {
    const newKey = generatePairingKey();
    setPairingKey(newKey);
    localStorage.setItem('nyron_p2p_pairing_key', newKey);
  };

  const copyPairingCode = () => {
    navigator.clipboard?.writeText(pairingKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePingDesktop = async () => {
    setIsTesting(true);
    setTestResult(null);
    p2pSyncService.setRemoteIp(remoteHost);

    const res = await p2pSyncService.pingDesktop(remoteHost);
    setIsTesting(false);

    if (res.ok) {
      setTestResult({
        ok: true,
        message: `🟢 Компьютер найден! (${res.info?.app || 'NeironoNotebook'} Desktop)`,
      });
    } else {
      setTestResult({
        ok: false,
        message: `🔴 Не удалось связаться с ${remoteHost}:49200. Проверьте, что приложение на ПК открыто.`,
      });
    }
    setTimeout(() => setTestResult(null), 5000);
  };

  const handleStartRealSync = async () => {
    p2pSyncService.setRemoteIp(remoteHost);

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

  const handleExport = () => {
    const jsonStr = exportVaultJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neirono-notebook-vault-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setImportStatus('Резервная копия сохранена в Файлы/Загрузки телефона.');
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
          setImportStatus(`Успешно восстановлено ${parsed.neurons?.length || 0} заметок и все данные!`);
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
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 select-none animate-fade-in"
      onClick={() => setSyncOpen(false)}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-white/[0.12] overflow-hidden shadow-2xl bg-[#14151c] flex flex-col max-h-[90vh]"
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
                <span className="px-1.5 py-0.5 rounded-full bg-[#10b981]/20 text-[#10b981] text-[9px] font-mono font-bold">
                  Wi-Fi Direct
                </span>
              </h3>
              <p className="text-[10px] text-[#94a3b8] font-mono">
                Быстрый обмен заметками и финансами с компьютером
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
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* ═════════ 1. CONNECT TO DESKTOP ═════════ */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#131526] to-[#171930] border border-[#38bdf8]/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Laptop size={15} className="text-[#38bdf8]" />
                <span>Подключение к программе на компьютере</span>
              </span>
              <span className="text-[10px] text-[#38bdf8] font-mono font-bold">
                Порт 49200
              </span>
            </div>

            <p className="text-[11px] text-[#cbd5e1] leading-relaxed">
              Откройте на ПК окно «Синхронизация» и скопируйте оттуда локальный IP адрес (например, <span className="font-mono text-[#38bdf8]">192.168.1.45</span>).
            </p>

            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={remoteHost}
                  onChange={(e) => setRemoteHost(e.target.value)}
                  placeholder="192.168.1.45 или 192.168.1.45:49200"
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/[0.1] text-xs text-white font-mono placeholder:text-[#64748b] focus:outline-none focus:border-[#38bdf8]"
                />
                <button
                  onClick={handlePingDesktop}
                  disabled={isTesting}
                  className="px-3.5 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-xs font-bold text-white transition-all border border-white/[0.08] shrink-0"
                >
                  {isTesting ? <RefreshCw size={13} className="animate-spin" /> : 'Тест'}
                </button>
              </div>

              {testResult && (
                <div
                  className={`p-2.5 rounded-xl text-xs flex items-center gap-2 font-medium ${
                    testResult.ok
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                  }`}
                >
                  {testResult.ok ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  <span>{testResult.message}</span>
                </div>
              )}

              {/* Big Action Button: Sync With PC Now */}
              <button
                onClick={handleStartRealSync}
                disabled={syncState.state === 'syncing' || syncState.state === 'connecting'}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#7c5cff] via-[#6366f1] to-[#38bdf8] hover:opacity-95 active:scale-[0.99] disabled:opacity-50 text-white font-extrabold text-xs shadow-lg shadow-[#7c5cff]/25 flex items-center justify-center gap-2 transition-all"
              >
                {syncState.state === 'syncing' || syncState.state === 'connecting' ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Синхронизация данных с компьютером...</span>
                  </>
                ) : (
                  <>
                    <Zap size={15} className="text-amber-300 fill-amber-300" />
                    <span>Синхронизировать с ПК сейчас (1 нажатие)</span>
                  </>
                )}
              </button>
            </div>

            {syncState.errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{syncState.errorMessage}</span>
              </div>
            )}
          </div>

          {/* ═════════ 2. DATA LOSS PROTECTION & ETERNAL BACKUP ═════════ */}
          <div className="p-4 rounded-2xl bg-[#141522] border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Shield size={15} className="text-[#10b981]" />
                <span>Защита от случайного удаления приложения</span>
              </span>
              <span className="text-[10px] text-[#10b981] font-mono font-bold">Офлайн копия</span>
            </div>

            <p className="text-[11px] text-[#94a3b8] leading-relaxed">
              Сохраните резервный файл в «Загрузки» или «Файлы» вашего телефона. Если приложение будет случайно удалено, вы сможете восстановить всё в один клик.
            </p>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={handleExport}
                className="p-3 rounded-xl bg-black/40 border border-white/[0.08] hover:border-[#10b981]/40 transition-all text-left flex items-center gap-2.5 active:scale-95 group"
              >
                <FolderDown size={17} className="text-[#10b981] group-hover:scale-110 transition-transform" />
                <div>
                  <h5 className="text-xs font-bold text-white">Сохранить в Файлы</h5>
                  <p className="text-[10px] text-[#64748b]">Резервный .json</p>
                </div>
              </button>

              <label className="p-3 rounded-xl bg-black/40 border border-white/[0.08] hover:border-[#38bdf8]/40 transition-all text-left flex items-center gap-2.5 active:scale-95 group cursor-pointer">
                <Database size={17} className="text-[#38bdf8] group-hover:scale-110 transition-transform" />
                <div>
                  <h5 className="text-xs font-bold text-white">Восстановить</h5>
                  <p className="text-[10px] text-[#64748b]">Выбрать .json</p>
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
              <div className="p-2.5 rounded-xl bg-[#10b981]/15 border border-[#10b981]/30 text-xs text-[#10b981] flex items-center gap-2 font-medium">
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

          {/* Secret Key Info */}
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-[#64748b] block font-mono">PIN-код сопряжения:</span>
              <span className="font-mono font-bold text-[#f59e0b] tracking-wider">{pairingKey}</span>
            </div>
            <button
              onClick={copyPairingCode}
              className="px-3 py-1.5 rounded-lg bg-white/[0.06] text-white text-[11px] font-medium"
            >
              {copied ? 'Скопировано!' : 'Копировать'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/[0.08] bg-[#0e0f13] text-[10px] text-[#64748b] flex items-center justify-between font-mono">
          <span>{neurons.length} заметок</span>
          <span>Прямое Wi-Fi соединение</span>
        </div>
      </div>
    </div>
  );
};

