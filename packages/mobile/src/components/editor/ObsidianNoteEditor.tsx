import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Pin,
  Trash2,
  Tag,
  Link2,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Code,
  Info,
  ChevronDown,
  X,
  Check,
  BookOpen,
  Sparkles,
  ArrowLeft,
  Edit3,
  Eye,
  Folder,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  CheckSquare,
  List,
  ListOrdered,
  Quote,
  Minus,
  Copy,
  Zap,
  MoreVertical,
} from 'lucide-react';
import { useBrainStore } from '../../store/useBrainStore';
import { LearningState } from '@axon/shared';
import { htmlToCleanMarkdown } from './LiveDocumentView';
import { RichWordEditor } from './RichWordEditor';

interface ObsidianNoteEditorProps {
  noteId: string;
}

export const ObsidianNoteEditor: React.FC<ObsidianNoteEditorProps> = ({ noteId }) => {
  const {
    neurons,
    folders,
    updateNeuron,
    deleteNeuron,
    togglePin,
    setLearningState,
    selectNeuron,
    openNote,
    openTab,
    moveNoteToFolder,
  } = useBrainStore();

  const neuron = neurons.find((n) => n.id === noteId);

  // Note View Mode: 'visual' (Word/Notion style WYSIWYG) | 'markdown' (Raw MD) | 'preview' (Reading)
  const [viewMode, setViewMode] = useState<'visual' | 'markdown' | 'preview'>('visual');
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const [isFolderPickerOpen, setIsFolderPickerOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isWikilinkPickerOpen, setIsWikilinkPickerOpen] = useState(false);
  const [wikilinkSearch, setWikilinkSearch] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<any>(null);

  const allVaultTags = useMemo(() => {
    const set = new Set<string>();
    neurons.forEach((n) => {
      (n.tags || []).forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [neurons]);

  if (!neuron) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center text-xs text-[#94a3b8] p-8 space-y-3 bg-[#0d0e12]">
        <p className="text-sm font-bold text-white">Заметка не найдена</p>
        <p className="text-xs text-[#64748b]">Возможно, эта заметка была удалена или перемещена.</p>
        <button
          onClick={() => openTab({ type: 'notes', title: 'Заметки' })}
          className="px-4 py-2 rounded-xl bg-[#7c5cff] text-white font-semibold text-xs shadow-lg shadow-[#7c5cff]/20 active:scale-95 transition-all"
        >
          Ко всем заметкам
        </button>
      </div>
    );
  }

  const outlinkNeurons = (neuron.outlinks || [])
    .map((id) => neurons.find((n) => n.id === id))
    .filter(Boolean);

  const backlinkNeurons = (neuron.backlinks || [])
    .map((id) => neurons.find((n) => n.id === id))
    .filter(Boolean);

  const words = (neuron.content || '')
    .replace(/#+\s+/g, ' ')
    .replace(/\[\[(.*?)\]\]/g, '$1')
    .split(/\s+/)
    .filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(words / 180));

  const handleTitleChange = (newTitle: string) => {
    updateNeuron(neuron.id, { title: newTitle });
    triggerSaveIndicator();
  };

  const handleContentChange = (newContent: string) => {
    updateNeuron(neuron.id, { content: newContent });
    triggerSaveIndicator();
  };

  const triggerSaveIndicator = () => {
    setSaveStatus('saving');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus('saved');
    }, 300);
  };

  // Keyboard toolbar insert / wrap text helper with native setRangeText (zero cursor jump!)
  const handleInsertMarkup = (prefix: string, suffix: string = '', defaultText: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const hasSelection = start !== end;

    if (hasSelection) {
      const selectedText = text.substring(start, end);

      // 1. Toggle OFF: If selectedText is already wrapped with prefix and suffix
      if (
        prefix &&
        suffix &&
        selectedText.startsWith(prefix) &&
        selectedText.endsWith(suffix) &&
        selectedText.length >= prefix.length + suffix.length
      ) {
        const unwrapped = selectedText.substring(prefix.length, selectedText.length - suffix.length);
        textarea.focus();
        textarea.setRangeText(unwrapped, start, end, 'select');
        handleContentChange(textarea.value);
        return;
      }

      // 2. Toggle OFF: If text surrounding the selection has prefix and suffix
      if (
        prefix &&
        suffix &&
        start >= prefix.length &&
        end + suffix.length <= text.length &&
        text.substring(start - prefix.length, start) === prefix &&
        text.substring(end, end + suffix.length) === suffix
      ) {
        textarea.focus();
        textarea.setSelectionRange(start - prefix.length, end + suffix.length);
        textarea.setRangeText(selectedText, start - prefix.length, end + suffix.length, 'select');
        handleContentChange(textarea.value);
        return;
      }

      // 3. Wrap selection
      const replacement = `${prefix}${selectedText}${suffix}`;
      textarea.focus();
      textarea.setRangeText(replacement, start, end, 'select');
      handleContentChange(textarea.value);
    } else {
      // No selection: check if cursor is between empty markers (e.g. **|**) -> toggle OFF
      if (
        prefix &&
        suffix &&
        start >= prefix.length &&
        end + suffix.length <= text.length &&
        text.substring(start - prefix.length, start) === prefix &&
        text.substring(end, end + suffix.length) === suffix
      ) {
        textarea.focus();
        textarea.setSelectionRange(start - prefix.length, end + suffix.length);
        textarea.setRangeText('', start - prefix.length, end + suffix.length, 'end');
        handleContentChange(textarea.value);
        return;
      }

      // Insert markers and place cursor cleanly between them
      const insertion = defaultText ? `${prefix}${defaultText}${suffix}` : `${prefix}${suffix}`;
      textarea.focus();
      textarea.setRangeText(insertion, start, end, 'end');
      const newCursor = defaultText ? start + prefix.length + defaultText.length : start + prefix.length;
      textarea.setSelectionRange(newCursor, newCursor);
      handleContentChange(textarea.value);
    }
  };

  const handleInsertLinePrefix = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const text = textarea.value;

    // Find boundaries of current line
    const lineStart = text.lastIndexOf('\n', start - 1) + 1;
    let lineEnd = text.indexOf('\n', start);
    if (lineEnd === -1) lineEnd = text.length;

    const currentLine = text.substring(lineStart, lineEnd);

    // 1. Toggle OFF if already has exact prefix
    if (currentLine.startsWith(prefix)) {
      const newLine = currentLine.substring(prefix.length);
      textarea.focus();
      textarea.setRangeText(newLine, lineStart, lineEnd, 'preserve');
      const newPos = Math.max(lineStart, start - prefix.length);
      textarea.setSelectionRange(newPos, newPos);
      handleContentChange(textarea.value);
      return;
    }

    // 2. Toggle between headings (# vs ## vs ###)
    if (prefix.startsWith('#')) {
      const headerMatch = currentLine.match(/^#{1,6}\s+/);
      if (headerMatch) {
        const existing = headerMatch[0];
        const newLine = prefix + currentLine.substring(existing.length);
        textarea.focus();
        textarea.setRangeText(newLine, lineStart, lineEnd, 'preserve');
        const diff = prefix.length - existing.length;
        textarea.setSelectionRange(start + diff, start + diff);
        handleContentChange(textarea.value);
        return;
      }
    }

    // 3. Toggle between list types (- [ ] vs - vs 1. vs >)
    const listMatch = currentLine.match(/^(\s*)([-*+]\s+\[[ xX]\]\s+|[-*+]\s+|\d+\.\s+|> )/);
    if (listMatch) {
      const existing = listMatch[0];
      const newLine = prefix + currentLine.substring(existing.length);
      textarea.focus();
      textarea.setRangeText(newLine, lineStart, lineEnd, 'preserve');
      const diff = prefix.length - existing.length;
      textarea.setSelectionRange(start + diff, start + diff);
      handleContentChange(textarea.value);
      return;
    }

    // 4. Prepend prefix to current line
    const newLine = prefix + currentLine;
    textarea.focus();
    textarea.setRangeText(newLine, lineStart, lineEnd, 'preserve');
    textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    handleContentChange(textarea.value);
  };

  // Interactive Checkbox toggle in Preview mode
  const handleToggleTaskCheckbox = (lineIndex: number, currentChecked: boolean, taskText: string) => {
    const lines = neuron.content.split('\n');
    const newLine = currentChecked ? `- [ ] ${taskText}` : `- [x] ${taskText}`;
    lines[lineIndex] = newLine;
    handleContentChange(lines.join('\n'));
  };

  // Interactive Wikilink click in Preview mode
  const handleWikiLinkClick = (targetTitle: string) => {
    const target = neurons.find(
      (n) => n.title.trim().toLowerCase() === targetTitle.trim().toLowerCase()
    );
    if (target) {
      openNote(target.id);
    } else {
      // Prompt or create note
      if (confirm(`Мысль «${targetTitle}» еще не создана. Создать новую заметку?`)) {
        const newNote = useBrainStore.getState().addNeuron(targetTitle, '');
        openNote(newNote.id);
      }
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const cleanTag = tagInput.trim().replace(/^#/, '');
      if (!neuron.tags.includes(cleanTag)) {
        updateNeuron(neuron.id, { tags: [...neuron.tags, cleanTag] });
      }
      setTagInput('');
      setIsTagDropdownOpen(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    updateNeuron(neuron.id, {
      tags: neuron.tags.filter((t) => t !== tagToRemove),
    });
  };

  // Current folder name
  const currentFolder = neuron.filePath ? neuron.filePath.split('/')[0] : 'Без папки';

  return (
    <div className="flex-1 h-full bg-[#0d0e12] flex flex-col text-[#e2e8f0] relative select-text overflow-hidden">
      {/* ══════════ TOP ERGONOMIC TOOLBAR ══════════ */}
      <div className="px-3 py-2 border-b border-white/[0.08] bg-[#12131d]/90 backdrop-blur-md flex items-center justify-between gap-2 shrink-0 z-20">
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Back button to Notes list */}
          <button
            onClick={() => openTab({ type: 'notes', title: 'Заметки' })}
            className="px-2.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] active:scale-95 text-[#94a3b8] hover:text-white flex items-center gap-1 text-xs shrink-0 transition-all border border-white/[0.06]"
            title="Назад к списку заметок"
          >
            <ArrowLeft size={14} className="text-[#7c5cff]" />
            <span className="font-semibold text-xs hidden xs:inline">Заметки</span>
          </button>

          {/* Clean Segmented Mode Switcher: Text vs Reading */}
          <div className="flex items-center p-0.5 bg-[#171824] border border-white/[0.08] rounded-xl text-xs shrink-0">
            <button
              onClick={() => setViewMode('visual')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 text-xs ${
                viewMode === 'visual'
                  ? 'bg-[#7c5cff] text-white shadow'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
              title="Визуальный редактор"
            >
              <Edit3 size={12} />
              <span>Текст</span>
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 text-xs ${
                viewMode === 'preview'
                  ? 'bg-[#7c5cff] text-white shadow'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
              title="Режим чтения"
            >
              <Eye size={12} />
              <span>Чтение</span>
            </button>
          </div>
        </div>

        {/* Save Status & Action Buttons (Decluttered with More Menu) */}
        <div className="flex items-center gap-1.5 shrink-0 relative">
          {saveStatus === 'saving' ? (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse mr-1" title="Сохранение..." />
          ) : (
            <span className="text-[10px] text-emerald-400 hidden sm:inline font-mono mr-1">✓ Сохранено</span>
          )}

          {/* Quick Pin Toggle */}
          <button
            onClick={() => togglePin(neuron.id)}
            className={`p-1.5 rounded-xl transition-all active:scale-95 ${
              neuron.pinned
                ? 'text-amber-400 bg-amber-500/15 border border-amber-500/30'
                : 'text-[#94a3b8] hover:text-white bg-white/[0.05] border border-white/[0.06]'
            }`}
            title={neuron.pinned ? 'Открепить заметку' : 'Закрепить'}
          >
            <Pin size={15} className={neuron.pinned ? 'fill-amber-400' : ''} />
          </button>

          {/* More Actions Dropdown (Zap, MD Mode, Info, Delete) */}
          <div className="relative">
            <button
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className="p-1.5 rounded-xl text-[#94a3b8] hover:text-white bg-white/[0.05] border border-white/[0.06] active:scale-95 transition-all"
              title="Дополнительно"
            >
              <MoreVertical size={15} />
            </button>

            {isMoreMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsMoreMenuOpen(false)}
                />
                <div
                  className="absolute right-0 top-10 bg-[#171822] border border-white/[0.12] rounded-2xl p-1.5 shadow-2xl z-50 w-52 space-y-0.5 animate-fade-in"
                  onClick={() => setIsMoreMenuOpen(false)}
                >
                  <button
                    onClick={() => {
                      selectNeuron(neuron.id);
                      openTab({ type: 'graph', title: 'Граф' });
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-[#38bdf8] hover:bg-[#38bdf8]/10 flex items-center gap-2 transition-colors"
                  >
                    <Zap size={14} />
                    <span>Показать на Графе</span>
                  </button>

                  <button
                    onClick={() => setViewMode(viewMode === 'markdown' ? 'visual' : 'markdown')}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-white hover:bg-white/[0.08] flex items-center gap-2 transition-colors"
                  >
                    <Code size={14} className="text-[#a78bfa]" />
                    <span>{viewMode === 'markdown' ? 'Редактор Текст' : 'Код Markdown (MD)'}</span>
                  </button>

                  <button
                    onClick={() => setIsInfoModalOpen(true)}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-[#cbd5e1] hover:bg-white/[0.08] flex items-center gap-2 transition-colors"
                  >
                    <Info size={14} className="text-[#94a3b8]" />
                    <span>Инфо о заметке</span>
                  </button>

                  <div className="h-[1px] bg-white/[0.08] my-1" />

                  <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-rose-400 hover:bg-rose-500/15 flex items-center gap-2 transition-colors"
                  >
                    <Trash2 size={14} />
                    <span>Удалить заметку</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ══════════ SCROLLABLE CONTENT BODY ══════════ */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 pb-28 space-y-3">
        {/* Note Metadata Sub-bar: Folder & Tags */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          {/* Folder pill with selector */}
          <button
            onClick={() => setIsFolderPickerOpen(true)}
            className="px-2.5 py-1 rounded-xl bg-[#1a1b28] hover:bg-[#222436] text-[#38bdf8] border border-[#38bdf8]/30 text-[11px] font-semibold flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Folder size={11} />
            <span>{currentFolder}</span>
            <ChevronDown size={10} className="text-[#94a3b8]" />
          </button>

          {/* Learning State */}
          <div className="px-2 py-1 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[10px] text-[#94a3b8] flex items-center gap-1 font-medium">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                neuron.learningState === 'mastered'
                  ? 'bg-emerald-400'
                  : neuron.learningState === 'review'
                  ? 'bg-amber-400'
                  : neuron.learningState === 'learning'
                  ? 'bg-[#38bdf8]'
                  : 'bg-[#7c5cff]'
              }`}
            />
            <span>
              {neuron.learningState === 'mastered'
                ? 'Выучено'
                : neuron.learningState === 'review'
                ? 'Повторение'
                : neuron.learningState === 'learning'
                ? 'Изучается'
                : 'Новая'}
            </span>
          </div>

          {/* Tags */}
          {neuron.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-xl bg-[#7c5cff]/15 text-[#a78bfa] border border-[#7c5cff]/30 text-[10px] font-mono flex items-center gap-1"
            >
              #{tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-white text-[#94a3b8] ml-0.5 font-bold"
              >
                ×
              </button>
            </span>
          ))}

          {/* Add Tag Input */}
          <div className="relative">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => {
                setTagInput(e.target.value);
                setIsTagDropdownOpen(true);
              }}
              onFocus={() => setIsTagDropdownOpen(true)}
              onKeyDown={handleAddTag}
              placeholder="+ тег..."
              className="bg-transparent text-[11px] text-white focus:outline-none placeholder:text-[#64748b] w-16 px-1 py-0.5 border-b border-dashed border-white/20 focus:border-[#7c5cff]"
            />

            {isTagDropdownOpen && tagInput.trim() && (
              <div className="absolute top-6 left-0 z-40 min-w-[150px] p-1.5 bg-[#1a1b28] border border-white/[0.12] rounded-xl shadow-2xl space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    const clean = tagInput.trim().replace(/^#/, '');
                    if (clean && !neuron.tags.includes(clean)) {
                      updateNeuron(neuron.id, { tags: [...neuron.tags, clean] });
                    }
                    setTagInput('');
                    setIsTagDropdownOpen(false);
                  }}
                  className="w-full text-left px-2 py-1 rounded-lg text-xs text-emerald-400 hover:bg-emerald-500/10 font-bold"
                >
                  + Создать #{tagInput.trim()}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ══════════ MODE 1: VISUAL WYSIWYG RICH EDITOR (DEFAULT) ══════════ */}
        {viewMode === 'visual' && (
          <RichWordEditor
            key={neuron.id}
            noteId={neuron.id}
            initialContent={neuron.content}
            onChange={handleContentChange}
            noteTitle={neuron.title}
            onTitleChange={handleTitleChange}
          />
        )}

        {/* ══════════ MODE 2: MARKDOWN SOURCE EDIT ══════════ */}
        {viewMode === 'markdown' && (
          <div className="w-full min-h-[55vh] flex flex-col space-y-3">
            <input
              type="text"
              value={neuron.title || ''}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Заголовок мысли..."
              className="w-full bg-transparent text-xl sm:text-2xl font-black text-white focus:outline-none placeholder:text-[#475569] tracking-tight py-1 border-b border-white/[0.08]"
            />

            {/* In-flow Markdown Toolbar */}
            <div className="bg-[#141520] border border-white/[0.1] rounded-xl p-1.5 flex items-center gap-1 overflow-x-auto no-scrollbar shadow-lg">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleInsertMarkup('**', '**', 'жирный')}
                className="h-8 w-8 rounded-lg bg-white/[0.05] active:bg-[#7c5cff] text-white font-black text-xs flex items-center justify-center shrink-0 transition-colors"
                title="Жирный шрифт"
              >
                Ж
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleInsertMarkup('*', '*', 'курсив')}
                className="h-8 w-8 rounded-lg bg-white/[0.05] active:bg-[#7c5cff] text-white italic font-serif text-xs flex items-center justify-center shrink-0 transition-colors"
                title="Курсив"
              >
                К
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleInsertLinePrefix('# ')}
                className="h-8 px-2.5 rounded-lg bg-white/[0.05] active:bg-[#7c5cff] text-white font-bold text-xs flex items-center justify-center shrink-0 transition-colors"
                title="Заголовок H1"
              >
                H1
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleInsertLinePrefix('## ')}
                className="h-8 px-2.5 rounded-lg bg-white/[0.05] active:bg-[#7c5cff] text-white font-bold text-xs flex items-center justify-center shrink-0 transition-colors"
                title="Заголовок H2"
              >
                H2
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleInsertLinePrefix('- [ ] ')}
                className="h-8 w-8 rounded-lg bg-white/[0.05] active:bg-[#7c5cff] text-white flex items-center justify-center shrink-0 transition-colors"
                title="Чекбокс задачи"
              >
                <CheckSquare size={14} className="text-emerald-400" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleInsertLinePrefix('- ')}
                className="h-8 w-8 rounded-lg bg-white/[0.05] active:bg-[#7c5cff] text-white flex items-center justify-center shrink-0 transition-colors"
                title="Маркированный список"
              >
                <List size={14} />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleInsertLinePrefix('1. ')}
                className="h-8 w-8 rounded-lg bg-white/[0.05] active:bg-[#7c5cff] text-white flex items-center justify-center shrink-0 transition-colors"
                title="Нумерованный список"
              >
                <ListOrdered size={14} />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleInsertLinePrefix('> ')}
                className="h-8 w-8 rounded-lg bg-white/[0.05] active:bg-[#7c5cff] text-white flex items-center justify-center shrink-0 transition-colors"
                title="Цитата"
              >
                <Quote size={14} />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleInsertMarkup('`', '`', 'код')}
                className="h-8 w-8 rounded-lg bg-white/[0.05] active:bg-[#7c5cff] text-white flex items-center justify-center shrink-0 transition-colors"
                title="Код"
              >
                <Code size={14} />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setIsWikilinkPickerOpen(true)}
                className="h-8 px-2.5 rounded-lg bg-[#7c5cff]/20 active:bg-[#7c5cff] text-[#a78bfa] border border-[#7c5cff]/40 shrink-0 font-bold text-xs flex items-center gap-1 transition-colors"
                title="Вставить ссылку [[Мысль]]"
              >
                <Link2 size={12} />
                <span>[[ ]]</span>
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleInsertLinePrefix('---\n')}
                className="h-8 w-8 rounded-lg bg-white/[0.05] active:bg-[#7c5cff] text-white flex items-center justify-center shrink-0 transition-colors"
                title="Разделитель"
              >
                <Minus size={14} />
              </button>
            </div>

            <textarea
              ref={textareaRef}
              value={neuron.content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Начните писать в формате Markdown...&#10;# Заголовок&#10;- [ ] Задача&#10;- Список&#10;[[Связь с другой мыслью]]"
              className="w-full flex-1 min-h-[420px] bg-[#101117]/60 border border-white/[0.08] rounded-2xl p-4 text-[#e2e8f0] text-sm leading-relaxed resize-none focus:outline-none font-mono selection:bg-[#7c5cff]/40 focus:border-[#7c5cff]/50 transition-colors"
              rows={16}
            />
          </div>
        )}

        {/* ══════════ MODE 3: PREVIEW (INTERACTIVE MARKDOWN) ══════════ */}
        {viewMode === 'preview' && (
          <div className="w-full min-h-[55vh] space-y-3 text-sm leading-relaxed text-[#e2e8f0]">
            <h1 className="text-2xl font-black text-white py-1 border-b border-white/[0.08]">
              {neuron.title || 'Без названия'}
            </h1>
            {neuron.content.trim() ? (
              neuron.content.split('\n').map((line, idx) => {
                // Headings
                if (line.startsWith('# ')) {
                  return (
                    <h1
                      key={idx}
                      className="text-xl font-extrabold text-white mt-4 mb-2 pb-1 border-b border-white/[0.08]"
                    >
                      {line.replace('# ', '')}
                    </h1>
                  );
                }
                if (line.startsWith('## ')) {
                  return (
                    <h2 key={idx} className="text-base font-bold text-[#a78bfa] mt-3 mb-1.5">
                      {line.replace('## ', '')}
                    </h2>
                  );
                }
                if (line.startsWith('### ')) {
                  return (
                    <h3 key={idx} className="text-sm font-bold text-[#38bdf8] mt-2 mb-1">
                      {line.replace('### ', '')}
                    </h3>
                  );
                }

                // Interactive Task List
                if (line.startsWith('- [ ] ') || line.startsWith('- [x] ')) {
                  const isChecked = line.startsWith('- [x] ');
                  const taskText = line.replace(/- \[[ x]\] /, '');
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-2.5 py-1 px-1 rounded-lg hover:bg-white/[0.03] transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleTaskCheckbox(idx, isChecked, taskText)}
                        className="w-4 h-4 rounded-md accent-[#7c5cff] cursor-pointer shrink-0"
                      />
                      <span
                        className={`text-xs ${
                          isChecked ? 'line-through text-[#64748b]' : 'text-white'
                        }`}
                      >
                        {taskText}
                      </span>
                    </div>
                  );
                }

                // Bullet List
                if (line.startsWith('- ') || line.startsWith('* ')) {
                  return (
                    <div key={idx} className="flex items-start gap-2 text-xs py-0.5 ml-2">
                      <span className="text-[#7c5cff] font-bold">•</span>
                      <span>{line.replace(/^[-*]\s+/, '')}</span>
                    </div>
                  );
                }

                // Numbered List
                if (/^\d+\.\s+/.test(line)) {
                  const match = line.match(/^(\d+\.)\s+(.*)$/);
                  return (
                    <div key={idx} className="flex items-start gap-2 text-xs py-0.5 ml-2">
                      <span className="text-[#38bdf8] font-mono font-semibold">
                        {match?.[1]}
                      </span>
                      <span>{match?.[2]}</span>
                    </div>
                  );
                }

                // Blockquote / Callout
                if (line.startsWith('> ')) {
                  const quoteText = line.replace(/^>\s+/, '');
                  return (
                    <div
                      key={idx}
                      className="p-2.5 my-1.5 rounded-xl bg-white/[0.03] border-l-4 border-[#7c5cff] text-xs text-[#cbd5e1] italic"
                    >
                      {quoteText}
                    </div>
                  );
                }

                // Horizontal Rule
                if (line.trim() === '---' || line.trim() === '***') {
                  return <hr key={idx} className="border-white/[0.08] my-3" />;
                }

                // Empty line
                if (!line.trim()) {
                  return <div key={idx} className="h-2" />;
                }

                // Regular line with clickable [[wikilinks]]
                const wikiRegex = /\[\[(.*?)\]\]/g;
                let match;
                let lastIndex = 0;
                const elements: React.ReactNode[] = [];

                while ((match = wikiRegex.exec(line)) !== null) {
                  const before = line.substring(lastIndex, match.index);
                  if (before) elements.push(before);

                  const linkTitle = match[1]!;
                  elements.push(
                    <span
                      key={`${idx}-${match.index}`}
                      onClick={() => handleWikiLinkClick(linkTitle)}
                      className="px-1.5 py-0.2 rounded-md bg-[#7c5cff]/20 text-[#a78bfa] hover:bg-[#7c5cff]/30 font-bold cursor-pointer transition-colors underline decoration-[#7c5cff]/50 inline-flex items-center gap-0.5"
                    >
                      <Link2 size={10} />
                      <span>{linkTitle}</span>
                    </span>
                  );
                  lastIndex = wikiRegex.lastIndex;
                }
                const after = line.substring(lastIndex);
                if (after) elements.push(after);

                return (
                  <p key={idx} className="text-xs text-[#cbd5e1] leading-relaxed">
                    {elements.length > 0 ? elements : line}
                  </p>
                );
              })
            ) : (
              <div className="py-12 text-center text-[#64748b] text-xs space-y-2">
                <p>Заметка пока пуста</p>
                <button
                  onClick={() => setViewMode('visual')}
                  className="px-3 py-1.5 rounded-xl bg-[#7c5cff] text-white font-bold"
                >
                  Начать писать
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══════════ BI-DIRECTIONAL SYNAPTIC LINKS ══════════ */}
        <div className="pt-4 border-t border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between text-xs text-[#94a3b8]">
            <span className="font-bold flex items-center gap-1.5">
              <Zap size={13} className="text-[#7c5cff]" />
              <span>Синаптические связи ({outlinkNeurons.length + backlinkNeurons.length}):</span>
            </span>
            <button
              onClick={() => {
                selectNeuron(neuron.id);
                openTab({ type: 'graph', title: 'Граф' });
              }}
              className="text-[11px] text-[#38bdf8] hover:underline"
            >
              Открыть в Графе ➔
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {outlinkNeurons.map((out) => out && (
              <button
                key={out.id}
                onClick={() => openNote(out.id)}
                className="px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-white flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <ArrowUpRight size={11} className="text-[#7c5cff]" />
                <span>{out.title}</span>
              </button>
            ))}

            {backlinkNeurons.map((back) => back && (
              <button
                key={back.id}
                onClick={() => openNote(back.id)}
                className="px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-white flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <ArrowDownLeft size={11} className="text-emerald-400" />
                <span>{back.title}</span>
              </button>
            ))}

            {outlinkNeurons.length === 0 && backlinkNeurons.length === 0 && (
              <span className="text-[11px] text-[#64748b] italic">
                Нет связей. Вставьте [[Название другой мысли]] для связывания.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ══════════ MODAL: WIKILINK PICKER ══════════ */}
      {isWikilinkPickerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={() => setIsWikilinkPickerOpen(false)}
        >
          <div
            className="w-full sm:max-w-sm bg-[#151624] border border-white/[0.12] rounded-t-3xl sm:rounded-3xl p-4 shadow-2xl space-y-3 max-h-[70vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Link2 size={13} className="text-[#7c5cff]" />
                <span>Связать с мыслью [[...]]</span>
              </h4>
              <button
                onClick={() => setIsWikilinkPickerOpen(false)}
                className="text-[#94a3b8] hover:text-white"
              >
                <X size={15} />
              </button>
            </div>

            <input
              type="text"
              value={wikilinkSearch}
              onChange={(e) => setWikilinkSearch(e.target.value)}
              placeholder="Поиск мысли..."
              className="w-full bg-[#1c1d2e] border border-white/[0.1] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#7c5cff]"
              autoFocus
            />

            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
              {neurons
                .filter(
                  (n) =>
                    n.id !== neuron.id &&
                    (!wikilinkSearch.trim() ||
                      n.title.toLowerCase().includes(wikilinkSearch.toLowerCase()))
                )
                .map((target) => (
                  <button
                    key={target.id}
                    onClick={() => {
                      handleInsertMarkup(`[[${target.title}]]`, '', '');
                      setIsWikilinkPickerOpen(false);
                      setWikilinkSearch('');
                    }}
                    className="w-full p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-left text-xs text-white flex items-center justify-between transition-colors"
                  >
                    <span className="font-semibold truncate">{target.title}</span>
                    <span className="text-[10px] text-[#94a3b8] font-mono">
                      {(target.outlinks?.length || 0) + (target.backlinks?.length || 0)} св.
                    </span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════ MODAL: FOLDER PICKER ══════════ */}
      {isFolderPickerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={() => setIsFolderPickerOpen(false)}
        >
          <div
            className="w-full sm:max-w-sm bg-[#151624] border border-white/[0.12] rounded-t-3xl sm:rounded-3xl p-4 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Folder size={13} className="text-[#38bdf8]" />
                <span>Переместить в папку</span>
              </h4>
              <button
                onClick={() => setIsFolderPickerOpen(false)}
                className="text-[#94a3b8] hover:text-white"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-1 max-h-56 overflow-y-auto">
              <button
                onClick={() => {
                  moveNoteToFolder(neuron.id, null);
                  setIsFolderPickerOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                  !neuron.filePath
                    ? 'bg-[#38bdf8]/20 text-[#38bdf8]'
                    : 'bg-white/[0.03] text-white hover:bg-white/[0.07]'
                }`}
              >
                <span>Без папки (Корень)</span>
                {!neuron.filePath && <Check size={14} />}
              </button>

              {folders.map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    moveNoteToFolder(neuron.id, f.name);
                    setIsFolderPickerOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                    currentFolder === f.name
                      ? 'bg-[#38bdf8]/20 text-[#38bdf8]'
                      : 'bg-white/[0.03] text-white hover:bg-white/[0.07]'
                  }`}
                >
                  <span>📁 {f.name}</span>
                  {currentFolder === f.name && <Check size={14} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════ MODAL: NOTE INFO ══════════ */}
      {isInfoModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsInfoModalOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-[#14151e] border border-white/[0.14] rounded-3xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Info size={16} className="text-[#7c5cff]" />
                <span>Свойства заметки</span>
              </h3>
              <button
                onClick={() => setIsInfoModalOpen(false)}
                className="text-[#94a3b8] hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-[#94a3b8]">
                <span>Слов в заметке:</span>
                <span className="text-white font-mono font-bold">{words}</span>
              </div>
              <div className="flex justify-between text-[#94a3b8]">
                <span>Время чтения:</span>
                <span className="text-white font-mono">~{readingTime} мин</span>
              </div>
              <div className="flex justify-between text-[#94a3b8]">
                <span>Связей в графе:</span>
                <span className="text-white font-mono font-bold">
                  {(neuron.outlinks?.length || 0) + (neuron.backlinks?.length || 0)}
                </span>
              </div>
              <div className="flex justify-between text-[#94a3b8]">
                <span>Создано:</span>
                <span className="text-white font-mono">
                  {new Date(neuron.createdAt).toLocaleDateString('ru-RU')}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsInfoModalOpen(false)}
              className="w-full py-2 rounded-xl bg-white/[0.08] text-white font-bold text-xs"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* ══════════ MODAL: DELETE CONFIRMATION ══════════ */}
      {isDeleteModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsDeleteModalOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-[#14151e] border border-rose-500/40 rounded-3xl p-5 shadow-2xl space-y-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
              <Trash2 size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Удалить заметку?</h3>
              <p className="text-xs text-[#94a3b8] mt-1">
                «{neuron.title}» будет удалена из базы знаний и исключена из Графа.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-[#cbd5e1]"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  deleteNeuron(neuron.id);
                  openTab({ type: 'notes', title: 'Заметки' });
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-500/25 active:scale-95 transition-all"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
