import React, { useState } from 'react';
import {
  Layers,
  Settings2,
  X,
  Link2,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  Sliders,
  RotateCcw,
} from 'lucide-react';
import { useBrainStore } from '../../store/useBrainStore';

interface MobileRightDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileRightDrawer: React.FC<MobileRightDrawerProps> = ({ isOpen, onClose }) => {
  const {
    neurons,
    activeNeuronId,
    graphSettings,
    updateGraphSettings,
    openTab,
    tabs,
    activeTabId,
  } = useBrainStore();

  const [activeTabType, setActiveTabType] = useState<'links' | 'physics'>('links');

  if (!isOpen) return null;

  const currentTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  const activeNeuron = neurons.find((n) => n.id === (currentTab?.noteId || activeNeuronId));

  return (
    <div className="fixed inset-0 z-50 flex justify-end select-none animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Content */}
      <div className="relative w-[85vw] max-w-[340px] h-full bg-[#101117] border-l border-white/[0.08] shadow-2xl flex flex-col z-10 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]">
        {/* Drawer Header */}
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-[#0e0f13]">
          {/* Segmented Control */}
          <div className="flex items-center p-1 bg-[#161722] rounded-xl border border-white/[0.06] text-xs">
            <button
              onClick={() => setActiveTabType('links')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                activeTabType === 'links'
                  ? 'bg-[#7c5cff] text-white shadow-md'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              Связи
            </button>
            <button
              onClick={() => setActiveTabType('physics')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                activeTabType === 'physics'
                  ? 'bg-[#7c5cff] text-white shadow-md'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              Физика графа
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {activeTabType === 'links' && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-white truncate">
                {activeNeuron?.title || 'Связи активной мысли'}
              </h3>

              {activeNeuron ? (
                <>
                  {/* Outlinks */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#7c5cff] uppercase tracking-wider">
                      <ArrowUpRight size={13} />
                      <span>Исходящие связи ({(activeNeuron.outlinks || []).length})</span>
                    </div>
                    <div className="space-y-1">
                      {(activeNeuron.outlinks || []).map((id) => {
                        const target = neurons.find((n) => n.id === id);
                        return (
                          <div
                            key={id}
                            onClick={() => {
                              if (target) {
                                openTab({ type: 'note', noteId: target.id, title: target.title });
                                onClose();
                              }
                            }}
                            className="p-2 rounded-xl bg-[#161720] border border-white/[0.06] hover:border-[#7c5cff] text-[#e2e8f0] cursor-pointer flex items-center gap-2"
                          >
                            <Link2 size={12} className="text-[#7c5cff]" />
                            <span className="truncate font-medium">{target?.title || id}</span>
                          </div>
                        );
                      })}
                      {(!activeNeuron.outlinks || activeNeuron.outlinks.length === 0) && (
                        <p className="text-[#64748b] text-[11px] italic">Нет исходящих связей</p>
                      )}
                    </div>
                  </div>

                  {/* Backlinks */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#10b981] uppercase tracking-wider">
                      <ArrowDownLeft size={13} />
                      <span>Входящие обратные связи ({(activeNeuron.backlinks || []).length})</span>
                    </div>
                    <div className="space-y-1">
                      {(activeNeuron.backlinks || []).map((id) => {
                        const source = neurons.find((n) => n.id === id);
                        return (
                          <div
                            key={id}
                            onClick={() => {
                              if (source) {
                                openTab({ type: 'note', noteId: source.id, title: source.title });
                                onClose();
                              }
                            }}
                            className="p-2 rounded-xl bg-[#161720] border border-white/[0.06] hover:border-[#10b981] text-[#e2e8f0] cursor-pointer flex items-center gap-2"
                          >
                            <Layers size={12} className="text-[#10b981]" />
                            <span className="truncate font-medium">{source?.title || id}</span>
                          </div>
                        );
                      })}
                      {(!activeNeuron.backlinks || activeNeuron.backlinks.length === 0) && (
                        <p className="text-[#64748b] text-[11px] italic">Нет входящих связей</p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-[#64748b] text-xs">
                  Откройте или выберите заметку для просмотра связей
                </div>
              )}
            </div>
          )}

          {activeTabType === 'physics' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white">Параметры физики</span>
                <button
                  onClick={() =>
                    updateGraphSettings({
                      nodeSize: 1.0,
                      linkDistance: 60,
                      repulsion: -75,
                      centerGravity: 0.12,
                      showLabels: true,
                      showArrows: true,
                    })
                  }
                  className="flex items-center gap-1 text-[11px] text-[#7c5cff] hover:underline"
                >
                  <RotateCcw size={11} />
                  <span>Сбросить</span>
                </button>
              </div>

              {/* Node Size */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[#94a3b8]">Размер узлов</span>
                  <span className="text-white font-mono">{graphSettings.nodeSize.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.1"
                  value={graphSettings.nodeSize}
                  onChange={(e) => updateGraphSettings({ nodeSize: parseFloat(e.target.value) })}
                  className="w-full accent-[#7c5cff] h-1.5 bg-[#1f212d] rounded-lg cursor-pointer"
                />
              </div>

              {/* Link Distance */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[#94a3b8]">Длина связей</span>
                  <span className="text-white font-mono">{graphSettings.linkDistance} px</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="150"
                  step="5"
                  value={graphSettings.linkDistance}
                  onChange={(e) => updateGraphSettings({ linkDistance: parseInt(e.target.value) })}
                  className="w-full accent-[#7c5cff] h-1.5 bg-[#1f212d] rounded-lg cursor-pointer"
                />
              </div>

              {/* Repulsion */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[#94a3b8]">Сила отталкивания</span>
                  <span className="text-white font-mono">{Math.abs(graphSettings.repulsion)}</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="200"
                  step="5"
                  value={Math.abs(graphSettings.repulsion)}
                  onChange={(e) => updateGraphSettings({ repulsion: -parseInt(e.target.value) })}
                  className="w-full accent-[#7c5cff] h-1.5 bg-[#1f212d] rounded-lg cursor-pointer"
                />
              </div>

              {/* Toggles */}
              <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                <label className="flex items-center justify-between py-1 cursor-pointer">
                  <span className="text-xs text-[#cbd5e1]">Отображать подписи узлов</span>
                  <input
                    type="checkbox"
                    checked={graphSettings.showLabels}
                    onChange={(e) => updateGraphSettings({ showLabels: e.target.checked })}
                    className="w-4 h-4 accent-[#7c5cff] rounded"
                  />
                </label>
                <label className="flex items-center justify-between py-1 cursor-pointer">
                  <span className="text-xs text-[#cbd5e1]">Отображать стрелки связей</span>
                  <input
                    type="checkbox"
                    checked={graphSettings.showArrows}
                    onChange={(e) => updateGraphSettings({ showArrows: e.target.checked })}
                    className="w-4 h-4 accent-[#7c5cff] rounded"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
