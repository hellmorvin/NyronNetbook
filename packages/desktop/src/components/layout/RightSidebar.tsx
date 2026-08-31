import React from 'react';
import {
  Layers,
  Settings2,
  PanelRightClose,
  Link2,
  ArrowUpRight,
  ArrowDownLeft,
  Zap,
  Network,
  Orbit,
  Atom,
} from 'lucide-react';
import { useBrainStore } from '../../store/useBrainStore';

export const RightSidebar: React.FC = () => {
  const {
    isRightSidebarOpen,
    rightSidebarTab,
    neurons,
    activeNeuronId,
    graphSettings,
    toggleRightSidebar,
    setRightSidebarTab,
    updateGraphSettings,
    openTab,
  } = useBrainStore();

  if (!isRightSidebarOpen) return null;

  const activeNeuron = neurons.find((n) => n.id === activeNeuronId);

  return (
    <aside className="w-68 h-full bg-[#111217] border-l border-white/[0.08] flex flex-col select-none z-20 shrink-0 text-[#e2e8f0]">
      {/* Header Tabs */}
      <div className="h-10 px-2 border-b border-white/[0.08] flex items-center justify-between bg-[#0e0f13]">
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setRightSidebarTab('backlinks')}
            className={`p-1.5 rounded-md transition-colors ${
              rightSidebarTab === 'backlinks'
                ? 'bg-white/[0.12] text-white'
                : 'text-[#94a3b8] hover:text-white'
            }`}
            title="Обратные ссылки"
          >
            <Layers size={14} />
          </button>
          <button
            onClick={() => setRightSidebarTab('graph-settings')}
            className={`p-1.5 rounded-md transition-colors ${
              rightSidebarTab === 'graph-settings'
                ? 'bg-white/[0.12] text-white'
                : 'text-[#94a3b8] hover:text-white'
            }`}
            title="Параметры графа"
          >
            <Settings2 size={14} />
          </button>
        </div>

        <button
          onClick={toggleRightSidebar}
          className="p-1 rounded-md text-[#94a3b8] hover:text-white hover:bg-white/[0.08]"
          title="Скрыть боковую панель"
        >
          <PanelRightClose size={14} />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-3 text-xs space-y-4">
        {rightSidebarTab === 'backlinks' && (
          <div className="space-y-3">
            <h4 className="font-semibold text-[11px] text-[#94a3b8] uppercase tracking-wider">
              {activeNeuron?.title || 'Все связи'}
            </h4>

            {activeNeuron ? (
              <div className="space-y-3">
                <div>
                  <span className="text-[11px] text-[#64748b] block mb-1">
                    Исходящие ({(activeNeuron.outlinks || []).length}):
                  </span>
                  <div className="space-y-1">
                    {(activeNeuron.outlinks || []).map((id) => {
                      const target = neurons.find((n) => n.id === id);
                      return (
                        <div
                          key={id}
                          onClick={() => target && openTab({ type: 'note', noteId: target.id, title: target.title })}
                          className="p-1.5 rounded-md bg-[#161720] hover:bg-[#1e202b] cursor-pointer text-[#7c5cff] truncate border border-white/[0.04]"
                        >
                          [[{target?.title || id}]]
                        </div>
                      );
                    })}
                    {(!activeNeuron.outlinks || activeNeuron.outlinks.length === 0) && (
                      <span className="text-[11px] text-[#475569] italic">Нет исходящих связей</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-[#64748b] block mb-1">
                    Обратные ссылки ({(activeNeuron.backlinks || []).length}):
                  </span>
                  <div className="space-y-1">
                    {(activeNeuron.backlinks || []).map((id) => {
                      const source = neurons.find((n) => n.id === id);
                      return (
                        <div
                          key={id}
                          onClick={() => source && openTab({ type: 'note', noteId: source.id, title: source.title })}
                          className="p-1.5 rounded-md bg-[#161720] hover:bg-[#1e202b] cursor-pointer text-[#f59e0b] truncate border border-white/[0.04]"
                        >
                          [[{source?.title || id}]]
                        </div>
                      );
                    })}
                    {(!activeNeuron.backlinks || activeNeuron.backlinks.length === 0) && (
                      <span className="text-[11px] text-[#475569] italic">Нет входящих связей</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[#64748b] italic">Выберите заметку для просмотра связей</p>
            )}
          </div>
        )}

        {rightSidebarTab === 'graph-settings' && (
          <div className="space-y-4">
            {/* Header with Quick Reset */}
            <div className="flex items-center justify-between pb-1 border-b border-white/[0.06]">
              <h4 className="font-bold text-[11px] text-[#7c5cff] uppercase tracking-wider">
                Параметры Графа
              </h4>
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
                className="text-[10px] text-[#94a3b8] hover:text-white px-2 py-0.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
                title="Сбросить все параметры графа к заводским"
              >
                Сброс
              </button>
            </div>

            {/* 1. Layout Presets */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-[#94a3b8] font-semibold uppercase tracking-wider block">
                Пресеты компоновки:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() =>
                    updateGraphSettings({
                      nodeSize: 1.0,
                      linkDistance: 60,
                      repulsion: -75,
                      centerGravity: 0.12,
                    })
                  }
                  className="p-2 rounded-xl bg-[#161720] hover:bg-[#1f212e] border border-white/[0.08] hover:border-[#7c5cff]/50 text-left transition-all group"
                >
                  <span className="text-[11px] font-bold text-white group-hover:text-[#7c5cff] flex items-center gap-1.5">
                    <Zap size={13} className="text-[#f59e0b] shrink-0" />
                    <span>Базовый</span>
                  </span>
                  <span className="text-[9px] text-[#64748b] block mt-0.5">Сбалансированный</span>
                </button>

                <button
                  onClick={() =>
                    updateGraphSettings({
                      nodeSize: 0.8,
                      linkDistance: 38,
                      repulsion: -45,
                      centerGravity: 0.20,
                    })
                  }
                  className="p-2 rounded-xl bg-[#161720] hover:bg-[#1f212e] border border-white/[0.08] hover:border-[#10b981]/50 text-left transition-all group"
                >
                  <span className="text-[11px] font-bold text-white group-hover:text-[#10b981] flex items-center gap-1.5">
                    <Network size={13} className="text-[#10b981] shrink-0" />
                    <span>Кластер</span>
                  </span>
                  <span className="text-[9px] text-[#64748b] block mt-0.5">Компактный вид</span>
                </button>

                <button
                  onClick={() =>
                    updateGraphSettings({
                      nodeSize: 1.2,
                      linkDistance: 110,
                      repulsion: -130,
                      centerGravity: 0.05,
                    })
                  }
                  className="p-2 rounded-xl bg-[#161720] hover:bg-[#1f212e] border border-white/[0.08] hover:border-[#38bdf8]/50 text-left transition-all group"
                >
                  <span className="text-[11px] font-bold text-white group-hover:text-[#38bdf8] flex items-center gap-1.5">
                    <Orbit size={13} className="text-[#38bdf8] shrink-0" />
                    <span>Космос</span>
                  </span>
                  <span className="text-[9px] text-[#64748b] block mt-0.5">Просторные связи</span>
                </button>

                <button
                  onClick={() =>
                    updateGraphSettings({
                      nodeSize: 1.0,
                      linkDistance: 48,
                      repulsion: -95,
                      centerGravity: 0.25,
                    })
                  }
                  className="p-2 rounded-xl bg-[#161720] hover:bg-[#1f212e] border border-white/[0.08] hover:border-[#f59e0b]/50 text-left transition-all group"
                >
                  <span className="text-[11px] font-bold text-white group-hover:text-[#f59e0b] flex items-center gap-1.5">
                    <Atom size={13} className="text-[#a855f7] shrink-0" />
                    <span>Ядро</span>
                  </span>
                  <span className="text-[9px] text-[#64748b] block mt-0.5">Высокая гравитация</span>
                </button>
              </div>
            </div>

            {/* 2. Physics Sliders with Exact Values */}
            <div className="space-y-3 p-2.5 rounded-2xl bg-[#161720] border border-white/[0.06]">
              <div>
                <div className="flex justify-between text-[11px] text-[#94a3b8] mb-1">
                  <span>Масштаб узлов</span>
                  <span className="font-mono text-white font-bold">{graphSettings.nodeSize.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.1"
                  value={graphSettings.nodeSize}
                  onChange={(e) => updateGraphSettings({ nodeSize: parseFloat(e.target.value) })}
                  className="w-full accent-[#7c5cff]"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-[#94a3b8] mb-1">
                  <span>Длина связей</span>
                  <span className="font-mono text-white font-bold">{graphSettings.linkDistance}px</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="200"
                  step="5"
                  value={graphSettings.linkDistance}
                  onChange={(e) => updateGraphSettings({ linkDistance: parseFloat(e.target.value) })}
                  className="w-full accent-[#7c5cff]"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-[#94a3b8] mb-1">
                  <span>Сила отталкивания</span>
                  <span className="font-mono text-white font-bold">{Math.abs(graphSettings.repulsion)}</span>
                </div>
                <input
                  type="range"
                  min="-200"
                  max="-20"
                  step="5"
                  value={graphSettings.repulsion}
                  onChange={(e) => updateGraphSettings({ repulsion: parseFloat(e.target.value) })}
                  className="w-full accent-[#7c5cff]"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-[#94a3b8] mb-1">
                  <span>Центр тяготения (Гравитация)</span>
                  <span className="font-mono text-white font-bold">{(graphSettings.centerGravity * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.02"
                  max="0.30"
                  step="0.01"
                  value={graphSettings.centerGravity}
                  onChange={(e) => updateGraphSettings({ centerGravity: parseFloat(e.target.value) })}
                  className="w-full accent-[#7c5cff]"
                />
              </div>
            </div>

            {/* 3. Visual Toggles */}
            <div className="space-y-2 p-2.5 rounded-2xl bg-[#161720] border border-white/[0.06]">
              <span className="text-[10px] text-[#94a3b8] font-semibold uppercase tracking-wider block mb-1">
                Отображение:
              </span>

              <label className="flex items-center justify-between cursor-pointer py-1 text-[11px] text-[#cbd5e1] hover:text-white">
                <span>Показывать названия мыслей</span>
                <input
                  type="checkbox"
                  checked={graphSettings.showLabels}
                  onChange={(e) => updateGraphSettings({ showLabels: e.target.checked })}
                  className="w-4 h-4 rounded accent-[#7c5cff] cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer py-1 text-[11px] text-[#cbd5e1] hover:text-white">
                <span>Направление связей (Стрелки)</span>
                <input
                  type="checkbox"
                  checked={graphSettings.showArrows}
                  onChange={(e) => updateGraphSettings({ showArrows: e.target.checked })}
                  className="w-4 h-4 rounded accent-[#7c5cff] cursor-pointer"
                />
              </label>
            </div>

            {/* 4. Vault Graph Metrics */}
            <div className="space-y-1.5 p-2.5 rounded-2xl bg-[#14151c] border border-white/[0.08]">
              <span className="text-[10px] text-[#94a3b8] font-semibold uppercase tracking-wider block mb-1">
                Статистика графа:
              </span>
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="p-1.5 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                  <span className="text-[9px] text-[#64748b] block">Узлов</span>
                  <span className="text-xs font-bold text-white font-mono">{neurons.length}</span>
                </div>
                <div className="p-1.5 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                  <span className="text-[9px] text-[#64748b] block">Связей</span>
                  <span className="text-xs font-bold text-[#7c5cff] font-mono">
                    {neurons.reduce((acc, n) => acc + (n.outlinks || []).length, 0)}
                  </span>
                </div>
                <div className="p-1.5 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                  <span className="text-[9px] text-[#64748b] block">Изолир.</span>
                  <span className="text-xs font-bold text-[#f59e0b] font-mono">
                    {neurons.filter((n) => (n.outlinks || []).length === 0 && (n.backlinks || []).length === 0).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
