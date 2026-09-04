import React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Share2,
  FileText,
  Plus,
  X,
  LayoutGrid,
  Database,
  Calendar,
  Wallet,
  Layers,
  Search,
  Sliders,
  BarChart3,
} from 'lucide-react';
import { useBrainStore } from '../../store/useBrainStore';
import { NeuralNotebookLogo } from '../brand/NeuralNotebookLogo';
import { WindowControls } from './WindowControls';

export const TopTabBar: React.FC = () => {
  const {
    tabs,
    activeTabId,
    setActiveTab,
    closeTab,
    closeAllTabs,
    openTab,
    addNeuron,
    canGoBack,
    canGoForward,
    goBack,
    goForward,
    setSearchOpen,
    toggleRightSidebar,
    isRightSidebarOpen,
  } = useBrainStore();

  const handleCreateNewTab = () => {
    const newNote = addNeuron('Без названия');
    openTab({ type: 'note', noteId: newNote.id, title: newNote.title });
  };

  const getTabIcon = (type: string) => {
    switch (type) {
      case 'graph':
        return <Share2 size={14} className="text-[#7c5cff] shrink-0" />;
      case 'canvas':
        return <LayoutGrid size={14} className="text-[#10b981] shrink-0" />;
      case 'database':
        return <Database size={14} className="text-[#f59e0b] shrink-0" />;
      case 'calendar':
        return <Calendar size={14} className="text-[#ec4899] shrink-0" />;
      case 'finance':
        return <Wallet size={14} className="text-[#10b981] shrink-0" />;
      case 'analytics':
        return <BarChart3 size={14} className="text-[#38bdf8] shrink-0" />;
      default:
        return <FileText size={14} className="text-[#38bdf8] shrink-0" />;
    }
  };

  return (
    <header
      onDoubleClick={(e) => {
        if (e.target === e.currentTarget) {
          window.electronAPI?.maximize?.();
        }
      }}
      className="h-11 bg-[#0d0e12] border-b border-white/[0.08] flex items-center justify-between select-none z-30 shrink-0 pl-2.5 pr-0 app-drag-region"
    >
      {/* Far Left Brand + Navigation Buttons */}
      <div className="flex items-center gap-2 shrink-0 pr-2.5 app-no-drag">
        <button
          onClick={() => openTab({ type: 'graph', title: 'Граф' })}
          className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/[0.08] transition-all cursor-pointer group"
          title="NyronNotebook"
        >
          <NeuralNotebookLogo size={20} animated={false} glow={false} />
          <span className="text-xs font-bold text-white tracking-wide group-hover:text-[#7c5cff] transition-colors">
            НейроноБлокнот
          </span>
        </button>

        <span className="w-[1px] h-4 bg-white/10 mx-0.5" />

        {/* History Back & Forward */}
        <div className="flex items-center gap-0.5 text-[#94a3b8]">
          <button
            onClick={goBack}
            disabled={!canGoBack()}
            className={`p-1.5 rounded-lg transition-colors ${
              canGoBack()
                ? 'hover:text-white hover:bg-white/[0.08] cursor-pointer text-[#e2e8f0]'
                : 'opacity-25 cursor-default text-[#475569]'
            }`}
            title="Назад (Alt+Left)"
          >
            <ArrowLeft size={14} />
          </button>
          <button
            onClick={goForward}
            disabled={!canGoForward()}
            className={`p-1.5 rounded-lg transition-colors ${
              canGoForward()
                ? 'hover:text-white hover:bg-white/[0.08] cursor-pointer text-[#e2e8f0]'
                : 'opacity-25 cursor-default text-[#475569]'
            }`}
            title="Вперед (Alt+Right)"
          >
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Center Tab Items List */}
      <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar h-full py-1 app-no-drag">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              onAuxClick={(e) => {
                if (e.button === 1) {
                  e.preventDefault();
                  closeTab(tab.id);
                }
              }}
              className={`group flex items-center gap-2 px-3 h-8 rounded-xl text-xs cursor-pointer transition-all shrink-0 max-w-[200px] border app-no-drag ${
                isActive
                  ? 'bg-[#191a22] text-white border-white/[0.15] font-semibold shadow-sm'
                  : 'bg-transparent text-[#94a3b8] border-transparent hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {getTabIcon(tab.type)}

              <span className="truncate text-xs font-medium">{tab.title || 'Без названия'}</span>

              {tabs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  className="p-0.5 rounded-md hover:bg-white/[0.12] hover:text-white text-[#64748b] transition-colors shrink-0 ml-auto opacity-0 group-hover:opacity-100"
                  title="Закрыть вкладку"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          );
        })}

        {/* New Tab Button */}
        <button
          onClick={handleCreateNewTab}
          className="p-1.5 rounded-xl text-[#94a3b8] hover:text-white hover:bg-white/[0.08] transition-colors shrink-0 app-no-drag"
          title="Новая заметка (+)"
        >
          <Plus size={15} />
        </button>
      </div>

      {/* Right Controls & Quick Actions */}
      <div className="flex items-center gap-1 shrink-0 pl-2 app-no-drag">
        {/* Quick Search Spotlight */}
        <button
          onClick={() => setSearchOpen(true)}
          className="p-1.5 rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/[0.08] transition-colors app-no-drag"
          title="Быстрый поиск (Ctrl+P / Ctrl+K)"
        >
          <Search size={14} />
        </button>

        {tabs.length > 1 && (
          <button
            onClick={closeAllTabs}
            className="p-1.5 rounded-lg text-[#94a3b8] hover:text-[#f43f5e] hover:bg-rose-500/15 transition-colors app-no-drag"
            title="Закрыть все открытые вкладки"
          >
            <Layers size={14} />
          </button>
        )}

        {/* Toggle Right Panel Button */}
        <button
          onClick={toggleRightSidebar}
          className={`p-1.5 rounded-lg transition-colors app-no-drag ${
            isRightSidebarOpen
              ? 'bg-white/[0.12] text-white'
              : 'text-[#94a3b8] hover:text-white hover:bg-white/[0.08]'
          }`}
          title={isRightSidebarOpen ? 'Скрыть правую панель' : 'Показать правую панель'}
        >
          <Sliders size={14} />
        </button>

        <span className="w-[1px] h-4 bg-white/10 mx-1 shrink-0" />

        {/* Custom Window Controls (Minimize, Maximize, Close) */}
        <WindowControls />
      </div>
    </header>
  );
};
