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
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

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
    <div className="flex-1 h-full bg-[#090a0f] flex flex-col select-text overflow-hidden text-[#e2e8f0]">
      {/* 1. Header with Title & Quick Controls */}
      <div className="px-6 py-3.5 border-b border-white/[0.08] bg-[#0d0e14] flex items-center justify-between flex-wrap gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#7c5cff]/15 border border-[#7c5cff]/30 shadow-md">
            <NeuralNotebookLogo size={24} glow />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-sm font-bold text-white tracking-tight">
                База Знаний & Таблицы
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-[#cbd5e1] font-mono text-[10px] font-semibold border border-white/[0.08]">
                {neurons.length} заметок
              </span>
            </div>
            <p className="text-[11px] text-[#94a3b8]">
              Таблица структурированных заметок, синапсов и категорий
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle: Table vs Cards */}
          <div className="flex items-center p-0.5 bg-[#141620] border border-white/[0.08] rounded-xl text-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                viewMode === 'table'
                  ? 'bg-[#7c5cff] text-white shadow-md'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
              title="Табличный вид"
            >
              <List size={13} />
              <span>Таблица</span>
            </button>

            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                viewMode === 'cards'
                  ? 'bg-[#7c5cff] text-white shadow-md'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
              title="Вид карточек"
            >
              <LayoutGrid size={13} />
              <span>Карточки</span>
            </button>
          </div>

          {/* New Note Button */}
          <button
            onClick={handleCreateNew}
            className="px-3.5 py-1.5 rounded-xl bg-[#7c5cff] hover:bg-[#6d4aff] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#7c5cff]/20 transition-all"
          >
            <Plus size={14} className="stroke-[2.5]" />
            <span>Новая мысль</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive KPI Metrics Dashboard Ribbon */}
      <div className="px-6 py-2.5 border-b border-white/[0.06] bg-[#0b0c12] shrink-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
          {/* Total Notes */}
          <div
            onClick={() => setSelectedState('all')}
            className={`p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              selectedState === 'all'
                ? 'bg-[#161824] border-[#7c5cff]/50 shadow-sm'
                : 'bg-[#10121a] border-white/[0.05] hover:border-white/[0.1]'
            }`}
          >
            <div className="flex items-center justify-between text-[#94a3b8] text-[10px]">
              <span>Всего</span>
              <BookOpen size={12} className="text-[#7c5cff]" />
            </div>
            <span className="text-sm font-bold text-white font-mono mt-0.5">
              {stats.totalNotes}
            </span>
          </div>

          {/* Mastered */}
          <div
            onClick={() => setSelectedState(selectedState === 'mastered' ? 'all' : 'mastered')}
            className={`p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              selectedState === 'mastered'
                ? 'bg-[#10b981]/15 border-[#10b981]/60 shadow-sm'
                : 'bg-[#10121a] border-white/[0.05] hover:border-[#10b981]/30'
            }`}
          >
            <div className="flex items-center justify-between text-[#10b981] text-[10px] font-medium">
              <span>Выучено</span>
              <CheckCircle2 size={12} />
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-sm font-bold text-[#10b981] font-mono">
                {stats.mastered}
              </span>
              <span className="text-[9px] text-[#10b981]/70 font-mono">
                {stats.totalNotes > 0 ? Math.round((stats.mastered / stats.totalNotes) * 100) : 0}%
              </span>
            </div>
          </div>

          {/* Learning */}
          <div
            onClick={() => setSelectedState(selectedState === 'learning' ? 'all' : 'learning')}
            className={`p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              selectedState === 'learning'
                ? 'bg-[#a855f7]/15 border-[#a855f7]/60 shadow-sm'
                : 'bg-[#10121a] border-white/[0.05] hover:border-[#a855f7]/30'
            }`}
          >
            <div className="flex items-center justify-between text-[#c084fc] text-[10px] font-medium">
              <span>Изучается</span>
              <Sparkles size={12} />
            </div>
            <span className="text-sm font-bold text-[#c084fc] font-mono mt-0.5">
              {stats.learning}
            </span>
          </div>

          {/* Review */}
          <div
            onClick={() => setSelectedState(selectedState === 'review' ? 'all' : 'review')}
            className={`p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              selectedState === 'review'
                ? 'bg-[#f59e0b]/15 border-[#f59e0b]/60 shadow-sm'
                : 'bg-[#10121a] border-white/[0.05] hover:border-[#f59e0b]/30'
            }`}
          >
            <div className="flex items-center justify-between text-[#fbbf24] text-[10px] font-medium">
              <span>Повторение</span>
              <RotateCcw size={12} />
            </div>
            <span className="text-sm font-bold text-[#fbbf24] font-mono mt-0.5">
              {stats.review}
            </span>
          </div>

          {/* New */}
          <div
            onClick={() => setSelectedState(selectedState === 'new' ? 'all' : 'new')}
            className={`p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              selectedState === 'new'
                ? 'bg-[#38bdf8]/15 border-[#38bdf8]/60 shadow-sm'
                : 'bg-[#10121a] border-white/[0.05] hover:border-[#38bdf8]/30'
            }`}
          >
            <div className="flex items-center justify-between text-[#38bdf8] text-[10px] font-medium">
              <span>Новые</span>
              <Clock size={12} />
            </div>
            <span className="text-sm font-bold text-[#38bdf8] font-mono mt-0.5">
              {stats.newNotes}
            </span>
          </div>

          {/* Synapses Total */}
          <div className="p-2 rounded-xl bg-[#10121a] border border-white/[0.05] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#94a3b8] text-[10px]">
              <span>Связей</span>
              <Link2 size={12} className="text-[#38bdf8]" />
            </div>
            <span className="text-sm font-bold text-white font-mono mt-0.5">
              {stats.totalSynapses}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Search & Multi-Filter Control Bar */}
      <div className="px-6 py-2.5 border-b border-white/[0.06] bg-[#0c0d12] flex items-center justify-between gap-3 flex-wrap text-xs shrink-0">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px] max-w-sm flex items-center">
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
        <div className="flex items-center gap-2 flex-wrap">
          {/* Folder Selector */}
          <div className="relative flex items-center">
            <Folder size={12} className="absolute left-2.5 text-[#94a3b8] pointer-events-none" />
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="bg-[#13151f] border border-white/[0.08] text-[#e2e8f0] pl-7 pr-6 py-1.5 rounded-xl focus:outline-none focus:border-[#7c5cff] appearance-none cursor-pointer text-xs"
            >
              <option value="all">Все разделы ({folders.length})</option>
              {folders.map((f) => (
                <option key={f.name} value={f.name}>
                  {f.name} ({f.count})
                </option>
              ))}
            </select>
            <ChevronDown size={11} className="absolute right-2 text-[#94a3b8] pointer-events-none" />
          </div>

          {/* Tag Selector */}
          {allTags.length > 0 && (
            <div className="relative flex items-center">
              <Tag size={12} className="absolute left-2.5 text-[#94a3b8] pointer-events-none" />
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="bg-[#13151f] border border-white/[0.08] text-[#e2e8f0] pl-7 pr-6 py-1.5 rounded-xl focus:outline-none focus:border-[#7c5cff] appearance-none cursor-pointer text-xs"
              >
                <option value="all">Все теги ({allTags.length})</option>
                {allTags.map((t) => (
                  <option key={t.name} value={t.name}>
                    #{t.name} ({t.count})
                  </option>
                ))}
              </select>
              <ChevronDown size={11} className="absolute right-2 text-[#94a3b8] pointer-events-none" />
            </div>
          )}

          {/* Sorting */}
          <div className="relative flex items-center">
            <ArrowUpDown size={12} className="absolute left-2.5 text-[#94a3b8] pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#13151f] border border-white/[0.08] text-[#e2e8f0] pl-7 pr-6 py-1.5 rounded-xl focus:outline-none focus:border-[#7c5cff] appearance-none cursor-pointer text-xs"
            >
              <option value="updated">По дате изменения</option>
              <option value="title">По названию (А-Я)</option>
              <option value="links">По числу связей</option>
              <option value="access">По открытиям</option>
            </select>
            <ChevronDown size={11} className="absolute right-2 text-[#94a3b8] pointer-events-none" />
          </div>

          {/* Reset Filters button */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-2.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-[#94a3b8] hover:text-white transition-colors flex items-center gap-1 text-xs"
              title="Сбросить все фильтры"
            >
              <RotateCcw size={11} />
              <span>Сброс</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Main Body: Table View OR Cards View */}
      <div className="flex-1 overflow-y-auto p-4" onClick={() => setStatusMenuOpenId(null)}>
        {/* ================= MODE 1: PRO DATA TABLE ================= */}
        {viewMode === 'table' && (
          <div className="w-full bg-[#10121a] border border-white/[0.06] rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] bg-[#0a0b10] text-[#94a3b8] uppercase font-semibold text-[10px] tracking-wider">
                  <th className="py-3 px-4">Заметка / Мысль</th>
                  <th className="py-3 px-3">Раздел</th>
                  <th className="py-3 px-3">Статус</th>
                  <th className="py-3 px-3">Связи</th>
                  <th className="py-3 px-3">Теги</th>
                  <th className="py-3 px-3">Обновлено</th>
                  <th className="py-3 px-4 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#64748b] text-xs">
                      Заметки не найдены
                    </td>
                  </tr>
                ) : (
                  filtered.map((note) => {
                    const folder = note.filePath.includes('/') ? note.filePath.split('/')[0] : 'Корень';
                    const isMenuOpen = statusMenuOpenId === note.id;
                    const outCount = note.outlinks?.length || 0;
                    const backCount = note.backlinks?.length || 0;
                    const cleanSnippet = getCleanSnippet(note.content, 90);

                    return (
                      <tr
                        key={note.id}
                        onClick={() => handleOpenNote(note.id, note.title)}
                        className={`hover:bg-white/[0.03] cursor-pointer transition-colors group ${
                          note.pinned ? 'bg-amber-500/[0.02]' : ''
                        }`}
                      >
                        {/* Title & Clean Snippet */}
                        <td className="py-2.5 px-4 max-w-[340px]">
                          <div className="flex items-center gap-2.5">
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
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="font-semibold text-white group-hover:text-[#7c5cff] transition-colors truncate">
                                  {note.title || 'Без названия'}
                                </span>
                                {note.pinned && (
                                  <Pin size={10} className="text-[#f59e0b] shrink-0" />
                                )}
                              </div>
                              <span className="text-[11px] text-[#64748b] truncate leading-tight mt-0.5">
                                {cleanSnippet}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Folder */}
                        <td className="py-2.5 px-3 text-[#94a3b8] whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.03] text-[10px] border border-white/[0.05] text-[#cbd5e1]">
                            <Folder size={10} className="text-[#7c5cff]" />
                            <span>{folder}</span>
                          </span>
                        </td>

                        {/* Learning State with Inline Dropdown */}
                        <td className="py-2.5 px-3 relative whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setStatusMenuOpenId(isMenuOpen ? null : note.id)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border flex items-center gap-1 transition-all ${
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
                                ? 'Повторение'
                                : 'Новая'}
                            </span>
                            <ChevronDown size={10} className="opacity-60" />
                          </button>

                          {/* Inline Status Menu */}
                          {isMenuOpen && (
                            <div className="absolute left-3 top-10 z-50 w-32 bg-[#161824] border border-white/[0.12] rounded-xl shadow-2xl p-1 space-y-0.5 animate-scale-up">
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
                        </td>

                        {/* Synapses (Clean Modern Counters) */}
                        <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap">
                          {outCount === 0 && backCount === 0 ? (
                            <span className="text-[#475569] text-[10px]">—</span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              {outCount > 0 && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#38bdf8]/10 text-[#38bdf8] text-[10px] border border-[#38bdf8]/20" title={`${outCount} исходящих связей`}>
                                  <ArrowUpRight size={10} /> {outCount}
                                </span>
                              )}
                              {backCount > 0 && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#a78bfa]/10 text-[#a78bfa] text-[10px] border border-[#a78bfa]/20" title={`${backCount} обратных связей`}>
                                  <ArrowDownLeft size={10} /> {backCount}
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Tags */}
                        <td className="py-2.5 px-3 max-w-[200px]" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1 flex-wrap">
                            {note.tags.slice(0, 2).map((t) => (
                              <button
                                key={t}
                                onClick={() => setSelectedTag(t)}
                                className="px-1.5 py-0.5 rounded bg-white/[0.04] text-[#a78bfa] text-[9px] border border-white/[0.06] hover:bg-[#7c5cff]/20 transition-colors"
                              >
                                #{t}
                              </button>
                            ))}
                            {note.tags.length > 2 && (
                              <span className="text-[9px] text-[#64748b] font-mono">
                                +{note.tags.length - 2}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Updated date */}
                        <td className="py-2.5 px-3 text-[#94a3b8] text-[10px] font-mono whitespace-nowrap">
                          {formatRelativeDate(note.updatedAt)}
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => togglePin(note.id)}
                              className={`p-1.5 rounded-lg hover:bg-white/[0.08] transition-colors ${
                                note.pinned ? 'text-[#f59e0b] bg-amber-500/15' : 'text-[#64748b] hover:text-white'
                              }`}
                              title={note.pinned ? 'Открепить' : 'Закрепить'}
                            >
                              <Pin size={12} />
                            </button>
                            <button
                              onClick={() => handleOpenNote(note.id, note.title)}
                              className="p-1.5 rounded-lg text-[#64748b] hover:text-[#7c5cff] hover:bg-white/[0.08] transition-colors"
                              title="Открыть заметку"
                            >
                              <ExternalLink size={12} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Удалить заметку «${note.title}»?`)) {
                                  deleteNeuron(note.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-[#64748b] hover:text-[#f43f5e] hover:bg-rose-500/15 transition-colors"
                              title="Удалить"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= MODE 2: CARDS KANBAN GRID ================= */}
        {viewMode === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((note) => {
              const folder = note.filePath.includes('/') ? note.filePath.split('/')[0] : 'Корень';
              const isMenuOpen = statusMenuOpenId === note.id;
              const cleanSnippet = getCleanSnippet(note.content, 120);
              const outCount = note.outlinks?.length || 0;
              const backCount = note.backlinks?.length || 0;

              return (
                <div
                  key={note.id}
                  onClick={() => handleOpenNote(note.id, note.title)}
                  className={`p-3.5 rounded-2xl bg-[#11131c] border transition-all cursor-pointer flex flex-col justify-between space-y-3 group hover:border-[#7c5cff]/40 hover:bg-[#141622] ${
                    note.pinned
                      ? 'border-amber-500/30 bg-amber-500/[0.02]'
                      : 'border-white/[0.06]'
                  }`}
                >
                  {/* Card Header: Folder + Status + Pin */}
                  <div className="flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.04] text-[10px] border border-white/[0.06] text-[#cbd5e1]">
                      <Folder size={10} className="text-[#7c5cff]" />
                      <span>{folder}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setStatusMenuOpenId(isMenuOpen ? null : note.id)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all ${
                          note.learningState === 'mastered'
                            ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30'
                            : note.learningState === 'learning'
                            ? 'bg-[#7c5cff]/15 text-[#a78bfa] border-[#7c5cff]/30'
                            : note.learningState === 'review'
                            ? 'bg-[#f59e0b]/15 text-[#fbbf24] border-[#f59e0b]/30'
                            : 'bg-white/[0.03] text-[#94a3b8] border-white/[0.06]'
                        }`}
                      >
                        {note.learningState === 'mastered'
                          ? 'Выучено'
                          : note.learningState === 'learning'
                          ? 'Изучается'
                          : note.learningState === 'review'
                          ? 'Повторение'
                          : 'Новая'}
                      </button>

                      <button
                        onClick={() => togglePin(note.id)}
                        className={`p-1 rounded-md transition-colors ${
                          note.pinned ? 'text-[#f59e0b] bg-amber-500/15' : 'text-[#64748b] hover:text-white'
                        }`}
                        title={note.pinned ? 'Открепить' : 'Закрепить'}
                      >
                        <Pin size={11} />
                      </button>
                    </div>
                  </div>

                  {/* Card Title & Clean Snippet */}
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-white group-hover:text-[#7c5cff] transition-colors truncate">
                      {note.title || 'Без названия'}
                    </h3>
                    <p className="text-xs text-[#94a3b8] line-clamp-3 leading-relaxed">
                      {cleanSnippet}
                    </p>
                  </div>

                  {/* Card Footer: Tags & Synapses */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.04] text-[10px]">
                    <div className="flex items-center gap-1 flex-wrap">
                      {note.tags.slice(0, 2).map((t) => (
                        <span key={t} className="px-1.5 py-0.5 rounded bg-white/[0.04] text-[#a78bfa] text-[9px]">
                          #{t}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-[#64748b]">
                      {outCount > 0 && <span className="text-[#38bdf8]">↑{outCount}</span>}
                      {backCount > 0 && <span className="text-[#a78bfa]">↓{backCount}</span>}
                      <span>{formatRelativeDate(note.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
