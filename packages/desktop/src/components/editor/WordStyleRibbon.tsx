import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  CheckSquare,
  Eraser,
  Table as TableIcon,
  Link2,
  Pipette,
} from 'lucide-react';

export interface WordRibbonActionHandlers {
  onFontSizeChange: (size: number) => void;
  onClearFormat: () => void;

  onBold: () => void;
  onItalic: () => void;
  onUnderline: () => void;
  onStrikethrough: () => void;
  onHighlight: (color: string, autoTextColor?: string) => void;
  onTextColor: (color: string) => void;

  onAlign: (align: 'left' | 'center' | 'right' | 'justify') => void;
  onBulletList: () => void;
  onNumberedList: () => void;
  onChecklist: () => void;

  onInsertEmptyTable: (rows?: number, cols?: number) => void;
  onOpenCalculator?: () => void;
  onInsertLink?: () => void;
  onAutoFixOrthography?: () => void;
}

interface WordStyleRibbonProps {
  handlers: WordRibbonActionHandlers;
  currentSize?: number;
  currentAlign?: 'left' | 'center' | 'right' | 'justify';
}

const FONT_SIZES = [10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48];

const HIGHLIGHT_COLORS = [
  { name: 'Желтый', color: '#fef08a' },
  { name: 'Зеленый', color: '#bbf7d0' },
  { name: 'Голубой', color: '#bae6fd' },
  { name: 'Розовый', color: '#fbcfe8' },
  { name: 'Оранжевый', color: '#fed7aa' },
  { name: 'Фиолетовый', color: '#7c5cff' },
  { name: 'Без цвета', color: 'transparent' },
];

const TEXT_COLORS = [
  { name: 'Белый', color: '#ffffff' },
  { name: 'Светло-серый', color: '#cbd5e1' },
  { name: 'Фиолетовый', color: '#a78bfa' },
  { name: 'Синий', color: '#38bdf8' },
  { name: 'Изумрудный', color: '#34d399' },
  { name: 'Янтарный', color: '#fbbf24' },
  { name: 'Красный', color: '#f87171' },
];

export function getContrastTextColor(hexColor: string): string {
  if (!hexColor || hexColor === 'transparent') return '#ffffff';
  let hex = hexColor.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map((c) => c + c).join('');
  }
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 145 ? '#0f172a' : '#ffffff';
}

export const WordStyleRibbon: React.FC<WordStyleRibbonProps> = ({
  handlers,
  currentSize = 14,
  currentAlign = 'left',
}) => {
  const [selectedSize, setSelectedSize] = useState(currentSize);

  // Dropdown menus state
  const [isHighlightMenuOpen, setIsHighlightMenuOpen] = useState(false);
  const [isTextColorMenuOpen, setIsTextColorMenuOpen] = useState(false);

  const [activeHighlightColor, setActiveHighlightColor] = useState('#fef08a');
  const [activeTextColor, setActiveTextColor] = useState('#ffffff');
  const [customHighlightRGB, setCustomHighlightRGB] = useState('#fef08a');
  const [customTextRGB, setCustomTextRGB] = useState('#7c5cff');

  // Popover refs
  const highlightRef = useRef<HTMLDivElement>(null);
  const textColorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedSize(currentSize);
  }, [currentSize]);

  // Click outside listener for color menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (highlightRef.current && !highlightRef.current.contains(e.target as Node)) {
        setIsHighlightMenuOpen(false);
      }
      if (textColorRef.current && !textColorRef.current.contains(e.target as Node)) {
        setIsTextColorMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sz = Number(e.target.value);
    setSelectedSize(sz);
    handlers.onFontSizeChange(sz);
  };

  const applyHighlightWithContrast = (color: string) => {
    setActiveHighlightColor(color);
    const contrastText = getContrastTextColor(color);
    handlers.onHighlight(color, contrastText);
    setIsHighlightMenuOpen(false);
  };

  return (
    <div className="w-full bg-[#14151e] border border-white/[0.09] rounded-2xl p-2.5 select-none shadow-2xl relative z-30">
      <div className="flex items-center gap-2.5 flex-wrap text-sm">
        
        {/* GROUP 1: FONT SIZE */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={selectedSize}
              onChange={handleSizeChange}
              className="h-9 bg-[#1c1d28] border border-white/[0.12] text-[#f1f5f9] text-xs font-bold font-mono rounded-xl px-2.5 pr-6 focus:outline-none focus:border-[#7c5cff] cursor-pointer appearance-none w-[68px]"
              title="Размер шрифта"
            >
              {FONT_SIZES.map((s) => (
                <option key={s} value={s} className="bg-[#1c1d28] text-white">
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-3 text-[#94a3b8] pointer-events-none" />
          </div>
        </div>

        <div className="w-[1px] h-6 bg-white/10 mx-0.5" />

        {/* GROUP 2: FORMATTING (Ж, К, Ч, ab, Marker, Text Color) */}
        <div className="flex items-center gap-1.5">
          {/* Bold (Ж) */}
          <button
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
            onClick={handlers.onBold}
            className="h-9 w-9 rounded-xl bg-white/[0.05] hover:bg-[#7c5cff]/30 text-white font-black text-sm flex items-center justify-center border border-white/[0.06] transition-colors active:scale-95"
            title="Полужирный (Ж / Ctrl+B)"
          >
            Ж
          </button>

          {/* Italic (К) */}
          <button
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
            onClick={handlers.onItalic}
            className="h-9 w-9 rounded-xl bg-white/[0.05] hover:bg-[#7c5cff]/30 text-white italic font-serif text-sm flex items-center justify-center border border-white/[0.06] transition-colors active:scale-95"
            title="Курсив (К / Ctrl+I)"
          >
            К
          </button>

          {/* Underline (Ч) */}
          <button
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
            onClick={handlers.onUnderline}
            className="h-9 w-9 rounded-xl bg-white/[0.05] hover:bg-[#7c5cff]/30 text-white underline font-bold text-sm flex items-center justify-center border border-white/[0.06] transition-colors active:scale-95"
            title="Подчеркнутый (Ч / Ctrl+U)"
          >
            Ч
          </button>

          {/* Strikethrough (ab) */}
          <button
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
            onClick={handlers.onStrikethrough}
            className="h-9 w-9 rounded-xl bg-white/[0.05] hover:bg-[#7c5cff]/30 text-[#cbd5e1] hover:text-white line-through font-mono text-xs flex items-center justify-center border border-white/[0.06] transition-colors active:scale-95"
            title="Зачеркнутый (ab)"
          >
            ab
          </button>

          {/* Highlight Color Picker (Marker with Auto Contrast) */}
          <div className="relative" ref={highlightRef}>
            <div className="flex items-center h-9 bg-white/[0.05] border border-white/[0.06] rounded-xl overflow-hidden">
              <button
                onMouseDown={(e) => e.preventDefault()}
                onTouchStart={(e) => e.preventDefault()}
                onClick={() => applyHighlightWithContrast(activeHighlightColor)}
                className="px-2.5 h-full flex items-center gap-1.5 hover:bg-[#7c5cff]/20 text-[#cbd5e1] hover:text-white transition-colors active:scale-95"
                title="Маркер (с автоматическим подбором цвета текста)"
              >
                <Highlighter size={14} style={{ color: activeHighlightColor !== 'transparent' ? activeHighlightColor : '#fef08a' }} />
                <span
                  className="w-3 h-3 rounded-full border border-black/40 shadow-sm"
                  style={{ backgroundColor: activeHighlightColor !== 'transparent' ? activeHighlightColor : 'transparent' }}
                />
              </button>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onTouchStart={(e) => e.preventDefault()}
                onClick={() => setIsHighlightMenuOpen(!isHighlightMenuOpen)}
                className="px-1.5 h-full hover:bg-white/[0.08] text-[#94a3b8] hover:text-white border-l border-white/[0.08]"
              >
                <ChevronDown size={11} />
              </button>
            </div>

            {isHighlightMenuOpen && (
              <div className="absolute top-11 left-0 bg-[#171822] border border-white/[0.12] rounded-2xl p-3 shadow-2xl z-50 w-56 space-y-2.5 animate-fade-in">
                <div className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">Цвет маркера (авто-контраст)</div>
                <div className="grid grid-cols-4 gap-1.5">
                  {HIGHLIGHT_COLORS.map((c) => (
                    <button
                      key={c.name}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyHighlightWithContrast(c.color)}
                      className="w-full h-7 rounded-lg border border-black/30 flex items-center justify-center hover:scale-105 transition-transform"
                      style={{ backgroundColor: c.color === 'transparent' ? '#262738' : c.color }}
                      title={c.name}
                    >
                      {c.color === 'transparent' && <span className="text-[10px] text-white">✕</span>}
                    </button>
                  ))}
                </div>

                {/* Custom RGB Color Picker */}
                <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between">
                  <span className="text-xs text-[#cbd5e1] flex items-center gap-1">
                    <Pipette size={13} className="text-[#7c5cff]" />
                    <span>Свой RGB:</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={customHighlightRGB}
                      onChange={(e) => {
                        setCustomHighlightRGB(e.target.value);
                        applyHighlightWithContrast(e.target.value);
                      }}
                      className="w-6 h-6 rounded-md cursor-pointer bg-transparent border-0"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Text Color Picker */}
          <div className="relative" ref={textColorRef}>
            <div className="flex items-center h-9 bg-white/[0.05] border border-white/[0.06] rounded-xl overflow-hidden">
              <button
                onMouseDown={(e) => e.preventDefault()}
                onTouchStart={(e) => e.preventDefault()}
                onClick={() => handlers.onTextColor(activeTextColor)}
                className="px-2.5 h-full flex items-center gap-1.5 hover:bg-[#7c5cff]/20 text-[#cbd5e1] hover:text-white transition-colors active:scale-95"
                title="Цвет текста"
              >
                <span className="font-extrabold text-sm underline" style={{ color: activeTextColor }}>A</span>
                <span
                  className="w-3 h-3 rounded-full border border-black/40 shadow-sm"
                  style={{ backgroundColor: activeTextColor }}
                />
              </button>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onTouchStart={(e) => e.preventDefault()}
                onClick={() => setIsTextColorMenuOpen(!isTextColorMenuOpen)}
                className="px-1.5 h-full hover:bg-white/[0.08] text-[#94a3b8] hover:text-white border-l border-white/[0.08]"
              >
                <ChevronDown size={11} />
              </button>
            </div>

            {isTextColorMenuOpen && (
              <div className="absolute top-11 left-0 bg-[#171822] border border-white/[0.12] rounded-2xl p-3 shadow-2xl z-50 w-56 space-y-2.5 animate-fade-in">
                <div className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">Цвет текста</div>
                <div className="grid grid-cols-4 gap-1.5">
                  {TEXT_COLORS.map((c) => (
                    <button
                      key={c.name}
                      onMouseDown={(e) => e.preventDefault()}
                      onTouchStart={(e) => e.preventDefault()}
                      onClick={() => {
                        setActiveTextColor(c.color);
                        handlers.onTextColor(c.color);
                        setIsTextColorMenuOpen(false);
                      }}
                      className="w-full h-7 rounded-lg border border-black/30 flex items-center justify-center hover:scale-105 transition-transform active:scale-95"
                      style={{ backgroundColor: c.color }}
                      title={c.name}
                    />
                  ))}
                </div>

                {/* Custom RGB Color Picker */}
                <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between">
                  <span className="text-xs text-[#cbd5e1] flex items-center gap-1">
                    <Pipette size={13} className="text-[#7c5cff]" />
                    <span>Свой RGB:</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={customTextRGB}
                      onChange={(e) => {
                        setCustomTextRGB(e.target.value);
                        setActiveTextColor(e.target.value);
                        handlers.onTextColor(e.target.value);
                      }}
                      className="w-6 h-6 rounded-md cursor-pointer bg-transparent border-0"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Clear Formatting */}
          <button
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
            onClick={handlers.onClearFormat}
            className="h-9 w-9 rounded-xl bg-white/[0.05] hover:bg-rose-500/20 text-[#94a3b8] hover:text-rose-400 flex items-center justify-center border border-white/[0.06] transition-colors active:scale-95"
            title="Очистить форматирование"
          >
            <Eraser size={14} />
          </button>
        </div>

        <div className="w-[1px] h-6 bg-white/10 mx-0.5" />

        {/* GROUP 3: ALIGNMENT & LISTS */}
        <div className="flex items-center gap-1">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
            onClick={() => handlers.onAlign('left')}
            className={`h-9 w-9 rounded-xl flex items-center justify-center transition-colors active:scale-95 ${
              currentAlign === 'left' ? 'bg-[#7c5cff] text-white shadow' : 'bg-white/[0.05] text-[#94a3b8] hover:text-white'
            }`}
            title="По левому краю"
          >
            <AlignLeft size={14} />
          </button>

          <button
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
            onClick={() => handlers.onAlign('center')}
            className={`h-9 w-9 rounded-xl flex items-center justify-center transition-colors active:scale-95 ${
              currentAlign === 'center' ? 'bg-[#7c5cff] text-white shadow' : 'bg-white/[0.05] text-[#94a3b8] hover:text-white'
            }`}
            title="По центру"
          >
            <AlignCenter size={14} />
          </button>

          <button
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
            onClick={() => handlers.onAlign('right')}
            className={`h-9 w-9 rounded-xl flex items-center justify-center transition-colors active:scale-95 ${
              currentAlign === 'right' ? 'bg-[#7c5cff] text-white shadow' : 'bg-white/[0.05] text-[#94a3b8] hover:text-white'
            }`}
            title="По правому краю"
          >
            <AlignRight size={14} />
          </button>

          <button
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
            onClick={() => handlers.onAlign('justify')}
            className={`h-9 w-9 rounded-xl flex items-center justify-center transition-colors active:scale-95 ${
              currentAlign === 'justify' ? 'bg-[#7c5cff] text-white shadow' : 'bg-white/[0.05] text-[#94a3b8] hover:text-white'
            }`}
            title="По ширине"
          >
            <AlignJustify size={14} />
          </button>

          <div className="w-[1px] h-6 bg-white/10 mx-1" />

          {/* Bullet List */}
          <button
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
            onClick={handlers.onBulletList}
            className="h-9 w-9 rounded-xl bg-white/[0.05] hover:bg-[#7c5cff]/30 text-[#cbd5e1] hover:text-white flex items-center justify-center border border-white/[0.06] transition-colors active:scale-95"
            title="Маркированный список"
          >
            <List size={15} />
          </button>

          {/* Numbered List */}
          <button
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
            onClick={handlers.onNumberedList}
            className="h-9 w-9 rounded-xl bg-white/[0.05] hover:bg-[#7c5cff]/30 text-[#cbd5e1] hover:text-white flex items-center justify-center border border-white/[0.06] transition-colors active:scale-95"
            title="Нумерованный список"
          >
            <ListOrdered size={15} />
          </button>

          {/* Checklist */}
          <button
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
            onClick={handlers.onChecklist}
            className="h-9 w-9 rounded-xl bg-white/[0.05] hover:bg-[#7c5cff]/30 text-[#cbd5e1] hover:text-white flex items-center justify-center border border-white/[0.06] transition-colors active:scale-95"
            title="Список задач (чекбокс)"
          >
            <CheckSquare size={14} />
          </button>
        </div>

        <div className="w-[1px] h-6 bg-white/10 mx-0.5" />

        {/* GROUP 4: INSERT (Таблица, Ссылка, Исправить текст) */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Insert Table */}
          <button
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
            onClick={() => handlers.onInsertEmptyTable(2, 3)}
            className="h-9 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-semibold text-xs flex items-center gap-1.5 border border-emerald-500/30 transition-colors shadow-sm active:scale-95"
            title="Вставить таблицу с нумерацией строк"
          >
            <TableIcon size={14} />
            <span>+ Таблица</span>
          </button>

          {/* Insert Link */}
          {handlers.onInsertLink && (
            <button
              onMouseDown={(e) => e.preventDefault()}
              onTouchStart={(e) => e.preventDefault()}
              onClick={handlers.onInsertLink}
              className="h-9 w-9 rounded-xl bg-white/[0.05] hover:bg-[#7c5cff]/30 text-[#cbd5e1] hover:text-white flex items-center justify-center border border-white/[0.06] transition-colors active:scale-95"
              title="Вставить ссылку [[Заметка]]"
            >
              <Link2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
