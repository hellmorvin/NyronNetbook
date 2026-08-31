import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  FileText,
  Plus,
  FolderPlus,
  Trash2,
  ChevronRight,
  ChevronDown,
  Pin,
  X,
  Sparkles,
  BookOpen,
  Settings,
  HardDrive,
  Search,
} from 'lucide-react';
import { useBrainStore } from '../../store/useBrainStore';

import { NeuralNotebookLogo } from '../brand/NeuralNotebookLogo';

interface MobileLeftDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileLeftDrawer: React.FC<MobileLeftDrawerProps> = ({ isOpen, onClose }) => {
  const {
    vaultName,
    neurons,
    folders,
    activeNeuronId,
    toggleFolder,
    addFolder,
    deleteFolder,
    addNeuron,
    openNote,
    deleteNeuron,
    togglePin,
    setSettingsOpen,
    setSyncOpen,
  } = useBrainStore();

  const [searchFilter, setSearchFilter] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  if (!isOpen) return null;

  const handleCreateNoteInFolder = (folderName?: string) => {
    const newNote = addNeuron('Новая мысль', '', folderName);
    openNote(newNote.id);
    onClose();
  };

  const handleAddFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      addFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreatingFolder(false);
    }
  };

  // Group notes by folder
  const folderMap = new Map<string, typeof neurons>();
  const rootNotes: typeof neurons = [];

  neurons.forEach((n) => {
    const parts = n.filePath ? n.filePath.split('/') : ['Default'];
    if (parts.length > 1) {
      const fName = parts[0]!;
      if (!folderMap.has(fName)) folderMap.set(fName, []);
      folderMap.get(fName)!.push(n);
    } else {
      rootNotes.push(n);
    }
  });

  // Filter notes by search query if present
  const filterMatch = (title: string) =>
    !searchFilter || title.toLowerCase().includes(searchFilter.toLowerCase());

  const pinnedNotes = neurons.filter((n) => n.pinned && filterMatch(n.title));

  return (
    <div className="fixed inset-0 z-50 flex select-none animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Content */}
      <div className="relative w-[85vw] max-w-[340px] h-full bg-[#101117] border-r border-white/[0.08] shadow-2xl flex flex-col z-10 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]">
        {/* Drawer Header */}
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-[#0e0f13]">
          <div className="flex items-center gap-2.5 min-w-0">
            <NeuralNotebookLogo size={32} glow={true} />
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white truncate">{vaultName}</h2>
              <span className="text-[10px] text-[#64748b]">
                {neurons.length} мыслей • {folders.length} папок
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Bar & Quick Creation Bar */}
        <div className="p-3 border-b border-white/[0.06] space-y-2">
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-3 text-[#64748b]" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Фильтр заметок..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#161720] border border-white/[0.06] text-xs text-white placeholder:text-[#475569] focus:outline-none focus:border-[#7c5cff]"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleCreateNoteInFolder()}
              className="flex-1 py-1.5 px-2.5 rounded-xl bg-[#7c5cff]/15 hover:bg-[#7c5cff]/25 text-[#7c5cff] border border-[#7c5cff]/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              <Plus size={14} />
              <span>Мысль</span>
            </button>
            <button
              onClick={() => setIsCreatingFolder((v) => !v)}
              className="py-1.5 px-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#94a3b8] hover:text-white border border-white/[0.06] text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <FolderPlus size={14} />
              <span>Папка</span>
            </button>
          </div>

          {isCreatingFolder && (
            <form onSubmit={handleAddFolderSubmit} className="pt-1 flex gap-1.5">
              <input
                type="text"
                autoFocus
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Имя новой папки..."
                className="flex-1 px-2.5 py-1 rounded-lg bg-[#161720] border border-white/[0.1] text-xs text-white focus:outline-none focus:border-[#7c5cff]"
              />
              <button
                type="submit"
                className="px-2.5 py-1 rounded-lg bg-[#7c5cff] text-white text-xs font-bold"
              >
                ОК
              </button>
            </form>
          )}
        </div>

        {/* Tree List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-3">
          {/* Pinned Section */}
          {pinnedNotes.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#f59e0b] flex items-center gap-1">
                <Pin size={11} />
                <span>Закрепленные</span>
              </div>
              <div className="space-y-0.5">
                {pinnedNotes.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      openNote(n.id);
                      onClose();
                    }}
                    className={`px-2.5 py-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-colors ${
                      activeNeuronId === n.id
                        ? 'bg-[#7c5cff] text-white font-bold shadow-md shadow-[#7c5cff]/20'
                        : 'text-[#e2e8f0] hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={14} className={activeNeuronId === n.id ? 'text-white' : 'text-[#f59e0b]'} />
                      <span className="truncate">{n.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Folder Hierarchy */}
          <div className="space-y-1">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
              Папки и документы
            </div>

            {folders.map((folder) => {
              const notesInFolder = (folderMap.get(folder.name) || []).filter((n) => filterMatch(n.title));
              return (
                <div key={folder.id} className="space-y-0.5">
                  <div
                    onClick={() => toggleFolder(folder.id)}
                    className="px-2.5 py-2 rounded-xl text-xs font-medium text-[#cbd5e1] hover:bg-white/[0.04] flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {folder.isOpen ? (
                        <ChevronDown size={14} className="text-[#64748b]" />
                      ) : (
                        <ChevronRight size={14} className="text-[#64748b]" />
                      )}
                      {folder.isOpen ? (
                        <FolderOpen size={15} className="text-[#7c5cff]" />
                      ) : (
                        <Folder size={15} className="text-[#7c5cff]" />
                      )}
                      <span className="truncate font-semibold text-white">{folder.name}</span>
                      <span className="text-[10px] text-[#64748b]">({notesInFolder.length})</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateNoteInFolder(folder.name);
                      }}
                      className="p-1 rounded-md text-[#64748b] hover:text-white hover:bg-white/[0.1] opacity-60 group-hover:opacity-100"
                      title="Добавить заметку в папку"
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  {folder.isOpen && (
                    <div className="pl-4 pr-1 space-y-0.5 border-l border-white/[0.06] ml-4">
                      {notesInFolder.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            openNote(n.id);
                            onClose();
                          }}
                          className={`px-2.5 py-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-colors ${
                            activeNeuronId === n.id
                              ? 'bg-[#7c5cff] text-white font-bold shadow-md shadow-[#7c5cff]/20'
                              : 'text-[#94a3b8] hover:text-white hover:bg-white/[0.04]'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText size={13} className={activeNeuronId === n.id ? 'text-white' : 'text-[#64748b]'} />
                            <span className="truncate">{n.title}</span>
                          </div>
                        </div>
                      ))}
                      {notesInFolder.length === 0 && (
                        <div className="px-2.5 py-1 text-[11px] text-[#475569] italic">
                          Пустая папка
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Root Notes */}
            {rootNotes.filter((n) => filterMatch(n.title)).map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  openNote(n.id);
                  onClose();
                }}
                className={`px-2.5 py-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-colors ${
                  activeNeuronId === n.id
                    ? 'bg-[#7c5cff] text-white font-bold shadow-md'
                    : 'text-[#cbd5e1] hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText size={14} className={activeNeuronId === n.id ? 'text-white' : 'text-[#64748b]'} />
                  <span className="truncate">{n.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Drawer Bottom Actions */}
        <div className="p-3 border-t border-white/[0.08] bg-[#0e0f13] flex items-center justify-between text-xs text-[#94a3b8]">
          <button
            onClick={() => {
              setSettingsOpen(true);
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-white/[0.06] hover:text-white transition-colors"
          >
            <Settings size={15} />
            <span>Настройки</span>
          </button>
          <button
            onClick={() => {
              setSyncOpen(true);
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-white/[0.06] hover:text-white transition-colors text-[#38bdf8]"
          >
            <HardDrive size={15} />
            <span>P2P Синхр</span>
          </button>
        </div>
      </div>
    </div>
  );
};
