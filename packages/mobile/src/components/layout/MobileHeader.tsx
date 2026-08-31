import React from 'react';
import { Menu, Search, Wifi, Plus, Sparkles } from 'lucide-react';
import { useMobileBrainStore } from '../../store/useMobileBrainStore';

export const MobileHeader: React.FC = () => {
  const {
    activeTab,
    setDrawerOpen,
    setSearchOpen,
    addNeuron,
    setActiveTab,
    neurons,
    activeNeuronId,
  } = useMobileBrainStore();

  const activeNeuron = neurons.find((n) => n.id === activeNeuronId);

  const getTitle = () => {
    switch (activeTab) {
      case 'notes':
        return activeNeuron ? activeNeuron.title : 'Заметки';
      case 'graph':
        return 'Нейро-Граф';
      case 'canvas':
        return 'Холст и стикеры';
      case 'shifts':
        return '⏱️ Смены и доход';
      case 'finance':
        return 'Финансы и копилки';
      case 'sync':
        return 'P2P Синхронизация';
      default:
        return 'NyronNotebook';
    }
  };

  return (
    <header className="h-14 bg-[#12131a] border-b border-[#232533] flex items-center justify-between px-3.5 shrink-0 z-30 safe-top">
      {/* Left Action: Menu Drawer */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-2 rounded-xl text-[#94a3b8] hover:text-white active:bg-white/[0.08] transition-colors"
          aria-label="Меню"
        >
          <Menu size={20} />
        </button>

        <h1 className="text-sm font-bold text-white truncate max-w-[170px] tracking-wide">
          {getTitle()}
        </h1>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1.5">
        {/* Quick Search */}
        <button
          onClick={() => setSearchOpen(true)}
          className="p-2 rounded-xl text-[#94a3b8] hover:text-white active:bg-white/[0.08] transition-colors"
          aria-label="Поиск"
        >
          <Search size={18} />
        </button>

        {/* Sync status / action */}
        <button
          onClick={() => setActiveTab('sync')}
          className={`p-2 rounded-xl transition-colors ${
            activeTab === 'sync' ? 'bg-[#8052ff]/20 text-[#8052ff]' : 'text-[#94a3b8] hover:text-white'
          }`}
          aria-label="Синхронизация"
        >
          <Wifi size={18} />
        </button>

        {/* Add Note Button if in Notes tab */}
        {activeTab === 'notes' && (
          <button
            onClick={() => addNeuron('Новая заметка')}
            className="p-2 rounded-xl bg-[#8052ff] text-white shadow-lg shadow-[#8052ff]/30 active:scale-95 transition-transform"
            aria-label="Создать заметку"
          >
            <Plus size={18} />
          </button>
        )}
      </div>
    </header>
  );
};
