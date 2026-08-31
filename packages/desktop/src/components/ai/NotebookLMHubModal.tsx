import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  Copy,
  Download,
  Check,
  Folder,
  Layers,
  UploadCloud,
  FilePlus,
  Search,
  Sparkles,
} from 'lucide-react';
import { useBrainStore } from '../../store/useBrainStore';
import { exportVaultAsNotebookLMSourcePack } from '@axon/shared';
import { IconNotebookLM } from '../icons/CustomNeironoIcons';

export const NotebookLMHubModal: React.FC = () => {
  const {
    isNotebookLMOpen,
    setNotebookLMOpen,
    neurons,
    addNeuron,
  } = useBrainStore();

  const [activeTab, setActiveTab] = useState<'sources' | 'import'>('sources');

  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [filterFolder, setFilterFolder] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [importTitle, setImportTitle] = useState('');
  const [importContent, setImportContent] = useState('');
  const [importFolder, setImportFolder] = useState('NotebookLM');
  const [isImportSaved, setIsImportSaved] = useState(false);

  useEffect(() => {
    if (isNotebookLMOpen && neurons.length > 0 && selectedNoteIds.length === 0) {
      setSelectedNoteIds(neurons.map((n) => n.id));
    }
  }, [isNotebookLMOpen, neurons]);

  if (!isNotebookLMOpen) return null;

  const allFolders = Array.from(
    new Set(neurons.map((n) => (n.filePath.includes('/') ? n.filePath.split('/')[0] : 'Корень')))
  );

  const filteredNeurons = neurons.filter((n) => {
    const folder = n.filePath.includes('/') ? n.filePath.split('/')[0] : 'Корень';
    return (
      (filterFolder === 'all' || folder === filterFolder) &&
      (n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())))
    );
  });

  const selectedNeurons = neurons.filter((n) => selectedNoteIds.includes(n.id));
  const totalWords = selectedNeurons.reduce(
    (acc, n) => acc + (n.title.split(/\s+/).length + n.content.split(/\s+/).length),
    0
  );
  const estTokens = Math.round(totalWords * 1.35);

  const toggleSelectNote = (id: string) => {
    setSelectedNoteIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedNoteIds(
      selectedNoteIds.length === filteredNeurons.length ? [] : filteredNeurons.map((n) => n.id)
    );
  };

  const handleDownloadSourcePack = () => {
    const packText = exportVaultAsNotebookLMSourcePack(
      selectedNeurons.map((n) => ({
        title: n.title,
        content: n.content,
        folder: n.filePath.includes('/') ? n.filePath.split('/')[0] : undefined,
        tags: n.tags,
      }))
    );
    const blob = new Blob([packText], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NotebookLM_Sources_${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyAndOpenWeb = () => {
    const packText = exportVaultAsNotebookLMSourcePack(
      selectedNeurons.map((n) => ({
        title: n.title,
        content: n.content,
        folder: n.filePath.includes('/') ? n.filePath.split('/')[0] : undefined,
        tags: n.tags,
      }))
    );
    navigator.clipboard.writeText(packText);
    setCopiedKey('open_web');
    setTimeout(() => {
      window.open('https://notebooklm.google.com/', '_blank');
      setCopiedKey(null);
    }, 400);
  };

  const handleImportSubmit = () => {
    if (!importContent.trim()) return;
    addNeuron(
      importTitle.trim() || `Заметка NotebookLM ${new Date().toLocaleDateString()}`,
      importContent,
      importFolder || 'NotebookLM'
    );
    setIsImportSaved(true);
    setTimeout(() => {
      setIsImportSaved(false);
      setImportTitle('');
      setImportContent('');
    }, 1800);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fade-in text-[#e2e8f0]"
      onClick={() => setNotebookLMOpen(false)}
    >
      <div
        className="w-full max-w-4xl h-[88vh] bg-[#10121a] rounded-2xl border border-white/[0.14] shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/[0.08] bg-[#0c0d14] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#38bdf8]/15 border border-[#38bdf8]/40 flex items-center justify-center text-[#38bdf8] shadow-sm">
              <IconNotebookLM size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Google NotebookLM Studio</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30 font-medium">
                  Прямой экспорт и импорт
                </span>
              </h2>
              <p className="text-xs text-[#94a3b8]">
                Экспортируйте ваши заметки в Google NotebookLM и импортируйте готовые материалы обратно
              </p>
            </div>
          </div>
          <button
            onClick={() => setNotebookLMOpen(false)}
            className="p-2 rounded-xl text-[#94a3b8] hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center px-4 border-b border-white/[0.08] bg-[#0c0d14] text-xs gap-2">
          <button
            onClick={() => setActiveTab('sources')}
            className={`px-4 py-3 font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'sources'
                ? 'text-[#38bdf8] border-[#38bdf8] bg-white/[0.03]'
                : 'text-[#94a3b8] border-transparent hover:text-white'
            }`}
          >
            <Layers size={15} />
            <span>📦 Источники & Экспорт</span>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-3 font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'import'
                ? 'text-[#ec4899] border-[#ec4899] bg-white/[0.03]'
                : 'text-[#94a3b8] border-transparent hover:text-white'
            }`}
          >
            <UploadCloud size={15} />
            <span>📥 Импорт заметок</span>
          </button>
        </div>

        {/* Main Body */}
        <div className="flex-1 p-4 overflow-y-auto flex flex-col bg-[#11131c]">
          {/* ================= TAB 1: SOURCES & EXPORT ================= */}
          {activeTab === 'sources' && (
            <div className="flex-1 flex flex-col gap-3">
              {/* Top Banner with Actions */}
              <div className="p-4 rounded-xl border border-[#38bdf8]/30 bg-gradient-to-r from-[#38bdf8]/10 via-[#7c5cff]/10 to-transparent flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>Экспорт в Google NotebookLM</span>
                    <Sparkles size={14} className="text-[#38bdf8]" />
                  </h3>
                  <p className="text-xs text-[#cbd5e1] mt-0.5">
                    Выбрано заметок: <b className="text-white">{selectedNeurons.length}</b> из {neurons.length}{' '}
                    • Слов: <b className="text-white">{totalWords.toLocaleString()}</b> (~{estTokens.toLocaleString()} токенов)
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleDownloadSourcePack}
                    disabled={selectedNeurons.length === 0}
                    className="px-3.5 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white font-medium text-xs flex items-center gap-1.5 transition-all disabled:opacity-40 border border-white/[0.1]"
                    title="Скачать единый Markdown файл с источниками"
                  >
                    <Download size={14} />
                    <span>Скачать .md</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyAndOpenWeb}
                    disabled={selectedNeurons.length === 0}
                    className="px-4 py-2 rounded-xl bg-[#38bdf8] text-[#0d0e12] font-bold text-xs hover:bg-[#38bdf8]/90 flex items-center gap-1.5 shadow-lg shadow-[#38bdf8]/20 transition-all disabled:opacity-40"
                  >
                    {copiedKey === 'open_web' ? <Check size={14} /> : <ExternalLink size={14} />}
                    <span>{copiedKey === 'open_web' ? 'Скопировано! Открываю...' : 'Скопировать и открыть NotebookLM'}</span>
                  </button>
                </div>
              </div>

              {/* Filters & Note Selector */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2 flex-1">
                  <div className="relative flex-1 max-w-xs">
                    <Search size={13} className="absolute left-3 top-2.5 text-[#64748b]" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Поиск по заметкам..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#161822] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-[#38bdf8]"
                    />
                  </div>

                  <select
                    value={filterFolder}
                    onChange={(e) => setFilterFolder(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-[#161822] border border-white/[0.08] text-xs text-[#cbd5e1] focus:outline-none focus:border-[#38bdf8]"
                  >
                    <option value="all">Все папки ({neurons.length})</option>
                    {allFolders.map((f) => (
                      <option key={f} value={f}>
                        📁 {f}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs text-[#38bdf8] hover:underline font-medium px-2 py-1"
                >
                  {selectedNoteIds.length === filteredNeurons.length ? 'Снять выделение' : 'Выбрать все'}
                </button>
              </div>

              {/* Notes List */}
              <div className="flex-1 overflow-y-auto rounded-xl border border-white/[0.08] bg-[#0c0d14] p-2 space-y-1 max-h-[46vh]">
                {filteredNeurons.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#64748b]">Заметки не найдены</div>
                ) : (
                  filteredNeurons.map((note) => {
                    const isSelected = selectedNoteIds.includes(note.id);
                    const folder = note.filePath.includes('/') ? note.filePath.split('/')[0] : 'Корень';
                    const words = note.content.split(/\s+/).length;

                    return (
                      <div
                        key={note.id}
                        onClick={() => toggleSelectNote(note.id)}
                        className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-[#38bdf8]/10 border-[#38bdf8]/40 text-white'
                            : 'bg-white/[0.02] border-white/[0.04] text-[#94a3b8] hover:bg-white/[0.05]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 rounded accent-[#38bdf8] pointer-events-none shrink-0"
                          />
                          <div className="truncate">
                            <span className="font-semibold text-xs text-white truncate block">
                              {note.title || 'Без названия'}
                            </span>
                            <span className="text-[10px] text-[#64748b] flex items-center gap-1.5 mt-0.5">
                              <Folder size={10} />
                              <span>{folder}</span>
                              <span>•</span>
                              <span>{words} слов</span>
                            </span>
                          </div>
                        </div>

                        {note.tags.length > 0 && (
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            {note.tags.slice(0, 2).map((t) => (
                              <span
                                key={t}
                                className="px-1.5 py-0.5 rounded text-[9px] bg-white/[0.06] text-[#cbd5e1]"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ================= TAB 2: IMPORT FROM NOTEBOOKLM ================= */}
          {activeTab === 'import' && (
            <div className="flex-1 flex flex-col gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#ec4899]/10 border border-[#ec4899]/30 flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-xs text-white flex items-center gap-1.5">
                    <span>Импорт заметок и исследований из NotebookLM</span>
                  </h3>
                  <p className="text-[11px] text-[#cbd5e1] mt-0.5">
                    Скопируйте сгенерированный ответ или конспект из NotebookLM и вставьте сюда для сохранения в вашу базу.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => window.open('https://notebooklm.google.com/', '_blank')}
                  className="px-3.5 py-2 rounded-xl bg-[#ec4899] text-white font-bold text-xs hover:bg-[#ec4899]/90 flex items-center gap-1.5 shrink-0 shadow-md transition-all"
                >
                  <ExternalLink size={13} />
                  <span>Открыть NotebookLM</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#cbd5e1] font-semibold mb-1">Заголовок заметки:</label>
                  <input
                    type="text"
                    value={importTitle}
                    onChange={(e) => setImportTitle(e.target.value)}
                    placeholder="Например: Анализ темы из NotebookLM..."
                    className="w-full px-3 py-2 rounded-xl bg-[#0e0f16] border border-white/[0.1] text-xs text-white focus:outline-none focus:border-[#ec4899]"
                  />
                </div>
                <div>
                  <label className="block text-[#cbd5e1] font-semibold mb-1">Целевая папка:</label>
                  <input
                    type="text"
                    value={importFolder}
                    onChange={(e) => setImportFolder(e.target.value)}
                    placeholder="NotebookLM"
                    className="w-full px-3 py-2 rounded-xl bg-[#0e0f16] border border-white/[0.1] text-xs text-white focus:outline-none focus:border-[#ec4899]"
                  />
                </div>
              </div>

              <div className="flex-1 flex flex-col min-h-[220px]">
                <label className="block text-[#cbd5e1] font-semibold mb-1">Содержимое (Markdown / Текст):</label>
                <textarea
                  value={importContent}
                  onChange={(e) => setImportContent(e.target.value)}
                  placeholder="Вставьте скопированный текст из NotebookLM (Ctrl+V)..."
                  className="flex-1 w-full p-3 rounded-xl bg-[#0e0f16] border border-white/[0.1] text-xs text-white focus:outline-none focus:border-[#ec4899] font-mono resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleImportSubmit}
                  disabled={!importContent.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ec4899] to-[#7c5cff] text-white font-bold text-xs hover:opacity-95 flex items-center gap-2 shadow-lg disabled:opacity-40 transition-all"
                >
                  {isImportSaved ? <Check size={15} /> : <FilePlus size={15} />}
                  <span>{isImportSaved ? 'Успешно сохранено в базу!' : 'Сохранить как новую заметку'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
