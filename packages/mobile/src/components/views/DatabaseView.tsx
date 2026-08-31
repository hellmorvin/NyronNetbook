import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Pin,
  Tag,
  ArrowUpDown,
  FileText,
  Trash2,
  Filter,
  CheckCircle2,
  Clock,
  BookOpen,
  LayoutGrid,
  List,
  Sparkles,
  Link2,
  Eye,
  ChevronDown,
  RotateCcw,
  Layers,
  Folder,
  X,
  ExternalLink,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { useBrainStore } from '../../store/useBrainStore';
import { NeuralNotebookLogo } from '../brand/NeuralNotebookLogo';
import { LearningState } from '@axon/shared';
import { getCleanSnippet } from '../../services/textSanitizer';

export const DatabaseView: React.FC = () => {
  const {
    neurons,
    openTab,
    addNeuron,
    deleteNeuron,
    togglePin,
    setLearningState,
  } = useBrainStore();

  const [search, setSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'updated' | 'title' | 'links' | 'access'>('updated');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Active status dropdown on note row/card
  const [statusMenuOpenId, setStatusMenuOpenId] = useState<string | null>(null);

  // Folder statistics
  const folders = useMemo(() => {
    const map: Record<string, number> = {};
    neurons.forEach((n) => {
      const folder = (n.filePath || '').includes('/') ? n.filePath.split('/')[0] : 'Без папки';
      map[folder] = (map[folder] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [neurons]);

  // Unique tags with counts
  const allTags = useMemo(() => {
    const map: Record<string, number> = {};
    neurons.forEach((n) => {
      (n.tags || []).forEach((t) => {
        map[t] = (map[t] || 0) + 1;
      });
    });
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [neurons]);

  // Global Knowledge Base KPIs
  const stats = useMemo(() => {
    const totalNotes = neurons.length;
    const totalSynapses = neurons.reduce((sum, n) => sum + (n.outlinks?.length || 0) + (n.backlinks?.length || 0), 0);
    const mastered = neurons.filter((n) => n.learningState === 'mastered').length;
    const learning = neurons.filter((n) => n.learningState === 'learning').length;
    const review = neurons.filter((n) => n.learningState === 'review').length;
    const newNotes = neurons.filter((n) => !n.learningState || n.learningState === 'new').length;

    return { totalNotes, totalSynapses, mastered, learning, review, newNotes };
  }, [neurons]);

  // Filtered & Sorted Notes
  const filtered = useMemo(() => {
    return neurons
      .filter((n) => {
        const query = search.toLowerCase().trim();
        const matchSearch =
          !query ||
          n.title.toLowerCase().includes(query) ||
          (n.content || '').toLowerCase().includes(query) ||
          n.tags.some((t) => t.toLowerCase().includes(query));

        const folder = (n.filePath || '').includes('/') ? n.filePath.split('/')[0] : 'Без папки';
        const matchFolder = selectedFolder === 'all' || folder === selectedFolder;
        const matchState =
          selectedState === 'all' ||
          (selectedState === 'new' ? !n.learningState || n.learningState === 'new' : n.learningState === selectedState);
        const matchTag = selectedTag === 'all' || (n.tags || []).includes(selectedTag);

        return matchSearch && matchFolder && matchState && matchTag;
      })
      .sort((a, b) => {
        // Pinned notes always on top unless sorting by specific criteria
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;

        if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '');
        if (sortBy === 'links') {
          const linksA = (a.outlinks?.length || 0) + (a.backlinks?.length || 0);
          const linksB = (b.outlinks?.length || 0) + (b.backlinks?.length || 0);
          return linksB - linksA;
        }
        if (sortBy === 'access') return (b.accessCount || 0) - (a.accessCount || 0);
        return (b.updatedAt || 0) - (a.updatedAt || 0);
      });
  }, [neurons, search, selectedFolder, selectedState, selectedTag, sortBy]);

  const handleOpenNote = (id: string, title: string) => {
    openTab({ type: 'note', noteId: id, title });
  };

  const handleCreateNew = () => {
    const newNote = addNeuron('Новая мысль');
    openTab({ type: 'note', noteId: newNote.id, title: newNote.title });
  };

  const formatRelativeDate = (timestamp?: number) => {
    if (!timestamp) return 'Недавно';
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 5) return 'Только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    if (diffDays === 1) return 'Вчера';
    if (diffDays < 7) return `${diffDays} дн назад`;

    const d = new Date(timestamp);
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedFolder('all');
    setSelectedState('all');
    setSelectedTag('all');
  };

  const hasActiveFilters = search || selectedFolder !== 'all' || selectedState !== 'all' || selectedTag !== 'all';

  return (
    <div className="flex-1 h-full bg-[#090a0f] flex flex-col select-none overflow-hidden text-[#e2e8f0]">
      {/* 1. Header with Title & Quick Controls */}
      <div className="px-4 py-2.5 sm:px-6 sm:py-3.5 border-b border-white/[0.08] bg-[#0d0e14] flex items-center justify-between flex-wrap gap-2 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 sm:p-2 rounded-xl bg-[#7c5cff]/15 border border-[#7c5cff]/30 shadow-md">
            <NeuralNotebookLogo size={20} glow />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-extrabold text-white tracking-tight">
                База Знаний
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-[#cbd5e1] font-mono text-[10px] font-bold border border-white/[0.08]">
                {neurons.length}
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-[#94a3b8] truncate max-w-[180px] sm:max-w-none">
              Структурированный реестр заметок
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* View Mode Toggle: Cards vs Table */}
          <div className="flex items-center p-0.5 bg-[#141620] border border-white/[0.08] rounded-xl text-xs">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 text-xs ${
                viewMode === 'cards'
                  ? 'bg-[#7c5cff] text-white shadow-md'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
              title="Вид карточек"
            >
              <LayoutGrid size={13} />
              <span>Карточки</span>
            </button>

            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 text-xs ${
                viewMode === 'table'
                  ? 'bg-[#7c5cff] text-white shadow-md'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
              title="Компактный список"
            >
              <List size={13} />
              <span>Список</span>
            </button>
          </div>

          {/* New Note Button */}
          <button
            onClick={handleCreateNew}
            className="px-3 py-1 rounded-xl bg-gradient-to-r from-[#7c5cff] to-[#6366f1] text-white text-xs font-extrabold flex items-center gap-1 shadow-md active:scale-95 transition-all"
          >
            <Plus size={14} className="stroke-[2.5]" />
            <span>Новая</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive KPI Horizontal Chips Bar */}
      <div className="px-3 py-1.5 border-b border-white/[0.06] bg-[#0b0c12] shrink-0 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 text-xs min-w-max">
          {/* Total Notes */}
          <button
            onClick={() => setSelectedState('all')}
            className={`px-2.5 py-1 rounded-xl border transition-all flex items-center gap-1.5 text-[11px] font-bold ${
              selectedState === 'all'
                ? 'bg-[#7c5cff]/20 border-[#7c5cff] text-white shadow-sm'
                : 'bg-[#10121a] border-white/[0.06] text-[#94a3b8]'
            }`}
          >
            <BookOpen size={12} className="text-[#7c5cff]" />
            <span>Все ({stats.totalNotes})</span>
          </button>

          {/* Mastered */}
          <button
            onClick={() => setSelectedState(selectedState === 'mastered' ? 'all' : 'mastered')}
            className={`px-2.5 py-1 rounded-xl border transition-all flex items-center gap-1.5 text-[11px] font-bold ${
              selectedState === 'mastered'
                ? 'bg-[#10b981]/20 border-[#10b981] text-[#10b981] shadow-sm'
                : 'bg-[#10121a] border-white/[0.06] text-[#94a3b8]'
            }`}
          >
            <CheckCircle2 size={12} className="text-[#10b981]" />
            <span>Выучено ({stats.mastered})</span>
          </button>

          {/* Learning */}
          <button
            onClick={() => setSelectedState(selectedState === 'learning' ? 'all' : 'learning')}
            className={`px-2.5 py-1 rounded-xl border transition-all flex items-center gap-1.5 text-[11px] font-bold ${
              selectedState === 'learning'
                ? 'bg-[#a855f7]/20 border-[#a855f7] text-[#c084fc] shadow-sm'
                : 'bg-[#10121a] border-white/[0.06] text-[#94a3b8]'
            }`}
          >
            <Sparkles size={12} className="text-[#c084fc]" />
            <span>Изучается ({stats.learning})</span>
          </button>

          {/* Review */}
          <button
            onClick={() => setSelectedState(selectedState === 'review' ? 'all' : 'review')}
            className={`px-2.5 py-1 rounded-xl border transition-all flex items-center gap-1.5 text-[11px] font-bold ${
              selectedState === 'review'
                ? 'bg-[#f59e0b]/20 border-[#f59e0b] text-[#fbbf24] shadow-sm'
                : 'bg-[#10121a] border-white/[0.06] text-[#94a3b8]'
            }`}
          >
            <RotateCcw size={12} className="text-[#fbbf24]" />
            <span>Повтор ({stats.review})</span>
          </button>

          {/* New */}
          <button
            onClick={() => setSelectedState(selectedState === 'new' ? 'all' : 'new')}
            className={`px-2.5 py-1 rounded-xl border transition-all flex items-center gap-1.5 text-[11px] font-bold ${
              selectedState === 'new'
                ? 'bg-[#38bdf8]/20 border-[#38bdf8] text-[#38bdf8] shadow-sm'
                : 'bg-[#10121a] border-white/[0.06] text-[#94a3b8]'
            }`}
          >
            <Clock size={12} className="text-[#38bdf8]" />
            <span>Новые ({stats.newNotes})</span>
          </button>

          {/* Synapses Total */}
          <div className="px-2.5 py-1 rounded-xl bg-[#10121a] border border-white/[0.06] flex items-center gap-1.5 text-[11px] font-bold text-[#94a3b8]">
            <Link2 size={12} className="text-[#38bdf8]" />
            <span>Связей: {stats.totalSynapses}</span>
          </div>
        </div>
      </div>

      {/* 3. Search & Multi-Filter Control Bar */}
      <div className="px-3 py-2 border-b border-white/[0.06] bg-[#0c0d12] flex items-center justify-between gap-2 flex-wrap text-xs shrink-0">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[140px] flex items-center">
          <Search size={13} className="absolute left-3 text-[#7c5cff] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по заметкам..."
            className="w-full bg-[#13151f] text-white pl-8 pr-7 py-1.5 rounded-xl border border-white/[0.08] focus:outline-none focus:border-[#7c5cff] transition-all text-xs placeholder:text-[#64748b]"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 p-1 rounded-md text-[#64748b] hover:text-white"
            >
              <X size={11} />
            </button>
          )}
        </div>

        {/* Filters Group */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Folder Selector */}
          <div className="relative flex items-center">
            <Folder size={11} className="absolute left-2 text-[#94a3b8] pointer-events-none" />
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="bg-[#13151f] border border-white/[0.08] text-[#e2e8f0] pl-6 pr-5 py-1.5 rounded-xl focus:outline-none focus:border-[#7c5cff] appearance-none cursor-pointer text-xs max-w-[130px]"
            >
              <option value="all">Все папки ({folders.length})</option>
              {folders.map((f) => (
                <option key={f.name} value={f.name}>
                  {f.name} ({f.count})
                </option>
              ))}
            </select>
            <ChevronDown size={10} className="absolute right-1.5 text-[#94a3b8] pointer-events-none" />
          </div>

          {/* Tag Selector */}
          {allTags.length > 0 && (
            <div className="relative flex items-center">
              <Tag size={11} className="absolute left-2 text-[#94a3b8] pointer-events-none" />
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="bg-[#13151f] border border-white/[0.08] text-[#e2e8f0] pl-6 pr-5 py-1.5 rounded-xl focus:outline-none focus:border-[#7c5cff] appearance-none cursor-pointer text-xs max-w-[110px]"
              >
                <option value="all">Все теги ({allTags.length})</option>
                {allTags.map((t) => (
                  <option key={t.name} value={t.name}>
                    #{t.name} ({t.count})
                  </option>
                ))}
              </select>
              <ChevronDown size={10} className="absolute right-1.5 text-[#94a3b8] pointer-events-none" />
            </div>
          )}

          {/* Sorting */}
          <div className="relative flex items-center">
            <ArrowUpDown size={11} className="absolute left-2 text-[#94a3b8] pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#13151f] border border-white/[0.08] text-[#e2e8f0] pl-6 pr-5 py-1.5 rounded-xl focus:outline-none focus:border-[#7c5cff] appearance-none cursor-pointer text-xs max-w-[125px]"
            >
              <option value="updated">По дате</option>
              <option value="title">По названию</option>
              <option value="links">По связям</option>
              <option value="access">По просмотрам</option>
            </select>
            <ChevronDown size={10} className="absolute right-1.5 text-[#94a3b8] pointer-events-none" />
          </div>

          {/* Reset Filters button */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-2 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-[#94a3b8] hover:text-white transition-colors flex items-center gap-1 text-xs"
              title="Сбросить фильтры"
            >
              <RotateCcw size={11} />
              <span>Сброс</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Main Body: Cards View (Default) OR Table View */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4" onClick={() => setStatusMenuOpenId(null)}>
        {/* ================= MODE 1: CARDS VIEW (DEFAULT ON MOBILE) ================= */}
        {viewMode === 'cards' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {filtered.length === 0 ? (
              <div className="col-span-full p-8 text-center text-xs text-[#64748b]">
                Заметки не найдены
              </div>
            ) : (
              filtered.map((note) => {
                const folder = (note.filePath || '').includes('/') ? note.filePath.split('/')[0] : 'Корень';
                const isMenuOpen = statusMenuOpenId === note.id;
                const cleanSnippet = getCleanSnippet(note.content, 110);
                const outCount = note.outlinks?.length || 0;
                const backCount = note.backlinks?.length || 0;

                return (
                  <div
                    key={note.id}
                    onClick={() => handleOpenNote(note.id, note.title)}
                    className={`p-3.5 rounded-2xl bg-[#11131c] border transition-all cursor-pointer flex flex-col justify-between space-y-2.5 group hover:border-[#7c5cff]/40 active:scale-[0.99] ${
                      note.pinned
                        ? 'border-amber-500/30 bg-amber-500/[0.03]'
                        : 'border-white/[0.06]'
                    }`}
                  >
                    {/* Top Row: Folder + Status Badge + Pin */}
                    <div className="flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/[0.04] text-[10px] font-medium border border-white/[0.06] text-[#cbd5e1] truncate max-w-[140px]">
                        <Folder size={10} className="text-[#7c5cff] shrink-0" />
                        <span className="truncate">{folder}</span>
                      </span>

                      <div className="flex items-center gap-1.5 shrink-0 relative">
                        <button
                          onClick={() => setStatusMenuOpenId(isMenuOpen ? null : note.id)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 ${
                            note.learningState === 'mastered'
                              ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30'
                              : note.learningState === 'learning'
                              ? 'bg-[#7c5cff]/15 text-[#a78bfa] border-[#7c5cff]/30'
                              : note.learningState === 'review'
                              ? 'bg-[#f59e0b]/15 text-[#fbbf24] border-[#f59e0b]/30'
                              : 'bg-white/[0.03] text-[#94a3b8] border-white/[0.06]'
                          }`}
                        >
                          <span>
                            {note.learningState === 'mastered'
                              ? 'Выучено'
                              : note.learningState === 'learning'
                              ? 'Изучается'
                              : note.learningState === 'review'
                              ? 'Повтор'
                              : 'Новая'}
                          </span>
                          <ChevronDown size={9} className="opacity-60" />
                        </button>

                        {/* Inline Status Menu */}
                        {isMenuOpen && (
                          <div className="absolute right-0 top-7 z-50 w-32 bg-[#161824] border border-white/[0.14] rounded-xl shadow-2xl p-1 space-y-0.5 animate-scale-up">
                            {(['new', 'learning', 'review', 'mastered'] as LearningState[]).map((st) => (
                              <button
                                key={st}
                                onClick={() => {
                                  setLearningState(note.id, st);
                                  setStatusMenuOpenId(null);
                                }}
                                className={`w-full text-left px-2 py-1 rounded-lg text-[10px] font-medium flex items-center justify-between hover:bg-white/[0.08] transition-colors ${
                                  (note.learningState || 'new') === st ? 'text-white font-bold bg-white/[0.05]' : 'text-[#94a3b8]'
                                }`}
                              >
                                <span>
                                  {st === 'mastered' ? 'Выучено' : st === 'learning' ? 'Изучается' : st === 'review' ? 'Повторение' : 'Новая'}
                                </span>
                                {(note.learningState || 'new') === st && <CheckCircle2 size={11} className="text-[#7c5cff]" />}
                              </button>
                            ))}
                          </div>
                        )}

                        <button
                          onClick={() => togglePin(note.id)}
                          className={`p-1 rounded-lg transition-colors ${
                            note.pinned ? 'text-[#f59e0b] bg-amber-500/15' : 'text-[#64748b] hover:text-white'
                          }`}
                          title={note.pinned ? 'Открепить' : 'Закрепить'}
                        >
                          <Pin size={11} />
                        </button>
                      </div>
                    </div>

                    {/* Middle: Title & Snippet */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{
                            backgroundColor: note.pinned
                              ? '#f59e0b'
                              : note.learningState === 'mastered'
                              ? '#10b981'
                              : note.learningState === 'learning'
                              ? '#a855f7'
                              : '#64748b',
                          }}
                        />
                        <h3 className="font-bold text-sm text-white group-hover:text-[#7c5cff] transition-colors truncate">
                          {note.title || 'Без названия'}
                        </h3>
                      </div>
                      <p className="text-[11px] text-[#94a3b8] line-clamp-2 leading-relaxed">
                        {cleanSnippet || 'Заметка пока пуста...'}
                      </p>
                    </div>

                    {/* Bottom Row: Tags + Synapses + Date + Delete */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.04] text-[10px]" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1 flex-wrap truncate flex-1 min-w-0">
                        {note.tags.slice(0, 2).map((t) => (
                          <span key={t} className="px-1.5 py-0.5 rounded-md bg-white/[0.04] text-[#a78bfa] text-[9px] truncate">
                            #{t}
                          </span>
                        ))}
                        {note.tags.length === 0 && (
                          <span className="text-[#475569] text-[9px]">—</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 font-mono text-[#64748b] shrink-0">
                        {(outCount > 0 || backCount > 0) && (
                          <span className="text-[#38bdf8] flex items-center gap-0.5">
                            <Link2 size={10} />
                            <span>{outCount + backCount}</span>
                          </span>
                        )}
                        <span>{formatRelativeDate(note.updatedAt)}</span>
                        <button
                          onClick={() => {
                            if (confirm(`Удалить заметку «${note.title}»?`)) {
                              deleteNeuron(note.id);
                            }
                          }}
                          className="p-1 rounded text-[#64748b] hover:text-[#f43f5e] transition-colors"
                          title="Удалить"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ================= MODE 2: RESPONSIVE MOBILE LIST (СПИСОК) ================= */}
        {viewMode === 'table' && (
          <div className="space-y-1.5">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#64748b]">
                Заметки не найдены
              </div>
            ) : (
              filtered.map((note) => {
                const folder = (note.filePath || '').includes('/') ? note.filePath.split('/')[0] : 'Корень';
                const isMenuOpen = statusMenuOpenId === note.id;
                const outCount = note.outlinks?.length || 0;
                const backCount = note.backlinks?.length || 0;
                const cleanSnippet = getCleanSnippet(note.content, 60);

                return (
                  <div
                    key={note.id}
                    onClick={() => handleOpenNote(note.id, note.title)}
                    className={`p-3 rounded-2xl bg-[#11131c] border transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99] group hover:border-[#7c5cff]/40 ${
                      note.pinned
                        ? 'border-amber-500/30 bg-amber-500/[0.03]'
                        : 'border-white/[0.06]'
                    }`}
                  >
                    {/* Left: Indicator Dot + Title + Folder + Snippet */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: note.pinned
                            ? '#f59e0b'
                            : note.learningState === 'mastered'
                            ? '#10b981'
                            : note.learningState === 'learning'
                            ? '#a855f7'
                            : '#64748b',
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-bold text-xs text-white group-hover:text-[#7c5cff] transition-colors truncate">
                            {note.title || 'Без названия'}
                          </span>
                          {note.pinned && (
                            <Pin size={10} className="text-[#f59e0b] shrink-0" />
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-[10px] text-[#94a3b8] mt-0.5 truncate">
                          <span className="text-[#a78bfa] font-medium flex items-center gap-1 shrink-0 bg-white/[0.03] px-1.5 py-0.5 rounded border border-white/[0.04]">
                            <Folder size={9} className="text-[#7c5cff] shrink-0" />
                            <span className="truncate max-w-[90px]">{folder}</span>
                          </span>
                          <span className="truncate text-[#64748b]">{cleanSnippet || 'Пустая заметка'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Status Pill + Actions */}
                    <div className="flex items-center gap-1.5 shrink-0 relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setStatusMenuOpenId(isMenuOpen ? null : note.id)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 ${
                          note.learningState === 'mastered'
                            ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30'
                            : note.learningState === 'learning'
                            ? 'bg-[#7c5cff]/15 text-[#a78bfa] border-[#7c5cff]/30'
                            : note.learningState === 'review'
                            ? 'bg-[#f59e0b]/15 text-[#fbbf24] border-[#f59e0b]/30'
                            : 'bg-white/[0.03] text-[#94a3b8] border-white/[0.06]'
                        }`}
                      >
                        <span>
                          {note.learningState === 'mastered'
                            ? 'Выучено'
                            : note.learningState === 'learning'
                            ? 'Изучается'
                            : note.learningState === 'review'
                            ? 'Повтор'
                            : 'Новая'}
                        </span>
                        <ChevronDown size={9} className="opacity-60" />
                      </button>

                      {/* Inline Status Menu */}
                      {isMenuOpen && (
                        <div className="absolute right-0 top-7 z-50 w-32 bg-[#161824] border border-white/[0.14] rounded-xl shadow-2xl p-1 space-y-0.5 animate-scale-up">
                          {(['new', 'learning', 'review', 'mastered'] as LearningState[]).map((st) => (
                            <button
                              key={st}
                              onClick={() => {
                                setLearningState(note.id, st);
                                setStatusMenuOpenId(null);
                              }}
                              className={`w-full text-left px-2 py-1 rounded-lg text-[10px] font-medium flex items-center justify-between hover:bg-white/[0.08] transition-colors ${
                                (note.learningState || 'new') === st ? 'text-white font-bold bg-white/[0.05]' : 'text-[#94a3b8]'
                              }`}
                            >
                              <span>
                                {st === 'mastered' ? 'Выучено' : st === 'learning' ? 'Изучается' : st === 'review' ? 'Повторение' : 'Новая'}
                              </span>
                              {(note.learningState || 'new') === st && <CheckCircle2 size={11} className="text-[#7c5cff]" />}
                            </button>
                          ))}
                        </div>
                      )}

                      <button
                        onClick={() => togglePin(note.id)}
                        className={`p-1 rounded-lg transition-colors ${
                          note.pinned ? 'text-[#f59e0b] bg-amber-500/15' : 'text-[#64748b] hover:text-white'
                        }`}
                        title={note.pinned ? 'Открепить' : 'Закрепить'}
                      >
                        <Pin size={11} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
