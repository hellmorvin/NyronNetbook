import React from 'react';
import {
  FileText,
  Network,
  Layers,
  Calendar,
  Wallet,
  Sparkles,
} from 'lucide-react';
import { useBrainStore } from '../../store/useBrainStore';

interface MobileBottomNavProps {
  onOpenMoreMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenMoreMenu }) => {
  const { tabs, activeTabId, openTab, activeNeuronId, neurons } = useBrainStore();

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  const activeType = activeTab?.type || 'graph';

  const handleOpenNotes = () => {
    if (activeType === 'notes' && activeNeuronId) {
      const n = neurons.find((item) => item.id === activeNeuronId);
      if (n) {
        openTab({ type: 'note', noteId: n.id, title: n.title });
        return;
      }
    }
    openTab({ type: 'notes', title: 'Заметки' });
  };

  const navItems = [
    {
      id: 'note',
      label: 'Заметки',
      icon: <FileText size={20} />,
      isActive: activeType === 'note' || activeType === 'notes',
      onClick: handleOpenNotes,
    },
    {
      id: 'graph',
      label: 'Граф',
      icon: <Network size={20} />,
      isActive: activeType === 'graph',
      onClick: () => openTab({ type: 'graph', title: 'Граф' }),
    },
    {
      id: 'canvas',
      label: 'Холст',
      icon: <Layers size={20} />,
      isActive: activeType === 'canvas',
      onClick: () => openTab({ type: 'canvas', title: 'Холст' }),
    },
    {
      id: 'calendar',
      label: 'Календарь',
      icon: <Calendar size={20} />,
      isActive: activeType === 'calendar',
      onClick: () => openTab({ type: 'calendar', title: 'Календарь' }),
    },
    {
      id: 'finance',
      label: 'Финансы',
      icon: <Wallet size={20} />,
      isActive: activeType === 'finance',
      onClick: () => openTab({ type: 'finance', title: 'Финансы' }),
    },
    {
      id: 'ai_more',
      label: 'Ещё',
      icon: <Sparkles size={20} />,
      isActive: false,
      onClick: onOpenMoreMenu,
    },
  ];

  return (
    <nav className="shrink-0 bg-[#0d0e12]/95 backdrop-blur-xl border-t border-white/[0.08] select-none z-30 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="h-16 px-1 xs:px-2 flex items-center justify-around">
        {navItems.map((item) => {
          const active = item.isActive;
          return (
            <button
              key={item.id}
              onClick={item.onClick}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-0.5 rounded-xl transition-all duration-150 active:scale-95 relative min-w-0 ${
                active
                  ? 'text-[#7c5cff]'
                  : 'text-[#64748b] hover:text-[#94a3b8] active:text-white'
              }`}
            >
              {/* Active Glow Pill */}
              {active && (
                <span className="absolute -top-1 w-7 xs:w-8 h-1 bg-[#7c5cff] rounded-full shadow-[0_0_8px_#7c5cff]" />
              )}
              <div
                className={`p-0.5 xs:p-1 rounded-lg transition-transform ${
                  active ? 'scale-105 xs:scale-110' : ''
                }`}
              >
                {item.icon}
              </div>
              <span
                className={`text-[9px] xs:text-[10px] font-semibold tracking-tight transition-colors truncate max-w-full leading-none mt-0.5 ${
                  active ? 'text-[#7c5cff]' : 'text-[#64748b]'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
