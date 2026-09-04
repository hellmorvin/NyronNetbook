import React, { useState, useMemo } from 'react';
import {
  Link2,
  X,
  Search,
  Plus,
  Unlink,
  Sparkles,
  ArrowRight,
  Compass,
  Check,
  Zap,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { useBrainStore } from '../../store/useBrainStore';

interface MobileGraphConnectionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialSourceNodeId?: string | null;
  onSelectOnCanvas?: (sourceNodeId: string) => void;
}

export const MobileGraphConnectionsSheet: React.FC<MobileGraphConnectionsSheetProps> = ({
  isOpen,
  onClose,
  initialSourceNodeId,
  onSelectOnCanvas,
}) => {
  const {
    neurons,
    connectNeuronsDirectly,
    disconnectNeuronsDirectly,
    selectNeuron,
    openNote,
    themePreset,
    uiSettings,
  } = useBrainStore();

  const [activeTab, setActiveTab] = useState<'create' | 'list' | 'suggest'>('create');
  const [sourceId, setSourceId] = useState<string>(initialSourceNodeId || '');
  const [targetId, setTargetId] = useState<string>('');
  const [searchTarget, setSearchTarget] = useState('');
  const [searchLinks, setSearchLinks] = useState('');
  const [connectionContext, setConnectionContext] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Sync initialSourceNodeId when sheet opens
  React.useEffect(() => {
    if (initialSourceNodeId) {
      setSourceId(initialSourceNodeId);
    } else if (!sourceId && neurons.length > 0) {
      setSourceId(neurons[0]?.id || '');
    }
  }, [initialSourceNodeId, neurons, isOpen]);

  const sourceNeuron = useMemo(() => neurons.find((n) => n.id === sourceId), [neurons, sourceId]);
  const targetNeuron = useMemo(() => neurons.find((n) => n.id === targetId), [neurons, targetId]);

  // All links in the graph: [{ source, target }]
  const allGraphLinks = useMemo(() => {
    const links: { source: typeof neurons[0]; target: typeof neurons[0] }[] = [];
    neurons.forEach((source) => {
      (source.outlinks || []).forEach((tid) => {
        const target = neurons.find((n) => n.id === tid);
        if (target) {
          links.push({ source, target });
        }
      });
    });
    return links;
  }, [neurons]);

  // Filtered links list for Tab 2
  const filteredLinks = useMemo(() => {
    if (!searchLinks.trim()) return allGraphLinks;
    const q = searchLinks.toLowerCase();
    return allGraphLinks.filter(
      (l) =>
        l.source.title.toLowerCase().includes(q) ||
        l.target.title.toLowerCase().includes(q)
    );
  }, [allGraphLinks, searchLinks]);

  // Smart suggestions: nodes sharing tags that are NOT linked yet
  const smartSuggestions = useMemo(() => {
    const suggestions: { a: typeof neurons[0]; b: typeof neurons[0]; commonTags: string[] }[] = [];
    for (let i = 0; i < neurons.length; i++) {
      for (let j = i + 1; j < neurons.length; j++) {
        const a = neurons[i]!;
        const b = neurons[j]!;
        const isLinked =
          (a.outlinks || []).includes(b.id) || (b.outlinks || []).includes(a.id);
        if (!isLinked && a.tags && b.tags) {
          const common = a.tags.filter((t) => b.tags?.includes(t));
          if (common.length > 0) {
            suggestions.push({ a, b, commonTags: common });
          }
        }
      }
    }
    return suggestions.slice(0, 15);
  }, [neurons]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(30);
    }
    setTimeout(() => setSuccessToast(null), 2500);
  };

  const handleCreateConnection = () => {
    if (!sourceId || !targetId || sourceId === targetId) return;
    const success = connectNeuronsDirectly(sourceId, targetId);
    if (success) {
      showToast(`⚡ Связь «${sourceNeuron?.title}» ➔ «${targetNeuron?.title}» закинута в граф!`);
      setTargetId('');
      setSearchTarget('');
    } else {
      showToast(`Связь уже существует`);
    }
  };

  const handleDisconnect = (srcId: string, tgtId: string, srcTitle: string, tgtTitle: string) => {
    disconnectNeuronsDirectly(srcId, tgtId);
    showToast(`Разорвана связь: «${srcTitle}» ⤬ «${tgtTitle}»`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end select-none animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Sheet Container */}
      <div className="relative w-full max-h-[88vh] bg-[#101118] border-t border-white/[0.12] rounded-t-3xl shadow-2xl z-10 flex flex-col pb-[env(safe-area-inset-bottom,16px)] animate-slide-up">
        {/* Handle Bar */}
        <div className="w-full flex items-center justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 bg-white/20 rounded-full" />
        </div>

        {/* Sheet Header */}
        <div className="px-5 py-2.5 flex items-center justify-between border-b border-white/[0.07]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#7c5cff]/20 border border-[#7c5cff]/30 text-[#7c5cff]">
              <Link2 size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Связи Графа</span>
                <span className="px-2 py-0.5 rounded-full bg-white/[0.08] text-[10px] text-[#38bdf8] font-mono">
                  {allGraphLinks.length} связей
                </span>
              </h3>
              <p className="text-[10px] text-[#94a3b8]">
                Создавайте и управляйте соединениями между мыслями
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center text-[#94a3b8]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Segmented Control Tabs */}
        <div className="px-4 pt-2 pb-1 border-b border-white/[0.06]">
          <div className="flex p-1 bg-[#161722] rounded-xl border border-white/[0.06] text-xs">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'create'
                  ? 'bg-[#7c5cff] text-white shadow-md'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <Zap size={13} />
              <span>Закинуть связь</span>
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'list'
                  ? 'bg-[#7c5cff] text-white shadow-md'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <Layers size={13} />
              <span>Все связи ({allGraphLinks.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('suggest')}
              className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'suggest'
                  ? 'bg-[#7c5cff] text-white shadow-md'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <Sparkles size={13} />
              <span>Рекомендации</span>
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        {successToast && (
          <div className="mx-4 mt-2 p-2 rounded-xl bg-[#10b981]/20 border border-[#10b981]/40 text-[#10b981] text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <Check size={14} className="shrink-0" />
            <span className="truncate">{successToast}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* ═════════ TAB 1: CREATE CONNECTION ═════════ */}
          {activeTab === 'create' && (
            <div className="space-y-4">
              {/* Visual Neural Bridge */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#181928] via-[#141520] to-[#181928] border border-white/[0.08] shadow-inner">
                <div className="text-[10px] uppercase font-bold text-[#94a3b8] tracking-wider mb-2 text-center">
                  Нейронный синапс
                </div>

                <div className="flex items-center justify-between gap-2">
                  {/* Source Node Preview */}
                  <div className="flex-1 min-w-0 p-2.5 rounded-xl bg-white/[0.04] border border-[#7c5cff]/40 text-center">
                    <span className="text-[10px] text-[#7c5cff] font-mono block">Откуда</span>
                    <span className="text-xs font-bold text-white block truncate mt-0.5">
                      {sourceNeuron?.title || 'Выберите мысль'}
                    </span>
                  </div>

                  {/* Animated Arrow Bridge */}
                  <div className="flex flex-col items-center justify-center px-1 text-[#7c5cff] shrink-0">
                    <div className="w-8 h-0.5 bg-gradient-to-r from-[#7c5cff] to-[#38bdf8] relative flex items-center justify-center">
                      <span className="absolute w-2 h-2 rounded-full bg-[#38bdf8] shadow-[0_0_8px_#38bdf8] animate-ping" />
                    </div>
                    <ArrowRight size={14} className="mt-1 text-[#38bdf8]" />
                  </div>

                  {/* Target Node Preview */}
                  <div className="flex-1 min-w-0 p-2.5 rounded-xl bg-white/[0.04] border border-[#38bdf8]/40 text-center">
                    <span className="text-[10px] text-[#38bdf8] font-mono block">Куда</span>
                    <span className="text-xs font-bold text-white block truncate mt-0.5">
                      {targetNeuron?.title || 'Выберите цель'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Source Thought Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#cbd5e1] flex items-center justify-between">
                  <span>1. Исходная мысль (Откуда):</span>
                  {sourceNeuron && (
                    <span className="text-[10px] text-[#94a3b8] font-normal font-mono">
                      {(sourceNeuron.outlinks || []).length} исходящих связей
                    </span>
                  )}
                </label>
                <select
                  value={sourceId}
                  onChange={(e) => setSourceId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#181926] border border-white/[0.1] text-white text-xs font-semibold focus:outline-none focus:border-[#7c5cff]"
                >
                  {neurons.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.title} ({(n.outlinks || []).length} св.)
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Thought Selector with Live Search */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#cbd5e1]">
                  2. Выберите мысль для связи (Куда):
                </label>

                {/* Target Search Filter */}
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                  <input
                    type="text"
                    value={searchTarget}
                    onChange={(e) => setSearchTarget(e.target.value)}
                    placeholder="Поиск по названию или #тегу..."
                    className="w-full bg-[#181926] border border-white/[0.08] rounded-xl pl-8 pr-3 py-2 text-white text-xs placeholder:text-[#64748b] focus:outline-none focus:border-[#7c5cff]"
                  />
                  {searchTarget && (
                    <button
                      onClick={() => setSearchTarget('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-white"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* List of Target Candidates */}
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {neurons
                    .filter(
                      (n) =>
                        n.id !== sourceId &&
                        (!searchTarget.trim() ||
                          n.title.toLowerCase().includes(searchTarget.toLowerCase()) ||
                          n.tags?.some((t) => t.toLowerCase().includes(searchTarget.toLowerCase())))
                    )
                    .map((item) => {
                      const isSelected = targetId === item.id;
                      const isAlreadyLinked =
                        sourceNeuron && (sourceNeuron.outlinks || []).includes(item.id);

                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            if (!isAlreadyLinked) {
                              setTargetId(item.id);
                            }
                          }}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#7c5cff]/20 border-[#7c5cff] shadow-md'
                              : isAlreadyLinked
                              ? 'bg-white/[0.02] border-white/[0.04] opacity-60'
                              : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.05]'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <span className={`text-xs font-bold block truncate ${isSelected ? 'text-[#7c5cff]' : 'text-white'}`}>
                              {item.title}
                            </span>
                            <span className="text-[10px] text-[#94a3b8] truncate block">
                              {item.filePath.split('/')[0] || 'Заметки'} • {item.tags?.map((t) => `#${t}`).join(' ') || 'нет тегов'}
                            </span>
                          </div>

                          {isAlreadyLinked ? (
                            <span className="px-2 py-1 rounded-lg bg-white/[0.05] text-[#94a3b8] text-[10px] font-bold shrink-0">
                              Уже связаны
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTargetId(item.id);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                                isSelected
                                  ? 'bg-[#7c5cff] text-white shadow'
                                  : 'bg-white/[0.06] hover:bg-white/[0.12] text-[#cbd5e1]'
                              }`}
                            >
                              {isSelected ? '✓ Выбрано' : 'Выбрать'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  onClick={handleCreateConnection}
                  disabled={!sourceId || !targetId || sourceId === targetId}
                  className={`w-full py-3 rounded-2xl text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${
                    !sourceId || !targetId || sourceId === targetId
                      ? 'bg-white/[0.08] text-[#64748b] cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#7c5cff] to-[#38bdf8] shadow-[#7c5cff]/30 hover:opacity-95'
                  }`}
                >
                  <Zap size={15} />
                  <span>⚡ Закинуть связь в Граф</span>
                </button>

                {onSelectOnCanvas && sourceNeuron && (
                  <button
                    onClick={() => {
                      onSelectOnCanvas(sourceNeuron.id);
                      onClose();
                    }}
                    className="w-full py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#94a3b8] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Compass size={13} />
                    <span>Или указать пальцем на холсте графа</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ═════════ TAB 2: ALL GRAPH CONNECTIONS LIST ═════════ */}
          {activeTab === 'list' && (
            <div className="space-y-3">
              {/* Search Bar for Links */}
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                <input
                  type="text"
                  value={searchLinks}
                  onChange={(e) => setSearchLinks(e.target.value)}
                  placeholder="Поиск связей по мыслям..."
                  className="w-full bg-[#181926] border border-white/[0.08] rounded-xl pl-8 pr-3 py-2 text-white text-xs placeholder:text-[#64748b] focus:outline-none focus:border-[#7c5cff]"
                />
              </div>

              {/* Links Counter Header */}
              <div className="flex items-center justify-between text-[11px] text-[#94a3b8]">
                <span>Всего связей: {filteredLinks.length}</span>
                <span>Нажмите ✂️ чтобы удалить</span>
              </div>

              {/* Links Render List */}
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {filteredLinks.map((item, idx) => (
                  <div
                    key={`${item.source.id}_${item.target.id}_${idx}`}
                    className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between gap-2.5 transition-all"
                  >
                    <div className="min-w-0 flex-1 flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <span
                          onClick={() => {
                            selectNeuron(item.source.id);
                            onClose();
                          }}
                          className="font-bold text-white text-xs truncate block hover:text-[#7c5cff] cursor-pointer"
                        >
                          {item.source.title}
                        </span>
                        <span className="text-[10px] text-[#64748b] truncate block">
                          {item.source.filePath.split('/')[0] || 'Заметки'}
                        </span>
                      </div>

                      <div className="px-1.5 py-0.5 rounded-md bg-[#7c5cff]/20 text-[#7c5cff] font-mono text-[10px] shrink-0 flex items-center gap-1">
                        <ArrowRight size={11} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <span
                          onClick={() => {
                            selectNeuron(item.target.id);
                            onClose();
                          }}
                          className="font-bold text-[#38bdf8] text-xs truncate block hover:underline cursor-pointer"
                        >
                          {item.target.title}
                        </span>
                        <span className="text-[10px] text-[#64748b] truncate block">
                          {item.target.filePath.split('/')[0] || 'Заметки'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        handleDisconnect(
                          item.source.id,
                          item.target.id,
                          item.source.title,
                          item.target.title
                        )
                      }
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-[#f43f5e] active:scale-95 transition-all shrink-0"
                      title="Разорвать связь"
                    >
                      <Unlink size={13} />
                    </button>
                  </div>
                ))}

                {filteredLinks.length === 0 && (
                  <div className="py-8 text-center text-[#64748b] text-xs">
                    Связей не найдено
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═════════ TAB 3: SMART SUGGESTIONS ═════════ */}
          {activeTab === 'suggest' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-[#7c5cff]/10 border border-[#7c5cff]/20 text-[#cbd5e1] text-[11px] leading-relaxed">
                💡 <strong className="text-white">Умные связи:</strong> найдены мысли со схожими тегами, которые ещё не соединены на графе. Соедините их для укрепления структуры знаний.
              </div>

              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {smartSuggestions.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                        <span className="truncate">{s.a.title}</span>
                        <span className="text-[#94a3b8] font-normal">и</span>
                        <span className="truncate text-[#38bdf8]">{s.b.title}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        {s.commonTags.map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.2 rounded bg-white/[0.06] text-[10px] text-[#7c5cff] font-mono"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        connectNeuronsDirectly(s.a.id, s.b.id);
                        showToast(`⚡ Связано: «${s.a.title}» ➔ «${s.b.title}»`);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#7c5cff] hover:bg-[#6c48ff] text-white text-xs font-bold flex items-center gap-1 shadow active:scale-95 transition-all shrink-0"
                    >
                      <Plus size={13} />
                      <span>Связать</span>
                    </button>
                  </div>
                ))}

                {smartSuggestions.length === 0 && (
                  <div className="py-8 text-center text-[#64748b] text-xs">
                    Нет новых рекомендаций. Все мысли с похожими тегами уже соединены!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
