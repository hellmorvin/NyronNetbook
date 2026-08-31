import React, { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  List,
  CheckSquare,
  Heading1,
  Heading2,
  Table,
  Link,
  Sigma,
  Eye,
  Edit3,
} from 'lucide-react';
import { useMobileBrainStore } from '../../store/useMobileBrainStore';

export const MobileNoteEditor: React.FC = () => {
  const {
    neurons,
    activeNeuronId,
    updateNeuronContent,
    addNeuron,
    setActiveNeuronId,
  } = useMobileBrainStore();

  const activeNeuron = neurons.find((n) => n.id === activeNeuronId);
  const [isPreview, setIsPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (!activeNeuron) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-[#64748b]">
        <span className="text-4xl mb-3"></span>
        <h3 className="text-sm font-bold text-white mb-1">Заметка не выбрана</h3>
        <p className="text-xs max-w-xs mb-4">Выберите заметку в боковом меню или создайте новую</p>
        <button
          onClick={() => addNeuron('Новая мысль')}
          className="py-2 px-4 rounded-xl bg-[#8052ff] text-white font-semibold text-xs shadow-lg shadow-[#8052ff]/20"
        >
          + Создать заметку
        </button>
      </div>
    );
  }

  const insertText = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = activeNeuron.content;

    const selected = current.substring(start, end);
    const replacement = `${prefix}${selected}${suffix}`;
    const updated = current.substring(0, start) + replacement + current.substring(end);

    updateNeuronContent(activeNeuron.id, updated);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 20);
  };

  const handleWikiLinkClick = (title: string) => {
    const target = neurons.find((n) => n.title.toLowerCase() === title.toLowerCase());
    if (target) {
      setActiveNeuronId(target.id);
    } else {
      const newNote = addNeuron(title);
      setActiveNeuronId(newNote.id);
    }
  };

  // Render markdown with clickable [[wikilinks]]
  const renderPreview = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="p-4 space-y-2 text-sm leading-relaxed text-[#e2e8f0]">
        {lines.map((line, idx) => {
          if (line.startsWith('# ')) {
            return (
              <h1 key={idx} className="text-xl font-bold text-white mt-3 mb-1 border-b border-white/[0.08] pb-1">
                {line.replace('# ', '')}
              </h1>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h2 key={idx} className="text-base font-bold text-[#8052ff] mt-2 mb-1">
                {line.replace('## ', '')}
              </h2>
            );
          }
          if (line.startsWith('- [ ] ') || line.startsWith('- [x] ')) {
            const isChecked = line.startsWith('- [x] ');
            const label = line.replace(/- \[[ x]\] /, '');
            return (
              <div key={idx} className="flex items-center gap-2 text-xs py-0.5">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {
                    const toggled = isChecked ? `- [ ] ${label}` : `- [x] ${label}`;
                    const nextContent = lines
                      .map((l, i) => (i === idx ? toggled : l))
                      .join('\n');
                    updateNeuronContent(activeNeuron.id, nextContent);
                  }}
                  className="rounded accent-[#8052ff]"
                />
                <span className={isChecked ? 'line-through text-[#64748b]' : 'text-[#cbd5e1]'}>
                  {label}
                </span>
              </div>
            );
          }

          // Parse [[WikiLinks]] in paragraphs
          const wikiRegex = /\[\[(.*?)\]\]/g;
          let match;
          let lastIndex = 0;
          const elements: React.ReactNode[] = [];

          while ((match = wikiRegex.exec(line)) !== null) {
            const before = line.substring(lastIndex, match.index);
            if (before) elements.push(before);

            const linkTarget = match[1]!;
            elements.push(
              <span
                key={`${idx}-${match.index}`}
                onClick={() => handleWikiLinkClick(linkTarget)}
                className="text-[#8052ff] underline font-semibold cursor-pointer active:opacity-70 px-0.5"
              >
                [[{linkTarget}]]
              </span>
            );
            lastIndex = wikiRegex.lastIndex;
          }
          const after = line.substring(lastIndex);
          if (after) elements.push(after);

          return (
            <p key={idx} className="text-xs text-[#cbd5e1] min-h-[1rem]">
              {elements.length > 0 ? elements : line}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0c0d12]">
      {/* Mode Switcher Banner */}
      <div className="h-9 px-4 border-b border-[#232533] flex items-center justify-between bg-[#14151e] shrink-0 text-xs">
        <span className="text-[11px] text-[#64748b] truncate max-w-[200px]">
          {activeNeuron.filePath}
        </span>

        <button
          onClick={() => setIsPreview(!isPreview)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#232533] text-[#94a3b8] active:text-white font-medium text-[11px]"
        >
          {isPreview ? <Edit3 size={13} /> : <Eye size={13} />}
          <span>{isPreview ? 'Редактор' : 'Просмотр'}</span>
        </button>
      </div>

      {/* Editor or Preview */}
      <div className="flex-1 overflow-y-auto">
        {isPreview ? (
          renderPreview(activeNeuron.content)
        ) : (
          <textarea
            ref={textareaRef}
            value={activeNeuron.content}
            onChange={(e) => updateNeuronContent(activeNeuron.id, e.target.value)}
            placeholder="Начните вводить текст заметки..."
            className="w-full h-full p-4 bg-transparent text-sm text-[#e2e8f0] focus:outline-none resize-none font-mono leading-relaxed placeholder:text-[#475569]"
          />
        )}
      </div>

      {/* Mobile Keyboard Accessory Toolbar */}
      {!isPreview && (
        <div className="h-11 bg-[#14151e] border-t border-[#232533] flex items-center gap-1 px-2 overflow-x-auto shrink-0 scrollbar-none">
          <button
            onClick={() => insertText('# ')}
            className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#94a3b8] hover:text-white active:bg-white/[0.08]"
          >
            H1
          </button>
          <button
            onClick={() => insertText('## ')}
            className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#94a3b8] hover:text-white active:bg-white/[0.08]"
          >
            H2
          </button>
          <button
            onClick={() => insertText('**', '**')}
            className="p-1.5 rounded-lg text-[#94a3b8] hover:text-white active:bg-white/[0.08]"
          >
            <Bold size={15} />
          </button>
          <button
            onClick={() => insertText('*', '*')}
            className="p-1.5 rounded-lg text-[#94a3b8] hover:text-white active:bg-white/[0.08]"
          >
            <Italic size={15} />
          </button>
          <button
            onClick={() => insertText('[[', ']]')}
            className="px-2 py-1 rounded-lg text-xs font-bold text-[#8052ff] bg-[#8052ff]/10 active:bg-[#8052ff]/20"
          >
            [[ ]]
          </button>
          <button
            onClick={() => insertText('- [ ] ')}
            className="p-1.5 rounded-lg text-[#94a3b8] hover:text-white active:bg-white/[0.08]"
          >
            <CheckSquare size={15} />
          </button>
          <button
            onClick={() => insertText('- ')}
            className="p-1.5 rounded-lg text-[#94a3b8] hover:text-white active:bg-white/[0.08]"
          >
            <List size={15} />
          </button>
          <button
            onClick={() =>
              insertText('\n| Элемент | Количество | Цена |\n| :--- | :--- | :--- |\n| Товар 1 | 1 | 500 |\n')
            }
            className="p-1.5 rounded-lg text-[#94a3b8] hover:text-white active:bg-white/[0.08]"
          >
            <Table size={15} />
          </button>
        </div>
      )}
    </div>
  );
};
