import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3-force-3d';
import {
  Settings2,
  RefreshCw,
  Search,
  Pin,
  Sparkles,
  Link2,
  Trash2,
  FileText,
  Filter,
  X,
  Type,
  Share2,
  Maximize2,
  Compass,
  Palette,
  Sliders,
  ZoomIn,
  ZoomOut,
  Layers,
  Plus,
  ArrowRight,
  Unlink,
  Check,
} from 'lucide-react';
import {
  IconGraph2D,
} from '../icons/CustomNeironoIcons';
import { useBrainStore, THEME_CONFIGS } from '../../store/useBrainStore';

interface SimNode {
  id: string;
  title: string;
  color: string;
  pinned: boolean;
  folder: string;
  tags: string[];
  learningState: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  linkCount: number;
}

interface SimLink {
  source: SimNode | string;
  target: SimNode | string;
}

const FOLDER_COLORS: Record<string, string> = {
  Default: '#8b5cf6',
  Neuroscience: '#8b5cf6',
  AI: '#06b6d4',
  Cognition: '#10b981',
  Anatomy: '#ec4899',
  Проекты: '#3b82f6',
  Идеи: '#f59e0b',
  Обучение: '#10b981',
  Смены: '#f43f5e',
  Архив: '#64748b',
};

const PALETTE_COLORS = [
  '#8b5cf6', // Violet
  '#38bdf8', // Sky Blue
  '#10b981', // Emerald Green
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f43f5e', // Rose
  '#6366f1', // Indigo
  '#eab308', // Yellow
  '#14b8a6', // Teal
];

const getIntelligentColor = (
  title: string,
  folder: string,
  tags: string[],
  learningState: string,
  colorMode: string,
  currentAccent: string,
  isLight: boolean = false
): string => {
  if (colorMode === 'monochrome') return isLight ? '#475569' : '#d4d4d8';
  if (colorMode === 'learning') {
    return learningState === 'mastered'
      ? '#10b981'
      : learningState === 'review'
      ? '#f59e0b'
      : '#8b5cf6';
  }
  if (folder && folder !== 'Default' && FOLDER_COLORS[folder]) {
    return FOLDER_COLORS[folder]!;
  }
  if (tags && tags.length > 0) {
    let hash = 0;
    const tagStr = tags[0]!;
    for (let i = 0; i < tagStr.length; i++) hash = (hash * 31 + tagStr.charCodeAt(i)) & 0xffffffff;
    return PALETTE_COLORS[Math.abs(hash) % PALETTE_COLORS.length]!;
  }
  if (title.endsWith('.canvas')) return '#38bdf8';
  if (title.endsWith('.base')) return '#10b981';
  if (/^\d{4}-\d{2}-\d{2}/.test(title)) return '#f59e0b';

  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = (hash * 31 + title.charCodeAt(i)) & 0xffffffff;
  return PALETTE_COLORS[Math.abs(hash) % PALETTE_COLORS.length]!;
};

export const ObsidianGraphView: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    neurons,
    activeNeuronId,
    graphSettings,
    themePreset,
    themeMode,
    uiSettings,
    spiderMode,
    selectNeuron,
    openNote,
    openTab,
    togglePin,
    toggleSpiderMode,
    deleteNeuron,
    updateNeuron,
    updateGraphSettings,
  } = useBrainStore();

  const isSystemDark =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;

  const isLight =
    themeMode === 'light' ||
    (themeMode === 'system' && !isSystemDark) ||
    themePreset.startsWith('light_');

  const themeConfig = THEME_CONFIGS[themePreset] || THEME_CONFIGS.obsidian;
  const currentAccent = uiSettings?.accentColor || themeConfig.accent;
  const canvasBg = isLight ? '#f8fafc' : '#202020';

  // Visual Customization Settings (Obsidian-Style Defaults)
  const [colorMode, setColorMode] = useState<'monochrome' | 'folders' | 'learning'>('monochrome');
  const [showGrid, setShowGrid] = useState(false);
  const [linkThickness, setLinkThickness] = useState(1.0);

  // UI State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLinkingMode, setIsLinkingMode] = useState(false);
  const [linkingSourceNode, setLinkingSourceNode] = useState<SimNode | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search & Tag Filter
  const [graphSearchQuery, setGraphSearchQuery] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);

  // Context Menu
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    node: SimNode | null;
  } | null>(null);

  // High-performance Transform Ref (zero React re-render lag)
  const transformRef = useRef<{ x: number; y: number; k: number }>({
    x: 0,
    y: 0,
    k: 1.0,
  });

  // Drag tracking refs (Rock-solid mouse tracking with window listeners)
  const dragStartPos = useRef({ x: 0, y: 0 });
  const hasMovedSignificantly = useRef(false);
  const draggedNodeRef = useRef<SimNode | null>(null);
  const isPanningCanvasRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const hoveredNodeRef = useRef<SimNode | null>(null);

  const simulationRef = useRef<any>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3000);
  }, []);

  const getFolderName = (filePath: string): string => {
    const parts = filePath.split('/');
    return parts.length > 1 ? parts[0]! : 'Default';
  };

  const allTags = useMemo(() => {
    const set = new Set<string>();
    neurons.forEach((n) => (n.tags || []).forEach((t) => set.add(t)));
    return Array.from(set);
  }, [neurons]);

  const totalSynapses = useMemo(() => {
    return neurons.reduce((acc, n) => acc + (n.outlinks?.length || 0), 0);
  }, [neurons]);

  // Fast O(1) Lookup Map for all connected neighbors of any node
  const nodeNeighborsMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    neurons.forEach((n) => {
      const set = new Set<string>([n.id]);
      (n.outlinks || []).forEach((id) => set.add(id));
      (n.backlinks || []).forEach((id) => set.add(id));
      map.set(n.id, set);
    });
    return map;
  }, [neurons]);

  const { simNodes, simLinks } = useMemo(() => {
    const n = neurons.length;
    const nodes: SimNode[] = neurons.map((neu, idx) => {
      const folder = getFolderName(neu.filePath);
      const linkCount = (neu.outlinks?.length || 0) + (neu.backlinks?.length || 0);

      const color = getIntelligentColor(
        neu.title,
        folder,
        neu.tags || [],
        neu.learningState || 'new',
        colorMode,
        currentAccent,
        isLight
      );

      // Spread initial positions across a large spiral so physics settles cleanly
      const angle = (idx / Math.max(1, n)) * Math.PI * 6; // multi-loop spiral
      const spreadRadius = 80 + idx * (260 / Math.max(1, n)) + (linkCount > 0 ? 0 : 60);
      const jitter = (Math.random() - 0.5) * 40;

      return {
        id: neu.id,
        title: neu.title,
        color,
        pinned: neu.pinned,
        folder,
        tags: neu.tags || [],
        learningState: neu.learningState || 'new',
        linkCount,
        x: Math.cos(angle) * spreadRadius + jitter,
        y: Math.sin(angle) * spreadRadius + jitter,
      };
    });

    const nodeMap = new Map(nodes.map((nd) => [nd.id, nd]));
    const links: SimLink[] = [];

    neurons.forEach((source) => {
      (source.outlinks || []).forEach((targetId) => {
        if (nodeMap.has(source.id) && nodeMap.has(targetId)) {
          links.push({ source: source.id, target: targetId });
        }
      });
    });

    return { simNodes: nodes, simLinks: links };
  }, [neurons, colorMode, currentAccent, isLight]);

  // Auto-Center Graph on mount & resize
  const centerGraphInViewport = useCallback(() => {
    if (containerRef.current) {
      const width = containerRef.current.clientWidth || 800;
      const height = containerRef.current.clientHeight || 600;
      transformRef.current = { x: width / 2, y: height / 2, k: 1.0 };
    }
  }, []);

  useEffect(() => {
    centerGraphInViewport();
  }, [centerGraphInViewport]);

  // Keyboard shortcut listener for Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isLinkingMode) {
          setIsLinkingMode(false);
          setLinkingSourceNode(null);
          showToast('Режим связи отменен');
        }
        if (contextMenu) {
          setContextMenu(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLinkingMode, contextMenu, showToast]);

  // Initialize D3 Force 2D Simulation with Stable Balanced Physics
  useEffect(() => {
    const linkDist = graphSettings.linkDistance || 120;
    const repulsionStrength = graphSettings.repulsion ? Math.min(-180, graphSettings.repulsion) : -380;
    const gravityStrength = graphSettings.centerGravity || 0.018;

    const sim = d3
      .forceSimulation(simNodes as any)
      .force(
        'link',
        d3
          .forceLink(simLinks as any)
          .id((d: any) => d.id)
          .distance(linkDist)
          .strength(0.28)
      )
      .force(
        'charge',
        d3
          .forceManyBody()
          .strength(repulsionStrength)
          .distanceMax(700)
          .distanceMin(20)
      )
      .force('x', d3.forceX(0).strength(gravityStrength))
      .force('y', d3.forceY(0).strength(gravityStrength))
      .force(
        'collide',
        d3
          .forceCollide()
          .radius((d: any) => {
            const linkCount = d.linkCount || 0;
            return (4.5 + Math.sqrt(linkCount) * 2.0) * (graphSettings.nodeSize || 1.0) + 26;
          })
          .iterations(3)
      )
      .alphaDecay(0.018)
      .velocityDecay(0.38);

    simulationRef.current = sim;

    return () => {
      sim.stop();
    };
  }, [
    simNodes,
    simLinks,
    graphSettings.linkDistance,
    graphSettings.repulsion,
    graphSettings.centerGravity,
    graphSettings.nodeSize,
  ]);

  // Connect & Disconnect Operations
  const connectNeurons = useCallback(
    (sourceId: string, targetId: string) => {
      const source = neurons.find((n) => n.id === sourceId);
      const target = neurons.find((n) => n.id === targetId);
      if (!source || !target || source.id === target.id) return;

      if (!(source.outlinks || []).includes(target.id)) {
        const linkSnippet = `[[${target.title}]]`;
        const newContent = source.content.trim()
          ? `${source.content}\n\nСвязано с ${linkSnippet}`
          : linkSnippet;
        updateNeuron(source.id, { content: newContent });
        showToast(`Соединено: «${source.title}» ➔ «${target.title}»`);
        simulationRef.current?.alpha(0.45).restart();
      } else {
        showToast(`Мысли «${source.title}» и «${target.title}» уже связаны`);
      }
    },
    [neurons, updateNeuron, showToast]
  );

  const disconnectNeurons = useCallback(
    (sourceId: string, targetId: string) => {
      const source = neurons.find((n) => n.id === sourceId);
      const target = neurons.find((n) => n.id === targetId);
      if (!source || !target) return;

      const escapedTargetTitle = target.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\[\\[${escapedTargetTitle}\\]\\]`, 'gi');
      const newContent = source.content
        .replace(regex, '')
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        .trim();
      updateNeuron(source.id, { content: newContent });
      showToast(`Удалена связь: «${source.title}» ⤬ «${target.title}»`);
      simulationRef.current?.alpha(0.45).restart();
    },
    [neurons, updateNeuron, showToast]
  );

  // Node matching search filter helper
  const isNodeMatch = useCallback(
    (node: SimNode) => {
      if (selectedTagFilter && !node.tags.includes(selectedTagFilter)) {
        return false;
      }
      if (graphSearchQuery.trim()) {
        const q = graphSearchQuery.toLowerCase();
        return (
          node.title.toLowerCase().includes(q) ||
          node.folder.toLowerCase().includes(q) ||
          node.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    },
    [graphSearchQuery, selectedTagFilter]
  );

  // HiDPI Canvas Continuous Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;

    // Node accent color: accent for connected, muted for isolated
    const NODE_COLOR      = isLight ? '#6366f1' : '#818cf8'; // indigo/violet accent
    const NODE_DIM        = isLight ? '#94a3b8' : '#52525b';
    const LINK_COLOR      = isLight ? 'rgba(30,41,59,0.20)' : 'rgba(200,200,220,0.18)';
    const LINK_HIGHLIGHT  = isLight ? '#6366f1' : '#818cf8';
    const LABEL_COLOR     = isLight ? '#334155' : '#c4c4cc';
    const LABEL_FOCUS     = isLight ? '#0f172a' : '#f1f5f9';
    const BG_COLOR        = isLight ? '#f1f5f9' : '#1e1e24';

    const render = () => {
      const width  = containerRef.current?.clientWidth  || 800;
      const height = containerRef.current?.clientHeight || 600;
      const dpr = window.devicePixelRatio || 1;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width  = width  * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // ── Background ────────────────────────────────────────────────────
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, width, height);

      // Optional dot-grid
      if (showGrid) {
        const tr0 = transformRef.current;
        const gs = 48;
        const sx = (((-tr0.x % (gs * tr0.k)) + gs * tr0.k) % (gs * tr0.k));
        const sy = (((-tr0.y % (gs * tr0.k)) + gs * tr0.k) % (gs * tr0.k));
        ctx.fillStyle = isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.04)';
        const ds = Math.max(1, 1.5 * tr0.k);
        for (let x = -sx; x < width + gs * tr0.k; x += gs * tr0.k)
          for (let y = -sy; y < height + gs * tr0.k; y += gs * tr0.k)
            ctx.fillRect(x, y, ds, ds);
      }

      // ── World-space transform ─────────────────────────────────────────
      ctx.save();
      const tr = transformRef.current;
      ctx.translate(tr.x, tr.y);
      ctx.scale(tr.k, tr.k);

      const isSearchActive  = Boolean(graphSearchQuery.trim() || selectedTagFilter);
      const hoveredId       = hoveredNodeRef.current?.id;
      const focusTargetId   = hoveredId || activeNeuronId;
      const focusNeighbors  = focusTargetId ? nodeNeighborsMap.get(focusTargetId) : null;

      // ── Links (straight, thin) ────────────────────────────────────────
      simLinks.forEach((link) => {
        const src = link.source as SimNode;
        const tgt = link.target as SimNode;
        if (!src || !tgt || src.x == null || tgt.x == null) return;

        const srcId = typeof link.source === 'object' ? src.id : link.source;
        const tgtId = typeof link.target === 'object' ? tgt.id : link.target;
        const isFocusLink = srcId === focusTargetId || tgtId === focusTargetId;

        ctx.beginPath();
        ctx.moveTo(src.x!, src.y!);
        ctx.lineTo(tgt.x!, tgt.y!);

        if (isFocusLink) {
          ctx.strokeStyle = LINK_HIGHLIGHT;
          ctx.globalAlpha = 0.85;
          ctx.lineWidth   = (linkThickness * 1.4) / tr.k;
        } else if (focusTargetId) {
          ctx.strokeStyle = LINK_COLOR;
          ctx.globalAlpha = 0.18;
          ctx.lineWidth   = linkThickness / tr.k;
        } else {
          ctx.strokeStyle = LINK_COLOR;
          ctx.globalAlpha = 0.85;
          ctx.lineWidth   = linkThickness / tr.k;
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      });

      // ── Nodes (flat solid circles) ────────────────────────────────────
      simNodes.forEach((node) => {
        if (node.x == null || node.y == null) return;

        const isSelected    = node.id === activeNeuronId;
        const isHovered     = node.id === hoveredId;
        const isLinkSrc     = isLinkingMode && linkingSourceNode?.id === node.id;
        const isMatched     = isNodeMatch(node);
        const isNeighbor    = focusTargetId && focusNeighbors ? focusNeighbors.has(node.id) : false;
        const isFocusNode   = isSelected || isHovered || isLinkSrc;
        const isDimmed      =
          (isSearchActive && !isMatched) ||
          (focusTargetId && !isNeighbor && !isFocusNode);

        // Radius: base 4.5px + sqrt(links)*1.5, scaled by user setting
        const r = (4.5 + Math.sqrt(node.linkCount) * 1.5) * (graphSettings.nodeSize || 1.0);

        // Node color
        let fill: string;
        if (isFocusNode) {
          fill = isLight ? '#f59e0b' : '#fbbf24';   // gold = selected/hovered
        } else if (isDimmed) {
          fill = NODE_DIM;
        } else if (colorMode !== 'monochrome') {
          fill = node.color || NODE_COLOR;
        } else {
          // monochrome: accent for connected, muted for isolated
          fill = node.linkCount > 0 ? NODE_COLOR : NODE_DIM;
        }

        ctx.globalAlpha = isDimmed ? 0.25 : 1.0;

        // Focus ring
        if (isFocusNode) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, r + 4 / tr.k, 0, Math.PI * 2);
          ctx.strokeStyle = fill;
          ctx.lineWidth   = 1.5 / tr.k;
          ctx.stroke();
        } else if (isNeighbor && !isDimmed) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, r + 2.5 / tr.k, 0, Math.PI * 2);
          ctx.strokeStyle = LINK_HIGHLIGHT + '88';
          ctx.lineWidth   = 1 / tr.k;
          ctx.stroke();
        }

        // Circle fill
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.fill();

        ctx.globalAlpha = 1;

        // ── Label ─────────────────────────────────────────────────────
        if (graphSettings.showLabels || isFocusNode) {
          const fontSize    = isFocusNode ? 11.5 : 9;
          const fontWeight  = isFocusNode ? '700' : '400';
          const labelAlpha  = isDimmed ? 0.22 : (isFocusNode ? 1.0 : 0.82);
          const title       = node.title.length > 28 ? node.title.slice(0, 26) + '…' : node.title;

          ctx.font          = `${fontWeight} ${fontSize}px -apple-system, "Segoe UI", ui-sans-serif, sans-serif`;
          ctx.textAlign     = 'center';
          ctx.textBaseline  = 'top';
          ctx.globalAlpha   = labelAlpha;
          // text shadow for readability
          ctx.shadowColor   = isLight ? 'rgba(241,245,249,0.9)' : 'rgba(30,30,36,0.95)';
          ctx.shadowBlur    = 3;
          ctx.fillStyle     = isFocusNode ? LABEL_FOCUS : LABEL_COLOR;
          ctx.fillText(title, node.x, node.y + r + 4 / tr.k);
          ctx.shadowBlur    = 0;
          ctx.globalAlpha   = 1;
        }
      });

      ctx.restore(); // world transform
      ctx.restore(); // dpr scale

      animFrameId = requestAnimationFrame(render);
    };

    animFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameId);
  }, [
    simNodes, simLinks, activeNeuronId, graphSettings,
    isLinkingMode, linkingSourceNode, isNodeMatch,
    graphSearchQuery, selectedTagFilter, nodeNeighborsMap,
    spiderMode, colorMode, showGrid, linkThickness,
    currentAccent, isLight, canvasBg,
  ]);


  // Coordinate conversion helper
  const getGraphCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const rawX = clientX - rect.left;
    const rawY = clientY - rect.top;
    const tr = transformRef.current;

    return {
      x: (rawX - tr.x) / tr.k,
      y: (rawY - tr.y) / tr.k,
    };
  };

  const findNodeAt = (graphX: number, graphY: number, hitMargin = 10): SimNode | null => {
    for (let i = simNodes.length - 1; i >= 0; i--) {
      const node = simNodes[i]!;
      if (node.x === undefined || node.y === undefined) continue;
      const dx = graphX - node.x;
      const dy = graphY - node.y;
      const radius = (4.8 + Math.sqrt(node.linkCount) * 2.2) * (graphSettings.nodeSize || 1.0) + hitMargin;
      if (dx * dx + dy * dy <= radius * radius) {
        return node;
      }
    }
    return null;
  };

  // Global Window-level MouseMove & MouseUp for Rock-solid Graph Dragging
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      const dx = Math.abs(e.clientX - dragStartPos.current.x);
      const dy = Math.abs(e.clientY - dragStartPos.current.y);
      if (dx > 4 || dy > 4) {
        hasMovedSignificantly.current = true;
      }

      // Dragging a node position
      if (draggedNodeRef.current) {
        const { x, y } = getGraphCoords(e.clientX, e.clientY);
        draggedNodeRef.current.fx = x;
        draggedNodeRef.current.fy = y;
        return;
      }

      // Panning the canvas
      if (isPanningCanvasRef.current) {
        transformRef.current.x = e.clientX - panStartRef.current.x;
        transformRef.current.y = e.clientY - panStartRef.current.y;
        return;
      }

      // Hovering
      const { x, y } = getGraphCoords(e.clientX, e.clientY);
      const hitNode = findNodeAt(x, y);
      hoveredNodeRef.current = hitNode;

      if (canvasRef.current) {
        canvasRef.current.style.cursor = isLinkingMode
          ? 'crosshair'
          : hitNode
          ? 'pointer'
          : 'grab';
      }
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      // Release dragged node
      if (draggedNodeRef.current) {
        draggedNodeRef.current.fx = null;
        draggedNodeRef.current.fy = null;
        draggedNodeRef.current = null;
        simulationRef.current?.alphaTarget(0);
      }
      isPanningCanvasRef.current = false;

      if (canvasRef.current) {
        canvasRef.current.style.cursor = hoveredNodeRef.current ? 'pointer' : 'grab';
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isLinkingMode]);

  // Safe Canvas MouseDown: Left click drags node or pans; 2-click Link Mode
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 2) return; // Right-click handled by handleContextMenu

    dragStartPos.current = { x: e.clientX, y: e.clientY };
    hasMovedSignificantly.current = false;

    const { x, y } = getGraphCoords(e.clientX, e.clientY);
    const hitNode = findNodeAt(x, y);

    // 1. Direct 2-Click Link Mode in Toolbar
    if (isLinkingMode) {
      if (!linkingSourceNode) {
        if (hitNode) {
          setLinkingSourceNode(hitNode);
          showToast(`Выбрана «${hitNode.title}». Теперь кликните по целевой мысли...`);
        }
      } else {
        if (hitNode && hitNode.id !== linkingSourceNode.id) {
          connectNeurons(linkingSourceNode.id, hitNode.id);
          setIsLinkingMode(false);
          setLinkingSourceNode(null);
        } else if (!hitNode) {
          setIsLinkingMode(false);
          setLinkingSourceNode(null);
          showToast('Режим связи завершен');
        }
      }
      return;
    }

    // 2. Normal Node Drag
    if (hitNode) {
      draggedNodeRef.current = hitNode;
      hitNode.fx = hitNode.x;
      hitNode.fy = hitNode.y;
      simulationRef.current?.alphaTarget(0.3).restart();
      if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
    } else {
      // 3. Canvas Panning
      isPanningCanvasRef.current = true;
      panStartRef.current = {
        x: e.clientX - transformRef.current.x,
        y: e.clientY - transformRef.current.y,
      };
      if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (hasMovedSignificantly.current || isLinkingMode) return;

    const { x, y } = getGraphCoords(e.clientX, e.clientY);
    const hitNode = findNodeAt(x, y);

    if (hitNode) {
      selectNeuron(hitNode.id);
      openNote(hitNode.id);
    } else {
      selectNeuron(null);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getGraphCoords(e.clientX, e.clientY);
    const hitNode = findNodeAt(x, y);

    if (hitNode) {
      openTab({ type: 'note', noteId: hitNode.id, title: hitNode.title });
    } else {
      const newNote = useBrainStore.getState().addNeuron('Новая мысль');
      newNote.position = { x: x / 10, y: y / 10, z: 0 };
      simulationRef.current?.alpha(0.5).restart();
      showToast(`Создана новая мысль: «${newNote.title}»`);
    }
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { x, y } = getGraphCoords(e.clientX, e.clientY);
    const hitNode = findNodeAt(x, y);

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      node: hitNode,
    });
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
    const tr = transformRef.current;
    const newK = Math.max(0.2, Math.min(4.5, tr.k * zoomFactor));

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    transformRef.current = {
      k: newK,
      x: mouseX - (mouseX - tr.x) * (newK / tr.k),
      y: mouseY - (mouseY - tr.y) * (newK / tr.k),
    };
  };

  const handleZoom = (delta: number) => {
    const tr = transformRef.current;
    const newK = Math.max(0.2, Math.min(4.5, tr.k * delta));
    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;

    transformRef.current = {
      k: newK,
      x: width / 2 - (width / 2 - tr.x) * (newK / tr.k),
      y: height / 2 - (height / 2 - tr.y) * (newK / tr.k),
    };
  };

  // Fit all nodes into the viewport - computes bounding box and adjusts scale/offset
  const handleCenterGraph = useCallback(() => {
    const nodes = simNodes.filter((n) => n.x != null && n.y != null);
    if (nodes.length === 0) { centerGraphInViewport(); return; }

    const width  = containerRef.current?.clientWidth  || 800;
    const height = containerRef.current?.clientHeight || 600;
    const padding = 80;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    nodes.forEach((n) => {
      if (n.x! < minX) minX = n.x!;
      if (n.x! > maxX) maxX = n.x!;
      if (n.y! < minY) minY = n.y!;
      if (n.y! > maxY) maxY = n.y!;
    });

    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const scale  = Math.max(0.12, Math.min(2.5,
      Math.min(
        (width  - padding * 2) / rangeX,
        (height - padding * 2) / rangeY
      )
    ));

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    transformRef.current = {
      k: scale,
      x: width  / 2 - cx * scale,
      y: height / 2 - cy * scale,
    };
  }, [simNodes, centerGraphInViewport]);

  // Connected neurons list for Context Menu
  const contextNodeConnections = useMemo(() => {
    if (!contextMenu?.node) return { outlinks: [], backlinks: [] };
    const node = neurons.find((n) => n.id === contextMenu.node!.id);
    if (!node) return { outlinks: [], backlinks: [] };

    const outlinks = (node.outlinks || []).map((id) => neurons.find((n) => n.id === id)).filter(Boolean);
    const backlinks = (node.backlinks || []).map((id) => neurons.find((n) => n.id === id)).filter(Boolean);
    return { outlinks, backlinks };
  }, [contextMenu, neurons]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none"
      style={{ background: canvasBg }}
    >
      {/* ═══ Canvas ═══════════════════════════════════════════════════ */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onClick={handleCanvasClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        onWheel={handleWheel}
        className="w-full h-full block cursor-grab active:cursor-grabbing"
      />

      {/* ═══ Integrated Mobile Top Stats & Search Bar ════════════════ */}
      <div className="absolute top-2.5 inset-x-2.5 z-20 flex items-center justify-between gap-2 pointer-events-auto">
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs shrink-0 shadow-lg"
          style={{
            background: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(18,18,24,0.88)',
            border: isLight ? '1px solid rgba(0,0,0,0.09)' : '1px solid rgba(255,255,255,0.07)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <IconGraph2D size={14} color={currentAccent} />
          <span style={{ color: isLight ? '#0f172a' : '#f1f5f9', fontWeight: 700 }}>{neurons.length}</span>
          <span className="text-[10px] text-[#94a3b8]">мыслей</span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: currentAccent, display: 'inline-block' }} />
          <span style={{ color: currentAccent, fontWeight: 700, fontFamily: 'monospace' }}>{totalSynapses}</span>
        </div>

        {/* Compact Search Bar that never collides */}
        <div className="relative flex-1 max-w-[200px] flex items-center">
          <Search
            size={12}
            className="absolute left-2.5 pointer-events-none"
            style={{ color: currentAccent }}
          />
          <input
            type="text"
            value={graphSearchQuery}
            onChange={(e) => setGraphSearchQuery(e.target.value)}
            placeholder="Поиск..."
            className="w-full text-xs outline-none"
            style={{
              background: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(18,18,24,0.88)',
              border: graphSearchQuery
                ? `1.5px solid ${currentAccent}`
                : isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(16px)',
              borderRadius: 12,
              paddingLeft: 24,
              paddingRight: graphSearchQuery ? 24 : 10,
              paddingTop: 5,
              paddingBottom: 5,
              fontSize: 11,
              color: isLight ? '#0f172a' : '#f1f5f9',
            }}
          />
          {graphSearchQuery && (
            <button
              onClick={() => setGraphSearchQuery('')}
              className="absolute right-2"
              style={{ color: isLight ? '#64748b' : '#94a3b8' }}
            >
              <X size={11} />
            </button>
          )}
        </div>
      </div>

      {/* ═══ Right Vertical Toolbar ═══════════════════════════════════ */}
      <div
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-1.5"
        style={{ pointerEvents: 'auto' }}
      >
        {/* Toolbar panel */}
        <div
          className="flex flex-col items-center gap-1 p-1.5 rounded-2xl"
          style={{
            background: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(18,18,24,0.88)',
            border: isLight ? '1px solid rgba(0,0,0,0.09)' : '1px solid rgba(255,255,255,0.07)',
            backdropFilter: 'blur(20px)',
            boxShadow: isLight ? '0 4px 24px rgba(0,0,0,0.10)' : '0 4px 32px rgba(0,0,0,0.5)',
          }}
        >
          {/* Zoom In */}
          <button
            onClick={() => handleZoom(1.25)}
            title="Приблизить"
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-all hover:scale-110 active:scale-95"
            style={{ color: isLight ? '#475569' : '#94a3b8' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <ZoomIn size={15} />
          </button>

          {/* Zoom Out */}
          <button
            onClick={() => handleZoom(0.8)}
            title="Отдалить"
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-all hover:scale-110 active:scale-95"
            style={{ color: isLight ? '#475569' : '#94a3b8' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <ZoomOut size={15} />
          </button>

          {/* Divider */}
          <div style={{ width: 20, height: 1, background: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)' }} />

          {/* Center / Fit */}
          <button
            onClick={handleCenterGraph}
            title="Показать всё"
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-all hover:scale-110 active:scale-95"
            style={{ color: isLight ? '#475569' : '#94a3b8' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <Maximize2 size={15} />
          </button>

          {/* Divider */}
          <div style={{ width: 20, height: 1, background: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)' }} />

          {/* Labels toggle */}
          <button
            onClick={() => updateGraphSettings({ showLabels: !graphSettings.showLabels })}
            title={graphSettings.showLabels ? 'Скрыть подписи' : 'Показать подписи'}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-all hover:scale-110 active:scale-95"
            style={{
              color: graphSettings.showLabels ? currentAccent : (isLight ? '#475569' : '#94a3b8'),
              background: graphSettings.showLabels
                ? (isLight ? `${currentAccent}18` : `${currentAccent}22`)
                : 'transparent',
            }}
          >
            <Type size={15} />
          </button>

          {/* Spider mode */}
          <button
            onClick={toggleSpiderMode}
            title={spiderMode ? 'Режим паука вкл.' : 'Режим паука'}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-all hover:scale-110 active:scale-95"
            style={{
              color: spiderMode ? '#f59e0b' : (isLight ? '#475569' : '#94a3b8'),
              background: spiderMode ? 'rgba(245,158,11,0.15)' : 'transparent',
            }}
          >
            <Layers size={15} />
          </button>

          {/* Link mode */}
          <button
            onClick={() => {
              setIsLinkingMode((prev) => !prev);
              setLinkingSourceNode(null);
              if (!isLinkingMode) showToast('Кликните по первой мысли, затем по второй');
            }}
            title="Связать мысли"
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-all hover:scale-110 active:scale-95"
            style={{
              color: isLinkingMode ? '#ffffff' : (isLight ? '#475569' : '#94a3b8'),
              background: isLinkingMode ? currentAccent : 'transparent',
            }}
          >
            <Link2 size={15} className={isLinkingMode ? 'animate-pulse' : ''} />
          </button>

          {/* Divider */}
          <div style={{ width: 20, height: 1, background: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)' }} />

          {/* Settings */}
          <button
            onClick={() => setIsSettingsOpen((prev) => !prev)}
            title="Настройки графа"
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-all hover:scale-110 active:scale-95"
            style={{
              color: isSettingsOpen ? '#ffffff' : (isLight ? '#475569' : '#94a3b8'),
              background: isSettingsOpen ? currentAccent : 'transparent',
            }}
          >
            <Sliders size={15} />
          </button>
        </div>
      </div>

      {/* ═══ Settings Panel (floats left of toolbar) ══════════════════ */}
      {isSettingsOpen && (
        <div
          className="absolute right-16 z-30 w-72 animate-fade-in"
          style={{
            top: '50%',
            transform: 'translateY(-50%)',
            background: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(20,20,28,0.96)',
            border: isLight ? '1px solid rgba(0,0,0,0.09)' : '1px solid rgba(255,255,255,0.09)',
            backdropFilter: 'blur(24px)',
            borderRadius: 20,
            padding: '16px',
            boxShadow: isLight ? '0 8px 40px rgba(0,0,0,0.14)' : '0 8px 48px rgba(0,0,0,0.6)',
          }}
        >
          <div
            className="flex items-center justify-between pb-3 mb-3"
            style={{ borderBottom: isLight ? '1px solid rgba(0,0,0,0.07)' : '1px solid rgba(255,255,255,0.07)' }}
          >
            <span className="flex items-center gap-2 font-semibold text-sm" style={{ color: isLight ? '#0f172a' : '#f1f5f9' }}>
              <Sliders size={14} style={{ color: currentAccent }} />
              Параметры
            </span>
            <span className="text-[11px] font-mono" style={{ color: currentAccent }}>{neurons.length} узлов</span>
          </div>

          <div className="space-y-4">
            {/* Color Mode */}
            <div>
              <p className="text-[11px] mb-2 font-medium" style={{ color: isLight ? '#64748b' : '#94a3b8' }}>Окраска узлов</p>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: 'folders', label: 'По папкам' },
                  { id: 'monochrome', label: 'Монохром' },
                  { id: 'learning', label: 'Обучение' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setColorMode(s.id as any)}
                    className="py-1.5 rounded-lg text-[10px] font-semibold transition-all"
                    style={{
                      background: colorMode === s.id ? currentAccent : (isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'),
                      color: colorMode === s.id ? '#fff' : (isLight ? '#64748b' : '#94a3b8'),
                      border: colorMode === s.id ? `1px solid ${currentAccent}` : isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium" style={{ color: isLight ? '#64748b' : '#94a3b8' }}>Сетка фона</span>
              <button
                onClick={() => setShowGrid((v) => !v)}
                className="w-10 h-5 rounded-full relative transition-all"
                style={{ background: showGrid ? currentAccent : (isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)') }}
              >
                <span
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
                  style={{ left: showGrid ? '1.375rem' : '0.125rem' }}
                />
              </button>
            </div>

            {/* Node Size */}
            <div>
              <div className="flex justify-between text-[11px] mb-1.5">
                <span style={{ color: isLight ? '#64748b' : '#94a3b8' }}>Размер узлов</span>
                <span className="font-mono" style={{ color: currentAccent }}>{graphSettings.nodeSize.toFixed(1)}x</span>
              </div>
              <input
                type="range" min="0.6" max="2.5" step="0.1"
                value={graphSettings.nodeSize}
                onChange={(e) => updateGraphSettings({ nodeSize: parseFloat(e.target.value) })}
                className="w-full"
                style={{ accentColor: currentAccent }}
              />
            </div>

            {/* Link Distance */}
            <div>
              <div className="flex justify-between text-[11px] mb-1.5">
                <span style={{ color: isLight ? '#64748b' : '#94a3b8' }}>Длина связей</span>
                <span className="font-mono" style={{ color: currentAccent }}>{graphSettings.linkDistance}px</span>
              </div>
              <input
                type="range" min="35" max="180" step="5"
                value={graphSettings.linkDistance}
                onChange={(e) => updateGraphSettings({ linkDistance: parseFloat(e.target.value) })}
                className="w-full"
                style={{ accentColor: currentAccent }}
              />
            </div>

            {/* Repulsion */}
            <div>
              <div className="flex justify-between text-[11px] mb-1.5">
                <span style={{ color: isLight ? '#64748b' : '#94a3b8' }}>Отталкивание</span>
                <span className="font-mono" style={{ color: currentAccent }}>{Math.abs(graphSettings.repulsion)}</span>
              </div>
              <input
                type="range" min="-400" max="-30" step="10"
                value={graphSettings.repulsion}
                onChange={(e) => updateGraphSettings({ repulsion: parseFloat(e.target.value) })}
                className="w-full"
                style={{ accentColor: currentAccent }}
              />
            </div>

            {/* Gravity */}
            <div>
              <div className="flex justify-between text-[11px] mb-1.5">
                <span style={{ color: isLight ? '#64748b' : '#94a3b8' }}>Гравитация</span>
                <span className="font-mono" style={{ color: currentAccent }}>{(graphSettings.centerGravity * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range" min="0.01" max="0.3" step="0.01"
                value={graphSettings.centerGravity}
                onChange={(e) => updateGraphSettings({ centerGravity: parseFloat(e.target.value) })}
                className="w-full"
                style={{ accentColor: currentAccent }}
              />
            </div>

            {/* Link thickness */}
            <div>
              <div className="flex justify-between text-[11px] mb-1.5">
                <span style={{ color: isLight ? '#64748b' : '#94a3b8' }}>Толщина связей</span>
                <span className="font-mono" style={{ color: currentAccent }}>{linkThickness.toFixed(1)}</span>
              </div>
              <input
                type="range" min="0.5" max="3.0" step="0.1"
                value={linkThickness}
                onChange={(e) => setLinkThickness(parseFloat(e.target.value))}
                className="w-full"
                style={{ accentColor: currentAccent }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ═══ Link Mode Banner ════════════════════════════════════════ */}
      {isLinkingMode && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 animate-fade-in">
          <div
            className="flex items-center gap-3 px-4 py-2 rounded-2xl text-xs font-semibold text-white"
            style={{ background: currentAccent, boxShadow: `0 4px 24px ${currentAccent}66` }}
          >
            <Link2 size={13} className="animate-pulse" />
            <span>
              {linkingSourceNode
                ? `Выбрана «${linkingSourceNode.title.slice(0, 20)}». Кликните вторую мысль`
                : 'Кликните по первой мысли'}
            </span>
            <button
              onClick={() => { setIsLinkingMode(false); setLinkingSourceNode(null); }}
              className="ml-1 opacity-70 hover:opacity-100 transition-opacity"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      {/* ═══ Toast ════════════════════════════════════════════════════ */}
      {toastMessage && (
        <div
          className="absolute bottom-16 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-2xl text-xs font-semibold flex items-center gap-2 pointer-events-none animate-fade-in"
          style={{
            background: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(20,20,28,0.95)',
            border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(16px)',
            color: isLight ? '#0f172a' : '#f1f5f9',
            boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
          }}
        >
          <Sparkles size={13} style={{ color: currentAccent }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ═══ Bottom Tags Filter (Full Width Responsive Floating Bar) ═══════════════ */}
      {allTags.length > 0 && (
        <div
          className="absolute bottom-2.5 inset-x-2.5 z-20 flex items-center gap-1.5 p-1.5 rounded-2xl overflow-x-auto no-scrollbar shadow-2xl"
          style={{
            background: isLight ? 'rgba(255,255,255,0.92)' : 'rgba(18,18,24,0.92)',
            border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.09)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <button
            onClick={() => setSelectedTagFilter(null)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 transition-all active:scale-95"
            style={{
              background: !selectedTagFilter
                ? `${currentAccent}25`
                : isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)',
              color: !selectedTagFilter ? currentAccent : (isLight ? '#64748b' : '#94a3b8'),
              border: !selectedTagFilter
                ? `1px solid ${currentAccent}`
                : isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <Filter size={12} />
            <span>Все ({neurons.length})</span>
          </button>

          {allTags.map((tag) => {
            const isSelected = selectedTagFilter === tag;
            const tagCount = neurons.filter((n) => n.tags?.includes(tag)).length;

            return (
              <button
                key={tag}
                onClick={() => setSelectedTagFilter(isSelected ? null : tag)}
                className="px-2.5 py-1 rounded-xl text-xs transition-all flex items-center gap-1.5 shrink-0 font-semibold active:scale-95"
                style={{
                  background: isSelected ? currentAccent : (isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)'),
                  color: isSelected ? '#fff' : (isLight ? '#334155' : '#cbd5e1'),
                  border: isSelected
                    ? `1px solid ${currentAccent}`
                    : isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.07)',
                  fontWeight: isSelected ? 800 : 500,
                  boxShadow: isSelected ? `0 2px 12px ${currentAccent}50` : 'none',
                }}
              >
                <span>#{tag}</span>
                {tagCount > 0 && (
                  <span
                    className="text-[10px] px-1 py-0.2 rounded-md font-mono"
                    style={{
                      background: isSelected ? 'rgba(255,255,255,0.25)' : (isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)'),
                      color: isSelected ? '#fff' : (isLight ? '#64748b' : '#94a3b8'),
                    }}
                  >
                    {tagCount}
                  </span>
                )}
                {isSelected && <X size={11} className="ml-0.5 opacity-90" />}
              </button>
            );
          })}
        </div>
      )}

      {/* ═══ Context Menu ═════════════════════════════════════════════ */}
      {contextMenu && contextMenu.node && (
        <div
          style={{
            position: 'fixed',
            top: Math.min(window.innerHeight - 300, contextMenu.y),
            left: Math.min(window.innerWidth - 260, contextMenu.x),
            zIndex: 50,
            background: isLight ? 'rgba(255,255,255,0.97)' : 'rgba(20,20,28,0.97)',
            border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(24px)',
          }}
          className="w-60 rounded-2xl p-1.5 text-xs space-y-0.5 animate-fade-in"
          onClick={() => setContextMenu(null)}
        >
          {/* Header */}
          <div
            className="px-3 py-2 font-bold truncate flex items-center justify-between"
            style={{
              color: isLight ? '#0f172a' : '#f1f5f9',
              borderBottom: isLight ? '1px solid rgba(0,0,0,0.07)' : '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <span className="truncate">{contextMenu.node.title}</span>
            <span className="text-[9px] font-mono ml-2" style={{ color: currentAccent }}>
              {contextMenu.node.linkCount} св.
            </span>
          </div>

          {[
            {
              icon: <FileText size={13} style={{ color: currentAccent }} />,
              label: 'Открыть заметку',
              onClick: () => { if (contextMenu.node) openNote(contextMenu.node.id); },
              accent: false,
            },
            {
              icon: <Link2 size={13} style={{ color: currentAccent }} />,
              label: 'Связать с другой...',
              onClick: (e: React.MouseEvent) => {
                e.stopPropagation();
                if (contextMenu.node) {
                  setLinkingSourceNode(contextMenu.node);
                  setIsLinkingMode(true);
                  showToast(`Выбрана «${contextMenu.node.title}». Кликните вторую мысль...`);
                  setContextMenu(null);
                }
              },
              accent: true,
            },
            {
              icon: <Pin size={13} style={{ color: '#f59e0b' }} />,
              label: contextMenu.node.pinned ? 'Открепить' : 'Закрепить',
              onClick: () => { if (contextMenu.node) togglePin(contextMenu.node.id); },
              accent: false,
            },
            {
              icon: <Share2 size={13} style={{ color: '#06b6d4' }} />,
              label: 'Копировать [[ссылку]]',
              onClick: () => {
                if (contextMenu.node) {
                  navigator.clipboard.writeText(`[[${contextMenu.node.title}]]`);
                  showToast('Скопирована ссылка [[...]]');
                }
              },
              accent: false,
            },
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={item.onClick as any}
              className="w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 transition-all"
              style={{
                color: item.accent ? currentAccent : (isLight ? '#334155' : '#e2e8f0'),
                background: item.accent
                  ? isLight ? `${currentAccent}10` : `${currentAccent}18`
                  : 'transparent',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = item.accent ? (isLight ? `${currentAccent}10` : `${currentAccent}18`) : 'transparent'; }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}

          {/* Outlinks list */}
          {contextNodeConnections.outlinks.length > 0 && (
            <div style={{ borderTop: isLight ? '1px solid rgba(0,0,0,0.07)' : '1px solid rgba(255,255,255,0.07)', paddingTop: 4 }}>
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: isLight ? '#94a3b8' : '#64748b' }}>
                Связи
              </div>
              {contextNodeConnections.outlinks.map((target: any) => (
                <div
                  key={target.id}
                  className="px-3 py-1.5 rounded-lg flex items-center justify-between"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="truncate text-[11px] max-w-[150px]" style={{ color: isLight ? '#64748b' : '#94a3b8' }}>{target.title}</span>
                  <button
                    onClick={() => {
                      if (contextMenu.node) {
                        disconnectNeurons(contextMenu.node.id, target.id);
                        setContextMenu(null);
                      }
                    }}
                    className="p-1 rounded-lg transition-all"
                    style={{ color: '#f43f5e' }}
                    title="Удалить связь"
                  >
                    <Unlink size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Delete */}
          <div style={{ borderTop: isLight ? '1px solid rgba(0,0,0,0.07)' : '1px solid rgba(255,255,255,0.07)', paddingTop: 4 }}>
            <button
              onClick={() => { if (contextMenu.node) deleteNeuron(contextMenu.node.id); }}
              className="w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 transition-all"
              style={{ color: '#f43f5e' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(244,63,94,0.08)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              <Trash2 size={13} />
              <span>Удалить мысль</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

