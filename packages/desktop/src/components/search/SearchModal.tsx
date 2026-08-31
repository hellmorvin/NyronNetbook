import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  X,
  Sparkles,
  Pin,
  CornerDownLeft,
  FileText,
  Calendar,
  DollarSign,
  LayoutGrid,
  Share2,
  Settings,
  BookOpen,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { useBrainStore } from '../../store/useBrainStore';
import { SearchMatch } from '@axon/shared';
import { getCleanSnippet } from '../../services/textSanitizer';

type SearchCategory = 'all' | 'notes' | 'shifts' | 'finance' | 'actions';

export const SearchModal: React.FC = () => {
  const {
    isSearchOpen,
    searchEngine,
    neurons,
    shifts,
    savingsGoals,
    setSearchOpen,
    openNote,
    openTab,
    setSettingsOpen,
    setManualOpen,
    addNeuron,
  } = useBrainStore();

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 40);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isSearchOpen]);

  // Command Actions
  const actionItems = useMemo(() => [
    {
      id: 'act_new_note',
      title: 'Создать новую мысль / заметку',
      category: 'actions' as const,
      icon: FileText,
      color: '#7c5cff',
      action: () => {
        const n = addNeuron('Без названия');
        openNote(n.id);
      },
    },
    {
      id: 'act_graph',
      title: 'Открыть Интерактивный Нейро-Граф',
      category: 'actions' as const,
      icon: Share2,
      color: '#38bdf8',
      action: () => openTab({ type: 'graph', title: 'Граф' }),
    },
    {
      id: 'act_canvas',
      title: 'Открыть Холст и Стикеры (Canvas)',
      category: 'actions' as const,
      icon: LayoutGrid,
      color: '#10b981',
      action: () => openTab({ type: 'canvas', title: 'Холст' }),
    },
    {
      id: 'act_calendar',
      title: 'Открыть Календарь рабочих смен и дел',
      category: 'actions' as const,
      icon: Calendar,
      color: '#ec4899',
      action: () => openTab({ type: 'calendar', title: 'Календарь и смены' }),
    },
    {
      id: 'act_finance',
      title: 'Открыть Финансовый Менеджер и Цели',
      category: 'actions' as const,
      icon: DollarSign,
      color: '#f59e0b',
      action: () => openTab({ type: 'finance', title: 'Финансы' }),
    },
    {
      id: 'act_manual',
      title: 'Открыть Руководство и Инструкцию',
      category: 'actions' as const,
      icon: BookOpen,
      color: '#a855f7',
      action: () => setManualOpen(true),
    },
    {
      id: 'act_settings',
      title: 'Открыть Настройки и Темы оформления',
      category: 'actions' as const,
      icon: Settings,
      color: '#94a3b8',
      action: () => setSettingsOpen(true),
    },
  ], [addNeuron, openNote, openTab, setManualOpen, setSettingsOpen]);

  // Filtered Results
  const filteredResults = useMemo(() => {
    const q = query.toLowerCase().trim();

    // 1. Notes matches
    let noteMatches: Array<{
      id: string;
      title: string;
      snippet: string;
      type: 'note';
      color?: string;
      pinned?: boolean;
    }> = [];

    if (!q) {
      noteMatches = neurons.slice(0, 10).map((n) => ({
        id: n.id,
        title: n.title,
        snippet: getCleanSnippet(n.content, 110),
        type: 'note',
        color: n.color,
        pinned: n.pinned,
      }));
    } else {
      const searchRes = searchEngine.search(q, 15);
      noteMatches = searchRes.map((m) => {
        const n = neurons.find((x) => x.id === m.id);
        return {
          id: m.id,
          title: m.title,
          snippet: getCleanSnippet(m.snippet || n?.content, 110),
          type: 'note',
          color: n?.color,
          pinned: n?.pinned,
        };
      });
    }

    // 2. Filter actions
    const matchedActions = actionItems
      .filter((a) => !q || a.title.toLowerCase().includes(q))
      .map((a) => ({
        id: a.id,
        title: a.title,
        snippet: 'Быстрое системное действие',
        type: 'action' as const,
        action: a.action,
        color: a.color,
      }));

    // 3. Filter Shifts
    const matchedShifts = shifts
      .filter((s) => !q || s.date.includes(q) || s.note.toLowerCase().includes(q))
      .slice(0, 5)
      .map((s) => ({
        id: `shift_${s.id}`,
        title: `Смена ${s.date} (${s.type === 'day' ? 'Дневная' : s.type === 'night' ? 'Ночная' : 'Сутки'})`,
        snippet: `${s.hours}ч • Заработок: ${s.earnings} ₽ • ${s.note || 'Без заметок'}`,
        type: 'shift' as const,
        color: '#38bdf8',
        action: () => openTab({ type: 'calendar', title: 'Календарь и смены' }),
      }));

    // 4. Filter Goals
    const matchedGoals = savingsGoals
      .filter((g) => !q || g.title.toLowerCase().includes(q))
      .map((g) => ({
        id: `goal_${g.id}`,
        title: g.title,
        snippet: `Цель: ${g.currentAmount.toLocaleString('ru-RU')} / ${g.targetAmount.toLocaleString('ru-RU')} ₽ (${Math.round((g.currentAmount / g.targetAmount) * 100)}%)`,
        type: 'finance' as const,
        color: g.color || '#10b981',
        action: () => openTab({ type: 'finance', title: 'Финансы' }),
      }));

    if (activeCategory === 'notes') return noteMatches;
    if (activeCategory === 'actions') return matchedActions;
    if (activeCategory === 'shifts') return matchedShifts;
    if (activeCategory === 'finance') return matchedGoals;

    return [...matchedActions, ...noteMatches, ...matchedShifts, ...matchedGoals];
  }, [query, activeCategory, neurons, searchEngine, actionItems, shifts, savingsGoals, openTab]);

  const selectedItem = filteredResults[selectedIndex] || filteredResults[0];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSearchOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredResults.length) % Math.max(1, filteredResults.length));
    } else if (e.key === 'Enter' && selectedItem) {
      e.preventDefault();
      executeItem(selectedItem);
    }
  };

  const executeItem = (item: any) => {
    if (item.type === 'note') {
      openNote(item.id);
    } else if (item.action) {
      item.action();
    }
    setSearchOpen(false);
  };

  if (!isSearchOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center pt-16 px-4 select-none animate-fade-in text-[#e2e8f0]"
      onClick={() => setSearchOpen(false)}
    >
      <div
        className="w-full max-w-3xl rounded-2xl border border-white/[0.12] overflow-hidden shadow-2xl bg-[#14151c] flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-white/[0.08] flex items-center gap-3 bg-[#171822]">
          <Search size={18} className="text-[#7c5cff] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Командная строка: ищите заметки, смены, цели или действия..."
            className="w-full bg-transparent text-white text-sm focus:outline-none placeholder:text-[#475569] font-medium"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 rounded text-[#94a3b8] hover:text-white">
              <X size={15} />
            </button>
          )}
          <kbd className="px-2 py-0.5 text-[10px] font-mono rounded-md bg-white/[0.08] text-[#94a3b8] border border-white/[0.06]">
            ESC
          </kbd>
        </div>

        {/* Categories Bar */}
        <div className="px-4 py-2 border-b border-white/[0.06] bg-[#111217] flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
          {[
            { id: 'all', label: 'Все результаты' },
            { id: 'notes', label: 'Заметки' },
            { id: 'actions', label: 'Действия' },
            { id: 'shifts', label: 'Смены' },
            { id: 'finance', label: 'Финансы' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id as SearchCategory);
                setSelectedIndex(0);
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                activeCategory === cat.id
                  ? 'bg-white/20 text-white font-bold shadow-sm'
                  : 'text-[#94a3b8] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Main Content: Split List + Preview */}
        <div className="flex-1 flex overflow-hidden min-h-[350px]">
          {/* Results List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 border-r border-white/[0.06]">
            {filteredResults.length === 0 ? (
              <div className="py-16 text-center text-xs text-[#64748b] space-y-2">
                <Sparkles size={24} className="mx-auto text-[#7c5cff] opacity-40" />
                <p className="text-white font-medium">Ничего не найдено</p>
                <p className="text-[11px]">Попробуйте изменить поисковый запрос</p>
              </div>
            ) : (
              filteredResults.map((item: any, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={item.id}
                    onClick={() => executeItem(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`p-2.5 rounded-xl cursor-pointer transition-all border flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#1f212d] border-[#7c5cff]/60 text-white shadow-md'
                        : 'border-transparent text-[#94a3b8] hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: item.color || '#7c5cff' }}
                      />
                      <div className="truncate">
                        <span className="font-semibold text-xs text-white truncate block">
                          {item.title}
                        </span>
                        <span className="text-[11px] text-[#64748b] truncate block">
                          {item.snippet}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isSelected && <CornerDownLeft size={13} className="text-[#7c5cff]" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Item Preview on the Right */}
          <div className="w-72 bg-[#111217] p-4 flex flex-col justify-between overflow-y-auto">
            {selectedItem ? (
              <div className="space-y-3">
                <div>
                  <span className="text-[9px] uppercase font-bold text-[#7c5cff] tracking-wider block mb-1">
                    Предпросмотр
                  </span>
                  <h3 className="text-xs font-bold text-white leading-snug">
                    {selectedItem.title}
                  </h3>
                </div>

                <div className="p-3 bg-[#161720] rounded-xl border border-white/[0.06] text-xs text-[#94a3b8] leading-relaxed">
                  {selectedItem.snippet || 'Нет краткого описания'}
                </div>

                <button
                  onClick={() => executeItem(selectedItem)}
                  className="w-full py-2 rounded-xl bg-[#7c5cff] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg"
                >
                  <span>Открыть</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center text-xs text-[#64748b]">
                Выберите элемент
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-2.5 border-t border-white/[0.08] bg-[#0e0f13] text-[11px] text-[#64748b] flex items-center justify-between font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ навигация</span>
            <span>↵ выбрать</span>
            <span>ESC закрыть</span>
          </div>
          <span className="text-[#7c5cff]">Nyron Spotlight Engine</span>
        </div>
      </div>
    </div>
  );
};
