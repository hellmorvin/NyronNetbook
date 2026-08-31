import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, CornerDownLeft, Plus, Sparkles } from 'lucide-react';
import { useBrainStore } from '../../store/useBrainStore';

export const QuickSwitcherModal: React.FC = () => {
  const {
    neurons,
    isSearchOpen,
    setSearchOpen,
    openTab,
    addNeuron,
  } = useBrainStore();

  const [query, setQuery] = useState('');
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

  const filtered = query.trim()
    ? neurons.filter((n) =>
        n.title.toLowerCase().includes(query.toLowerCase().trim())
      )
    : neurons.slice(0, 10);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSearchOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length + 1) % Math.max(1, filtered.length + 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex < filtered.length && filtered[selectedIndex]) {
        const target = filtered[selectedIndex]!;
        openTab({ type: 'note', noteId: target.id, title: target.title });
        setSearchOpen(false);
      } else if (query.trim()) {
        // Create new note with this exact title
        const newNote = addNeuron(query.trim());
        openTab({ type: 'note', noteId: newNote.id, title: newNote.title });
        setSearchOpen(false);
      }
    }
  };

  if (!isSearchOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center pt-24 px-4 select-none animate-fade-in"
      onClick={() => setSearchOpen(false)}
    >
      <div
        className="w-full max-w-xl bg-[#1e1e22] rounded-2xl border border-[#2e2e34] overflow-hidden shadow-2xl flex flex-col max-h-[60vh] text-[#dcddde]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="p-3.5 border-b border-[#2e2e34] flex items-center gap-3 bg-[#161618]">
          <Search size={16} className="text-[#8052ff] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Меню быстрого перехода (введите имя заметки)..."
            className="w-full bg-transparent text-sm text-white focus:outline-none placeholder:text-[#5e5f66] font-medium"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-[#2a2a30] text-[#8b8b92]">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5 text-xs">
          {filtered.map((note, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <div
                key={note.id}
                onClick={() => {
                  openTab({ type: 'note', noteId: note.id, title: note.title });
                  setSearchOpen(false);
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`px-3 py-2 rounded-xl cursor-pointer transition-colors flex items-center justify-between ${
                  isSelected
                    ? 'bg-[#2a2a32] text-white font-medium'
                    : 'text-[#9c9da2] hover:bg-[#24242a] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <FileText size={14} className="text-[#8052ff] shrink-0" />
                  <span className="truncate">{note.title}</span>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-[#5e5f66] shrink-0">
                  <span>{note.filePath}</span>
                  {isSelected && <CornerDownLeft size={12} className="text-[#8052ff]" />}
                </div>
              </div>
            );
          })}

          {/* Option to create note if query typed */}
          {query.trim() && (
            <div
              onClick={() => {
                const newNote = addNeuron(query.trim());
                openTab({ type: 'note', noteId: newNote.id, title: newNote.title });
                setSearchOpen(false);
              }}
              onMouseEnter={() => setSelectedIndex(filtered.length)}
              className={`px-3 py-2 rounded-xl cursor-pointer transition-colors flex items-center gap-2 text-[#8052ff] ${
                selectedIndex === filtered.length ? 'bg-[#2a2a32] font-medium' : 'hover:bg-[#24242a]'
              }`}
            >
              <Plus size={14} />
              <span>Создать заметку "{query.trim()}"</span>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="h-8 px-3 border-t border-[#2a2a2e] flex items-center justify-between text-[10px] text-[#5e5f66] bg-[#161618]">
          <span>↑↓ Навигация · ↵ Выбрать / Создать</span>
          <span>Быстрый переход Obsidian</span>
        </div>
      </div>
    </div>
  );
};
