import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Search,
  BookOpen,
  X,
  LayoutGrid,
  Move,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  Check,
  Link2,
  GitBranch,
  Workflow,
  Layers,
  Edit3,
  FileText,
  ArrowRight,
  HelpCircle,
  Lightbulb,
  Zap,
} from 'lucide-react';
import { useBrainStore, CanvasCard, CanvasConnection } from '../../store/useBrainStore';

const COLOR_OPTIONS = [
  { name: 'Фиолетовый', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.16)', border: 'rgba(139, 92, 246, 0.40)' },
  { name: 'Циан', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.16)', border: 'rgba(6, 182, 212, 0.40)' },
  { name: 'Изумрудный', color: '#10b981', bg: 'rgba(16, 185, 129, 0.16)', border: 'rgba(16, 185, 129, 0.40)' },
  { name: 'Янтарный', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.16)', border: 'rgba(245, 158, 11, 0.40)' },
  { name: 'Розовый', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.16)', border: 'rgba(244, 63, 94, 0.40)' },
  { name: 'Серый', color: '#64748b', bg: 'rgba(100, 116, 139, 0.16)', border: 'rgba(100, 116, 139, 0.40)' },
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

function getExactCardEdgeConnection(fromCard: CanvasCard, toCard: CanvasCard): EdgeConnection {
  const fromW = fromCard.width || 220;
  const fromH = fromCard.height || 140;
  const toW = toCard.width || 220;
  const toH = toCard.height || 140;

  const c1 = { x: fromCard.x + fromW / 2, y: fromCard.y + fromH / 2 };
  const c2 = { x: toCard.x + toW / 2, y: toCard.y + toH / 2 };

  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;

  let fromSide: 'top' | 'bottom' | 'left' | 'right';
  let toSide: 'top' | 'bottom' | 'left' | 'right';
  let p1: Point;
  let p2: Point;

  if (Math.abs(dx) * (fromH / fromW) > Math.abs(dy)) {
    if (dx > 0) {
      fromSide = 'right';
      toSide = 'left';
      p1 = { x: fromCard.x + fromW, y: c1.y };
      p2 = { x: toCard.x, y: c2.y };
    } else {
      fromSide = 'left';
      toSide = 'right';
      p1 = { x: fromCard.x, y: c1.y };
      p2 = { x: toCard.x + toW, y: c2.y };
    }
  } else {
    if (dy > 0) {
      fromSide = 'bottom';
      toSide = 'top';
      p1 = { x: c1.x, y: fromCard.y + fromH };
      p2 = { x: c2.x, y: toCard.y };
    } else {
      fromSide = 'top';
      toSide = 'bottom';
      p1 = { x: c1.x, y: fromCard.y };
      p2 = { x: c2.x, y: toCard.y + toH };
    }
  }

  return { p1, p2, fromSide, toSide };
}

function calculateSmoothBezier(conn: EdgeConnection): string {
  const { p1, p2, fromSide, toSide } = conn;
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dist = Math.hypot(dx, dy);
  const curvature = Math.min(Math.max(25, dist * 0.35), 140);

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

export const MobileCanvasView: React.FC = () => {
  const {
    canvasCards,
    canvasConnections,
    addCanvasCard,
    updateCanvasCard,
    deleteCanvasCard,
    addCanvasConnection,
    deleteCanvasConnection,
    addNeuron,
    openNote,
  } = useBrainStore();

  const [viewMode, setViewMode] = useState<'board' | 'grid'>('board');
  const [newCardText, setNewCardText] = useState('');
  const [newCardTitle, setNewCardTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState('#8b5cf6');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeColorFilter, setActiveColorFilter] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // Card linking state
  const [linkingSourceCardId, setLinkingSourceCardId] = useState<string | null>(null);

  // Selected Study / Note Modal State
  const [selectedStudyCard, setSelectedStudyCard] = useState<CanvasCard | null>(null);

  const boardTransformRef = useRef({ x: 20, y: 20, scale: 1 });
  const [boardTransform, setBoardTransform] = useState({ x: 20, y: 20, scale: 1 });
  boardTransformRef.current = boardTransform;

  const linkingSourceCardIdRef = useRef<string | null>(null);
  linkingSourceCardIdRef.current = linkingSourceCardId;

  const boardRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage((c) => (c === msg ? null : c)), 2500);
  }, []);

  // Center a new card right in the current visible viewport center
  const handleAddCardAtCenter = useCallback(
    (title?: string, content?: string, color?: string) => {
      const cardTitle = (title ?? newCardTitle).trim() || 'Мысль';
      const cardContent = (content ?? newCardText).trim();
      const cardColor = color || selectedColor;

      const currentTr = boardTransformRef.current;
      const viewW = window.innerWidth;
      const viewH = window.innerHeight;

      const centerX = Math.round((-currentTr.x + viewW / 2 - 110) / currentTr.scale);
      const centerY = Math.round((-currentTr.y + viewH / 2 - 70) / currentTr.scale);

      addCanvasCard({
        x: centerX + (Math.random() * 40 - 20),
        y: centerY + (Math.random() * 40 - 20),
        width: 220,
        height: 140,
        type: 'sticky',
        title: cardTitle,
        content: cardContent,
        color: cardColor,
      });

      setNewCardText('');
      setNewCardTitle('');
      setIsAddModalOpen(false);
      showToast('Стикер добавлен на холст');
    },
    [newCardTitle, newCardText, selectedColor, addCanvasCard, showToast]
  );

  // Listen to mobile-canvas-add-card dispatched from TopBar "+"
  useEffect(() => {
    const handleTopBarAdd = () => {
      setIsAddModalOpen(true);
    };
    window.addEventListener('mobile-canvas-add-card', handleTopBarAdd);
    return () => window.removeEventListener('mobile-canvas-add-card', handleTopBarAdd);
  }, []);

  // Handle Card Linking initiation and completion
  const handleStartLink = useCallback(
    (cardId: string) => {
      setLinkingSourceCardId(cardId);
      showToast('🎯 Источник выбран. Теперь нажмите на цель для создания стрелки');
    },
    [showToast]
  );

  const handleCompleteLink = useCallback(
    (targetCardId: string, customLabel?: string) => {
      const sourceId = linkingSourceCardIdRef.current;
      if (!sourceId || sourceId === targetCardId) {
        setLinkingSourceCardId(null);
        return;
      }

      const sourceCard = canvasCards.find((c) => c.id === sourceId);
      addCanvasConnection({
        fromNode: sourceId,
        toNode: targetCardId,
        color: sourceCard?.color || '#8b5cf6',
        label: customLabel || undefined,
      });

      showToast('Стрелка создана!');
      setLinkingSourceCardId(null);
    },
    [canvasCards, addCanvasConnection, showToast]
  );

  // Apply Educational Study Mindmap & Flowchart Templates
  const handleApplyTemplate = useCallback(
    (templateType: 'mindmap' | 'flashcard' | 'decision' | 'terms') => {
      const currentTr = boardTransformRef.current;
      const viewW = window.innerWidth;
      const viewH = window.innerHeight;
      const originX = Math.round((-currentTr.x + viewW / 2 - 110) / currentTr.scale);
      const originY = Math.round((-currentTr.y + viewH / 2 - 70) / currentTr.scale);

      if (templateType === 'mindmap') {
        const center = addCanvasCard({
          x: originX,
          y: originY,
          width: 210,
          height: 120,
          type: 'sticky',
          title: '💡 Главная тема',
          content: 'Основной тезис или изучаемый предмет',
          color: '#8b5cf6',
        });
        const c1 = addCanvasCard({
          x: originX + 260,
          y: originY - 110,
          width: 190,
          height: 100,
          type: 'sticky',
          title: '1. Теория и правила',
          content: 'Ключевые законы и формулировки',
          color: '#06b6d4',
        });
        const c2 = addCanvasCard({
          x: originX + 260,
          y: originY + 20,
          width: 190,
          height: 100,
          type: 'sticky',
          title: '2. Практика и примеры',
          content: 'Где и как это применяется на деле',
          color: '#10b981',
        });
        const c3 = addCanvasCard({
          x: originX + 260,
          y: originY + 140,
          width: 190,
          height: 100,
          type: 'sticky',
          title: '3. Итоги и выводы',
          content: 'Главные инсайты темы',
          color: '#f59e0b',
        });

        setTimeout(() => {
          addCanvasConnection({ fromNode: center.id, toNode: c1.id, color: '#06b6d4', label: 'Теория' });
          addCanvasConnection({ fromNode: center.id, toNode: c2.id, color: '#10b981', label: 'Практика' });
          addCanvasConnection({ fromNode: center.id, toNode: c3.id, color: '#f59e0b', label: 'Вывод' });
        }, 50);

        showToast('Создан учебный конспект');
      } else if (templateType === 'flashcard') {
        const q = addCanvasCard({
          x: originX - 120,
          y: originY,
          width: 200,
          height: 120,
          type: 'sticky',
          title: '❓ Вопрос по теме',
          content: 'Сформулируйте вопрос для самопроверки...',
          color: '#f59e0b',
        });
        const a = addCanvasCard({
          x: originX + 160,
          y: originY,
          width: 200,
          height: 120,
          type: 'sticky',
          title: '💡 Точный ответ',
          content: 'Развернутый правильный ответ и доказательство',
          color: '#10b981',
        });

        setTimeout(() => {
          addCanvasConnection({ fromNode: q.id, toNode: a.id, color: '#10b981', label: 'Ответ' });
        }, 50);

        showToast('Создана пара Вопрос-Ответ');
      } else if (templateType === 'decision') {
        const problem = addCanvasCard({
          x: originX - 180,
          y: originY,
          width: 180,
          height: 110,
          type: 'sticky',
          title: '🎯 Задача / Выбор',
          content: 'Какое решение принять?',
          color: '#8b5cf6',
        });
        const plus = addCanvasCard({
          x: originX + 70,
          y: originY - 70,
          width: 170,
          height: 100,
          type: 'sticky',
          title: '✅ Плюсы (ЗА)',
          content: '1. Быстро\n2. Надежно',
          color: '#10b981',
        });
        const minus = addCanvasCard({
          x: originX + 70,
          y: originY + 70,
          width: 170,
          height: 100,
          type: 'sticky',
          title: '❌ Минусы (ПРОТИВ)',
          content: '1. Требует усилий',
          color: '#f43f5e',
        });

        setTimeout(() => {
          addCanvasConnection({ fromNode: problem.id, toNode: plus.id, color: '#10b981', label: 'Аргументы ЗА' });
          addCanvasConnection({ fromNode: problem.id, toNode: minus.id, color: '#f43f5e', label: 'Риски' });
        }, 50);

        showToast('Создан анализ решений');
      } else if (templateType === 'terms') {
        const term = addCanvasCard({
          x: originX - 160,
          y: originY,
          width: 180,
          height: 110,
          type: 'sticky',
          title: '📖 Понятие / Термин',
          content: 'Название термина',
          color: '#06b6d4',
        });
        const def = addCanvasCard({
          x: originX + 80,
          y: originY,
          width: 200,
          height: 120,
          type: 'sticky',
          title: '🔍 Определение',
          content: 'Простыми словами, что это означает и как работает',
          color: '#8b5cf6',
        });

        setTimeout(() => {
          addCanvasConnection({ fromNode: term.id, toNode: def.id, color: '#8b5cf6', label: 'Значение' });
        }, 50);

        showToast('Создана карточка термина');
      }

      setIsTemplateModalOpen(false);
    },
    [addCanvasCard, addCanvasConnection, showToast]
  );

  // Native High-Performance Touch Listeners for Freeform Board
  useEffect(() => {
    const board = boardRef.current;
    if (!board || viewMode !== 'board') return;

    let isPinching = false;
    let initialDist = 0;
    let initialScale = 1;
    let initialMidX = 0;
    let initialMidY = 0;
    let initialTrX = 0;
    let initialTrY = 0;

    let isDraggingCard = false;
    let draggingCardId: string | null = null;
    let dragCardDomElem: HTMLElement | null = null;
    let cardStartX = 0;
    let cardStartY = 0;
    let lastDraggedPos: { x: number; y: number } | null = null;

    let touchStartX = 0;
    let touchStartY = 0;
    let hasMovedFar = false;

    let isPanningBoard = false;
    let panStartX = 0;
    let panStartY = 0;

    // DO NOT call e.preventDefault() on touchstart!
    // That allows native buttons, clicks, inputs to function normally on Android WebView.
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const t1 = e.touches[0]!;
        const t2 = e.touches[1]!;
        isPinching = true;
        isPanningBoard = false;
        isDraggingCard = false;
        draggingCardId = null;
        dragCardDomElem = null;

        initialDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY) || 1;
        initialScale = boardTransformRef.current.scale;
        initialMidX = (t1.clientX + t2.clientX) / 2;
        initialMidY = (t1.clientY + t2.clientY) / 2;
        initialTrX = boardTransformRef.current.x;
        initialTrY = boardTransformRef.current.y;
        return;
      }

      if (e.touches.length === 1) {
        const t = e.touches[0]!;
        isPinching = false;
        hasMovedFar = false;
        touchStartX = t.clientX;
        touchStartY = t.clientY;

        const target = e.target as HTMLElement;

        // If touching a button or interactive child, let native click event handle it
        if (target.closest('button') || target.closest('input') || target.closest('textarea') || target.closest('select')) {
          return;
        }

        const cardElem = target.closest('[data-card-id]') as HTMLElement | null;

        if (cardElem) {
          const id = cardElem.getAttribute('data-card-id');
          if (id) {
            const currentCards = useBrainStore.getState().canvasCards;
            const card = currentCards.find((c) => c.id === id);
            if (card) {
              isDraggingCard = true;
              draggingCardId = id;
              dragCardDomElem = cardElem;
              cardStartX = card.x;
              cardStartY = card.y;
              return;
            }
          }
        }

        // Background pan
        isPanningBoard = true;
        panStartX = t.clientX - boardTransformRef.current.x;
        panStartY = t.clientY - boardTransformRef.current.y;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && isPinching) {
        if (e.cancelable) e.preventDefault();
        const t1 = e.touches[0]!;
        const t2 = e.touches[1]!;
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const midX = (t1.clientX + t2.clientX) / 2;
        const midY = (t1.clientY + t2.clientY) / 2;

        const ratio = dist / initialDist;
        const newScale = Math.max(0.25, Math.min(3.5, initialScale * ratio));

        const dx = midX - initialMidX;
        const dy = midY - initialMidY;

        const newX = midX - (midX - initialTrX) * (newScale / initialScale) + dx;
        const newY = midY - (midY - initialTrY) * (newScale / initialScale) + dy;

        boardTransformRef.current = { scale: newScale, x: newX, y: newY };
        if (surfaceRef.current) {
          surfaceRef.current.style.transform = `translate3d(${newX}px, ${newY}px, 0) scale(${newScale})`;
        }
        return;
      }

      if (e.touches.length === 1 && !isPinching) {
        const t = e.touches[0]!;
        const dx = t.clientX - touchStartX;
        const dy = t.clientY - touchStartY;
        const dist = Math.hypot(dx, dy);

        if (dist > 6) {
          hasMovedFar = true;
          if (e.cancelable) e.preventDefault();
        }

        if (isDraggingCard && draggingCardId && dragCardDomElem && hasMovedFar) {
          const currentScale = boardTransformRef.current.scale;
          const newX = Math.round(cardStartX + dx / currentScale);
          const newY = Math.round(cardStartY + dy / currentScale);
          lastDraggedPos = { x: newX, y: newY };

          // Direct DOM transform for 120 FPS buttery smooth movement without React re-rendering
          dragCardDomElem.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
          return;
        }

        if (isPanningBoard && hasMovedFar) {
          const newX = t.clientX - panStartX;
          const newY = t.clientY - panStartY;
          boardTransformRef.current.x = newX;
          boardTransformRef.current.y = newY;
          if (surfaceRef.current) {
            surfaceRef.current.style.transform = `translate3d(${newX}px, ${newY}px, 0) scale(${boardTransformRef.current.scale})`;
          }
        }
      }
    };

    const onTouchEnd = () => {
      if (isPinching) {
        isPinching = false;
        setBoardTransform({ ...boardTransformRef.current });
        return;
      }

      if (isDraggingCard && draggingCardId) {
        if (hasMovedFar && lastDraggedPos) {
          // Finished dragging: save position to Zustand store
          updateCanvasCard(draggingCardId, { x: lastDraggedPos.x, y: lastDraggedPos.y });
        } else {
          // User tapped on card without dragging:
          if (linkingSourceCardIdRef.current) {
            // In linking mode: connect source card to this tapped card!
            handleCompleteLink(draggingCardId);
          } else {
            // Open card study reader/editor note modal
            const tappedCard = useBrainStore.getState().canvasCards.find((c) => c.id === draggingCardId);
            if (tappedCard) {
              setSelectedStudyCard(tappedCard);
            }
          }
        }
      }

      if (isPanningBoard && hasMovedFar) {
        setBoardTransform({ ...boardTransformRef.current });
      }

      isDraggingCard = false;
      draggingCardId = null;
      dragCardDomElem = null;
      isPanningBoard = false;
      lastDraggedPos = null;
    };

    board.addEventListener('touchstart', onTouchStart, { passive: true });
    board.addEventListener('touchmove', onTouchMove, { passive: false });
    board.addEventListener('touchend', onTouchEnd, { passive: true });
    board.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      board.removeEventListener('touchstart', onTouchStart);
      board.removeEventListener('touchmove', onTouchMove);
      board.removeEventListener('touchend', onTouchEnd);
      board.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [viewMode, updateCanvasCard, handleCompleteLink]);

  // Convert Sticky to Real Markdown Note in the Notebook
  const handleConvertToNote = (card: CanvasCard) => {
    const mdContent = `# ${card.title || 'Мысль с холста'}\n\n${card.content || ''}\n\n> [!note] Карточка импортирована из интерактивного холста\n`;
    const note = addNeuron(card.title || 'Мысль с холста', mdContent);
    openNote(note.id);
    showToast(`Создана заметка: «${card.title || 'Мысль'}»`);
  };

  // Filtered Cards
  const filteredCards = useMemo(() => {
    return canvasCards.filter((card) => {
      if (activeColorFilter && card.color !== activeColorFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = (card.title || '').toLowerCase().includes(q);
        const inContent = (card.content || '').toLowerCase().includes(q);
        return inTitle || inContent;
      }
      return true;
    });
  }, [canvasCards, activeColorFilter, searchQuery]);

  // Cards lookup map for SVG Arrows
  const cardsMap = useMemo(() => {
    const map = new Map<string, CanvasCard>();
    canvasCards.forEach((c) => map.set(c.id, c));
    return map;
  }, [canvasCards]);

  // SVG Curved Connections calculation
  const renderedConnections = useMemo(() => {
    return canvasConnections
      .map((conn) => {
        const from = cardsMap.get(conn.fromNode);
        const to = cardsMap.get(conn.toNode);
        if (!from || !to) return null;

        const edge = getExactCardEdgeConnection(from, to);
        const pathData = calculateSmoothBezier(edge);
        const midX = Math.round((edge.p1.x + edge.p2.x) / 2);
        const midY = Math.round((edge.p1.y + edge.p2.y) / 2);

        return {
          id: conn.id,
          color: conn.color || '#8b5cf6',
          label: conn.label,
          pathData,
          midX,
          midY,
          fromNode: conn.fromNode,
          toNode: conn.toNode,
        };
      })
      .filter(Boolean) as {
      id: string;
      color: string;
      label?: string;
      pathData: string;
      midX: number;
      midY: number;
      fromNode: string;
      toNode: string;
    }[];
  }, [canvasConnections, cardsMap]);

  return (
    <div className="w-full h-full bg-[#0c0d12] flex flex-col overflow-hidden select-none text-[#e2e8f0]">
      {/* ═══ Top Control Bar ═══ */}
      <div className="p-3 bg-[#111218] border-b border-white/[0.08] flex items-center justify-between gap-2 shrink-0 z-20">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500/25 to-cyan-500/25 text-purple-400 border border-purple-500/35 flex items-center justify-center shrink-0">
            <Workflow size={16} />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs font-bold text-white tracking-wide truncate">
              Холст мыслей и заметок
            </h2>
            <p className="text-[10px] text-[#94a3b8] truncate">
              {canvasCards.length} стикеров · {canvasConnections.length} стрелок
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Templates */}
          <button
            onClick={() => setIsTemplateModalOpen(true)}
            className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all"
            title="Учебные схемы и шаблоны"
          >
            <Sparkles size={13} />
            <span className="hidden sm:inline">Схемы</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center p-0.5 bg-[#161722] border border-white/[0.08] rounded-xl text-xs">
            <button
              onClick={() => setViewMode('board')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'board'
                  ? 'bg-[#8b5cf6] text-white shadow-sm'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
              title="Холст со стрелками"
            >
              <Move size={14} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-[#8b5cf6] text-white shadow-sm'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
              title="Сетка заметок"
            >
              <LayoutGrid size={14} />
            </button>
          </div>

          {/* Quick Add Sticky */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="p-1.5 rounded-xl bg-[#8b5cf6] hover:bg-[#7c5cff] text-white font-bold transition-all shadow-md active:scale-95"
            title="Добавить карточку"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* ═══ Main View Body ═══ */}
      <div className="flex-1 relative overflow-hidden">
        {viewMode === 'grid' ? (
          /* ═══ Grid View: Linear Cards Layout ═══ */
          <div className="w-full h-full overflow-y-auto p-4 pb-20">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredCards.map((card) => {
                const colorOpt =
                  COLOR_OPTIONS.find((c) => c.color === card.color) || COLOR_OPTIONS[0]!;
                return (
                  <div
                    key={card.id}
                    onClick={() => setSelectedStudyCard(card)}
                    className="p-3.5 rounded-2xl border bg-[#14151e] hover:border-white/30 transition-all cursor-pointer shadow-lg flex flex-col justify-between gap-2"
                    style={{ borderColor: colorOpt.border }}
                  >
                    <div className="flex items-center justify-between border-b border-white/[0.08] pb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: card.color }} />
                        <span className="font-bold text-xs text-white truncate">{card.title || 'Мысль'}</span>
                      </div>
                      <span className="text-[10px] text-[#94a3b8] flex items-center gap-1">
                        <BookOpen size={11} />
                        <span>Открыть</span>
                      </span>
                    </div>
                    <p className="text-xs text-[#cbd5e1] line-clamp-4 leading-relaxed">
                      {card.content || 'Пустой стикер...'}
                    </p>
                    <div className="pt-1 flex items-center justify-between text-[10px] text-[#94a3b8]">
                      <span>{card.type === 'note' ? 'Заметка' : 'Стикер'}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConvertToNote(card);
                        }}
                        className="text-[#38bdf8] hover:underline"
                      >
                        В блокнот ➔
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ═══ Freeform Board View: Touch Pan, Zoom & SVG Arrows ═══ */
          <div
            ref={boardRef}
            className="w-full h-full relative overflow-hidden select-none"
            style={{
              touchAction: 'none',
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          >
            {/* Active Linking Mode Notification Banner */}
            {linkingSourceCardId && (
              <div className="absolute top-2 inset-x-3 z-30 bg-[#171822]/95 border border-[#8b5cf6] rounded-2xl p-2.5 shadow-2xl flex items-center justify-between backdrop-blur-xl animate-fade-in">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-[#8b5cf6]/25 text-[#8b5cf6] flex items-center justify-center shrink-0 animate-pulse">
                    <Link2 size={14} />
                  </div>
                  <p className="text-xs text-white truncate font-medium">
                    Связывание: нажмите на карточку-цель для стрелки
                  </p>
                </div>
                <button
                  onClick={() => setLinkingSourceCardId(null)}
                  className="px-2.5 py-1 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-xs font-semibold text-[#94a3b8] active:scale-95 shrink-0"
                >
                  Отмена
                </button>
              </div>
            )}

            {/* Zoom & Reset Controls Overlay */}
            <div className="absolute right-3 bottom-20 z-30 flex flex-col items-center gap-1.5 bg-[#14151e]/90 backdrop-blur-xl border border-white/[0.08] p-1.5 rounded-2xl shadow-2xl">
              <button
                onClick={() =>
                  setBoardTransform((prev) => ({
                    ...prev,
                    scale: Math.min(3.0, prev.scale * 1.25),
                  }))
                }
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#94a3b8] active:text-white active:bg-white/[0.08]"
                title="Приблизить"
              >
                <ZoomIn size={17} />
              </button>
              <button
                onClick={() =>
                  setBoardTransform((prev) => ({
                    ...prev,
                    scale: Math.max(0.3, prev.scale / 1.25),
                  }))
                }
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#94a3b8] active:text-white active:bg-white/[0.08]"
                title="Отдалить"
              >
                <ZoomOut size={17} />
              </button>
              <button
                onClick={() => setBoardTransform({ x: 20, y: 20, scale: 1 })}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#38bdf8] active:bg-white/[0.08]"
                title="Сброс масштаба"
              >
                <Maximize2 size={15} />
              </button>
            </div>

            {/* Quick Add Floating Button on Canvas */}
            <div className="absolute left-4 bottom-20 z-30 flex items-center gap-2">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-[#8b5cf6] to-[#06b6d4] text-white font-bold text-xs shadow-xl shadow-cyan-500/20 flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <Plus size={16} />
                <span>Стикер</span>
              </button>
              <button
                onClick={() => setIsTemplateModalOpen(true)}
                className="p-2.5 rounded-2xl bg-[#14151e]/90 border border-white/[0.10] text-purple-400 text-xs font-bold shadow-xl active:scale-95 transition-all"
                title="Схемы и интеллект-карты"
              >
                <Sparkles size={16} />
              </button>
            </div>

            {/* Transform Surface */}
            <div
              ref={surfaceRef}
              className="absolute inset-0 origin-top-left pointer-events-none"
              style={{
                transform: `translate3d(${boardTransform.x}px, ${boardTransform.y}px, 0) scale(${boardTransform.scale})`,
                willChange: 'transform',
              }}
            >
              {/* SVG Curved Bezier Arrows Overlay */}
              <svg
                className="absolute overflow-visible pointer-events-none"
                style={{ left: 0, top: 0, width: 1, height: 1 }}
              >
                <defs>
                  <marker
                    id="arrow-default"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#8b5cf6" />
                  </marker>
                  {COLOR_OPTIONS.map((c) => (
                    <marker
                      key={c.color}
                      id={`arrow-${c.color.replace('#', '')}`}
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill={c.color} />
                    </marker>
                  ))}
                </defs>

                {renderedConnections.map((conn) => {
                  const markerId = `arrow-${(conn.color || '#8b5cf6').replace('#', '')}`;
                  return (
                    <g key={conn.id} className="pointer-events-auto cursor-pointer">
                      {/* Invisible wider hit path for touch deletion */}
                      <path
                        d={conn.pathData}
                        fill="none"
                        stroke="transparent"
                        strokeWidth={24}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCanvasConnection(conn.id);
                          showToast('Связь удалена');
                        }}
                      />
                      {/* Glow path */}
                      <path
                        d={conn.pathData}
                        fill="none"
                        stroke={conn.color}
                        strokeWidth={4}
                        strokeOpacity={0.25}
                      />
                      {/* Visible curved line */}
                      <path
                        d={conn.pathData}
                        fill="none"
                        stroke={conn.color}
                        strokeWidth={2.2}
                        markerEnd={`url(#${markerId})`}
                      />
                      {/* Semantic Label Badge */}
                      {conn.label && (
                        <g transform={`translate(${conn.midX}, ${conn.midY})`}>
                          <rect
                            x={-40}
                            y={-12}
                            width={80}
                            height={18}
                            rx={9}
                            fill="#14151f"
                            stroke={conn.color}
                            strokeWidth={1}
                            className="drop-shadow"
                          />
                          <text
                            x={0}
                            y={1}
                            fill="#e2e8f0"
                            fontSize={9}
                            fontWeight="bold"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="select-none"
                          >
                            {conn.label}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Canvas Cards on Board */}
              {filteredCards.map((card) => {
                const colorOpt =
                  COLOR_OPTIONS.find((c) => c.color === card.color) || COLOR_OPTIONS[0]!;
                const isLinking = card.id === linkingSourceCardId;

                return (
                  <div
                    key={card.id}
                    data-card-id={card.id}
                    className={`absolute p-3 rounded-2xl border shadow-2xl backdrop-blur-xl flex flex-col justify-between pointer-events-auto transition-shadow select-none ${
                      isLinking
                        ? 'ring-4 ring-[#8b5cf6] shadow-purple-500/50 animate-pulse'
                        : 'active:shadow-purple-500/20'
                    }`}
                    style={{
                      transform: `translate3d(${card.x}px, ${card.y}px, 0)`,
                      width: `${card.width || 220}px`,
                      minHeight: '130px',
                      backgroundColor: colorOpt.bg,
                      borderColor: isLinking ? '#8b5cf6' : colorOpt.border,
                      touchAction: 'none',
                    }}
                  >
                    {/* Header: Title, Link & Delete Buttons */}
                    <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.08] cursor-grab active:cursor-grabbing gap-1">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: card.color }}
                        />
                        <span className="font-bold text-xs text-white truncate">
                          {card.title || 'Мысль'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* 🔗 Link Card button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (linkingSourceCardId === card.id) {
                              setLinkingSourceCardId(null);
                            } else {
                              handleStartLink(card.id);
                            }
                          }}
                          className={`p-1 rounded-lg active:scale-90 transition-all ${
                            isLinking
                              ? 'bg-purple-500 text-white shadow'
                              : 'text-[#94a3b8] hover:text-white hover:bg-white/[0.08]'
                          }`}
                          title="Соединить стрелкой с другой карточкой"
                        >
                          <Link2 size={13} />
                        </button>

                        {/* Open Note Reader */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStudyCard(card);
                          }}
                          className="p-1 rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/[0.08] active:scale-90 transition-all"
                          title="Развернуть карточку-заметку"
                        >
                          <BookOpen size={13} />
                        </button>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCanvasCard(card.id);
                            showToast('Стикер удален');
                          }}
                          className="p-1 rounded-lg text-[#94a3b8] hover:text-[#f43f5e] active:scale-95 transition-all"
                          title="Удалить"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Content Preview */}
                    <p className="text-xs text-[#e2e8f0] my-2 whitespace-pre-wrap leading-relaxed line-clamp-4">
                      {card.content || 'Пустой стикер...'}
                    </p>

                    {/* Footer */}
                    <div className="pt-1.5 border-t border-white/[0.06] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConvertToNote(card);
                        }}
                        className="text-[10px] text-[#38bdf8] font-semibold flex items-center gap-1 hover:underline active:scale-95"
                      >
                        <FileText size={11} />
                        <span>В блокнот</span>
                      </button>

                      <div className="flex items-center gap-1">
                        {COLOR_OPTIONS.slice(0, 4).map((co) => (
                          <button
                            key={co.color}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateCanvasCard(card.id, { color: co.color });
                            }}
                            className={`w-2.5 h-2.5 rounded-full transition-transform ${
                              card.color === co.color ? 'scale-125 ring-1 ring-white' : 'opacity-60'
                            }`}
                            style={{ backgroundColor: co.color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ═══ Modal: Rich Card Study & Note Editor ═══ */}
      {selectedStudyCard && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedStudyCard(null)}
        >
          <div
            className="w-full max-w-lg bg-[#14151e] border border-white/[0.14] rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                <span
                  className="w-3.5 h-3.5 rounded-full shrink-0 shadow-md"
                  style={{ backgroundColor: selectedStudyCard.color }}
                />
                <input
                  type="text"
                  value={selectedStudyCard.title || ''}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    setSelectedStudyCard((prev) => (prev ? { ...prev, title: newTitle } : null));
                    updateCanvasCard(selectedStudyCard.id, { title: newTitle });
                  }}
                  placeholder="Заголовок карточки..."
                  className="bg-transparent font-bold text-sm text-white focus:outline-none focus:border-b border-purple-500 w-full"
                />
              </div>
              <button
                onClick={() => setSelectedStudyCard(null)}
                className="text-[#94a3b8] hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Note Markdown Format Tools */}
            <div className="flex items-center gap-1.5 p-1 bg-[#101117] rounded-xl border border-white/[0.06] overflow-x-auto no-scrollbar text-xs">
              <button
                onClick={() => {
                  const newC = `${selectedStudyCard.content || ''}\n## `;
                  setSelectedStudyCard((prev) => (prev ? { ...prev, content: newC } : null));
                  updateCanvasCard(selectedStudyCard.id, { content: newC });
                }}
                className="px-2 py-1 rounded bg-white/[0.05] hover:bg-white/[0.10] text-[#cbd5e1] font-bold"
              >
                H2
              </button>
              <button
                onClick={() => {
                  const newC = `${selectedStudyCard.content || ''}\n- `;
                  setSelectedStudyCard((prev) => (prev ? { ...prev, content: newC } : null));
                  updateCanvasCard(selectedStudyCard.id, { content: newC });
                }}
                className="px-2 py-1 rounded bg-white/[0.05] hover:bg-white/[0.10] text-[#cbd5e1]"
              >
                • Список
              </button>
              <button
                onClick={() => {
                  const newC = `${selectedStudyCard.content || ''}\n> [!tip] `;
                  setSelectedStudyCard((prev) => (prev ? { ...prev, content: newC } : null));
                  updateCanvasCard(selectedStudyCard.id, { content: newC });
                }}
                className="px-2 py-1 rounded bg-white/[0.05] hover:bg-white/[0.10] text-[#38bdf8] font-medium"
              >
                💡 Совет
              </button>
              <button
                onClick={() => {
                  const newC = `${selectedStudyCard.content || ''}\n**Важно:** `;
                  setSelectedStudyCard((prev) => (prev ? { ...prev, content: newC } : null));
                  updateCanvasCard(selectedStudyCard.id, { content: newC });
                }}
                className="px-2 py-1 rounded bg-white/[0.05] hover:bg-white/[0.10] text-[#f59e0b] font-bold"
              >
                ★ Важно
              </button>
            </div>

            {/* Main Note Textarea */}
            <div>
              <textarea
                value={selectedStudyCard.content || ''}
                onChange={(e) => {
                  const newContent = e.target.value;
                  setSelectedStudyCard((prev) => (prev ? { ...prev, content: newContent } : null));
                  updateCanvasCard(selectedStudyCard.id, { content: newContent });
                }}
                rows={7}
                placeholder="Запишите мысли, факты, конспект или выводы..."
                className="w-full bg-[#101117] border border-white/[0.08] rounded-2xl p-3 text-white text-xs leading-relaxed resize-none focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>

            {/* Color Palette Chips */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#94a3b8] uppercase font-bold">Цвет темы:</span>
              <div className="flex items-center gap-1.5">
                {COLOR_OPTIONS.map((co) => (
                  <button
                    key={co.color}
                    onClick={() => {
                      setSelectedStudyCard((prev) => (prev ? { ...prev, color: co.color } : null));
                      updateCanvasCard(selectedStudyCard.id, { color: co.color });
                    }}
                    className={`w-6 h-6 rounded-full transition-transform flex items-center justify-center ${
                      selectedStudyCard.color === co.color ? 'scale-110 ring-2 ring-white shadow-md' : 'opacity-60'
                    }`}
                    style={{ backgroundColor: co.color }}
                  >
                    {selectedStudyCard.color === co.color && <Check size={12} className="text-white" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Connected Concepts Section */}
            <div className="p-3 bg-[#101117] rounded-2xl border border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-purple-400 flex items-center gap-1">
                  <Workflow size={12} />
                  <span>Связи карточки</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    handleStartLink(selectedStudyCard.id);
                    setSelectedStudyCard(null);
                  }}
                  className="text-[11px] text-[#38bdf8] hover:underline flex items-center gap-1 font-semibold"
                >
                  <Plus size={12} />
                  <span>Провести стрелку</span>
                </button>
              </div>

              {/* List connections from or to this card */}
              {(() => {
                const relatedConns = canvasConnections.filter(
                  (c) => c.fromNode === selectedStudyCard.id || c.toNode === selectedStudyCard.id
                );

                if (relatedConns.length === 0) {
                  return (
                    <p className="text-[11px] text-[#64748b] italic">
                      Нет связей. Нажмите «Провести стрелку», чтобы соединить с другой концепцией.
                    </p>
                  );
                }

                return (
                  <div className="space-y-1.5">
                    {relatedConns.map((conn) => {
                      const isOutgoing = conn.fromNode === selectedStudyCard.id;
                      const otherId = isOutgoing ? conn.toNode : conn.fromNode;
                      const otherCard = canvasCards.find((c) => c.id === otherId);

                      return (
                        <div
                          key={conn.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-[#161722] border border-white/[0.06] text-xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-purple-400 font-bold">{isOutgoing ? '➔' : '←'}</span>
                            <span className="font-semibold text-white truncate">
                              {otherCard?.title || 'Карточка'}
                            </span>
                            {conn.label && (
                              <span className="text-[10px] text-[#94a3b8] px-1.5 py-0.5 rounded bg-black/40 border border-white/[0.06]">
                                {conn.label}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              deleteCanvasConnection(conn.id);
                              showToast('Связь удалена');
                            }}
                            className="text-[#94a3b8] hover:text-[#f43f5e] font-bold px-1"
                            title="Удалить стрелку"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Actions: Export to Note and Delete */}
            <div className="flex items-center gap-2 pt-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => {
                  handleConvertToNote(selectedStudyCard);
                  setSelectedStudyCard(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <BookOpen size={14} />
                <span>Открыть как заметку в Блокноте</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  deleteCanvasCard(selectedStudyCard.id);
                  setSelectedStudyCard(null);
                  showToast('Карточка удалена');
                }}
                className="p-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-[#f43f5e] active:scale-95 transition-all"
                title="Удалить карточку"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Modal: Ready-Made Educational Study Templates ═══ */}
      {isTemplateModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsTemplateModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#14151e] border border-white/[0.14] rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Учебные схемы и шаблоны холста</h3>
                  <p className="text-[10px] text-[#94a3b8]">Зачем нужен холст?</p>
                </div>
              </div>
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="text-[#94a3b8] hover:text-white p-1"
              >
                <X size={16} />
              </button>
            </div>

            {/* Explanatory banner */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20 text-xs text-[#cbd5e1] leading-relaxed">
              💡 <strong className="text-white">Для чего нужен холст:</strong> обычные заметки — это плоский текст, а холст — это визуальная карта знаний (Mind-Map). Здесь мысли соединяются стрелками, раскрываются в причины и следствия и видны целиком.
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleApplyTemplate('mindmap')}
                className="w-full p-3.5 rounded-2xl bg-[#181926] hover:bg-[#1f2030] border border-white/[0.08] text-left transition-all flex items-start gap-3 active:scale-98 shadow-md"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                  <GitBranch size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">🎓 Конспект темы (Mind-Map)</h4>
                  <p className="text-[11px] text-[#94a3b8] mt-0.5 leading-relaxed">
                    Главное понятие по центру ➔ Теория ➔ Практика ➔ Итоги.
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleApplyTemplate('flashcard')}
                className="w-full p-3.5 rounded-2xl bg-[#181926] hover:bg-[#1f2030] border border-white/[0.08] text-left transition-all flex items-start gap-3 active:scale-98 shadow-md"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <HelpCircle size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">🃏 Флэш-карточка (Вопрос ➔ Ответ)</h4>
                  <p className="text-[11px] text-[#94a3b8] mt-0.5 leading-relaxed">
                    Карточка для самопроверки и тренировки памяти.
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleApplyTemplate('decision')}
                className="w-full p-3.5 rounded-2xl bg-[#181926] hover:bg-[#1f2030] border border-white/[0.08] text-left transition-all flex items-start gap-3 active:scale-98 shadow-md"
              >
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Workflow size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">⚖️ Анализ решений (Плюсы и Минусы)</h4>
                  <p className="text-[11px] text-[#94a3b8] mt-0.5 leading-relaxed">
                    Цель ➔ Аргументы «ЗА» (зеленый) и «ПРОТИВ» (розовый).
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleApplyTemplate('terms')}
                className="w-full p-3.5 rounded-2xl bg-[#181926] hover:bg-[#1f2030] border border-white/[0.08] text-left transition-all flex items-start gap-3 active:scale-98 shadow-md"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <BookOpen size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">📖 Термины и определения</h4>
                  <p className="text-[11px] text-[#94a3b8] mt-0.5 leading-relaxed">
                    Понятие ➔ Простое определение ➔ Пример из жизни.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Modal: Create New Sticky Card ═══ */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-[#14151e] border border-white/[0.14] rounded-3xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus size={16} className="text-purple-400" />
                <span>Новый стикер на холсте</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-[#94a3b8] hover:text-white p-1">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase text-[#94a3b8] block mb-1">
                  Заголовок (по желанию)
                </label>
                <input
                  type="text"
                  value={newCardTitle}
                  onChange={(e) => setNewCardTitle(e.target.value)}
                  placeholder="Например: Идея проекта..."
                  className="w-full bg-[#1c1d29] border border-white/[0.08] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#06b6d4]"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-[#94a3b8] block mb-1">
                  Текст стикера
                </label>
                <textarea
                  value={newCardText}
                  onChange={(e) => setNewCardText(e.target.value)}
                  placeholder="Напишите мысль, список или заметку..."
                  rows={3}
                  className="w-full bg-[#1c1d29] border border-white/[0.08] rounded-xl px-3 py-2 text-white text-xs resize-none focus:outline-none focus:border-[#06b6d4]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-[#94a3b8] block mb-1.5">
                  Цвет карточки
                </label>
                <div className="flex items-center gap-2">
                  {COLOR_OPTIONS.map((co) => (
                    <button
                      key={co.color}
                      type="button"
                      onClick={() => setSelectedColor(co.color)}
                      className={`w-7 h-7 rounded-full transition-all flex items-center justify-center ${
                        selectedColor === co.color
                          ? 'scale-110 ring-2 ring-white shadow-lg'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: co.color }}
                    >
                      {selectedColor === co.color && <Check size={13} className="text-white drop-shadow" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-xs font-semibold text-[#94a3b8]"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => handleAddCardAtCenter()}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#06b6d4] text-white text-xs font-bold shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
              >
                Создать стикер
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 inset-x-0 mx-auto w-fit max-w-[90%] px-4 py-2 bg-[#1c1d29] text-[#38bdf8] border border-[#38bdf8]/30 rounded-2xl shadow-2xl text-xs font-semibold flex items-center gap-2 z-50 animate-fade-in pointer-events-none">
          <Sparkles size={14} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default MobileCanvasView;
