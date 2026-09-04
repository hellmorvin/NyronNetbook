import React, { useState } from 'react';
import {
  LayoutGrid,
  Zap,
  Trash2,
  ExternalLink,
  X,
  Check,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { useBrainStore } from '../../store/useBrainStore';

interface MobileCanvasBridgeSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileCanvasBridgeSheet: React.FC<MobileCanvasBridgeSheetProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    canvasCards,
    canvasConnections,
    syncCanvasToGraph,
    loadGraphOntoCanvas,
    clearCanvas,
    cleanupCanvasClutter,
    clearCanvasConnections,
    openTab,
    neurons,
  } = useBrainStore();

  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    cards: number;
    connections: number;
  } | null>(null);

  const clutterCardsCount = React.useMemo(() => {
    const connectedCardIds = new Set<string>();
    canvasConnections.forEach((conn) => {
      connectedCardIds.add(conn.fromNode);
      connectedCardIds.add(conn.toNode);
    });

    return canvasCards.filter((card) => {
      const hasContent =
        (card.content && card.content.trim().length > 0) ||
        (card.title &&
          card.title.trim().length > 0 &&
          card.title !== 'Мысль' &&
          card.title !== 'Стикер');
      const isConnected = connectedCardIds.has(card.id);
      return !hasContent && !isConnected;
    }).length;
  }, [canvasCards, canvasConnections]);

  if (!isOpen) return null;

  const handleOpenGraphOnCanvas = () => {
    loadGraphOntoCanvas();
    openTab({ type: 'canvas', title: 'Холст' });
    onClose();
  };

  const handleSyncToGraph = () => {
    const res = syncCanvasToGraph();
    setSyncResult({
      cards: res.createdCardsCount,
      connections: res.createdConnectionsCount,
    });
    // Auto-clear notification after 4s
    setTimeout(() => setSyncResult(null), 4000);
  };

  const handleOpenCanvas = () => {
    openTab({ type: 'canvas', title: 'Холст' });
    onClose();
  };

  const handleClearCanvas = () => {
    clearCanvas();
    setIsConfirmClearOpen(false);
    setSyncResult(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-[#12131d] border border-white/[0.12] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#8b5cf6] to-[#06b6d4] text-white flex items-center justify-center shadow-lg shadow-[#8b5cf6]/20">
              <LayoutGrid size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Интеграция с Холстом</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#8b5cf6]/20 text-[#a78bfa] font-mono">
                  Холст ➔ Граф
                </span>
              </h3>
              <p className="text-[11px] text-[#94a3b8]">
                Управление стикерами, стрелками и перенос в 2D-Граф
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#94a3b8] hover:text-white hover:bg-white/[0.08] active:scale-95 transition-all"
          >
            <X size={17} />
          </button>
        </div>

        {/* Sync Result Success Toast */}
        {syncResult && (
          <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between animate-fade-in shadow-lg">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold block">Успешно перенесено в Граф!</span>
                <span className="text-[11px] text-emerald-300/80">
                  Новых мыслей: {syncResult.cards} • Создано синапсов: {syncResult.connections}
                </span>
              </div>
            </div>
            <Check size={16} className="text-emerald-400" />
          </div>
        )}

        {/* Canvas Current Status Stats Card */}
        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.07] space-y-2.5">
          <div className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider">
            Состояние интерактивного Холста
          </div>

          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              <span className="text-lg font-black text-white block">
                {canvasCards.length}
              </span>
              <span className="text-[10px] text-[#94a3b8]">Стикеров и карточек</span>
            </div>

            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              <span className="text-lg font-black text-[#a78bfa] block font-mono">
                {canvasConnections.length}
              </span>
              <span className="text-[10px] text-[#94a3b8]">Стрелок (связей)</span>
            </div>
          </div>
        </div>

        {/* Main Action 0: Open Current Graph on Canvas with exact synaptic connections */}
        <div className="space-y-1.5 p-3 rounded-2xl bg-gradient-to-r from-[#8b5cf6]/15 to-[#38bdf8]/15 border border-[#8b5cf6]/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Layers size={14} className="text-[#38bdf8]" />
              <span>Открыть Граф на Холсте</span>
            </span>
            <span className="text-[10px] text-[#38bdf8] font-mono font-bold">
              {neurons.length} мыслей
            </span>
          </div>
          <p className="text-[10px] text-[#94a3b8] leading-relaxed">
            Перенесет все мысли и нарисует между ними стрелки в точности по существующим связям графа.
          </p>
          <button
            onClick={handleOpenGraphOnCanvas}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#38bdf8] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#8b5cf6]/25 active:scale-95 transition-all mt-1"
          >
            <ExternalLink size={14} />
            <span>Разместить связи на Холсте</span>
          </button>
        </div>

        {/* Main Action 1: Add/Sync Canvas to Graph */}
        <div className="space-y-2">
          <button
            onClick={handleSyncToGraph}
            disabled={canvasCards.length === 0 && canvasConnections.length === 0}
            className={`w-full py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 ${
              canvasCards.length === 0 && canvasConnections.length === 0
                ? 'bg-white/[0.05] text-[#64748b] cursor-not-allowed border border-white/[0.05]'
                : 'bg-gradient-to-r from-[#8b5cf6] via-[#7c5cff] to-[#38bdf8] text-white shadow-[#7c5cff]/30 hover:opacity-95'
            }`}
          >
            <Zap size={15} className="fill-white/20" />
            <span>⚡ Закинуть весь Холст в Граф</span>
          </button>
          <p className="text-[10px] text-[#64748b] text-center px-2">
            Превратит все карточки в мысли базы знаний, а стрелки — в синаптические ссылки [[...]] на графе.
          </p>
        </div>

        {/* Main Action 2: Open Canvas Directly */}
        <button
          onClick={handleOpenCanvas}
          className="w-full py-2.5 px-4 rounded-2xl bg-white/[0.05] hover:bg-white/[0.09] text-white font-semibold text-xs flex items-center justify-between border border-white/[0.08] active:scale-95 transition-all"
        >
          <div className="flex items-center gap-2">
            <LayoutGrid size={14} className="text-[#38bdf8]" />
            <span>Перейти к интерактивному Холсту</span>
          </div>
          <ExternalLink size={13} className="text-[#94a3b8]" />
        </button>

        {/* Clear Canvas Section (Convenient Clearing / Start Fresh / Clutter Cleanup) */}
        <div className="pt-2 border-t border-white/[0.08] space-y-2">
          {clutterCardsCount > 0 && !isConfirmClearOpen && (
            <button
              onClick={() => {
                cleanupCanvasClutter();
                setSyncResult(null);
              }}
              className="w-full py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold flex items-center justify-between transition-all border border-amber-500/20 active:scale-95"
            >
              <div className="flex items-center gap-1.5">
                <Sparkles size={13} className="text-amber-400" />
                <span>Удалить пустые стикеры (мусор)</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                -{clutterCardsCount}
              </span>
            </button>
          )}

          {!isConfirmClearOpen ? (
            <button
              onClick={() => setIsConfirmClearOpen(true)}
              className="w-full py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border border-rose-500/20 active:scale-95"
            >
              <Trash2 size={13} />
              <span>Очистить Холст (начать заново)</span>
            </button>
          ) : (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2 animate-fade-in">
              <div className="flex items-start gap-2 text-rose-300 text-xs">
                <AlertTriangle size={15} className="text-rose-400 shrink-0 mt-0.5" />
                <span>
                  Удалить все <b>{canvasCards.length}</b> стикеров и <b>{canvasConnections.length}</b> стрелок с холста?
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearCanvas}
                  className="flex-1 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold active:scale-95 transition-all"
                >
                  Да, очистить всё
                </button>
                <button
                  onClick={() => setIsConfirmClearOpen(false)}
                  className="flex-1 py-1.5 rounded-xl bg-white/[0.08] text-[#cbd5e1] text-xs font-medium active:scale-95 transition-all"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
