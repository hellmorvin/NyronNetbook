import React, { useState, useEffect } from 'react';
import {
  Wifi,
  Radio,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Laptop,
  ArrowRightLeft,
  ShieldCheck,
} from 'lucide-react';
import { p2pSyncService, SyncStatus } from '../../services/mobileP2PSyncService';
import { useMobileBrainStore } from '../../store/useMobileBrainStore';

export const MobileSyncView: React.FC = () => {
  const { neurons, setNeurons } = useMobileBrainStore();
  const [status, setStatus] = useState<SyncStatus>(p2pSyncService.getStatus());
  const [ipInput, setIpInput] = useState(status.remoteIp || '');
  const [successBanner, setSuccessBanner] = useState(false);

  useEffect(() => {
    const unsub = p2pSyncService.subscribe((s) => setStatus(s));
    return unsub;
  }, []);

  const handleStartSync = () => {
    if (ipInput.trim()) {
      p2pSyncService.setRemoteIp(ipInput.trim());
    }
    p2pSyncService.syncWithDesktop(
      () => neurons,
      (updated) => {
        setNeurons(updated);
        setSuccessBanner(true);
        setTimeout(() => setSuccessBanner(false), 4000);
      }
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#0c0d12] p-4 space-y-4">
      {/* P2P Status Card */}
      <div className="bg-gradient-to-tr from-[#8052ff]/20 via-[#14151e] to-[#10b981]/20 border border-[#232533] p-5 rounded-3xl shadow-xl flex flex-col items-center text-center gap-3">
        <div className="flex items-center gap-4 text-white">
          <div className="p-3 rounded-2xl bg-[#8052ff]/20 text-[#8052ff] border border-[#8052ff]/30">
            <Smartphone size={24} />
          </div>
          <ArrowRightLeft
            size={18}
            className={status.state === 'syncing' ? 'animate-spin text-[#8052ff]' : 'text-[#64748b]'}
          />
          <div className="p-3 rounded-2xl bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30">
            <Laptop size={24} />
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold text-white tracking-wide">P2P Синхронизация с ПК</h2>
          <p className="text-[11px] text-[#94a3b8] max-w-xs mt-1">
            Прямой обмен заметками и базой данных по домашней сети Wi-Fi или точке доступа
          </p>
        </div>

        {/* Status Indicator Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#0c0d12] border border-white/[0.08]">
          {status.state === 'idle' && (
            <>
              <div className="w-2 h-2 rounded-full bg-[#64748b]" />
              <span className="text-[#94a3b8]">Готов к синхронизации</span>
            </>
          )}
          {status.state === 'connecting' && (
            <>
              <RefreshCw size={12} className="animate-spin text-[#38bdf8]" />
              <span className="text-[#38bdf8]">Поиск компьютера...</span>
            </>
          )}
          {status.state === 'syncing' && (
            <>
              <RefreshCw size={12} className="animate-spin text-[#8052ff]" />
              <span className="text-[#8052ff]">Сверка Merkle-дерева...</span>
            </>
          )}
          {status.state === 'connected' && (
            <>
              <CheckCircle2 size={12} className="text-[#10b981]" />
              <span className="text-[#10b981]">Синхронизировано ({status.syncedCount} заметок)</span>
            </>
          )}
          {status.state === 'error' && (
            <>
              <AlertCircle size={12} className="text-[#ff4757]" />
              <span className="text-[#ff4757] truncate max-w-[200px]">
                {status.errorMessage || 'Ошибка'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-3 bg-[#10b981]/20 border border-[#10b981]/40 rounded-2xl flex items-center gap-2.5 text-xs text-[#10b981] font-semibold animate-fade-in">
          <CheckCircle2 size={16} />
          <span>База знаний успешно синхронизирована с ПК!</span>
        </div>
      )}

      {/* IP Connection Box */}
      <div className="bg-[#14151e] border border-[#232533] p-4 rounded-3xl space-y-3 shadow-lg">
        <label className="block text-xs font-bold text-white uppercase tracking-wider">
          IP-адрес компьютера:
        </label>
        <input
          type="text"
          value={ipInput}
          onChange={(e) => setIpInput(e.target.value)}
          placeholder="Например: 192.168.1.100"
          className="w-full py-2.5 px-3 rounded-xl bg-[#0c0d12] border border-[#232533] text-sm text-white font-mono placeholder:text-[#64748b] focus:outline-none focus:border-[#8052ff]"
        />

        <button
          onClick={handleStartSync}
          disabled={status.state === 'syncing' || status.state === 'connecting'}
          className="w-full py-3 rounded-2xl bg-[#8052ff] hover:bg-[#7244ee] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#8052ff]/30 active:scale-98 transition-transform disabled:opacity-50"
        >
          <RefreshCw size={15} className={status.state === 'syncing' ? 'animate-spin' : ''} />
          <span>Синхронизировать сейчас</span>
        </button>
      </div>

      {/* Security & Wireless Features Box */}
      <div className="p-3.5 bg-[#14151e] border border-[#232533] rounded-2xl space-y-2 text-[11px] text-[#94a3b8]">
        <div className="flex items-center gap-2 text-white font-semibold text-xs">
          <ShieldCheck size={16} className="text-[#10b981]" />
          <span>100% Локально и безопасно</span>
        </div>
        <p>
          Данные передаются только по прямой локальной сети (Wi-Fi или Точка Доступа). Никакие файлы не попадают на сторонние серверы.
        </p>
      </div>
    </div>
  );
};
