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
  HardDrive,
  QrCode,
  Radio,
  Laptop,
  Zap,
  Info
} from 'lucide-react';
import { useBrainStore } from '../../store/useBrainStore';
import { generatePairingKey, encodeSyncQRPayload } from '@axon/shared';
import { QRCodeView } from './QRCodeView';

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

  const [activeTab, setActiveTab] = useState<'qr' | 'manual' | 'vault'>('qr');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedIp, setCopiedIp] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [pairingKey, setPairingKey] = useState<string>('');
  const [localIp, setLocalIp] = useState<string>('127.0.0.1');
  const [allInterfaces, setAllInterfaces] = useState<
    Array<{ name: string; address: string; type: string; label: string; isVirtual: boolean }>
  >([]);
  const [serverPort, setServerPort] = useState<number>(49200);

  const [vaultInfo, setVaultInfo] = useState<{
    vaultDir: string;
    exists: boolean;
    notesCount: number;
    backupCount: number;
    lastSaved: number | null;
  } | null>(null);

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

    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.setSyncPairingKey?.(savedKey);

      window.electronAPI.getAllNetworkInterfaces?.().then((ifaces) => {
        if (Array.isArray(ifaces) && ifaces.length > 0) {
          setAllInterfaces(ifaces);
          const nonVirt = ifaces.find((i) => !i.isVirtual);
          if (nonVirt) setLocalIp(nonVirt.address);
        }
      }).catch(() => {});

      window.electronAPI.getSyncServerStatus?.().then((status) => {
        if (status) {
          if (status.ip) setLocalIp(status.ip);
          if (status.port) setServerPort(status.port);
          if (status.interfaces && status.interfaces.length > 0) {
            setAllInterfaces(status.interfaces);
          }
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
    window.electronAPI?.setSyncPairingKey?.(newKey);
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

  // Compile full QR sync payload containing candidate IPs and master pairing key
  const candidateIps = allInterfaces.length > 0
    ? Array.from(new Set([localIp, ...allInterfaces.map((i) => i.address)]))
    : [localIp];

  const qrString = encodeSyncQRPayload({
    app: 'nyron',
    v: '1.1.0',
    key: pairingKey,
    port: serverPort,
    ips: candidateIps,
    created: Date.now(),
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fade-in"
      onClick={() => setSyncOpen(false)}
    >
      <div
        className="w-full max-w-2xl rounded-3xl border border-white/[0.12] overflow-hidden shadow-2xl bg-[#14151c] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-[#111217]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#38bdf8]/15 border border-[#38bdf8]/30 flex items-center justify-center text-[#38bdf8]">
              <QrCode size={19} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Синхронизация Nyron</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  Сервер : {serverPort}
                </span>
              </div>
              <p className="text-[11px] text-[#94a3b8]">
                Быстрое и надежное подключение с телефона через QR-код, Wi-Fi или Точку доступа
              </p>
            </div>
          </div>

          <button
            onClick={() => setSyncOpen(false)}
            className="p-2 rounded-xl text-[#94a3b8] hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X size={17} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-3 border-b border-white/[0.06] flex items-center gap-2 bg-[#12131a]">
          <button
            onClick={() => setActiveTab('qr')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
              activeTab === 'qr'
                ? 'bg-[#38bdf8]/15 border-[#38bdf8]/40 text-[#38bdf8]'
                : 'bg-transparent border-transparent text-[#94a3b8] hover:text-white'
            }`}
          >
            <QrCode size={14} />
            <span>QR-код сопряжения</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
              activeTab === 'manual'
                ? 'bg-[#7c5cff]/15 border-[#7c5cff]/40 text-[#a78bfa]'
                : 'bg-transparent border-transparent text-[#94a3b8] hover:text-white'
            }`}
          >
            <Radio size={14} />
            <span>Точка доступа & Wi-Fi IP</span>
          </button>

          <button
            onClick={() => setActiveTab('vault')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
              activeTab === 'vault'
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                : 'bg-transparent border-transparent text-[#94a3b8] hover:text-white'
            }`}
          >
            <Shield size={14} />
            <span>Вечное Хранилище</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[72vh] overflow-y-auto">
          {/* ═════════════════ TAB 1: QR CODE HUB ═════════════════ */}
          {activeTab === 'qr' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#151726] to-[#12131d] border border-[#38bdf8]/30 flex flex-col md:flex-row items-center gap-6 shadow-xl">
                {/* QR Code Canvas */}
                <div className="shrink-0 flex flex-col items-center gap-2">
                  <QRCodeView value={qrString} size={210} border={3} />
                  <span className="text-[10px] text-[#38bdf8] font-mono font-bold flex items-center gap-1.5">
                    <Zap size={11} /> Готов к мгновенному сканированию
                  </span>
                </div>

                {/* Instructions & Credentials */}
                <div className="flex-1 space-y-3">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Smartphone size={16} className="text-[#38bdf8]" />
                      <span>Подключение в 1 нажатие</span>
                    </h4>
                    <p className="text-[11px] text-[#cbd5e1] leading-relaxed pt-1">
                      1. Откройте приложение <b>Nyron</b> на смартфоне.<br />
                      2. Перейдите в меню <b>«Синхронизация»</b>.<br />
                      3. Нажмите <b>«Сканировать QR-код»</b> и наведите камеру на этот экран.
                    </p>
                  </div>

                  {/* Pairing Credentials Pills */}
                  <div className="space-y-2 pt-1">
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.08] flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[9px] text-[#64748b] uppercase tracking-wider block font-mono">
                          IP-адрес компьютера
                        </span>
                        <span className="font-mono font-black text-white">{localIp}:{serverPort}</span>
                      </div>
                      <button
                        onClick={copyServerAddress}
                        className="px-2.5 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-white text-[11px] font-medium flex items-center gap-1 transition-all"
                      >
                        {copiedIp ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        <span>{copiedIp ? 'Скопировано' : 'Копировать'}</span>
                      </button>
                    </div>

                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.08] flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[9px] text-[#64748b] uppercase tracking-wider block font-mono">
                          Секретный PIN сопряжения
                        </span>
                        <span className="font-mono font-bold text-[#f59e0b] tracking-wider">{pairingKey}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={handleRegenerateKey}
                          className="p-1.5 rounded-lg text-[#64748b] hover:text-white transition-colors"
                          title="Сгенерировать новый ключ"
                        >
                          <RefreshCw size={12} />
                        </button>
                        <button
                          onClick={copyPairingCode}
                          className="px-2.5 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-white text-[11px] font-medium flex items-center gap-1 transition-all"
                        >
                          {copiedKey ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                          <span>{copiedKey ? 'Скопировано' : 'Копировать'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Adapter selection */}
              {allInterfaces.length > 1 && (
                <div className="p-3.5 rounded-2xl bg-[#141520] border border-white/[0.08] space-y-2">
                  <span className="text-[11px] font-bold text-[#94a3b8] block">
                    Доступные сетевые адаптеры компьютера (выберите сеть, если подключены к другой):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {allInterfaces.map((iface) => (
                      <button
                        key={iface.address}
                        onClick={() => setLocalIp(iface.address)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 border ${
                          localIp === iface.address
                            ? 'bg-[#38bdf8]/20 border-[#38bdf8] text-white font-bold'
                            : 'bg-black/30 border-white/[0.08] text-[#94a3b8] hover:text-white'
                        }`}
                      >
                        <span>{iface.type === 'wifi' ? '📶' : iface.type === 'hotspot' ? '📱' : '💻'}</span>
                        <span>{iface.name}:</span>
                        <span className="text-white font-bold">{iface.address}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═════════════════ TAB 2: WI-FI & HOTSPOT MANUAL ═════════════════ */}
          {activeTab === 'manual' && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#151724] border border-white/[0.08] space-y-1.5">
                  <div className="flex items-center gap-2 text-[#38bdf8] text-xs font-bold">
                    <Wifi size={15} />
                    <span>Вариант 1: Домашний Wi-Fi</span>
                  </div>
                  <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                    Подключите телефон и компьютер к одной и той же сети Wi-Fi роутера. На телефоне введите IP: <span className="text-white font-mono">{localIp}</span>.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#151724] border border-white/[0.08] space-y-1.5">
                  <div className="flex items-center gap-2 text-[#f59e0b] text-xs font-bold">
                    <Smartphone size={15} />
                    <span>Вариант 2: Точка доступа телефона</span>
                  </div>
                  <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                    Включите «Точку доступа» (Хот-спот) на смартфоне и подключите к ней компьютер по Wi-Fi. Никаких роутеров не требуется!
                  </p>
                </div>
              </div>

              {/* Direct host test */}
              <div className="p-4 rounded-2xl bg-[#141522] border border-white/[0.08] space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Radio size={14} className="text-[#a78bfa]" />
                  <span>Проверка доступности удаленного устройства по IP</span>
                </h4>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={remoteHost}
                    onChange={(e) => setRemoteHost(e.target.value)}
                    placeholder="192.168.1.15 или 192.168.148.152"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/[0.1] text-xs text-white font-mono placeholder:text-[#64748b] focus:outline-none focus:border-[#7c5cff]"
                  />
                  <button
                    onClick={handleStartP2PSync}
                    disabled={syncStatus === 'syncing'}
                    className="px-4 py-2.5 rounded-xl bg-[#7c5cff] hover:bg-[#6c48ff] text-white text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {syncStatus === 'syncing' ? <RefreshCw size={13} className="animate-spin" /> : <ArrowRight size={13} />}
                    <span>Проверить связь</span>
                  </button>
                </div>

                {syncMessage && (
                  <div
                    className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                      syncStatus === 'error'
                        ? 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                        : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                    }`}
                  >
                    {syncStatus === 'error' ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
                    <span>{syncMessage}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═════════════════ TAB 3: ETERNAL VAULT & BACKUPS ═════════════════ */}
          {activeTab === 'vault' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#121422] to-[#151728] border border-[#7c5cff]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield size={16} className="text-[#7c5cff]" />
                    <span className="text-xs font-bold text-white">Вечная папка (Защита от удаления)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#7c5cff]/20 text-[#a78bfa] text-[10px] font-mono font-bold">
                    Всегда сохранено
                  </span>
                </div>

                <p className="text-[11px] text-[#cbd5e1] leading-relaxed">
                  Все заметки (<span className="text-white font-mono">.md</span>), финансы и холсты сохраняются в системной папке пользователя <span className="text-white font-semibold">«Документы/NeironoNotebook_Vault»</span>.
                </p>

                {vaultInfo && (
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.06] text-[11px] font-mono space-y-1 text-[#94a3b8]">
                    <div className="flex justify-between items-center text-white">
                      <span className="truncate max-w-[340px]" title={vaultInfo.vaultDir}>
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
                    className="px-3.5 py-2 rounded-xl bg-[#7c5cff] hover:bg-[#6c48ff] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#7c5cff]/20"
                  >
                    <Save size={13} />
                    <span>Сделать снимок</span>
                  </button>

                  <button
                    onClick={handleRestoreFromFolder}
                    className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-[#94a3b8] hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-all border border-white/[0.06]"
                  >
                    <RotateCcw size={13} />
                    <span>Восстановить</span>
                  </button>
                </div>

                {vaultSaveStatus && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2 font-medium">
                    <CheckCircle2 size={13} className="shrink-0" />
                    <span>{vaultSaveStatus}</span>
                  </div>
                )}
              </div>

              {/* Offline backup json */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  onClick={handleExport}
                  className="p-3 rounded-xl bg-[#161720] border border-white/[0.08] hover:border-[#7c5cff]/40 transition-all text-left flex items-center gap-2.5 group"
                >
                  <Download size={16} className="text-[#7c5cff] group-hover:scale-110 transition-transform" />
                  <div>
                    <h5 className="text-xs font-medium text-white">Экспорт в JSON</h5>
                    <p className="text-[10px] text-[#64748b]">Скачать резервный файл</p>
                  </div>
                </button>

                <label className="p-3 rounded-xl bg-[#161720] border border-white/[0.08] hover:border-[#10b981]/40 transition-all text-left flex items-center gap-2.5 group cursor-pointer">
                  <Upload size={16} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <h5 className="text-xs font-medium text-white">Импорт из JSON</h5>
                    <p className="text-[10px] text-[#64748b]">Загрузить файл архива</p>
                  </div>
                  <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                </label>
              </div>

              {importStatus && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
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
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-white/[0.08] bg-[#0e0f13] text-[10px] text-[#64748b] flex items-center justify-between font-mono">
          <div className="flex items-center gap-2">
            <Shield size={12} className="text-emerald-400" />
            <span>Локальная защищенная P2P сеть без облачных серверов</span>
          </div>
          <span>{neurons.length} заметок в локальной базе</span>
        </div>
      </div>
    </div>
  );
};
