import React from 'react';
import { Keyboard, X } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { category: 'Навигация', items: [
    { keys: ['Ctrl', 'K'], desc: 'Быстрый поиск по заметкам' },
    { keys: ['Ctrl', 'P'], desc: 'Быстрый переход (Quick Switch)' },
    { keys: ['Ctrl', 'N'], desc: 'Создать новую заметку' },
    { keys: ['Ctrl', 'B'], desc: 'Переключить боковую панель' },
    { keys: ['Alt', '←'], desc: 'Назад по истории' },
    { keys: ['Alt', '→'], desc: 'Вперёд по истории' },
    { keys: ['Ctrl', '/'], desc: 'Показать горячие клавиши' },
  ]},
  { category: 'Редактор', items: [
    { keys: ['[['], desc: 'Создать вики-ссылку на другую заметку' },
    { keys: ['Ctrl', 'S'], desc: 'Сохранить (авто-сохранение)' },
  ]},
  { category: 'Граф', items: [
    { keys: ['Двойной клик'], desc: 'Создать нейрон на графе' },
    { keys: ['Правый клик'], desc: 'Контекстное меню нейрона' },
    { keys: ['Колесо мыши'], desc: 'Масштабирование графа' },
    { keys: ['Перетаскивание'], desc: 'Перемещение нейрона / панорама' },
  ]},
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center px-4 select-none animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#14151c] rounded-2xl border border-white/[0.12] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-[#111217]">
          <div className="flex items-center gap-2">
            <Keyboard size={16} className="text-[#7c5cff]" />
            <h2 className="text-sm font-semibold text-white">Горячие клавиши</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#94a3b8] hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {shortcuts.map((section) => (
            <div key={section.category}>
              <h3 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">
                {section.category}
              </h3>
              <div className="space-y-1">
                {section.items.map((shortcut, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/[0.04] transition-colors"
                  >
                    <span className="text-xs text-[#e2e8f0]">{shortcut.desc}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, i) => (
                        <React.Fragment key={i}>
                          {i > 0 && <span className="text-[10px] text-[#475569]">+</span>}
                          <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-white/[0.06] text-[#cbd5e1] border border-white/[0.06] min-w-[22px] text-center">
                            {key}
                          </kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-2.5 border-t border-white/[0.08] bg-[#0e0f13] text-center">
          <span className="text-[10px] text-[#64748b]">
            Нажмите ESC или Ctrl+/ для закрытия
          </span>
        </div>
      </div>
    </div>
  );
};
