import React from 'react';
import {
  X,
  FileText,
  Folder,
  FolderOpen,
  Plus,
  Trash2,
  Pin,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { useMobileBrainStore } from '../../store/useMobileBrainStore';

export const MobileDrawer: React.FC = () => {
  const {
    isDrawerOpen,
    setDrawerOpen,
    neurons,
    activeNeuronId,
    setActiveNeuronId,
    setActiveTab,
    addNeuron,
    deleteNeuron,
  } = useMobileBrainStore();

  if (!isDrawerOpen) return null;

  // Group notes by folder
  const foldersMap = new Map<string, typeof neurons>();
  neurons.forEach((n) => {
    const parts = n.filePath.split('/');
    const folder = parts.length > 1 ? parts[0]! : 'Корневые заметки';
    const list = foldersMap.get(folder) || [];
    list.push(n);
    foldersMap.set(folder, list);
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex animate-fade-in"
      onClick={() => setDrawerOpen(false)}
    >
      <div
        className="w-[82%] max-w-xs h-full bg-[#12131a] border-r border-[#232533] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="h-16 px-4 border-b border-[#232533] flex items-center justify-between bg-[#14151e] safe-top">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#8052ff] to-[#ec4899] flex items-center justify-center text-white font-bold text-sm shadow-md">
              
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-tight">NyronNotebook</h2>
              <span className="text-[10px] text-[#8052ff] font-medium">База знаний</span>
            </div>
          </div>

          <button
            onClick={() => setDrawerOpen(false)}
            className="p-1.5 rounded-xl text-[#94a3b8] hover:text-white active:bg-white/[0.08]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action Button: New Note */}
        <div className="p-3 border-b border-[#232533]">
          <button
            onClick={() => {
              addNeuron('Новая заметка');
              setDrawerOpen(false);
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-[#8052ff] hover:bg-[#7244ee] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#8052ff]/20 active:scale-98 transition-transform"
          >
            <Plus size={16} />
            <span>Новая заметка</span>
          </button>
        </div>

        {/* Note Folders List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
          {Array.from(foldersMap.entries()).map(([folderName, folderNotes]) => (
            <div key={folderName} className="space-y-1">
              <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold text-[#64748b] uppercase tracking-wider">
                <Folder size={13} className="text-[#8052ff]" />
                <span>{folderName}</span>
                <span className="ml-auto text-[10px] opacity-70">({folderNotes.length})</span>
              </div>

              <div className="space-y-0.5 pl-1">
                {folderNotes.map((note) => {
                  const isActive = note.id === activeNeuronId;
                  return (
                    <div
                      key={note.id}
                      onClick={() => {
                        setActiveNeuronId(note.id);
                        setActiveTab('notes');
                        setDrawerOpen(false);
                      }}
                      className={`group flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer transition-all ${
                        isActive
                          ? 'bg-[#8052ff]/20 text-white font-semibold border border-[#8052ff]/30'
                          : 'text-[#94a3b8] hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate flex-1 mr-1">
                        <FileText size={14} className={isActive ? 'text-[#8052ff]' : 'text-[#64748b]'} />
                        <span className="truncate">{note.title}</span>
                      </div>

                      {/* Delete Action */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Удалить заметку "${note.title}"?`)) {
                            deleteNeuron(note.id);
                          }
                        }}
                        className="p-1 rounded-md text-transparent group-hover:text-[#ff4757] hover:bg-[#ff4757]/15 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-[#232533] bg-[#0c0d12] text-center text-[10px] text-[#64748b] safe-bottom">
          Всего заметок: {neurons.length} · P2P Ready
        </div>
      </div>
    </div>
  );
};
