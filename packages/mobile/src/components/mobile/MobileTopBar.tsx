import React from 'react';
import {
  Menu,
  Search,
  Plus,
  MoreVertical,
  Network,
  Calendar,
  Wallet,
  FileText,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { useBrainStore } from '../../store/useBrainStore';

interface MobileTopBarProps {
  onOpenLeftDrawer: () => void;
  onOpenRightDrawer: () => void;
}

export const MobileTopBar: React.FC<MobileTopBarProps> = ({
  onOpenLeftDrawer,
  onOpenRightDrawer,
}) => {
  const {
    vaultName,
    tabs,
    activeTabId,
    neurons,
    activeNeuronId,
    setSearchOpen,
    addNeuron,
    openNote,
  } = useBrainStore();

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  const activeNeuron = neurons.find((n) => n.id === (activeTab?.noteId || activeNeuronId));

  const handleContextAdd = () => {
    switch (activeTab?.type) {
      case 'note':
      case 'graph': {
        const newNote = addNeuron('Новая мысль');
        openNote(newNote.id);
        break;
      }
      case 'canvas': {
        window.dispatchEvent(new CustomEvent('mobile-canvas-add-card'));
        break;
      }
      case 'calendar': {
        window.dispatchEvent(new CustomEvent('mobile-calendar-add-event'));
        break;
      }
      case 'finance': {
        window.dispatchEvent(new CustomEvent('mobile-finance-add-transaction'));
        break;
      }
      case 'database': {
        const newNote = addNeuron('Новая запись');
        openNote(newNote.id);
        break;
      }
      default: {
        const newNote = addNeuron('Новая мысль');
        openNote(newNote.id);
      }
    }
  };

  const getAddButtonDetails = () => {
    switch (activeTab?.type) {
      case 'canvas':
        return {
          title: 'Добавить стикер / карточку',
          bg: 'bg-[#38bdf8] active:bg-[#0284c7]',
          shadow: 'shadow-[#38bdf8]/20',
        };
      case 'calendar':
        return {
          title: 'Добавить смену или событие',
          bg: 'bg-[#10b981] active:bg-[#059669]',
          shadow: 'shadow-[#10b981]/20',
        };
      case 'finance':
        return {
          title: 'Добавить доход или расход',
          bg: 'bg-[#f59e0b] active:bg-[#d97706]',
          shadow: 'shadow-[#f59e0b]/20',
        };
      default:
        return {
          title: 'Создать заметку',
          bg: 'bg-[#7c5cff] active:bg-[#6c48ff]',
          shadow: 'shadow-[#7c5cff]/20',
        };
    }
  };

  const addBtn = getAddButtonDetails();

  const getTitle = () => {
    if (activeTab?.type === 'graph') return 'Нейро-Граф';
    if (activeTab?.type === 'canvas') return 'Холст и Доска';
    if (activeTab?.type === 'calendar') return 'Календарь';
    if (activeTab?.type === 'finance') return 'Финансы и Бюджет';
    if (activeTab?.type === 'database') return 'База данных';
    if (activeTab?.type === 'note') return activeNeuron?.title || activeTab?.title || 'Заметка';
    return vaultName || 'Psih Brain';
  };

  const getIcon = () => {
    if (activeTab?.type === 'graph') return <Network size={16} className="text-[#7c5cff]" />;
    if (activeTab?.type === 'canvas') return <Layers size={16} className="text-[#38bdf8]" />;
    if (activeTab?.type === 'calendar') return <Calendar size={16} className="text-[#10b981]" />;
    if (activeTab?.type === 'finance') return <Wallet size={16} className="text-[#f59e0b]" />;
    return <FileText size={16} className="text-[#7c5cff]" />;
  };

  return (
    <header className="shrink-0 bg-[#0d0e12]/95 backdrop-blur-xl border-b border-white/[0.08] select-none z-30 pt-[env(safe-area-inset-top,0px)]">
      <div className="h-14 px-3 flex items-center justify-between gap-2">
        {/* Left: Burger Menu Button */}
        <button
          onClick={onOpenLeftDrawer}
          className="w-10 h-10 rounded-xl bg-white/[0.04] active:bg-white/[0.12] active:scale-95 flex items-center justify-center text-[#e2e8f0] border border-white/[0.06] transition-all"
          aria-label="Открыть проводник"
        >
          <Menu size={20} />
        </button>

        {/* Center: Title & Context Badge */}
        <div className="flex-1 min-w-0 flex items-center gap-2 px-1">
          <div className="p-1.5 rounded-lg bg-[#161722] border border-white/[0.06] shrink-0">
            {getIcon()}
          </div>
          <div className="min-w-0 flex flex-col">
            <span className="text-[10px] text-[#64748b] font-medium leading-none truncate flex items-center gap-0.5">
              <span>{vaultName}</span>
              {activeTab?.type === 'note' && (
                <>
                  <ChevronRight size={10} className="text-[#475569]" />
                  <span className="text-[#7c5cff]">{activeNeuron?.filePath?.split('/')[0] || 'Заметки'}</span>
                </>
              )}
            </span>
            <h1 className="text-sm font-bold text-white truncate leading-tight mt-0.5">
              {getTitle()}
            </h1>
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Contextual Quick Add Button */}
          <button
            onClick={handleContextAdd}
            className={`w-9 h-9 rounded-xl ${addBtn.bg} active:scale-95 text-white flex items-center justify-center shadow-lg ${addBtn.shadow} transition-all`}
            title={addBtn.title}
          >
            <Plus size={18} />
          </button>

          {/* Quick Search */}
          <button
            onClick={() => setSearchOpen(true)}
            className="w-9 h-9 rounded-xl bg-white/[0.04] active:bg-white/[0.1] active:scale-95 text-[#94a3b8] hover:text-white flex items-center justify-center border border-white/[0.06] transition-all"
            title="Поиск"
          >
            <Search size={17} />
          </button>

          {/* Right Drawer Toggle (Backlinks & Settings) */}
          <button
            onClick={onOpenRightDrawer}
            className="w-9 h-9 rounded-xl bg-white/[0.04] active:bg-white/[0.1] active:scale-95 text-[#94a3b8] hover:text-white flex items-center justify-center border border-white/[0.06] transition-all"
            title="Связи и параметры"
          >
            <MoreVertical size={17} />
          </button>
        </div>
      </div>
    </header>
  );
};
