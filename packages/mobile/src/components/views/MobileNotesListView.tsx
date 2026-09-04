import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Pin,
  Folder,
  FolderInput,
  FolderPlus,
  Check,
  Tag,
  Link2,
  Calendar,
  MoreVertical,
  Trash2,
  Eye,
  Edit3,
  Network,
  Share2,
  Grid,
  List,
  ArrowUpDown,
  Sparkles,
  X,
  FileText,
  Clock,
} from 'lucide-react';
import { useBrainStore, Neuron } from '../../store/useBrainStore';

export const MobileNotesListView: React.FC = () => {
  const {
    neurons,
    folders,
    activeNeuronId,
    openNote,
    openTab,
    addNeuron,
    deleteNeuron,
    togglePin,
    selectNeuron,
    moveNoteToFolder,
    addFolder,
  } = useBrainStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'updated' | 'title' | 'connections' | 'pinned'>('updated');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeMenuNoteId, setActiveMenuNoteId] = useState<string | null>(null);

  // Move to Folder Bottom Sheet Modal State
  const [moveFolderModalNote, setMoveFolderModalNote] = useState<Neuron | null>(null);
  const [isCreatingNewFolderInline, setIsCreatingNewFolderInline] = useState(false);
  const [newFolderNameInput, setNewFolderNameInput] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage((c) => (c === msg ? null : c)), 2500);
  };

  // Folder statistics
  const folderCounts = useMemo(() => {
    const map: Record<string, number> = {};
    neurons.forEach((n) => {
      const f = n.filePath ? n.filePath.split('/')[0] : 'Без папки';
      map[f] = (map[f] || 0) + 1;
    });
    return map;
  }, [neurons]);

  // Unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    neurons.forEach((n) => {
      (n.tags || []).forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [neurons]);

  // Stable note ordering so notes never jump around or re-sort erratically while typing
  const stableOrderRef = React.useRef<{ key: string; order: string[] }>({ key: '', order: [] });
  const currentSortKey = `${sortBy}_${selectedFolder || ''}_${selectedTag || ''}_${searchQuery}`;

  // Filtered & Sorted notes (stabilized during active typing/editing)
  const displayedNotes = useMemo(() => {
    const filtered = neurons.filter((n) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = n.title.toLowerCase().includes(q);
        const matchContent = n.content.toLowerCase().includes(q);
        const matchTags = n.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchContent && !matchTags) return false;
      }

      // Folder filter
      if (selectedFolder) {
        const folder = n.filePath ? n.filePath.split('/')[0] : 'Без папки';
        if (folder !== selectedFolder) return false;
      }

      // Tag filter
      if (selectedTag) {
        if (!n.tags?.includes(selectedTag)) return false;
      }

      return true;
    });

    // If search/folder/tag/sort filter changed, compute fresh sort order
    if (stableOrderRef.current.key !== currentSortKey || stableOrderRef.current.order.length === 0) {
      const sorted = [...filtered].sort((a, b) => {
        if (sortBy === 'pinned') {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return b.updatedAt - a.updatedAt;
        }
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        if (sortBy === 'connections') {
          const ca = (a.outlinks?.length || 0) + (a.backlinks?.length || 0);
          const cb = (b.outlinks?.length || 0) + (b.backlinks?.length || 0);
          return cb - ca;
        }
        // Default: updated desc, pinned first
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.updatedAt - a.updatedAt;
      });

      stableOrderRef.current = {
        key: currentSortKey,
        order: sorted.map((n) => n.id),
      };
      return sorted;
    }

    // Preserve stable order for existing notes while updating their content in-place
    const orderMap = new Map<string, number>();
    stableOrderRef.current.order.forEach((id, idx) => orderMap.set(id, idx));

    return [...filtered].sort((a, b) => {
      const idxA = orderMap.has(a.id) ? orderMap.get(a.id)! : -1;
      const idxB = orderMap.has(b.id) ? orderMap.get(b.id)! : -1;
      if (idxA === -1 && idxB === -1) return b.updatedAt - a.updatedAt;
      if (idxA === -1) return -1; // newly added note appears at top
      if (idxB === -1) return 1;
      return idxA - idxB;
    });
  }, [neurons, searchQuery, selectedFolder, selectedTag, sortBy, currentSortKey]);

  const handleCreateNewNote = () => {
    const newNote = addNeuron('Новая мысль', '', selectedFolder || undefined);
    openNote(newNote.id);
  };

  const handleOpenOnGraph = (noteId: string) => {
    selectNeuron(noteId);
    openTab({ type: 'graph', title: 'Граф' });
  };

  const cleanExcerpt = (content: string) => {
    if (!content) return 'Нет содержимого...';
    return (
      content
        .replace(/<[^>]+>/g, ' ') // remove any legacy HTML tags
        .replace(/---[\s\S]*?---/g, '') // remove frontmatter
        .replace(/#+\s+/g, '') // remove markdown headings
        .replace(/\[\[(.*?)\]\]/g, '$1') // remove wikilinks syntax
        .replace(/`{1,3}.*?`{1,3}/g, '') // remove inline code
        .replace(/\n+/g, ' ')
        .trim()
        .slice(0, 110) + (content.length > 110 ? '...' : '')
    );
  };

  const formatRelativeTime = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Только что';
    if (mins < 60) return `${mins} мин назад`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} ч назад`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} дн назад`;
    return new Date(ts).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b0c13] text-white overflow-hidden select-none">
      {/* ═════════ HEADER ═════════ */}
      <div className="p-4 pb-2 border-b border-white/[0.08] bg-[#0f1019]/90 backdrop-blur-md shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Заметки и Мысли</span>
              <span className="px-2 py-0.5 rounded-full bg-[#7c5cff]/20 text-[#a78bfa] text-xs font-mono font-bold">
                {displayedNotes.length}
              </span>
            </h1>
            <p className="text-[11px] text-[#94a3b8]">
              База знаний и ассоциативных связей
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {/* View Mode Switcher */}
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-[#94a3b8] active:scale-95 transition-all"
              title="Переключить вид"
            >
              {viewMode === 'grid' ? <List size={16} /> : <Grid size={16} />}
            </button>

            {/* Sort Toggle */}
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-[#181926] border border-white/[0.1] rounded-xl px-2.5 py-1.5 text-xs text-[#cbd5e1] font-semibold focus:outline-none"
            >
              <option value="updated">По дате</option>
              <option value="title">По имени (А-Я)</option>
              <option value="connections">По связям ⚡</option>
              <option value="pinned">Закреплённые</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-2">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по заметкам, идеям, #тегам..."
            className="w-full bg-[#181926] border border-white/[0.08] rounded-xl pl-9 pr-8 py-2.5 text-xs text-white placeholder:text-[#64748b] focus:outline-none focus:border-[#7c5cff]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Pills Carousel: Folders & Tags */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-xs">
          {/* All notes */}
          <button
            onClick={() => {
              setSelectedFolder(null);
              setSelectedTag(null);
            }}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
              selectedFolder === null && selectedTag === null
                ? 'bg-[#7c5cff] text-white shadow-md'
                : 'bg-white/[0.05] text-[#94a3b8] hover:bg-white/[0.1]'
            }`}
          >
            Все ({neurons.length})
          </button>

          {/* Folder Pills */}
          {Object.entries(folderCounts).map(([folderName, count]) => (
            <button
              key={folderName}
              onClick={() => {
                setSelectedFolder(selectedFolder === folderName ? null : folderName);
                setSelectedTag(null);
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                selectedFolder === folderName
                  ? 'bg-[#38bdf8] text-black font-bold shadow-md'
                  : 'bg-white/[0.05] text-[#94a3b8] hover:bg-white/[0.1]'
              }`}
            >
              <Folder size={12} />
              <span>{folderName}</span>
              <span className="opacity-70 font-mono text-[10px]">({count})</span>
            </button>
          ))}

          {/* Tag Pills */}
          {allTags.slice(0, 10).map((tag) => (
            <button
              key={tag}
              onClick={() => {
                setSelectedTag(selectedTag === tag ? null : tag);
                setSelectedFolder(null);
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all shrink-0 ${
                selectedTag === tag
                  ? 'bg-[#ec4899] text-white font-bold shadow-md'
                  : 'bg-white/[0.05] text-[#94a3b8] hover:bg-white/[0.1]'
              }`}
            >
              <Tag size={11} />
              <span>#{tag}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ═════════ NOTES LIST / GRID CONTAINER ═════════ */}
      <div className="flex-1 overflow-y-auto p-3.5 pb-24 space-y-3">
        {displayedNotes.length === 0 ? (
          <div className="py-16 text-center text-[#64748b] space-y-3">
            <FileText size={40} className="mx-auto opacity-40 text-[#7c5cff]" />
            <p className="text-sm font-semibold text-white">Заметки не найдены</p>
            <p className="text-xs text-[#94a3b8] max-w-xs mx-auto">
              Попробуйте изменить поисковый запрос или создайте новую заметку кнопкой ниже.
            </p>
            <button
              onClick={handleCreateNewNote}
              className="mt-2 px-4 py-2 rounded-xl bg-[#7c5cff] text-white font-bold text-xs shadow-lg inline-flex items-center gap-2"
            >
              <Plus size={14} />
              <span>Создать заметку</span>
            </button>
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 gap-3'
                : 'space-y-2'
            }
          >
            {displayedNotes.map((note) => {
              const outCount = note.outlinks?.length || 0;
              const inCount = note.backlinks?.length || 0;
              const totalLinks = outCount + inCount;
              const folder = note.filePath ? note.filePath.split('/')[0] : 'Заметки';
              const isMenuOpen = activeMenuNoteId === note.id;

              return (
                <div
                  key={note.id}
                  onClick={() => openNote(note.id)}
                  className="group relative p-3.5 rounded-2xl bg-gradient-to-b from-[#161724] to-[#12131d] border border-white/[0.07] hover:border-[#7c5cff]/50 active:scale-[0.99] transition-all cursor-pointer shadow-md flex flex-col justify-between gap-2.5"
                >
                  {/* Top Bar of Card */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {/* Folder & Pinned Badge */}
                      <div className="flex items-center gap-1.5 mb-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMoveFolderModalNote(note);
                          }}
                          className="px-2 py-0.5 rounded-md bg-white/[0.06] hover:bg-[#38bdf8]/15 text-[10px] text-[#38bdf8] font-medium truncate max-w-[140px] flex items-center gap-1 active:scale-95 transition-all"
                          title="Нажмите для перемещения в другую папку"
                        >
                          <Folder size={10} className="shrink-0 text-[#38bdf8]" />
                          <span className="truncate">{folder}</span>
                        </button>
                        {note.pinned && (
                          <span className="p-1 rounded-md bg-amber-500/20 text-amber-400">
                            <Pin size={10} className="fill-amber-400" />
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h2 className="text-sm font-bold text-white group-hover:text-[#a78bfa] transition-colors truncate">
                        {note.title}
                      </h2>
                    </div>

                    {/* Quick 3-dots Menu Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuNoteId(isMenuOpen ? null : note.id);
                      }}
                      className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-[#94a3b8] shrink-0"
                    >
                      <MoreVertical size={14} />
                    </button>
                  </div>

                  {/* Dropdown Menu when 3-dots clicked */}
                  {isMenuOpen && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-3 top-10 z-30 w-48 rounded-xl bg-[#1d1e2c] border border-white/[0.12] shadow-2xl p-1.5 space-y-1 text-xs animate-scale-in"
                    >
                      <button
                        onClick={() => {
                          setActiveMenuNoteId(null);
                          openNote(note.id);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg text-left text-white hover:bg-white/[0.08] flex items-center gap-2"
                      >
                        <Edit3 size={13} className="text-[#7c5cff]" />
                        <span>Редактировать</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveMenuNoteId(null);
                          setMoveFolderModalNote(note);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg text-left text-white hover:bg-white/[0.08] flex items-center gap-2"
                      >
                        <FolderInput size={13} className="text-[#38bdf8]" />
                        <span>Переместить в папку</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveMenuNoteId(null);
                          handleOpenOnGraph(note.id);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg text-left text-white hover:bg-white/[0.08] flex items-center gap-2"
                      >
                        <Network size={13} className="text-[#38bdf8]" />
                        <span>Найти на графе</span>
                      </button>

                      <button
                        onClick={() => {
                          togglePin(note.id);
                          setActiveMenuNoteId(null);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg text-left text-white hover:bg-white/[0.08] flex items-center gap-2"
                      >
                        <Pin size={13} className="text-amber-400" />
                        <span>{note.pinned ? 'Открепить' : 'Закрепить'}</span>
                      </button>

                      <div className="h-px bg-white/[0.08] my-1" />

                      <button
                        onClick={() => {
                          if (confirm(`Удалить заметку «${note.title}»?`)) {
                            deleteNeuron(note.id);
                          }
                          setActiveMenuNoteId(null);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg text-left text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                      >
                        <Trash2 size={13} />
                        <span>Удалить</span>
                      </button>
                    </div>
                  )}

                  {/* Excerpt Body */}
                  <p className="text-[11px] text-[#94a3b8] line-clamp-2 leading-relaxed font-normal">
                    {cleanExcerpt(note.content)}
                  </p>

                  {/* Tags */}
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {note.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 rounded bg-white/[0.04] text-[10px] text-[#a78bfa] font-mono"
                        >
                          #{tag}
                        </span>
                      ))}
                      {note.tags.length > 3 && (
                        <span className="text-[10px] text-[#64748b]">
                          +{note.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Card Bottom Meta Bar */}
                  <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between text-[10px] text-[#64748b]">
                    {/* Synaptic Connections Badge */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenOnGraph(note.id);
                      }}
                      className="px-2 py-0.5 rounded-md bg-[#7c5cff]/10 hover:bg-[#7c5cff]/20 text-[#a78bfa] font-mono flex items-center gap-1 transition-colors"
                      title="Связи в графе"
                    >
                      <Link2 size={11} />
                      <span>{totalLinks} связей</span>
                    </div>

                    {/* Relative Time */}
                    <div className="flex items-center gap-1 font-mono">
                      <Clock size={10} />
                      <span>{formatRelativeTime(note.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═════════ FLOATING ACTION BUTTON (+) ═════════ */}
      <button
        onClick={handleCreateNewNote}
        className="fixed bottom-20 right-5 z-40 w-14 h-14 rounded-2xl bg-gradient-to-r from-[#7c5cff] to-[#38bdf8] text-white shadow-xl shadow-[#7c5cff]/30 flex items-center justify-center active:scale-90 transition-all hover:opacity-95"
        title="Новая мысль"
      >
        <Plus size={24} />
      </button>

      {/* ═════════ MOVE TO FOLDER BOTTOM SHEET MODAL ═════════ */}
      {moveFolderModalNote && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={() => {
            setMoveFolderModalNote(null);
            setIsCreatingNewFolderInline(false);
          }}
        >
          <div
            className="w-full sm:max-w-md bg-[#161724] border-t sm:border border-white/[0.12] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#38bdf8]/20 text-[#38bdf8] flex items-center justify-center shrink-0">
                  <FolderInput size={17} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate">
                    Переместить в папку
                  </h3>
                  <p className="text-[11px] text-[#94a3b8] truncate">
                    «{moveFolderModalNote.title}»
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setMoveFolderModalNote(null);
                  setIsCreatingNewFolderInline(false);
                }}
                className="p-1 rounded-lg text-[#94a3b8] hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Folder List Scroll Area */}
            <div className="space-y-1.5 overflow-y-auto max-h-60 pr-1">
              {/* Option 1: Root (No folder) */}
              {(() => {
                const currentNoteFolder = moveFolderModalNote.filePath?.includes('/')
                  ? moveFolderModalNote.filePath.split('/')[0]
                  : null;
                const isCurrentRoot = !currentNoteFolder;

                return (
                  <button
                    onClick={() => {
                      moveNoteToFolder(moveFolderModalNote.id, null);
                      showToast(`«${moveFolderModalNote.title}» перемещена в корень`);
                      setMoveFolderModalNote(null);
                    }}
                    className={`w-full p-3 rounded-xl text-left flex items-center justify-between transition-all active:scale-[0.98] ${
                      isCurrentRoot
                        ? 'bg-[#38bdf8]/20 border border-[#38bdf8]/40 text-[#38bdf8] font-bold'
                        : 'bg-white/[0.04] hover:bg-white/[0.08] text-[#cbd5e1]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Folder size={16} className={isCurrentRoot ? 'text-[#38bdf8]' : 'text-[#64748b]'} />
                      <span className="text-xs">Без папки (Корень)</span>
                    </div>
                    {isCurrentRoot && <Check size={16} className="text-[#38bdf8]" />}
                  </button>
                );
              })()}

              {/* Existing Folders */}
              {folders.map((f) => {
                const currentNoteFolder = moveFolderModalNote.filePath?.includes('/')
                  ? moveFolderModalNote.filePath.split('/')[0]
                  : null;
                const isCurrent = currentNoteFolder === f.name;
                const count = folderCounts[f.name] || 0;

                return (
                  <button
                    key={f.id}
                    onClick={() => {
                      moveNoteToFolder(moveFolderModalNote.id, f.name);
                      showToast(`«${moveFolderModalNote.title}» перемещена в «${f.name}»`);
                      setMoveFolderModalNote(null);
                    }}
                    className={`w-full p-3 rounded-xl text-left flex items-center justify-between transition-all active:scale-[0.98] ${
                      isCurrent
                        ? 'bg-[#38bdf8]/20 border border-[#38bdf8]/40 text-[#38bdf8] font-bold'
                        : 'bg-white/[0.04] hover:bg-white/[0.08] text-[#cbd5e1]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Folder size={16} className={isCurrent ? 'text-[#38bdf8]' : 'text-[#a78bfa]'} />
                      <span className="text-xs truncate">{f.name}</span>
                      <span className="text-[10px] text-[#64748b] font-mono">({count})</span>
                    </div>
                    {isCurrent && <Check size={16} className="text-[#38bdf8] shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Create New Folder Inline Option */}
            <div className="pt-2 border-t border-white/[0.08] shrink-0">
              {isCreatingNewFolderInline ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newFolderNameInput}
                    onChange={(e) => setNewFolderNameInput(e.target.value)}
                    placeholder="Имя новой папки..."
                    autoFocus
                    className="flex-1 bg-[#10111a] border border-[#7c5cff] rounded-xl px-3 py-2 text-xs text-white placeholder:text-[#64748b] focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newFolderNameInput.trim()) {
                        const trimmed = newFolderNameInput.trim();
                        addFolder(trimmed);
                        moveNoteToFolder(moveFolderModalNote.id, trimmed);
                        showToast(`Создана папка «${trimmed}» и заметка перемещена`);
                        setMoveFolderModalNote(null);
                        setIsCreatingNewFolderInline(false);
                        setNewFolderNameInput('');
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (newFolderNameInput.trim()) {
                        const trimmed = newFolderNameInput.trim();
                        addFolder(trimmed);
                        moveNoteToFolder(moveFolderModalNote.id, trimmed);
                        showToast(`Создана папка «${trimmed}» и заметка перемещена`);
                        setMoveFolderModalNote(null);
                        setIsCreatingNewFolderInline(false);
                        setNewFolderNameInput('');
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-[#7c5cff] text-white text-xs font-bold active:scale-95 transition-all"
                  >
                    ОК
                  </button>
                  <button
                    onClick={() => {
                      setIsCreatingNewFolderInline(false);
                      setNewFolderNameInput('');
                    }}
                    className="p-2 rounded-xl bg-white/[0.06] text-[#94a3b8] text-xs"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCreatingNewFolderInline(true)}
                  className="w-full py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-[#a78bfa] flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <FolderPlus size={15} />
                  <span>+ Создать новую папку и переместить</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 inset-x-0 mx-auto w-fit max-w-[90%] px-4 py-2 bg-[#1c1d29] text-[#38bdf8] border border-[#38bdf8]/30 rounded-2xl shadow-2xl text-xs font-semibold flex items-center gap-2 z-50 animate-fade-in pointer-events-none">
          <Sparkles size={14} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
