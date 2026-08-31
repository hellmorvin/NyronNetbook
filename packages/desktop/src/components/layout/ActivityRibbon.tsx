import React from 'react';
import {
  IconExplorerFolder,
  IconSearchSpotlight,
  IconBookmarkRibbon,
  IconGraph2D,
  IconNotebookLM,
  IconSettingsGear,
  IconWalletCapital,
  IconExcelTable,
} from '../icons/CustomNeironoIcons';
import { LayoutGrid, Calendar } from 'lucide-react';
import { useBrainStore, RibbonView } from '../../store/useBrainStore';
import { NeuralNotebookLogo } from '../brand/NeuralNotebookLogo';

export const ActivityRibbon: React.FC = () => {
  const {
    activeRibbonView,
    isLeftSidebarOpen,
    tabs,
    activeTabId,
    setActiveRibbonView,
    toggleLeftSidebar,
    openTab,
    setNotebookLMOpen,
    setQuizOpen,
    setSettingsOpen,
  } = useBrainStore();

  const activeTab = tabs.find((t) => t.id === activeTabId);

  const handleRibbonSidebarToggle = (view: RibbonView) => {
    if (activeRibbonView === view && isLeftSidebarOpen) {
      toggleLeftSidebar();
    } else {
      setActiveRibbonView(view);
      if (!isLeftSidebarOpen) {
        toggleLeftSidebar();
      }
    }
  };

  return (
    <nav className="w-[56px] min-w-[56px] max-w-[56px] h-full bg-[#0a0b0e] border-r border-white/[0.08] flex flex-col justify-between items-center py-2.5 select-none z-30 shrink-0">
      {/* Top Action Icons */}
      <div className="flex flex-col items-center gap-1.5 w-full px-1.5">

        {/* 1. File Explorer */}
        <button
          onClick={() => handleRibbonSidebarToggle('explorer')}
          className={`p-3 rounded-2xl transition-all relative ${
            activeRibbonView === 'explorer' && isLeftSidebarOpen
              ? 'bg-white/[0.12] text-white shadow-md border border-white/[0.15]'
              : 'text-[#94a3b8] hover:text-white hover:bg-white/[0.08]'
          }`}
          title="Файловый проводник"
        >
          <IconExplorerFolder size={20} color="currentColor" />
          {activeRibbonView === 'explorer' && isLeftSidebarOpen && (
            <span className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-[#7c5cff] rounded-r-md" />
          )}
        </button>

        {/* 2. Quick Search & Switcher */}
        <button
          onClick={() => handleRibbonSidebarToggle('search')}
          className={`p-3 rounded-2xl transition-all relative ${
            activeRibbonView === 'search' && isLeftSidebarOpen
              ? 'bg-white/[0.12] text-white shadow-md border border-white/[0.15]'
              : 'text-[#94a3b8] hover:text-white hover:bg-white/[0.08]'
          }`}
          title="Поиск по хранилищу и заметкам"
        >
          <IconSearchSpotlight size={20} color="currentColor" />
          {activeRibbonView === 'search' && isLeftSidebarOpen && (
            <span className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-[#7c5cff] rounded-r-md" />
          )}
        </button>

        {/* 3. Bookmarks / Pinned */}
        <button
          onClick={() => handleRibbonSidebarToggle('bookmarks')}
          className={`p-3 rounded-2xl transition-all relative ${
            activeRibbonView === 'bookmarks' && isLeftSidebarOpen
              ? 'bg-white/[0.12] text-white shadow-md border border-white/[0.15]'
              : 'text-[#94a3b8] hover:text-white hover:bg-white/[0.08]'
          }`}
          title="Закладки и избранное"
        >
          <IconBookmarkRibbon size={20} color="currentColor" />
          {activeRibbonView === 'bookmarks' && isLeftSidebarOpen && (
            <span className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-[#f59e0b] rounded-r-md" />
          )}
        </button>

        <div className="w-7 h-[1px] bg-white/[0.08] my-0.5" />

        {/* 4. Neural Graph */}
        <button
          onClick={() => openTab({ type: 'graph', title: 'Граф' })}
          className={`p-3 rounded-2xl transition-all relative ${
            activeTab?.type === 'graph'
              ? 'bg-[#7c5cff]/20 text-[#7c5cff] border border-[#7c5cff]/40 shadow-md'
              : 'text-[#94a3b8] hover:text-white hover:bg-white/[0.08]'
          }`}
          title="Интерактивный Граф знаний"
        >
          <IconGraph2D size={20} color={activeTab?.type === 'graph' ? '#7c5cff' : 'currentColor'} />
        </button>

        {/* 5. Infinite Whiteboard Canvas */}
        <button
          onClick={() => openTab({ type: 'canvas', title: 'Холст' })}
          className={`p-3 rounded-2xl transition-all relative ${
            activeTab?.type === 'canvas'
              ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40 shadow-md'
              : 'text-[#94a3b8] hover:text-white hover:bg-white/[0.08]'
          }`}
          title="Бесконечный холст и майнд-карты"
        >
          <LayoutGrid size={20} className={activeTab?.type === 'canvas' ? 'text-[#10b981]' : 'currentColor'} />
        </button>

        {/* 6. Calendar & Planner */}
        <button
          onClick={() => openTab({ type: 'calendar', title: 'Календарь' })}
          className={`p-3 rounded-2xl transition-all relative ${
            activeTab?.type === 'calendar'
              ? 'bg-[#ec4899]/20 text-[#ec4899] border border-[#ec4899]/40 shadow-md'
              : 'text-[#94a3b8] hover:text-white hover:bg-white/[0.08]'
          }`}
          title="Календарь и планировщик"
        >
          <Calendar size={20} className={activeTab?.type === 'calendar' ? 'text-[#ec4899]' : 'currentColor'} />
        </button>

        {/* 7. Personal Finance & Budget Manager */}
        <button
          onClick={() => openTab({ type: 'finance', title: 'Финансы' })}
          className={`p-3 rounded-2xl transition-all relative ${
            activeTab?.type === 'finance'
              ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40 shadow-md'
              : 'text-[#94a3b8] hover:text-white hover:bg-white/[0.08]'
          }`}
          title="Управление финансами и бюджетом"
        >
          <IconWalletCapital size={20} color={activeTab?.type === 'finance' ? '#10b981' : 'currentColor'} />
        </button>

        {/* 8. Excel & Database Sheets */}
        <button
          onClick={() => openTab({ type: 'database', title: 'База данных' })}
          className={`p-3 rounded-2xl transition-all relative ${
            activeTab?.type === 'database'
              ? 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/40 shadow-md'
              : 'text-[#94a3b8] hover:text-white hover:bg-white/[0.08]'
          }`}
          title="Таблицы и базы данных"
        >
          <IconExcelTable size={20} color={activeTab?.type === 'database' ? '#f59e0b' : 'currentColor'} />
        </button>
      </div>

      {/* Bottom Tools & Settings Icons */}
      <div className="flex flex-col items-center gap-2 w-full px-1.5">
        {/* Google NotebookLM Studio */}
        <button
          onClick={() => setNotebookLMOpen(true)}
          className="p-3 rounded-2xl text-[#94a3b8] hover:text-[#38bdf8] hover:bg-[#38bdf8]/15 transition-all group relative shadow-sm"
          title="Google NotebookLM Studio"
        >
          <IconNotebookLM size={20} color="#38bdf8" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
        </button>

        {/* App Settings */}
        <button
          onClick={() => setSettingsOpen(true)}
          className="p-3 rounded-2xl text-[#94a3b8] hover:text-white hover:bg-white/[0.08] transition-all"
          title="Настройки блокнота"
        >
          <IconSettingsGear size={20} color="currentColor" />
        </button>
      </div>
    </nav>
  );
};
