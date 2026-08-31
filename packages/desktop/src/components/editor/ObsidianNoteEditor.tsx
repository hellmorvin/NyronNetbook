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
  FileSpreadsheet,
  Code,
  Columns,
} from 'lucide-react';
import { useBrainStore } from '../../store/useBrainStore';
import { LearningState } from '@axon/shared';
import { RichWordEditor } from './RichWordEditor';
import { LiveDocumentView, htmlToCleanMarkdown } from './LiveDocumentView';

interface ObsidianNoteEditorProps {
  noteId: string;
}

export const ObsidianNoteEditor: React.FC<ObsidianNoteEditorProps> = ({ noteId }) => {
  const {
    neurons,
    updateNeuron,
    deleteNeuron,
    togglePin,
    setLearningState,
    selectNeuron,
    openTab,
  } = useBrainStore();

  const neuron = neurons.find((n) => n.id === noteId);

  // Default to Visual Word WYSIWYG Mode
  const [viewMode, setViewMode] = useState<'visual' | 'edit' | 'split'>('visual');
  const [tagInput, setTagInput] = useState('');
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const tagPickerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
        <p className="text-sm font-medium text-white">Заметка не найдена</p>
        <p className="text-xs text-[#64748b]">Возможно, эта заметка была удалена или перемещена.</p>
        <button
          onClick={() => openTab({ type: 'graph', title: 'Граф' })}
          className="px-3 py-1.5 rounded-lg bg-[#7c5cff] text-white hover:bg-[#7c5cff]/90 transition-colors text-xs font-medium"
        >
          Вернуться к Графу
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

  const words = (neuron.content || '').replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(words / 200));

  const handleTitleChange = (newTitle: string) => {
    updateNeuron(neuron.id, { title: newTitle });
  };

  const handleContentChange = (newContent: string) => {
    updateNeuron(neuron.id, { content: newContent });
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const cleanTag = tagInput.trim().replace(/^#/, '');
      if (!neuron.tags.includes(cleanTag)) {
        updateNeuron(neuron.id, { tags: [...neuron.tags, cleanTag] });
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    updateNeuron(neuron.id, {
      tags: neuron.tags.filter((t) => t !== tagToRemove),
    });
  };

  return (
    <div className="flex-1 h-full bg-[#0d0e12] flex flex-col select-text overflow-y-auto text-[#e2e8f0] relative">
      <div className="w-full px-8 py-5 pb-20 space-y-4">
        
        {/* Top Control Bar: Mode Switcher & Actions */}
        <div className="flex items-center justify-between gap-2 pb-1 border-b border-white/[0.06] flex-wrap">
          {/* Mode Switcher */}
          <div className="flex items-center p-0.5 bg-[#14151c] border border-white/[0.08] rounded-xl text-xs">
            <button
              onClick={() => setViewMode('visual')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors flex items-center gap-1.5 ${
                viewMode === 'visual'
                  ? 'bg-[#7c5cff] text-white shadow-md'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
              title="Визуальный редактор (Word-стиль без символов кода)"
            >
              <FileSpreadsheet size={13} />
              <span>Визуальный</span>
            </button>
            <button
              onClick={() => setViewMode('edit')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                viewMode === 'edit'
                  ? 'bg-[#7c5cff] text-white shadow-md'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
              title="Исходный код Markdown"
            >
              <Code size={13} />
              <span>MD код</span>
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                viewMode === 'split'
                  ? 'bg-[#7c5cff] text-white shadow-md'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <Columns size={12} />
              <span>Сплит</span>
            </button>
          </div>

          {/* Note Metadata Details */}
          <div className="flex items-center gap-3 text-xs text-[#94a3b8]">
            <div className="flex items-center gap-1.5">
              <Calendar size={13} className="text-[#7c5cff]" />
              <span>{new Date(neuron.createdAt).toLocaleDateString()}</span>
            </div>
            <span>{words} слов</span>
            <div className="flex items-center gap-1">
              <Clock size={12} className="text-[#38bdf8]" />
              <span>~{readingTime} мин</span>
            </div>

            <div className="flex items-center gap-2 ml-2">
              <select
                value={neuron.learningState || 'new'}
                onChange={(e) => setLearningState(neuron.id, e.target.value as LearningState)}
                className="bg-[#191a22] border border-white/[0.1] text-white rounded-md px-2 py-0.5 text-xs focus:outline-none focus:border-[#7c5cff]"
              >
                <option value="new">Новая мысль</option>
                <option value="learning">Изучается</option>
                <option value="review">Повторение</option>
                <option value="mastered">Выучено (Mastered)</option>
              </select>
            </div>

            <button
              onClick={() => togglePin(neuron.id)}
              className={`p-1.5 rounded-lg transition-colors ${
                neuron.pinned
                  ? 'text-[#f59e0b] bg-[#f59e0b]/15'
                  : 'text-[#94a3b8] hover:text-white hover:bg-white/[0.06]'
              }`}
              title={neuron.pinned ? 'Открепить заметку' : 'Закрепить'}
            >
              <Pin size={15} />
            </button>
            <button
              onClick={() => deleteNeuron(neuron.id)}
              className="p-1.5 rounded-lg text-[#94a3b8] hover:text-[#f43f5e] hover:bg-white/[0.06] transition-colors"
              title="Удалить заметку"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Tags Bar */}
        <div className="flex items-center gap-2 flex-wrap text-xs" ref={tagPickerRef}>
          <Tag size={12} className="text-[#94a3b8]" />
          {neuron.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-md bg-[#191a22] text-[#7c5cff] border border-[#7c5cff]/30 text-[11px] flex items-center gap-1"
            >
              #{tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-white ml-0.5 text-xs text-[#94a3b8]"
              >
                ×
              </button>
            </span>
          ))}
          <div className="relative">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => {
                setTagInput(e.target.value);
                setIsTagDropdownOpen(true);
              }}
              onFocus={() => setIsTagDropdownOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddTag(e);
                  setIsTagDropdownOpen(false);
                } else if (e.key === 'Escape') {
                  setIsTagDropdownOpen(false);
                }
              }}
              placeholder="+ добавить тег..."
              className="bg-transparent text-[11px] text-white focus:outline-none placeholder:text-[#475569] w-28"
            />

            {isTagDropdownOpen && (
              <div className="absolute top-6 left-0 z-50 min-w-[180px] p-2 bg-[#171822] border border-white/[0.12] rounded-xl shadow-2xl space-y-1 animate-fade-in">
                <div className="text-[10px] text-[#94a3b8] px-1.5 py-0.5 font-bold uppercase tracking-wider">
                  Теги хранилища
                </div>
                <div className="max-h-36 overflow-y-auto space-y-0.5">
                  {allVaultTags
                    .filter((t) => !neuron.tags.includes(t) && t.toLowerCase().includes(tagInput.toLowerCase()))
                    .map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          updateNeuron(neuron.id, { tags: [...neuron.tags, t] });
                          setTagInput('');
                          setIsTagDropdownOpen(false);
                        }}
                        className="w-full text-left px-2 py-1 rounded-lg text-xs text-[#cbd5e1] hover:text-white hover:bg-[#7c5cff]/20 flex items-center justify-between transition-colors"
                      >
                        <span>#{t}</span>
                        <span className="text-[10px] text-[#64748b]">+</span>
                      </button>
                    ))}
                  {tagInput.trim() && !allVaultTags.includes(tagInput.trim().toLowerCase()) && (
                    <button
                      type="button"
                      onClick={() => {
                        const clean = tagInput.trim().replace(/^#/, '');
                        if (clean) {
                          updateNeuron(neuron.id, { tags: [...neuron.tags, clean] });
                          setTagInput('');
                          setIsTagDropdownOpen(false);
                        }
                      }}
                      className="w-full text-left px-2 py-1 rounded-lg text-xs text-[#10b981] hover:bg-[#10b981]/20 font-medium"
                    >
                      + Создать #{tagInput.trim()}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ================= MAIN WORKSPACE ================= */}
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

        {viewMode === 'edit' && (
          <div className="space-y-3">
            <input
              type="text"
              value={neuron.title || ''}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Заголовок заметки..."
              className="w-full bg-transparent text-2xl font-bold text-white focus:outline-none placeholder:text-[#475569] tracking-tight px-1"
            />
            <div className="bg-[#101117]/70 border border-white/[0.08] rounded-2xl p-5 min-h-[500px]">
              <textarea
                ref={textareaRef}
                value={neuron.content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Начните писать заметку..."
                className="w-full bg-transparent text-sm text-[#e2e8f0] leading-relaxed resize-none focus:outline-none font-mono selection:bg-[#7c5cff]/40 min-h-[460px]"
                rows={20}
              />
            </div>
          </div>
        )}

        {viewMode === 'split' && (
          <div className="space-y-3">
            <input
              type="text"
              value={neuron.title || ''}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Заголовок заметки..."
              className="w-full bg-transparent text-2xl font-bold text-white focus:outline-none placeholder:text-[#475569] tracking-tight px-1"
            />
            <div className="grid grid-cols-2 gap-4 min-h-[500px]">
              <div className="p-4 bg-[#101117]/70 border border-white/[0.08] rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider block mb-2">
                  Исходный код Markdown
                </span>
                <textarea
                  ref={textareaRef}
                  value={neuron.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Код заметки..."
                  className="w-full bg-transparent text-xs text-[#e2e8f0] leading-relaxed resize-none focus:outline-none font-mono selection:bg-[#7c5cff]/40 min-h-[460px]"
                  rows={20}
                />
              </div>
              <div className="p-4 bg-[#101117]/70 border border-white/[0.08] rounded-2xl overflow-y-auto">
                <span className="text-[10px] uppercase font-bold text-[#7c5cff] tracking-wider block mb-2">
                  Визуальный вид
                </span>
                <div
                  className="prose-dark text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: neuron.content }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Bottom Bi-directional Neural Links Bar */}
        <div className="mt-8 pt-4 border-t border-white/[0.08] space-y-4">
          {outlinkNeurons.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-[#94a3b8] flex items-center gap-1.5">
                <ArrowUpRight size={14} className="text-[#7c5cff]" />
                <span>Исходящие нейро-связи ({outlinkNeurons.length}):</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {outlinkNeurons.map((out) => out && (
                  <button
                    key={out.id}
                    onClick={() => {
                      selectNeuron(out.id);
                      openTab({ type: 'note', noteId: out.id, title: out.title });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#14151c] border border-white/[0.08] text-xs text-[#e2e8f0] hover:border-[#7c5cff] hover:text-white transition-all flex items-center gap-1.5"
                  >
                    <Link2 size={11} className="text-[#7c5cff]" />
                    <span>{out.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {backlinkNeurons.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-[#94a3b8] flex items-center gap-1.5">
                <ArrowDownLeft size={14} className="text-[#10b981]" />
                <span>Обратные ссылки ({backlinkNeurons.length}):</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {backlinkNeurons.map((back) => back && (
                  <button
                    key={back.id}
                    onClick={() => {
                      selectNeuron(back.id);
                      openTab({ type: 'note', noteId: back.id, title: back.title });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#14151c] border border-white/[0.08] text-xs text-[#e2e8f0] hover:border-[#10b981] hover:text-white transition-all flex items-center gap-1.5"
                  >
                    <Layers size={11} className="text-[#10b981]" />
                    <span>{back.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
