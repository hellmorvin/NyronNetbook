import React from 'react';
import {
  FileText,
  Share2,
  LayoutGrid,
  Calendar,
  Wallet,
  Wifi,
} from 'lucide-react';
import { useMobileBrainStore, MobileTab } from '../../store/useMobileBrainStore';

export const MobileBottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useMobileBrainStore();

  const navItems: Array<{ id: MobileTab; label: string; icon: React.ReactNode }> = [
    { id: 'notes', label: 'Заметки', icon: <FileText size={20} /> },
    { id: 'graph', label: 'Граф', icon: <Share2 size={20} /> },
    { id: 'canvas', label: 'Холст', icon: <LayoutGrid size={20} /> },
    { id: 'shifts', label: 'Смены', icon: <Calendar size={20} /> },
    { id: 'finance', label: 'Финансы', icon: <Wallet size={20} /> },
    { id: 'sync', label: 'P2P', icon: <Wifi size={20} /> },
  ];

  return (
    <nav className="h-16 bg-[#12131a]/95 backdrop-blur-xl border-t border-[#232533] flex items-center justify-around px-2 shrink-0 z-30 safe-bottom">
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              isActive
                ? 'text-[#8052ff] scale-105 font-bold'
                : 'text-[#64748b] hover:text-[#94a3b8] active:scale-95'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-[#8052ff]/15' : ''}`}>
              {item.icon}
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
