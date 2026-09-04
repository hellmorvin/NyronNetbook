import React from 'react';
import {
  Sparkles,
  HelpCircle,
  HardDrive,
  Database,
  Settings,
  BookOpen,
  X,
  Share2,
  BarChart2,
} from 'lucide-react';
import { useBrainStore } from '../../store/useBrainStore';

interface MobileMoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileMoreSheet: React.FC<MobileMoreSheetProps> = ({ isOpen, onClose }) => {
  const {
    setNotebookLMOpen,
    setSyncOpen,
    setSettingsOpen,
    setManualOpen,
    openTab,
  } = useBrainStore();

  if (!isOpen) return null;

  const actions = [
    {
      id: 'analytics',
      title: 'Аналитика и Метрики',
      desc: 'Когнитивная плотность графа, статистика мыслей, финансы и смены',
      icon: <BarChart2 size={22} className="text-[#38bdf8]" />,
      onClick: () => {
        openTab({ type: 'analytics', title: 'Аналитика' });
        onClose();
      },
    },
    {
      id: 'notebooklm',
      title: 'Google NotebookLM AI Hub',
      desc: 'Анализ хранилища, подкасты, саммари и ответы AI',
      icon: <Sparkles size={22} className="text-[#7c5cff]" />,
      onClick: () => {
        setNotebookLMOpen(true);
        onClose();
      },
    },
    {
      id: 'sync',
      title: 'P2P Синхронизация',
      desc: 'Обмен данными с компьютером и другими устройствами напрямую',
      icon: <HardDrive size={22} className="text-[#38bdf8]" />,
      onClick: () => {
        setSyncOpen(true);
        onClose();
      },
    },
    {
      id: 'database',
      title: 'Табличная База Данных',
      desc: 'Все заметки и их свойства в единой таблице',
      icon: <Database size={22} className="text-[#f59e0b]" />,
      onClick: () => {
        openTab({ type: 'database', title: 'База данных' });
        onClose();
      },
    },
    {
      id: 'settings',
      title: 'Настройки и Темы',
      desc: 'Цветовые палитры, шрифты, параметры отображения',
      icon: <Settings size={22} className="text-[#a855f7]" />,
      onClick: () => {
        setSettingsOpen(true);
        onClose();
      },
    },
    {
      id: 'manual',
      title: 'Инструкция и Справочник',
      desc: 'Гайд по использованию всех функций приложения',
      icon: <BookOpen size={22} className="text-[#e2e8f0]" />,
      onClick: () => {
        setManualOpen(true);
        onClose();
      },
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end select-none animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Sheet Content */}
      <div className="relative w-full max-h-[85vh] bg-[#101117] border-t border-white/[0.1] rounded-t-3xl shadow-2xl z-10 flex flex-col pb-[env(safe-area-inset-bottom,16px)] animate-slide-up">
        {/* Handle Bar */}
        <div className="w-full flex items-center justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 py-2.5 flex items-center justify-between border-b border-white/[0.06]">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles size={18} className="text-[#7c5cff]" />
            <span>Инструменты и функции</span>
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center text-[#94a3b8]"
          >
            <X size={16} />
          </button>
        </div>

        {/* List of Actions */}
        <div className="p-4 overflow-y-auto space-y-2">
          {actions.map((act) => (
            <button
              key={act.id}
              onClick={act.onClick}
              className="w-full p-3 rounded-2xl bg-[#161722] hover:bg-[#1d1f2d] active:scale-[0.98] border border-white/[0.06] flex items-center gap-3.5 text-left transition-all"
            >
              <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.04] shrink-0">
                {act.icon}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-white leading-snug">{act.title}</h4>
                <p className="text-[11px] text-[#94a3b8] leading-snug mt-0.5 truncate">{act.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
