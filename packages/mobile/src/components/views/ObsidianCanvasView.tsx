import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import {
  Plus,
  Trash2,
  ZoomIn,
  ZoomOut,
  Compass,
  FileText,
  X,
  Info,
  Link2,
  Sparkles,
  Palette,
  Copy,
  ExternalLink,
  BookOpen,
  Search,
} from 'lucide-react';
import {
  IconStickyNote,
  IconClearCanvas,
} from '../icons/CustomNeironoIcons';
import { useBrainStore, CanvasCard, CanvasConnection } from '../../store/useBrainStore';

const COLOR_PRESETS = [
  { name: 'Iris Violet', color: '#8b5cf6' },
  { name: 'Cyan Sky', color: '#06b6d4' },
  { name: 'Emerald Mint', color: '#10b981' },
  { name: 'Amber Glow', color: '#f59e0b' },
  { name: 'Rose Coral', color: '#f43f5e' },
  { name: 'Slate Steel', color: '#64748b' },
];

interface Point {
  x: number;
  y: number;
}

interface EdgeConnection {
  p1: Point;
  p2: Point;
  fromSide: 'top' | 'bottom' | 'left' | 'right';
  toSide: 'top' | 'bottom' | 'left' | 'right';
}

// Calculate mathematically exact closest boundary points between two rectangular cards
function getExactCardEdgeConnection(fromCard: CanvasCard, toCard: CanvasCard): EdgeConnection {
  const c1 = { x: fromCard.x + fromCard.width / 2, y: fromCard.y + fromCard.height / 2 };
  const c2 = { x: toCard.x + toCard.width / 2, y: toCard.y + toCard.height / 2 };

  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;

  let fromSide: 'top' | 'bottom' | 'left' | 'right';
  let toSide: 'top' | 'bottom' | 'left' | 'right';
  let p1: Point;
  let p2: Point;

  if (Math.abs(dx) * (fromCard.height / fromCard.width) > Math.abs(dy)) {
    // Horizontal dominant
    if (dx > 0) {
      fromSide = 'right';
      toSide = 'left';
      p1 = { x: fromCard.x + fromCard.width, y: c1.y };
      p2 = { x: toCard.x, y: c2.y };
    } else {
      fromSide = 'left';
      toSide = 'right';
      p1 = { x: fromCard.x, y: c1.y };
      p2 = { x: toCard.x + toCard.width, y: c2.y };
    }
  } else {
    // Vertical dominant
    if (dy > 0) {
      fromSide = 'bottom';
      toSide = 'top';
      p1 = { x: c1.x, y: fromCard.y + fromCard.height };
      p2 = { x: c2.x, y: toCard.y };
    } else {
      fromSide = 'top';
      toSide = 'bottom';
      p1 = { x: c1.x, y: fromCard.y };
      p2 = { x: c2.x, y: toCard.y + toCard.height };
    }
  }

  return { p1, p2, fromSide, toSide };
}

function calculateSmoothBezier(conn: EdgeConnection): string {
  const { p1, p2, fromSide, toSide } = conn;
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dist = Math.hypot(dx, dy);
  const curvature = Math.min(Math.max(30, dist * 0.4), 160);

  let c1x = p1.x;
  let c1y = p1.y;
  if (fromSide === 'right') c1x += curvature;
  else if (fromSide === 'left') c1x -= curvature;
  else if (fromSide === 'bottom') c1y += curvature;
  else if (fromSide === 'top') c1y -= curvature;

  let c2x = p2.x;
  let c2y = p2.y;
  if (toSide === 'right') c2x += curvature;
  else if (toSide === 'left') c2x -= curvature;
  else if (toSide === 'bottom') c2y += curvature;
  else if (toSide === 'top') c2y -= curvature;

  return `M ${p1.x} ${p1.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
}

// 0ms Lag Canvas Card Item
interface CanvasCardItemProps {
  card: CanvasCard;
  isSelected: boolean;
  isLinkingSource: boolean;
  isLinkingActive: boolean;
  onDragMouseDown: (e: React.MouseEvent, card: CanvasCard) => void;
  onResizeMouseDown: (e: React.MouseEvent, card: CanvasCard) => void;
  onCardClick: (cardId: string) => void;
  onStartLinking: (e: React.MouseEvent, cardId: string) => void;
  onOpenVaultNote?: (noteId: string) => void;
  onChangeColor: (id: string, color: string) => void;
  onDuplicate: (card: CanvasCard) => void;
  onUpdateTitle: (id: string, title: string) => void;
  onUpdateContent: (id: string, content: string) => void;
  onDelete: (id: string) => void;
}

const CanvasCardItem = memo<CanvasCardItemProps>(({
  card,
  isSelected,
  isLinkingSource,
  isLinkingActive,
  onDragMouseDown,
  onResizeMouseDown,
  onCardClick,
  onStartLinking,
  onOpenVaultNote,
  onChangeColor,
  onDuplicate,
  onUpdateTitle,
  onUpdateContent,
  onDelete,
}) => {
  const isSticky = card.type === 'sticky';
  const isVaultNote = Boolean(card.noteId);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  return (
    <div
      id={`canvas-card-${card.id}`}
      onClick={(e) => {
        e.stopPropagation();
        onCardClick(card.id);
      }}
      className={`canvas-card group absolute pointer-events-auto rounded-2xl flex flex-col justify-between select-none ${
        isSticky
          ? 'shadow-2xl'
          : 'bg-[#12131a]/95 border border-white/[0.12] shadow-2xl backdrop-blur-xl'
      } ${
        isLinkingSource
          ? 'ring-4 ring-[#8b5cf6] shadow-2xl shadow-purple-500/50 scale-[1.01]'
          : isLinkingActive
          ? 'hover:ring-2 hover:ring-[#10b981] cursor-pointer ring-1 ring-white/10'
          : isSelected
          ? 'ring-2 ring-[#8b5cf6] shadow-purple-500/30'
          : 'hover:border-white/20'
      }`}
      style={{
        transform: `translate3d(${card.x}px, ${card.y}px, 0)`,
        width: `${card.width}px`,
        height: `${card.height}px`,
        backgroundColor: isSticky ? `${card.color}20` : undefined,
        border: isSticky ? `1.5px solid ${card.color}80` : undefined,
        willChange: 'transform',
      }}
      onMouseDown={(e) => onDragMouseDown(e, card)}
    >
      {/* Top Floating Mini-Action Bar on Selection */}
      {isSelected && (
        <div
          className="absolute -top-11 left-1/2 -translate-x-1/2 z-40 px-2 py-1 rounded-xl bg-[#171822] border border-white/[0.16] shadow-2xl flex items-center gap-1 animate-fade-in text-xs whitespace-nowrap"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Quick Link Button */}
          <button
            onClick={(e) => onStartLinking(e, card.id)}
            className={`px-2 py-1 rounded-lg flex items-center gap-1 text-[11px] font-bold transition-colors ${
              isLinkingSource
                ? 'bg-[#8b5cf6] text-white'
                : 'text-[#8b5cf6] hover:bg-[#8b5cf6]/20'
            }`}
            title="Соединить с другой карточкой"
          >
            <Link2 size={12} />
            <span>{isLinkingSource ? 'Цель...' : 'Связать'}</span>
          </button>

          <span className="w-[1px] h-3.5 bg-white/10" />

          {/* Color Palette Picker */}
          <div className="relative">
            <button
              onClick={() => setIsColorPickerOpen((v) => !v)}
              className="p-1.5 rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/[0.08]"
              title="Изменить цвет"
            >
              <Palette size={13} />
            </button>

            {isColorPickerOpen && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-1.5 rounded-xl bg-[#1a1c26] border border-white/[0.15] shadow-2xl flex gap-1 z-50 animate-fade-in">
                {COLOR_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => {
                      onChangeColor(card.id, p.color);
                      setIsColorPickerOpen(false);
                    }}
                    className="w-5 h-5 rounded-full hover:scale-125 transition-transform border border-white/20"
                    style={{ backgroundColor: p.color }}
                    title={p.name}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Duplicate Card */}
          <button
            onClick={() => onDuplicate(card)}
            className="p-1.5 rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/[0.08]"
            title="Дублировать карточку"
          >
            <Copy size={13} />
          </button>

          {/* Open Vault Note in Editor */}
          {isVaultNote && onOpenVaultNote && (
            <button
              onClick={() => onOpenVaultNote(card.noteId!)}
              className="p-1.5 rounded-lg text-[#06b6d4] hover:bg-[#06b6d4]/20"
              title="Открыть заметку в редакторе"
            >
              <ExternalLink size={13} />
            </button>
          )}

          <span className="w-[1px] h-3.5 bg-white/10" />

          {/* Delete Card */}
          <button
            onClick={() => onDelete(card.id)}
            className="p-1.5 rounded-lg text-[#f43f5e] hover:bg-red-500/20"
            title="Удалить карточку"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}

      {/* Card Header (Drag Area) */}
      <div className="p-2.5 pb-1.5 flex items-center justify-between border-b border-white/[0.06] cursor-grab active:cursor-grabbing gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {isSticky ? (
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: card.color }} />
          ) : isVaultNote ? (
            <BookOpen size={14} className="text-[#06b6d4] shrink-0" />
          ) : (
            <FileText size={14} className="text-[#8b5cf6] shrink-0" />
          )}
          <input
            type="text"
            defaultValue={card.title || ''}
            onBlur={(e) => onUpdateTitle(card.id, e.target.value)}
            className="bg-transparent font-bold text-xs text-white focus:outline-none truncate min-w-0 flex-1"
            placeholder="Заголовок..."
          />
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          {/* Direct Link Button in Header */}
          <button
            onClick={(e) => onStartLinking(e, card.id)}
            className={`p-1 rounded ${
              isLinkingSource
                ? 'bg-[#8b5cf6] text-white shadow-sm'
                : 'text-[#8b5cf6] hover:bg-[#8b5cf6]/20'
            }`}
            title="Соединить с другой карточкой"
          >
            <Link2 size={13} className={isLinkingSource ? 'animate-pulse' : ''} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(card.id);
            }}
            className="p-1 rounded text-[#94a3b8] hover:text-[#f43f5e] hover:bg-white/[0.08]"
            title="Удалить карточку"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-2.5 flex-1 flex flex-col overflow-hidden">
        <textarea
          defaultValue={card.content || ''}
          onBlur={(e) => onUpdateContent(card.id, e.target.value)}
          placeholder="Запишите мысль или идею..."
          className="w-full h-full bg-transparent text-xs text-[#e2e8f0] resize-none focus:outline-none leading-relaxed font-sans scrollbar-thin scrollbar-thumb-white/10"
        />
      </div>

      {/* Bottom Resize Handle */}
      <div
        onMouseDown={(e) => onResizeMouseDown(e, card)}
        className="absolute bottom-1 right-1 w-4 h-4 cursor-nwse-resize opacity-0 group-hover:opacity-60 hover:!opacity-100 flex items-center justify-center text-[#94a3b8]"
        title="Потяните для изменения размера"
      >
        <svg width="6" height="6" viewBox="0 0 6 6" fill="currentColor">
          <circle cx="5" cy="5" r="1" />
          <circle cx="5" cy="2" r="1" />
          <circle cx="2" cy="5" r="1" />
        </svg>
      </div>
    </div>
  );
});

export const ObsidianCanvasView: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);

  const {
    neurons,
    canvasCards,
    canvasConnections,
    themePreset,
    themeMode,
    addCanvasCard,
    addCanvasSticker,
    updateCanvasCard,
    deleteCanvasCard,
    addCanvasConnection,
    deleteCanvasConnection,
    clearCanvas,
    openNote,
  } = useBrainStore();

  const isSystemDark =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;

  const isLight =
    themeMode === 'light' ||
    (themeMode === 'system' && !isSystemDark) ||
    themePreset.startsWith('light_');

  // Local Viewport Transform (Smooth GPU composited)
  const transformRef = useRef<{ x: number; y: number; k: number }>({ x: 100, y: 80, k: 1.0 });

  // Selected & Drag Tracking (Zero React lag)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isDragOverCanvas, setIsDragOverCanvas] = useState(false);

  // Live Card Positions Map for real-time SVG line rubberband updates
  const liveCardPositions = useRef<Map<string, { x: number; y: number; width: number; height: number }>>(new Map());

  // Keep live positions in sync with Zustand canvasCards
  useEffect(() => {
    canvasCards.forEach((c) => {
      liveCardPositions.current.set(c.id, { x: c.x, y: c.y, width: c.width, height: c.height });
    });
  }, [canvasCards]);

  const activePanRef = useRef<{
    startX: number;
    startY: number;
    initialTrX: number;
    initialTrY: number;
  } | null>(null);

  const activeDragRef = useRef<{
    cardId: string;
    startX: number;
    startY: number;
    cardInitialX: number;
    cardInitialY: number;
    cardEl: HTMLElement | null;
    width: number;
    height: number;
  } | null>(null);

  const activeResizeRef = useRef<{
    cardId: string;
    startX: number;
    startY: number;
    initialWidth: number;
    initialHeight: number;
    cardEl: HTMLElement | null;
  } | null>(null);

  // 1-Click Connect State
  const [linkingSourceId, setLinkingSourceId] = useState<string | null>(null);

  // Modals & Drawers
  const [isStickerPickerOpen, setIsStickerPickerOpen] = useState(false);
  const [isVaultNotePickerOpen, setIsVaultNotePickerOpen] = useState(false);
  const [vaultNoteSearch, setVaultNoteSearch] = useState('');
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage((c) => (c === msg ? null : c)), 3000);
  }, []);

  // Update Surface Transform via direct GPU transform (0ms lag)
  const updateSurfaceTransform = useCallback(() => {
    if (surfaceRef.current) {
      const tr = transformRef.current;
      surfaceRef.current.style.transform = `translate3d(${tr.x}px, ${tr.y}px, 0) scale(${tr.k})`;
    }
  }, []);

  useEffect(() => {
    updateSurfaceTransform();
  }, [updateSurfaceTransform]);

  // Cancel Linking on Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (linkingSourceId) {
          setLinkingSourceId(null);
          showToast('Режим связи отменен');
        }
        if (isVaultNotePickerOpen) setIsVaultNotePickerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [linkingSourceId, isVaultNotePickerOpen, showToast]);

  // Update Real-Time SVG Line Paths during card dragging
  const updateSvgLinesRealtime = useCallback(() => {
    canvasConnections.forEach((conn) => {
      const fromPos = liveCardPositions.current.get(conn.fromNode);
      const toPos = liveCardPositions.current.get(conn.toNode);
      if (!fromPos || !toPos) return;

      const edge = getExactCardEdgeConnection(
        { ...fromPos, id: conn.fromNode, type: 'note', content: '', color: '' },
        { ...toPos, id: conn.toNode, type: 'note', content: '', color: '' }
      );
      const pathData = calculateSmoothBezier(edge);

      const pathEl = document.getElementById(`conn-path-${conn.id}`);
      const clickPathEl = document.getElementById(`conn-click-${conn.id}`);
      const deleteGroupEl = document.getElementById(`conn-del-${conn.id}`);

      if (pathEl) pathEl.setAttribute('d', pathData);
      if (clickPathEl) clickPathEl.setAttribute('d', pathData);
      if (deleteGroupEl) {
        deleteGroupEl.setAttribute('transform', `translate(${(edge.p1.x + edge.p2.x) / 2}, ${(edge.p1.y + edge.p2.y) / 2})`);
      }
    });
  }, [canvasConnections]);

  // Global High-Performance Drag & Pan Listeners (Runs on GPU, commits on mouseup)
  useEffect(() => {
    let rafId: number | null = null;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      // 1. Canvas Panning (144 FPS Smooth GPU Pan)
      if (activePanRef.current) {
        const dx = e.clientX - activePanRef.current.startX;
        const dy = e.clientY - activePanRef.current.startY;
        transformRef.current.x = activePanRef.current.initialTrX + dx;
        transformRef.current.y = activePanRef.current.initialTrY + dy;

        if (!rafId) {
          rafId = requestAnimationFrame(() => {
            rafId = null;
            updateSurfaceTransform();
          });
        }
        return;
      }

      // 2. Card Dragging (Direct DOM transform + Real-Time Connected Lines)
      if (activeDragRef.current) {
        const tr = transformRef.current;
        const dx = (e.clientX - activeDragRef.current.startX) / tr.k;
        const dy = (e.clientY - activeDragRef.current.startY) / tr.k;
        const newX = Math.round(activeDragRef.current.cardInitialX + dx);
        const newY = Math.round(activeDragRef.current.cardInitialY + dy);

        if (activeDragRef.current.cardEl) {
          activeDragRef.current.cardEl.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
        }

        liveCardPositions.current.set(activeDragRef.current.cardId, {
          x: newX,
          y: newY,
          width: activeDragRef.current.width,
          height: activeDragRef.current.height,
        });

        if (!rafId) {
          rafId = requestAnimationFrame(() => {
            rafId = null;
            updateSvgLinesRealtime();
          });
        }
        return;
      }

      // 3. Card Resizing
      if (activeResizeRef.current) {
        const tr = transformRef.current;
        const dx = (e.clientX - activeResizeRef.current.startX) / tr.k;
        const dy = (e.clientY - activeResizeRef.current.startY) / tr.k;
        const newWidth = Math.max(180, Math.round(activeResizeRef.current.initialWidth + dx));
        const newHeight = Math.max(120, Math.round(activeResizeRef.current.initialHeight + dy));

        if (activeResizeRef.current.cardEl) {
          activeResizeRef.current.cardEl.style.width = `${newWidth}px`;
          activeResizeRef.current.cardEl.style.height = `${newHeight}px`;
        }

        const existing = liveCardPositions.current.get(activeResizeRef.current.cardId);
        if (existing) {
          liveCardPositions.current.set(activeResizeRef.current.cardId, {
            ...existing,
            width: newWidth,
            height: newHeight,
          });
        }

        if (!rafId) {
          rafId = requestAnimationFrame(() => {
            rafId = null;
            updateSvgLinesRealtime();
          });
        }
      }
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      // Commit Pan
      if (activePanRef.current) {
        activePanRef.current = null;
      }

      // Commit Drag to Zustand store ONCE on release (0ms latency during drag!)
      if (activeDragRef.current) {
        const tr = transformRef.current;
        const dx = (e.clientX - activeDragRef.current.startX) / tr.k;
        const dy = (e.clientY - activeDragRef.current.startY) / tr.k;
        const newX = Math.round(activeDragRef.current.cardInitialX + dx);
        const newY = Math.round(activeDragRef.current.cardInitialY + dy);

        updateCanvasCard(activeDragRef.current.cardId, { x: newX, y: newY });
        activeDragRef.current = null;
      }

      // Commit Resize to Zustand store ONCE on release
      if (activeResizeRef.current) {
        const tr = transformRef.current;
        const dx = (e.clientX - activeResizeRef.current.startX) / tr.k;
        const dy = (e.clientY - activeResizeRef.current.startY) / tr.k;
        const newWidth = Math.max(180, Math.round(activeResizeRef.current.initialWidth + dx));
        const newHeight = Math.max(120, Math.round(activeResizeRef.current.initialHeight + dy));

        updateCanvasCard(activeResizeRef.current.cardId, { width: newWidth, height: newHeight });
        activeResizeRef.current = null;
      }
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0]!;
        handleGlobalMouseMove({ clientX: touch.clientX, clientY: touch.clientY } as any);
      }
    };

    const handleGlobalTouchEnd = () => {
      handleGlobalMouseUp({} as any);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    window.addEventListener('touchend', handleGlobalTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchend', handleGlobalTouchEnd);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [updateCanvasCard, updateSurfaceTransform, updateSvgLinesRealtime]);

  // Start Canvas Pan
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (
      (e.target as HTMLElement).closest('.canvas-card') ||
      (e.target as HTMLElement).closest('.canvas-toolbar') ||
      (e.target as HTMLElement).closest('.canvas-modal')
    ) {
      return;
    }

    if (linkingSourceId) {
      setLinkingSourceId(null);
    }

    if (e.button === 0 || e.button === 1) {
      activePanRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initialTrX: transformRef.current.x,
        initialTrY: transformRef.current.y,
      };
      setSelectedCardId(null);
    }
  };

  const handleCanvasTouchStart = (e: React.TouchEvent) => {
    if (
      (e.target as HTMLElement).closest('.canvas-card') ||
      (e.target as HTMLElement).closest('.canvas-toolbar') ||
      (e.target as HTMLElement).closest('.canvas-modal')
    ) {
      return;
    }
    if (linkingSourceId) setLinkingSourceId(null);
    if (e.touches.length === 1) {
      const touch = e.touches[0]!;
      activePanRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        initialTrX: transformRef.current.x,
        initialTrY: transformRef.current.y,
      };
      setSelectedCardId(null);
    }
  };

  // Start Card Drag (Smooth 0ms delay)
  const handleCardDragMouseDown = useCallback((e: React.MouseEvent, card: CanvasCard) => {
    if ((e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).tagName === 'INPUT') {
      return;
    }
    e.stopPropagation();
    setSelectedCardId(card.id);

    const cardEl = document.getElementById(`canvas-card-${card.id}`);

    activeDragRef.current = {
      cardId: card.id,
      startX: e.clientX,
      startY: e.clientY,
      cardInitialX: card.x,
      cardInitialY: card.y,
      cardEl,
      width: card.width,
      height: card.height,
    };
  }, []);

  const handleCardDragTouchStart = useCallback((e: React.TouchEvent, card: CanvasCard) => {
    if ((e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).tagName === 'INPUT') {
      return;
    }
    e.stopPropagation();
    setSelectedCardId(card.id);
    if (e.touches.length === 1) {
      const touch = e.touches[0]!;
      const cardEl = document.getElementById(`canvas-card-${card.id}`);
      activeDragRef.current = {
        cardId: card.id,
        startX: touch.clientX,
        startY: touch.clientY,
        cardInitialX: card.x,
        cardInitialY: card.y,
        cardEl,
        width: card.width,
        height: card.height,
      };
    }
  }, []);

  // Start Card Resize
  const handleResizeMouseDown = useCallback((e: React.MouseEvent, card: CanvasCard) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedCardId(card.id);

    const cardEl = document.getElementById(`canvas-card-${card.id}`);

    activeResizeRef.current = {
      cardId: card.id,
      startX: e.clientX,
      startY: e.clientY,
      initialWidth: card.width,
      initialHeight: card.height,
      cardEl,
    };
  }, []);

  // Card Click (Direct 2-click connecting)
  const handleCardClick = useCallback(
    (cardId: string) => {
      if (!linkingSourceId) {
        setSelectedCardId(cardId);
        return;
      }

      if (linkingSourceId !== cardId) {
        const fromCard = canvasCards.find((c) => c.id === linkingSourceId);
        const toCard = canvasCards.find((c) => c.id === cardId);

        if (fromCard && toCard) {
          addCanvasConnection({
            fromNode: fromCard.id,
            toNode: toCard.id,
            color: '#8b5cf6',
          });
          showToast(`✨ Соединено: «${fromCard.title}» ➔ «${toCard.title}»`);
        }
      }

      setLinkingSourceId(null);
    },
    [linkingSourceId, canvasCards, addCanvasConnection, showToast]
  );

  const handleStartLinking = useCallback(
    (e: React.MouseEvent, cardId: string) => {
      e.stopPropagation();
      if (linkingSourceId === cardId) {
        setLinkingSourceId(null);
      } else {
        setLinkingSourceId(cardId);
        const c = canvasCards.find((x) => x.id === cardId);
        showToast(`Выбрана: «${c?.title || 'Карточка'}». Кликните по второй карточке...`);
      }
    },
    [linkingSourceId, canvasCards, showToast]
  );

  // Duplicate Card
  const handleDuplicateCard = useCallback(
    (card: CanvasCard) => {
      const newCard = addCanvasCard({
        ...card,
        x: card.x + 30,
        y: card.y + 30,
        title: `${card.title || 'Карточка'} (Копия)`,
      });
      setSelectedCardId(newCard.id);
      showToast(`Карточка дублирована`);
    },
    [addCanvasCard, showToast]
  );

  // Change Card Color
  const handleChangeCardColor = useCallback(
    (cardId: string, color: string) => {
      updateCanvasCard(cardId, { color });
    },
    [updateCanvasCard]
  );

  // Double Click Canvas to add quick sticky
  const handleDoubleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.canvas-card') || (e.target as HTMLElement).closest('.canvas-toolbar')) {
      return;
    }
    const tr = transformRef.current;
    const spawnX = Math.round((e.clientX - tr.x) / tr.k - 110);
    const spawnY = Math.round((e.clientY - tr.y) / tr.k - 80);
    const card = addCanvasSticker('Новая мысль...', '#f59e0b', spawnX, spawnY);
    setSelectedCardId(card.id);
  };

  // Drag & Drop Note from Sidebar onto Canvas
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!isDragOverCanvas) setIsDragOverCanvas(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragOverCanvas(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverCanvas(false);

    let noteId = e.dataTransfer.getData('text/plain');
    try {
      const jsonStr = e.dataTransfer.getData('application/json');
      if (jsonStr) {
        const parsed = JSON.parse(jsonStr);
        if (parsed.noteId) noteId = parsed.noteId;
      }
    } catch {}

    if (!noteId) return;

    const note = neurons.find((n) => n.id === noteId);
    if (!note) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const tr = transformRef.current;

    const dropX = Math.round((mouseX - tr.x) / tr.k - 145);
    const dropY = Math.round((mouseY - tr.y) / tr.k - 90);

    const newCard = addCanvasCard({
      x: dropX,
      y: dropY,
      width: 290,
      height: 180,
      type: 'note',
      title: note.title,
      content: note.content ? note.content.slice(0, 220) : 'Заметка из базы...',
      noteId: note.id,
      color: '#8b5cf6',
    });

    setSelectedCardId(newCard.id);
    showToast(`✨ Заметка «${note.title}» размещена на холсте`);
  };

  // Zoom with Smooth Mouse Centering
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    const delta = e.deltaY < 0 ? zoomFactor : 1 / zoomFactor;
    const tr = transformRef.current;
    const newK = Math.max(0.15, Math.min(3.5, tr.k * delta));

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    transformRef.current = {
      k: newK,
      x: mouseX - (mouseX - tr.x) * (newK / tr.k),
      y: mouseY - (mouseY - tr.y) * (newK / tr.k),
    };
    updateSurfaceTransform();
  };

  const handleZoomButtons = (factor: number) => {
    const tr = transformRef.current;
    const newK = Math.max(0.15, Math.min(3.5, tr.k * factor));
    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;

    transformRef.current = {
      k: newK,
      x: width / 2 - (width / 2 - tr.x) * (newK / tr.k),
      y: height / 2 - (height / 2 - tr.y) * (newK / tr.k),
    };
    updateSurfaceTransform();
  };

  const handleCreateStickerWithColor = (color: string) => {
    const tr = transformRef.current;
    const centerX = (-tr.x + (containerRef.current?.clientWidth || 800) / 2) / tr.k - 110;
    const centerY = (-tr.y + (containerRef.current?.clientHeight || 600) / 2) / tr.k - 90;
    const stk = addCanvasSticker('Идея на стикере...', color, centerX, centerY);
    setSelectedCardId(stk.id);
    setIsStickerPickerOpen(false);
  };

  const handleCreateCard = (type: 'note' | 'text', color: string = '#8b5cf6') => {
    const tr = transformRef.current;
    const centerX = (-tr.x + (containerRef.current?.clientWidth || 800) / 2) / tr.k - 140;
    const centerY = (-tr.y + (containerRef.current?.clientHeight || 600) / 2) / tr.k - 90;

    const newCard = addCanvasCard({
      x: centerX + (Math.random() * 40 - 20),
      y: centerY + (Math.random() * 40 - 20),
      width: 290,
      height: 180,
      type,
      title: type === 'note' ? 'Карточка заметки' : 'Текстовый блок',
      content: 'Содержимое карточки...',
      color,
    });
    setSelectedCardId(newCard.id);
  };

  // Embed Existing Vault Note
  const handleEmbedVaultNote = (neuron: any) => {
    const tr = transformRef.current;
    const centerX = (-tr.x + (containerRef.current?.clientWidth || 800) / 2) / tr.k - 140;
    const centerY = (-tr.y + (containerRef.current?.clientHeight || 600) / 2) / tr.k - 90;

    const newCard = addCanvasCard({
      x: centerX,
      y: centerY,
      width: 300,
      height: 190,
      type: 'note',
      title: neuron.title,
      content: neuron.content ? neuron.content.slice(0, 200) : 'Заметка из базы...',
      noteId: neuron.id,
      color: '#06b6d4',
    });
    setSelectedCardId(newCard.id);
    setIsVaultNotePickerOpen(false);
    showToast(`Заметка «${neuron.title}» добавлена на холст`);
  };

  // Center Canvas on all cards
  const handleCenterAllCards = () => {
    if (canvasCards.length === 0) {
      transformRef.current = { x: 100, y: 80, k: 1.0 };
      updateSurfaceTransform();
      return;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    canvasCards.forEach((c) => {
      minX = Math.min(minX, c.x);
      minY = Math.min(minY, c.y);
      maxX = Math.max(maxX, c.x + c.width);
      maxY = Math.max(maxY, c.y + c.height);
    });

    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;
    const boundsWidth = maxX - minX || 400;
    const boundsHeight = maxY - minY || 300;

    const scale = Math.min(1.5, Math.max(0.4, Math.min(width / (boundsWidth + 160), height / (boundsHeight + 160))));
    const centerX = width / 2 - (minX + boundsWidth / 2) * scale;
    const centerY = height / 2 - (minY + boundsHeight / 2) * scale;

    transformRef.current = { x: centerX, y: centerY, k: scale };
    updateSurfaceTransform();
    showToast('Холст отцентрирован по карточкам');
  };

  // Dynamically compute exact boundary connections for each line
  const renderedConnections = useMemo(() => {
    return canvasConnections
      .map((conn) => {
        const fromCard = canvasCards.find((c) => c.id === conn.fromNode);
        const toCard = canvasCards.find((c) => c.id === conn.toNode);
        if (!fromCard || !toCard) return null;

        const edge = getExactCardEdgeConnection(fromCard, toCard);
        const pathData = calculateSmoothBezier(edge);

        return {
          id: conn.id,
          color: conn.color || '#8b5cf6',
          pathData,
          midX: (edge.p1.x + edge.p2.x) / 2,
          midY: (edge.p1.y + edge.p2.y) / 2,
        };
      })
      .filter(Boolean);
  }, [canvasConnections, canvasCards]);

  const sourceCardTitle = useMemo(() => {
    if (!linkingSourceId) return null;
    return canvasCards.find((c) => c.id === linkingSourceId)?.title || 'Карточка';
  }, [linkingSourceId, canvasCards]);

  // Auto-center all cards on initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      handleCenterAllCards();
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleCanvasMouseDown}
      onTouchStart={handleCanvasTouchStart}
      onDoubleClick={handleDoubleClick}
      onWheel={handleWheel}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative w-full h-full ${isLight ? 'bg-[#f8fafc]' : 'bg-[#0b0c10]'} overflow-hidden select-none cursor-grab active:cursor-grabbing transition-colors ${
        isDragOverCanvas ? 'ring-4 ring-inset ring-[#8b5cf6]/60 bg-[#0e0f18]' : ''
      }`}
      style={{
        backgroundImage: `radial-gradient(circle, ${isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.06)'} 1.2px, transparent 1.2px)`,
        backgroundSize: `28px 28px`,
      }}
    >
      {/* Visual Drag-Over Drop Target Hint */}
      {isDragOverCanvas && (
        <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center bg-[#8b5cf6]/10 backdrop-blur-[2px] animate-fade-in">
          <div className="px-6 py-3 rounded-2xl bg-[#171822] border border-[#8b5cf6] text-white shadow-2xl flex items-center gap-2.5 text-sm font-bold animate-bounce">
            <Sparkles size={18} className="text-[#8b5cf6]" />
            <span>Отпустите заметку для размещения на холсте</span>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-2xl bg-[#171822]/95 backdrop-blur-xl border border-white/[0.12] text-white shadow-2xl text-xs font-semibold flex items-center gap-2 animate-fade-in pointer-events-none">
          <Sparkles size={14} className="text-[#8b5cf6]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Active Linking Banner */}
      {linkingSourceId && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-5 py-2 rounded-2xl bg-[#8b5cf6] text-white shadow-2xl text-xs font-semibold flex items-center gap-3 animate-fade-in border border-white/20">
          <Link2 size={15} className="animate-pulse" />
          <span>Выбрана «{sourceCardTitle}». Кликните по второй карточке для связи</span>
          <button
            onClick={() => {
              setLinkingSourceId(null);
              showToast('Режим связи отменен');
            }}
            className="px-2 py-0.5 rounded-lg bg-black/20 hover:bg-black/40 text-xs font-bold transition-all ml-2"
          >
            Отмена (Esc)
          </button>
        </div>
      )}

      {/* Top Floating Whiteboard Toolbar (Mobile-Responsive Dock) */}
      <div className="canvas-toolbar absolute top-2.5 inset-x-2.5 z-20 flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#14151c]/95 backdrop-blur-xl border border-white/[0.08] shadow-2xl overflow-x-auto no-scrollbar">
        {/* Sticky Note Button */}
        <div className="relative shrink-0">
          <button
            onClick={() => setIsStickerPickerOpen((v) => !v)}
            className="px-2.5 py-1.5 rounded-xl bg-[#f59e0b]/20 text-[#f59e0b] hover:bg-[#f59e0b]/30 text-xs font-semibold flex items-center gap-1.5 border border-[#f59e0b]/30 shadow-md active:scale-95 transition-all"
          >
            <IconStickyNote size={14} color="#f59e0b" />
            <span>+ Стикер</span>
          </button>

          {isStickerPickerOpen && (
            <div className="absolute top-10 left-0 p-2 rounded-2xl bg-[#171822] border border-white/[0.12] shadow-2xl z-50 flex gap-1.5 animate-fade-in">
              {COLOR_PRESETS.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleCreateStickerWithColor(item.color)}
                  className="w-6 h-6 rounded-full hover:scale-125 transition-transform border border-white/20 shadow-sm"
                  style={{ backgroundColor: item.color }}
                  title={item.name}
                />
              ))}
            </div>
          )}
        </div>

        {/* Card Button */}
        <button
          onClick={() => handleCreateCard('note')}
          className="px-2.5 py-1.5 rounded-xl bg-[#8b5cf6]/20 text-[#8b5cf6] hover:bg-[#8b5cf6]/30 text-xs font-semibold flex items-center gap-1 border border-[#8b5cf6]/30 shadow-md shrink-0 active:scale-95 transition-all"
        >
          <Plus size={14} />
          <span>+ Карточка</span>
        </button>

        {/* Embed Vault Note Button */}
        <button
          onClick={() => setIsVaultNotePickerOpen(true)}
          className="px-2.5 py-1.5 rounded-xl bg-[#06b6d4]/20 text-[#06b6d4] hover:bg-[#06b6d4]/30 text-xs font-semibold flex items-center gap-1 border border-[#06b6d4]/30 shadow-md shrink-0 active:scale-95 transition-all"
          title="Вставить существующую заметку из базы знаний"
        >
          <BookOpen size={14} />
          <span>+ Из базы</span>
        </button>

        {/* Dedicated "Связать" Mode Button */}
        <button
          onClick={() => {
            if (canvasCards.length < 2) {
              showToast('Создайте минимум 2 карточки для связи');
              return;
            }
            if (linkingSourceId) {
              setLinkingSourceId(null);
            } else {
              setLinkingSourceId(canvasCards[0]!.id);
              showToast('Кликните по первой карточке, затем по второй');
            }
          }}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 border shadow-lg shrink-0 active:scale-95 transition-all ${
            linkingSourceId
              ? 'bg-[#8b5cf6] text-white border-white/30 ring-2 ring-[#8b5cf6]/50'
              : 'bg-[#14151c]/95 text-[#e2e8f0] hover:text-white hover:bg-[#8b5cf6]/20 border-white/[0.08]'
          }`}
          title="Нажмите сюда ➔ кликните по двум карточкам для соединения"
        >
          <Link2 size={14} className={linkingSourceId ? 'text-white animate-pulse' : 'text-[#8b5cf6]'} />
          <span>Связать</span>
        </button>

        {/* Center Cards Button */}
        <button
          onClick={handleCenterAllCards}
          className="p-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-[#cbd5e1] border border-white/[0.08] text-xs font-medium flex items-center justify-center shrink-0 active:scale-95 transition-all"
          title="Отцентрировать холст по карточкам"
        >
          <Compass size={15} />
        </button>

        {/* Clear Canvas */}
        <button
          onClick={() => setIsClearConfirmOpen(true)}
          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-[#f43f5e]/15 text-[#f43f5e] hover:bg-[#f43f5e]/25 text-xs font-medium flex items-center gap-1 border border-[#f43f5e]/20 shrink-0 active:scale-95 transition-all"
          title="Очистить весь холст разом"
        >
          <IconClearCanvas size={14} color="#f43f5e" />
          <span className="hidden sm:inline">Очистить</span>
        </button>

        <span className="w-[1px] h-4 bg-white/10 mx-1" />

        {/* Zoom Controls */}
        <button
          onClick={() => handleZoomButtons(1.15)}
          className="p-1.5 rounded-xl text-[#94a3b8] hover:text-white hover:bg-white/[0.08]"
          title="Приблизить (+)"
        >
          <ZoomIn size={14} />
        </button>

        <button
          onClick={() => handleZoomButtons(0.85)}
          className="p-1.5 rounded-xl text-[#94a3b8] hover:text-white hover:bg-white/[0.08]"
          title="Отдалить (-)"
        >
          <ZoomOut size={14} />
        </button>

        <button
          onClick={handleCenterAllCards}
          className="p-1.5 rounded-xl text-[#94a3b8] hover:text-white hover:bg-white/[0.08]"
          title="Отцентрировать по всем карточкам"
        >
          <Compass size={14} />
        </button>

        <button
          onClick={() => setIsGuideOpen((v) => !v)}
          className="p-1.5 rounded-xl text-[#8b5cf6] hover:bg-[#8b5cf6]/20"
          title="Инструкция по холсту"
        >
          <Info size={14} />
        </button>
      </div>

      {/* Vault Note Embed Modal */}
      {isVaultNotePickerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setIsVaultNotePickerOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#171822] border border-white/[0.14] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3.5 border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2 text-white text-xs font-bold">
                <BookOpen size={15} className="text-[#06b6d4]" />
                <span>Добавить заметку из базы на холст:</span>
              </div>
              <button onClick={() => setIsVaultNotePickerOpen(false)} className="text-[#94a3b8] hover:text-white">
                <X size={14} />
              </button>
            </div>

            <div className="p-3 border-b border-white/[0.06]">
              <div className="relative flex items-center">
                <Search size={14} className="absolute left-3 text-[#06b6d4] pointer-events-none" />
                <input
                  type="text"
                  autoFocus
                  value={vaultNoteSearch}
                  onChange={(e) => setVaultNoteSearch(e.target.value)}
                  placeholder="Поиск по заметкам..."
                  className="w-full bg-[#101118] text-white pl-9 pr-3 py-2 rounded-xl text-xs border border-white/[0.10] focus:outline-none focus:border-[#06b6d4]"
                />
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto p-2 space-y-1">
              {neurons
                .filter((n) => {
                  const q = vaultNoteSearch.toLowerCase().trim();
                  if (!q) return true;
                  return n.title.toLowerCase().includes(q) || n.filePath.toLowerCase().includes(q);
                })
                .slice(0, 12)
                .map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleEmbedVaultNote(n)}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-white/[0.08] flex items-center justify-between text-xs group"
                  >
                    <div className="truncate">
                      <div className="text-white font-medium truncate">{n.title}</div>
                      <div className="text-[10px] text-[#64748b] truncate">{n.filePath}</div>
                    </div>
                    <Plus size={14} className="text-[#64748b] group-hover:text-[#06b6d4] shrink-0" />
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Guide Banner */}
      {isGuideOpen && (
        <div className="absolute top-14 left-4 z-40 max-w-sm p-4 bg-[#14151c]/95 backdrop-blur-xl border border-white/[0.12] rounded-2xl shadow-2xl text-xs space-y-2.5 animate-fade-in text-[#e2e8f0]">
          <div className="flex items-center justify-between pb-1 border-b border-white/[0.08]">
            <span className="font-bold text-[#8b5cf6]">Как пользоваться Холстом:</span>
            <button onClick={() => setIsGuideOpen(false)} className="text-[#94a3b8] hover:text-white">
              <X size={13} />
            </button>
          </div>
          <ul className="space-y-1.5 text-[11px] text-[#cbd5e1] list-disc list-inside leading-relaxed">
            <li><b>Перетаскивание из бокового меню</b>: просто перетащите любую заметку из левого списка прямо на холст!</li>
            <li><b>Связи в 2 клика</b>: нажмите кнопку <b>«Связать»</b> на карточке A ➔ кликните по карточке B.</li>
            <li><b>Масштабирование карточек</b>: тяните за правый нижний угол карточки.</li>
            <li><b>Удаление связи</b>: наведите на стрелку и нажмите на красный крестик <b>[✕]</b>.</li>
          </ul>
        </div>
      )}

      {/* Confirmation Modal for Clearing Canvas */}
      {isClearConfirmOpen && (
        <div className="canvas-modal fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#171822] rounded-2xl border border-white/[0.12] p-5 shadow-2xl space-y-4 animate-fade-in">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 text-[#f43f5e]">
              <IconClearCanvas size={18} color="#f43f5e" />
              <span>Очистить весь холст?</span>
            </h3>
            <p className="text-xs text-[#94a3b8]">
              Вы действительно хотите удалить все карточки, стикеры и связи на этом холсте?
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsClearConfirmOpen(false)}
                className="flex-1 py-2 rounded-xl bg-white/[0.06] text-xs font-medium text-white hover:bg-white/[0.12]"
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  clearCanvas();
                  setIsClearConfirmOpen(false);
                }}
                className="flex-1 py-2 rounded-xl bg-[#f43f5e] text-xs font-semibold text-white hover:bg-[#f43f5e]/90"
              >
                Очистить всё
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hardware Accelerated Canvas Viewport Surface */}
      <div
        ref={surfaceRef}
        className="absolute inset-0 origin-top-left pointer-events-none"
        style={{
          transform: `translate3d(100px, 80px, 0) scale(1.0)`,
          willChange: 'transform',
        }}
      >
        {/* Render SVG Connection Lines with Dynamic Edge Anchoring */}
        <svg className="absolute inset-0 w-[10000px] h-[10000px] pointer-events-none overflow-visible">
          <defs>
            <marker
              id="canvas-arrow-clean"
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
            >
              <polygon points="0 1, 8 4, 0 7" fill="#8b5cf6" />
            </marker>
          </defs>

          {renderedConnections.map((conn) => {
            if (!conn) return null;

            return (
              <g key={conn.id} className="pointer-events-auto group cursor-pointer">
                {/* Thick invisible click path */}
                <path
                  id={`conn-click-${conn.id}`}
                  d={conn.pathData}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="16"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteCanvasConnection(conn.id);
                  }}
                />
                {/* Visible smooth bezier line */}
                <path
                  id={`conn-path-${conn.id}`}
                  d={conn.pathData}
                  fill="none"
                  stroke={conn.color}
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  markerEnd="url(#canvas-arrow-clean)"
                  className="opacity-90 group-hover:opacity-100 group-hover:stroke-width-3 group-hover:stroke-[#a78bfa]"
                />
                {/* Delete button dot in center */}
                <g
                  id={`conn-del-${conn.id}`}
                  className="opacity-0 group-hover:opacity-100 cursor-pointer"
                  transform={`translate(${conn.midX}, ${conn.midY})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteCanvasConnection(conn.id);
                  }}
                >
                  <circle
                    cx="0"
                    cy="0"
                    r="9"
                    fill="#171822"
                    stroke="#f43f5e"
                    strokeWidth="1.5"
                  />
                  <line
                    x1="-3"
                    y1="-3"
                    x2="3"
                    y2="3"
                    stroke="#f43f5e"
                    strokeWidth="1.5"
                  />
                  <line
                    x1="3"
                    y1="-3"
                    x2="-3"
                    y2="3"
                    stroke="#f43f5e"
                    strokeWidth="1.5"
                  />
                </g>
              </g>
            );
          })}
        </svg>

        {/* Render Cards & Sticky Notes */}
        {canvasCards.map((card) => {
          const isSelected = card.id === selectedCardId;
          const isLinkingSource = linkingSourceId === card.id;

          return (
            <CanvasCardItem
              key={card.id}
              card={card}
              isSelected={isSelected}
              isLinkingSource={isLinkingSource}
              isLinkingActive={Boolean(linkingSourceId)}
              onDragMouseDown={handleCardDragMouseDown}
              onResizeMouseDown={handleResizeMouseDown}
              onCardClick={handleCardClick}
              onStartLinking={handleStartLinking}
              onOpenVaultNote={(noteId) => openNote(noteId)}
              onChangeColor={handleChangeCardColor}
              onDuplicate={handleDuplicateCard}
              onUpdateTitle={(id, title) => updateCanvasCard(id, { title })}
              onUpdateContent={(id, content) => updateCanvasCard(id, { content })}
              onDelete={(id) => deleteCanvasCard(id)}
            />
          );
        })}
      </div>
    </div>
  );
};
