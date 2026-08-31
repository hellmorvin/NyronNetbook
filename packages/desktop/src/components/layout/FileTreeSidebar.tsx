import React, { useState, useEffect, useRef } from 'react';
import {
  FilePlus,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  FileText,
  Pin,
  Search,
  X,
  Bookmark,
  Settings,
  Tag,
  Copy,
  ExternalLink,
  Trash2,
  Edit2,
  FolderInput,
  Share2,
  Check,
  Sparkles,
  LayoutGrid,
} from 'lucide-react';
import { useBrainStore } from '../../store/useBrainStore';
import { Neuron } from '@axon/shared';

export const FileTreeSidebar: React.FC = () => {
  const {
    vaultName,
    neurons,
    folders,
    activeNeuronId,
    isLeftSidebarOpen,
    activeRibbonView,
    addNeuron,
    updateNeuron,
    deleteNeuron,
    addFolder,
    deleteFolder,
    renameFolder,
    moveNoteToFolder,
    toggleFolder,
    selectNeuron,
    openTab,
    togglePin,
    addCanvasCard,
    searchEngine,
  } = useBrainStore();

  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const [isTagsSectionOpen, setIsTagsSectionOpen] = useState(true);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    note?: Neuron;
    folder?: { id: string; name: string };
  } | null>(null);

  const [isMoveSubmenuOpen, setIsMoveSubmenuOpen] = useState(false);
  const [isCopySubmenuOpen, setIsCopySubmenuOpen] = useState(false);

  // Inline Rename State for Note
  const [renamingNoteId, setRenamingNoteId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState('');

  // Inline Rename State for Folder
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameFolderName, setRenameFolderName] = useState('');

  // Drag-and-Drop between folders state
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage((c) => (c === msg ? null : c)), 2500);
  };

  // Close context menu on outside click or escape
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null);
      setIsMoveSubmenuOpen(false);
      setIsCopySubmenuOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu(null);
        setIsMoveSubmenuOpen(false);
        setIsCopySubmenuOpen(false);
        setRenamingNoteId(null);
        setRenamingFolderId(null);
      }
    };
    window.addEventListener('click', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      addFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreatingFolder(false);
      showToast(`Папка «${newFolderName.trim()}» создана`);
    }
  };

  const handleOpenNote = (noteId: string, noteTitle: string) => {
    selectNeuron(noteId);
    openTab({ type: 'note', noteId, title: noteTitle });
  };

  const handleCreateNewNote = (folderName?: string) => {
    const newNote = addNeuron('Без названия', undefined, folderName);
    openTab({ type: 'note', noteId: newNote.id, title: newNote.title });
  };

  // Drag handlers for Left-Click Drag and Drop
  const handleDragStartNote = (e: React.DragEvent, note: { id: string; title: string }) => {
    setDraggedNoteId(note.id);
    e.dataTransfer.setData('text/note-id', note.id);
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'note', noteId: note.id, title: note.title }));
    e.dataTransfer.setData('text/plain', note.id);
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  const handleDragEndNote = () => {
    setDraggedNoteId(null);
    setDragOverFolder(null);
  };

  const handleDragOverFolder = (e: React.DragEvent, folderName: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverFolder !== folderName) {
      setDragOverFolder(folderName);
    }
  };

  const handleDropOnFolder = (e: React.DragEvent, folderName: string) => {
    e.preventDefault();
    e.stopPropagation();
    const noteId = e.dataTransfer.getData('text/note-id') || e.dataTransfer.getData('text/plain') || draggedNoteId;
    if (noteId) {
      moveNoteToFolder(noteId, folderName);
      const n = neurons.find((x) => x.id === noteId);
      showToast(`«${n?.title || 'Заметка'}» перемещена в «${folderName}»`);
    }
    setDraggedNoteId(null);
    setDragOverFolder(null);
  };

  const handleDragOverRoot = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverFolder !== '__root__') {
      setDragOverFolder('__root__');
    }
  };

  const handleDropOnRoot = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const noteId = e.dataTransfer.getData('text/note-id') || e.dataTransfer.getData('text/plain') || draggedNoteId;
    if (noteId) {
      moveNoteToFolder(noteId, null);
      const n = neurons.find((x) => x.id === noteId);
      showToast(`«${n?.title || 'Заметка'}» перемещена в корень`);
    }
    setDraggedNoteId(null);
    setDragOverFolder(null);
  };

  // Right-Click Context Menu trigger
  const handleContextMenuNote = (e: React.MouseEvent, note: Neuron) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMoveSubmenuOpen(false);
    setIsCopySubmenuOpen(false);
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      note,
    });
  };

  const handleContextMenuFolder = (e: React.MouseEvent, folder: { id: string; name: string }) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMoveSubmenuOpen(false);
    setIsCopySubmenuOpen(false);
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      folder,
    });
  };

  // Actions from Context Menu
  const handlePlaceOnCanvas = (note: Neuron) => {
    addCanvasCard({
      x: 140 + Math.random() * 60,
      y: 100 + Math.random() * 60,
      width: 290,
      height: 180,
      type: 'note',
      title: note.title,
      content: note.content ? note.content.slice(0, 220) : 'Заметка из базы...',
      noteId: note.id,
      color: '#8b5cf6',
    });
    openTab({ type: 'canvas', title: 'Холст' });
    showToast(`«${note.title}» добавлена на Холст`);
    setContextMenu(null);
  };

  const handleDuplicateNote = (note: Neuron) => {
    const filePath = note.filePath || '';
    const folder = filePath.includes('/') ? filePath.split('/')[0] : undefined;
    const duplicated = addNeuron(`${note.title} (Копия)`, note.content, folder);
    showToast(`Создана копия: «${duplicated.title}»`);
    setContextMenu(null);
  };

  const handleMoveNoteToFolder = (note: Neuron, targetFolder: string | null) => {
    moveNoteToFolder(note.id, targetFolder);
    showToast(`Файл перемещен в: ${targetFolder || 'Корень'}`);
    setContextMenu(null);
  };

  const handleSaveRenameNote = (noteId: string) => {
    if (renameTitle.trim()) {
      updateNeuron(noteId, { title: renameTitle.trim() });
      showToast(`Заметка переименована: «${renameTitle.trim()}»`);
    }
    setRenamingNoteId(null);
  };

  const handleSaveRenameFolder = (folder: { id: string; name: string }) => {
    if (renameFolderName.trim() && renameFolderName.trim() !== folder.name) {
      renameFolder(folder.name, renameFolderName.trim());
      showToast(`Папка переименована в: «${renameFolderName.trim()}»`);
    }
    setRenamingFolderId(null);
  };

  const handleDeleteFolderAction = (folderName: string, deleteNotes: boolean) => {
    deleteFolder(folderName, deleteNotes);
    showToast(deleteNotes ? `Папка «${folderName}» и все файлы удалены` : `Папка «${folderName}» удалена (файлы сохранены в корне)`);
    setContextMenu(null);
  };

  // Calculate all unique tags with count
  const vaultTagStats = React.useMemo(() => {
    const counts: Record<string, number> = {};
    neurons.forEach((n) => {
      (n.tags || []).forEach((t) => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return Object.entries(counts).map(([tag, count]) => ({ tag, count }));
  }, [neurons]);

  // Filter neurons if filterQuery or selectedTagFilter is present in explorer
  const visibleNeurons = React.useMemo(() => {
    return neurons.filter((n) => {
      const tags = n.tags || [];
      const title = n.title || '';
      if (selectedTagFilter && !tags.includes(selectedTagFilter)) return false;
      if (filterQuery.trim()) {
        const q = filterQuery.toLowerCase().trim();
        return (
          title.toLowerCase().includes(q) ||
          tags.some((t) => (t || '').toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [neurons, selectedTagFilter, filterQuery]);

  // Bookmarks list
  const bookmarkedNeurons = React.useMemo(() => {
    return neurons.filter((n) => n.pinned);
  }, [neurons]);

  // Search results for search view
  const searchResults = React.useMemo(() => {
    return sidebarSearchQuery.trim() && searchEngine && typeof searchEngine.search === 'function'
      ? searchEngine.search(sidebarSearchQuery.trim(), 15)
      : [];
  }, [sidebarSearchQuery, searchEngine]);

  // Group notes by folder prefix for explorer
  const knownFolderNames = React.useMemo(() => {
    return new Set(folders.map((f) => f.name));
  }, [folders]);

  // Group notes by folder prefix for explorer - unmatched folders fallback to root!
  const rootNotes = React.useMemo(() => {
    return visibleNeurons.filter((n) => {
      const p = n.filePath || '';
      if (!p.includes('/')) return true;
      const fName = p.split('/')[0];
      return !knownFolderNames.has(fName);
    });
  }, [visibleNeurons, knownFolderNames]);

  const folderGroups = React.useMemo(() => {
    return folders.map((folder) => ({
      folder,
      notes: visibleNeurons.filter((n) => (n.filePath || '').startsWith(`${folder.name}/`)),
    }));
  }, [folders, visibleNeurons]);

  if (!isLeftSidebarOpen) return null;

  return (
    <aside className="w-[260px] min-w-[260px] max-w-[260px] h-full bg-[#111217] border-r border-white/[0.08] flex flex-col select-none z-20 shrink-0 text-[#e2e8f0]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-12 left-20 z-50 px-3.5 py-1.5 rounded-xl bg-[#171822] border border-white/[0.14] text-white shadow-2xl text-xs font-semibold flex items-center gap-2 animate-fade-in pointer-events-none">
          <Sparkles size={13} className="text-[#8b5cf6]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Toolbar Header */}
      <div className="h-12 px-4 border-b border-white/[0.08] flex items-center justify-between bg-[#0e0f13] shrink-0">
        <span className="text-sm font-bold uppercase tracking-wider text-[#cbd5e1] flex items-center gap-2">
          {activeRibbonView === 'bookmarks' ? (
            <>
              <Bookmark size={16} className="text-[#f59e0b]" />
              <span>Закладки</span>
            </>
          ) : activeRibbonView === 'search' ? (
            <>
              <Search size={16} className="text-[#7c5cff]" />
              <span>Поиск</span>
            </>
          ) : (
            <>
              <FileText size={16} className="text-[#7c5cff]" />
              <span>{vaultName || 'Файлы'}</span>
            </>
          )}
        </span>

        {activeRibbonView === 'explorer' && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleCreateNewNote()}
              className="p-1.5 rounded-lg hover:bg-white/[0.08] text-[#94a3b8] hover:text-white transition-colors"
              title="Создать заметку"
            >
              <FilePlus size={16} />
            </button>
            <button
              onClick={() => setIsCreatingFolder(true)}
              className="p-1.5 rounded-lg hover:bg-white/[0.08] text-[#94a3b8] hover:text-white transition-colors"
              title="Создать папку"
            >
              <FolderPlus size={16} />
            </button>
          </div>
        )}
      </div>

      {/* VIEW: EXPLORER */}
      {activeRibbonView === 'explorer' && (
        <>
          {/* Quick Note Filter / Search Input */}
          <div className="p-3 border-b border-white/[0.06]">
            <div className="relative">
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Фильтр файлов..."
                className="w-full bg-[#171822] border border-white/[0.1] rounded-xl px-3.5 py-2 text-sm text-[#e2e8f0] placeholder:text-[#64748b] focus:outline-none focus:border-[#7c5cff] transition-all"
              />
              {filterQuery && (
                <button
                  onClick={() => setFilterQuery('')}
                  className="absolute right-2.5 top-2.5 text-[#64748b] hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            {selectedTagFilter && (
              <div className="flex items-center justify-between mt-2 px-2.5 py-1 rounded-lg bg-[#7c5cff]/15 border border-[#7c5cff]/30 text-xs text-[#7c5cff]">
                <span>Тег: #{selectedTagFilter}</span>
                <button
                  onClick={() => setSelectedTagFilter(null)}
                  className="hover:text-white"
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>

          {/* New Folder Creation Inline Form */}
          {isCreatingFolder && (
            <form onSubmit={handleCreateFolder} className="p-3 border-b border-white/[0.06] bg-[#161720]">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Имя новой папки..."
                autoFocus
                className="w-full bg-[#0d0e12] border border-[#7c5cff] rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none mb-2"
              />
              <div className="flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsCreatingFolder(false)}
                  className="px-2.5 py-1 rounded-lg hover:bg-white/[0.08] text-[#94a3b8]"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded-lg bg-[#7c5cff] text-white font-medium"
                >
                  Создать
                </button>
              </div>
            </form>
          )}

          {/* Scrollable File & Folder Tree */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 text-sm">
            {/* Folders List */}
            {folderGroups.map(({ folder, notes }) => {
              const isDragOver = dragOverFolder === folder.name;
              const isRenamingFolder = renamingFolderId === folder.id;

              return (
                <div
                  key={folder.id}
                  onDragOver={(e) => handleDragOverFolder(e, folder.name)}
                  onDragLeave={() => {
                    if (dragOverFolder === folder.name) setDragOverFolder(null);
                  }}
                  onDrop={(e) => handleDropOnFolder(e, folder.name)}
                  className={`space-y-0.5 rounded-2xl transition-all duration-150 ${
                    isDragOver
                      ? 'bg-[#7c5cff]/20 border-2 border-dashed border-[#7c5cff] p-1 shadow-lg shadow-[#7c5cff]/20 scale-[1.01]'
                      : 'border border-transparent'
                  }`}
                >
                  <div
                    onClick={() => toggleFolder(folder.id)}
                    onContextMenu={(e) => handleContextMenuFolder(e, folder)}
                    className="group flex items-center justify-between px-2.5 py-2 rounded-xl text-sm font-semibold text-[#cbd5e1] hover:text-white hover:bg-white/[0.06] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                      {folder.isOpen ? (
                        <ChevronDown size={15} className="text-[#7c5cff] shrink-0" />
                      ) : (
                        <ChevronRight size={15} className="text-[#64748b] shrink-0" />
                      )}

                      {isRenamingFolder ? (
                        <input
                          type="text"
                          autoFocus
                          value={renameFolderName}
                          onChange={(e) => setRenameFolderName(e.target.value)}
                          onBlur={() => handleSaveRenameFolder(folder)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRenameFolder(folder);
                            if (e.key === 'Escape') setRenamingFolderId(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="bg-[#171822] text-white text-xs px-1.5 py-0.5 rounded border border-[#8b5cf6] focus:outline-none w-full"
                        />
                      ) : (
                        <span className="truncate">{folder.name}</span>
                      )}
                    </div>

                    <span className="text-xs text-[#64748b] group-hover:text-[#94a3b8] font-mono">
                      {notes.length}
                    </span>
                  </div>

                  {/* Sub-Notes in Folder */}
                  {folder.isOpen && (
                    <div className="pl-5 space-y-0.5 border-l border-white/[0.08] ml-3.5 my-1">
                      {notes.length === 0 ? (
                        <div
                          onClick={() => handleCreateNewNote(folder.name)}
                          className="px-2 py-1 text-xs text-[#64748b] hover:text-[#7c5cff] cursor-pointer italic"
                        >
                          + Создать в папке
                        </div>
                      ) : (
                        notes.map((note) => {
                          const isActive = note.id === activeNeuronId;
                          const isRenaming = renamingNoteId === note.id;

                          return (
                            <div
                              key={note.id}
                              draggable={!isRenaming}
                              onDragStart={(e) => handleDragStartNote(e, note)}
                              onDragEnd={handleDragEndNote}
                              onClick={() => handleOpenNote(note.id, note.title)}
                              onContextMenu={(e) => handleContextMenuNote(e, note)}
                              className={`group flex items-center justify-between px-2.5 py-1.5 rounded-xl text-sm cursor-grab active:cursor-grabbing transition-all ${
                                isActive
                                  ? 'bg-[#7c5cff]/20 text-white font-semibold border border-[#7c5cff]/40 shadow-sm'
                                  : 'text-[#cbd5e1] hover:text-white hover:bg-white/[0.05]'
                              }`}
                              title="Кликните для открытия, ЛКМ для перетаскивания в папку или на холст, ПКМ для меню"
                            >
                              <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-[#7c5cff]' : 'bg-[#64748b]'}`} />
                                {isRenaming ? (
                                  <input
                                    type="text"
                                    autoFocus
                                    value={renameTitle}
                                    onChange={(e) => setRenameTitle(e.target.value)}
                                    onBlur={() => handleSaveRenameNote(note.id)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveRenameNote(note.id);
                                      if (e.key === 'Escape') setRenamingNoteId(null);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="bg-[#171822] text-white text-xs px-1 py-0.5 rounded border border-[#8b5cf6] focus:outline-none w-full"
                                  />
                                ) : (
                                  <span className="truncate">{note.title || 'Без названия'}</span>
                                )}
                              </div>

                              {note.pinned && (
                                <Pin size={12} className="text-[#f59e0b] shrink-0 ml-1" />
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Root Notes Area with Drop Support */}
            <div
              onDragOver={handleDragOverRoot}
              onDragLeave={() => {
                if (dragOverFolder === '__root__') setDragOverFolder(null);
              }}
              onDrop={handleDropOnRoot}
              className={`pt-1 space-y-0.5 rounded-2xl transition-all ${
                dragOverFolder === '__root__'
                  ? 'bg-emerald-500/15 border-2 border-dashed border-emerald-500 p-2 shadow-lg scale-[1.01]'
                  : ''
              }`}
            >
              {dragOverFolder === '__root__' && (
                <div className="text-center py-1 text-xs text-emerald-400 font-semibold animate-pulse">
                  ⬇ Переместить в корень
                </div>
              )}

              {rootNotes.map((note) => {
                const isActive = note.id === activeNeuronId;
                const isRenaming = renamingNoteId === note.id;

                return (
                  <div
                    key={note.id}
                    draggable={!isRenaming}
                    onDragStart={(e) => handleDragStartNote(e, note)}
                    onDragEnd={handleDragEndNote}
                    onClick={() => handleOpenNote(note.id, note.title)}
                    onContextMenu={(e) => handleContextMenuNote(e, note)}
                    className={`group flex items-center justify-between px-2.5 py-1.5 rounded-xl text-sm cursor-grab active:cursor-grabbing transition-all ${
                      isActive
                        ? 'bg-[#7c5cff]/20 text-white font-semibold border border-[#7c5cff]/40 shadow-sm'
                        : 'text-[#cbd5e1] hover:text-white hover:bg-white/[0.05]'
                    }`}
                    title="Кликните для открытия, ЛКМ для перетаскивания в папку или на холст, ПКМ для меню"
                  >
                    <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-[#7c5cff]' : 'bg-[#64748b]'}`} />
                      {isRenaming ? (
                        <input
                          type="text"
                          autoFocus
                          value={renameTitle}
                          onChange={(e) => setRenameTitle(e.target.value)}
                          onBlur={() => handleSaveRenameNote(note.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRenameNote(note.id);
                            if (e.key === 'Escape') setRenamingNoteId(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="bg-[#171822] text-white text-xs px-1 py-0.5 rounded border border-[#8b5cf6] focus:outline-none w-full"
                        />
                      ) : (
                        <span className="truncate">{note.title || 'Без названия'}</span>
                      )}
                    </div>

                    {note.pinned && (
                      <Pin size={12} className="text-[#f59e0b] shrink-0 ml-1" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Vault Tags Section */}
          <div className="p-3 border-t border-white/[0.08] bg-[#0e0f13] space-y-2">
            <div
              onClick={() => setIsTagsSectionOpen(!isTagsSectionOpen)}
              className="flex items-center justify-between text-xs uppercase font-bold text-[#94a3b8] cursor-pointer hover:text-white"
            >
              <div className="flex items-center gap-1.5">
                <Tag size={13} className="text-[#7c5cff]" />
                <span>Теги хранилища</span>
              </div>
              <span>{isTagsSectionOpen ? '−' : '+'}</span>
            </div>

            {isTagsSectionOpen && (
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pt-1">
                {vaultTagStats.map(({ tag, count }) => (
                  <button
                    key={tag}
                    onClick={() =>
                      setSelectedTagFilter(selectedTagFilter === tag ? null : tag)
                    }
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      selectedTagFilter === tag
                        ? 'bg-[#7c5cff] text-white shadow'
                        : 'bg-[#1a1b24] text-[#94a3b8] hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
                    }`}
                  >
                    #{tag} ({count})
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* VIEW: BOOKMARKS */}
      {activeRibbonView === 'bookmarks' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 text-sm">
          {bookmarkedNeurons.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#64748b] italic">
              Нет закрепленных заметок
            </div>
          ) : (
            bookmarkedNeurons.map((note) => (
              <div
                key={note.id}
                draggable
                onDragStart={(e) => handleDragStartNote(e, note)}
                onClick={() => handleOpenNote(note.id, note.title)}
                onContextMenu={(e) => handleContextMenuNote(e, note)}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#171822] hover:bg-white/[0.08] cursor-grab active:cursor-grabbing border border-white/[0.06] transition-colors"
                title="Кликните для открытия, ПКМ для контекстного меню или перетащите на холст"
              >
                <span className="truncate font-medium text-[#e2e8f0]">{note.title}</span>
                <Pin size={13} className="text-[#f59e0b] shrink-0" />
              </div>
            ))
          )}
        </div>
      )}

      {/* VIEW: SEARCH */}
      {activeRibbonView === 'search' && (
        <div className="flex-1 flex flex-col p-3 space-y-3">
          <input
            type="text"
            value={sidebarSearchQuery}
            onChange={(e) => setSidebarSearchQuery(e.target.value)}
            placeholder="Искать в заметках..."
            autoFocus
            className="w-full bg-[#171822] border border-white/[0.1] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#7c5cff]"
          />

          <div className="flex-1 overflow-y-auto space-y-2 text-sm">
            {searchResults.map((match) => (
              <div
                key={match.id}
                draggable
                onDragStart={(e) => handleDragStartNote(e, match)}
                onClick={() => handleOpenNote(match.id, match.title)}
                onContextMenu={(e) => {
                  const n = neurons.find((x) => x.id === match.id);
                  if (n) handleContextMenuNote(e, n);
                }}
                className="p-3 rounded-xl bg-[#171822] hover:bg-white/[0.08] cursor-grab active:cursor-grabbing border border-white/[0.06] space-y-1"
                title="Кликните для открытия, ПКМ для контекстного меню или перетащите на холст"
              >
                <div className="font-semibold text-white truncate">{match.title}</div>
                {match.snippet && (
                  <div className="text-xs text-[#94a3b8] line-clamp-2">{match.snippet}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Obsidian-Style Rich Right-Click (ПКМ) Context Menu */}
      {contextMenu && (
        <div
          style={{
            top: Math.min(window.innerHeight - 340, Math.max(10, contextMenu.y)),
            left: Math.min(window.innerWidth - 260, Math.max(10, contextMenu.x)),
          }}
          className="fixed z-50 w-64 bg-[#171822] border border-white/[0.14] rounded-2xl shadow-2xl p-1.5 text-xs text-[#e2e8f0] space-y-1 animate-fade-in font-sans"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Note Context Menu */}
          {contextMenu.note && (
            <>
              <div className="px-2.5 py-1.5 text-[11px] font-bold text-[#94a3b8] truncate border-b border-white/[0.06] flex items-center justify-between">
                <span className="truncate">{contextMenu.note.title}</span>
                <span className="text-[9px] font-mono text-[#8b5cf6]">{contextMenu.note.tags?.length || 0} тегов</span>
              </div>

              {/* 1. Open in new tab */}
              <button
                onClick={() => {
                  if (contextMenu.note) handleOpenNote(contextMenu.note.id, contextMenu.note.title);
                  setContextMenu(null);
                }}
                className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-white/[0.08] flex items-center gap-2.5 text-white transition-colors"
              >
                <FileText size={14} className="text-[#8b5cf6]" />
                <span>Открыть в новой вкладке</span>
              </button>

              {/* 2. Place on Canvas */}
              <button
                onClick={() => {
                  if (contextMenu.note) handlePlaceOnCanvas(contextMenu.note);
                }}
                className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-white/[0.08] flex items-center gap-2.5 text-white transition-colors"
              >
                <LayoutGrid size={14} className="text-[#06b6d4]" />
                <span>Разместить на Холсте</span>
              </button>

              <div className="border-t border-white/[0.06] my-1" />

              {/* 3. Rename */}
              <button
                onClick={() => {
                  if (contextMenu.note) {
                    setRenamingNoteId(contextMenu.note.id);
                    setRenameTitle(contextMenu.note.title);
                  }
                  setContextMenu(null);
                }}
                className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-white/[0.08] flex items-center gap-2.5 transition-colors"
              >
                <Edit2 size={14} className="text-[#f59e0b]" />
                <span>Переименовать</span>
              </button>

              {/* 4. Move file to... (Submenu) */}
              <div className="relative">
                <button
                  onClick={() => setIsMoveSubmenuOpen(!isMoveSubmenuOpen)}
                  className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-white/[0.08] flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <FolderInput size={14} className="text-[#10b981]" />
                    <span>Переместить файл в...</span>
                  </div>
                  <ChevronRight size={13} className="text-[#64748b]" />
                </button>

                {isMoveSubmenuOpen && (
                  <div className="absolute left-full top-0 ml-1 w-48 bg-[#1a1c28] border border-white/[0.14] rounded-xl shadow-2xl p-1 text-xs space-y-0.5 animate-fade-in z-50 max-h-52 overflow-y-auto">
                    <button
                      onClick={() => {
                        if (contextMenu.note) handleMoveNoteToFolder(contextMenu.note, null);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/[0.08] text-[#94a3b8] hover:text-white"
                    >
                      Корень (без папки)
                    </button>
                    {folders.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => {
                          if (contextMenu.note) handleMoveNoteToFolder(contextMenu.note, f.name);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/[0.08] text-white truncate"
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 5. Pin / Bookmark */}
              <button
                onClick={() => {
                  if (contextMenu.note) {
                    togglePin(contextMenu.note.id);
                    showToast(contextMenu.note.pinned ? 'Заметка откреплена' : 'Добавлено в закладки');
                  }
                  setContextMenu(null);
                }}
                className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-white/[0.08] flex items-center gap-2.5 transition-colors"
              >
                <Bookmark size={14} className={contextMenu.note.pinned ? 'text-[#f59e0b]' : 'text-[#64748b]'} />
                <span>{contextMenu.note.pinned ? 'Удалить из закладок' : 'Добавить в закладки'}</span>
              </button>

              <div className="border-t border-white/[0.06] my-1" />

              {/* 6. Copy Links Submenu */}
              <div className="relative">
                <button
                  onClick={() => setIsCopySubmenuOpen(!isCopySubmenuOpen)}
                  className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-white/[0.08] flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Share2 size={14} className="text-[#38bdf8]" />
                    <span>Копировать...</span>
                  </div>
                  <ChevronRight size={13} className="text-[#64748b]" />
                </button>

                {isCopySubmenuOpen && (
                  <div className="absolute left-full top-0 ml-1 w-52 bg-[#1a1c28] border border-white/[0.14] rounded-xl shadow-2xl p-1 text-xs space-y-0.5 animate-fade-in z-50">
                    <button
                      onClick={() => {
                        if (contextMenu.note) {
                          navigator.clipboard.writeText(`[[${contextMenu.note.title}]]`);
                          showToast('Скопирована [[вики-ссылка]]');
                        }
                        setContextMenu(null);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/[0.08] text-white"
                    >
                      Вики-ссылку [[...]]
                    </button>
                    <button
                      onClick={() => {
                        if (contextMenu.note) {
                          navigator.clipboard.writeText(contextMenu.note.filePath);
                          showToast('Скопирован относительный путь');
                        }
                        setContextMenu(null);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/[0.08] text-white"
                    >
                      Относительный путь
                    </button>
                  </div>
                )}
              </div>

              {/* 7. Duplicate */}
              <button
                onClick={() => {
                  if (contextMenu.note) handleDuplicateNote(contextMenu.note);
                }}
                className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-white/[0.08] flex items-center gap-2.5 transition-colors"
              >
                <Copy size={14} className="text-[#94a3b8]" />
                <span>Дублировать файл</span>
              </button>

              <div className="border-t border-white/[0.06] my-1" />

              {/* 8. Delete */}
              <button
                onClick={() => {
                  if (contextMenu.note) {
                    deleteNeuron(contextMenu.note.id);
                    showToast(`Заметка удалена`);
                  }
                  setContextMenu(null);
                }}
                className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-red-500/20 text-[#f43f5e] flex items-center gap-2.5 font-medium transition-colors"
              >
                <Trash2 size={14} />
                <span>Удалить файл</span>
              </button>
            </>
          )}

          {/* Folder Context Menu */}
          {contextMenu.folder && (
            <>
              <div className="px-2.5 py-1.5 text-[11px] font-bold text-[#94a3b8] truncate border-b border-white/[0.06] flex items-center justify-between">
                <span className="truncate">Папка: {contextMenu.folder.name}</span>
              </div>

              {/* 1. New note in folder */}
              <button
                onClick={() => {
                  if (contextMenu.folder) handleCreateNewNote(contextMenu.folder.name);
                  setContextMenu(null);
                }}
                className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-white/[0.08] flex items-center gap-2.5 text-white transition-colors"
              >
                <FilePlus size={14} className="text-[#8b5cf6]" />
                <span>Новая заметка в этой папке</span>
              </button>

              {/* 2. Rename folder */}
              <button
                onClick={() => {
                  if (contextMenu.folder) {
                    setRenamingFolderId(contextMenu.folder.id);
                    setRenameFolderName(contextMenu.folder.name);
                  }
                  setContextMenu(null);
                }}
                className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-white/[0.08] flex items-center gap-2.5 transition-colors text-[#e2e8f0]"
              >
                <Edit2 size={14} className="text-[#f59e0b]" />
                <span>Переименовать папку</span>
              </button>

              {/* 3. Toggle Open/Collapse */}
              <button
                onClick={() => {
                  if (contextMenu.folder) toggleFolder(contextMenu.folder.id);
                  setContextMenu(null);
                }}
                className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-white/[0.08] flex items-center gap-2.5 transition-colors text-[#e2e8f0]"
              >
                <ChevronRight size={14} className="text-[#38bdf8]" />
                <span>Свернуть / Развернуть</span>
              </button>

              <div className="border-t border-white/[0.06] my-1" />

              {/* 4. Delete folder (keep files in root) */}
              <button
                onClick={() => {
                  if (contextMenu.folder) {
                    handleDeleteFolderAction(contextMenu.folder.name, false);
                  }
                }}
                className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-red-500/15 text-[#f43f5e] flex items-center gap-2.5 font-medium transition-colors"
              >
                <Trash2 size={14} />
                <span>Удалить папку (сохранить файлы)</span>
              </button>

              {/* 5. Delete folder and all files inside */}
              <button
                onClick={() => {
                  if (contextMenu.folder) {
                    handleDeleteFolderAction(contextMenu.folder.name, true);
                  }
                }}
                className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-red-500/25 text-[#f43f5e] flex items-center gap-2.5 font-bold transition-colors text-[11px]"
              >
                <Trash2 size={14} />
                <span>Удалить папку и все файлы</span>
              </button>
            </>
          )}
        </div>
      )}
    </aside>
  );
};
