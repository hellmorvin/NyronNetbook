import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, X, CornerDownLeft } from 'lucide-react';
import { useMobileBrainStore } from '../../store/useMobileBrainStore';

export const MobileSearchModal: React.FC = () => {
  const {
    isSearchOpen,
    setSearchOpen,
    neurons,
    searchEngine,
    setActiveNeuronId,
    setActiveTab,
  } = useMobileBrainStore();

  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 60);
    } else {
      setQuery('');
    }
  }, [isSearchOpen]);

  if (!isSearchOpen) return null;

  // Search results
  const results = query.trim()
    ? searchEngine.search(query.trim()).map((res) => {
        const found = neurons.find((n) => n.id === res.id);
        return found || { id: res.id, title: res.title, filePath: '', content: '' };
      })
    : neurons.slice(0, 8);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col p-4 animate-fade-in safe-top safe-bottom"
      onClick={() => setSearchOpen(false)}
    >
      <div
        className="w-full bg-[#14151e] border border-[#232533] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Input */}
        <div className="p-3 border-b border-[#232533] flex items-center gap-2.5 bg-[#12131a]">
          <Search size={18} className="text-[#8052ff] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по заметкам и мыслям..."
            className="flex-1 bg-transparent text-sm text-white focus:outline-none placeholder:text-[#64748b] font-medium"
          />
          <button
            onClick={() => setSearchOpen(false)}
            className="p-1 rounded-xl text-[#94a3b8] active:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs">
          {results.length === 0 ? (
            <div className="p-6 text-center text-[#64748b]">
              <span>Ничего не найдено</span>
            </div>
          ) : (
            results.map((note) => (
              <div
                key={note.id}
                onClick={() => {
                  setActiveNeuronId(note.id);
                  setActiveTab('notes');
                  setSearchOpen(false);
                }}
                className="p-3 rounded-2xl flex items-center justify-between text-[#cbd5e1] hover:text-white active:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <FileText size={15} className="text-[#8052ff] shrink-0" />
                  <span className="truncate font-semibold">{note.title}</span>
                </div>
                <CornerDownLeft size={13} className="text-[#64748b] shrink-0" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
