import React, { useEffect, useRef, useState } from 'react';
import { useMobileBrainStore } from '../../store/useMobileBrainStore';
import { ZoomIn, ZoomOut, RefreshCw, Layers } from 'lucide-react';

interface Node2D {
  id: string;
  title: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  connections: string[];
}

export const MobileGraphView: React.FC = () => {
  const { neurons, setActiveNeuronId, setActiveTab } = useMobileBrainStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<Node2D | null>(null);

  const nodesRef = useRef<Node2D[]>([]);
  const isDraggingRef = useRef(false);
  const dragNodeRef = useRef<Node2D | null>(null);
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);

  // Initialize graph nodes and links
  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight - 130;

    const initialNodes: Node2D[] = neurons.map((n, idx) => {
      const angle = (idx / Math.max(1, neurons.length)) * 2 * Math.PI;
      const dist = 80 + Math.random() * 60;
      return {
        id: n.id,
        title: n.title,
        x: width / 2 + Math.cos(angle) * dist,
        y: height / 2 + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: 12 + Math.min(10, n.wikiLinks.length * 2),
        color: n.frontmatter.pinned ? '#ec4899' : '#8052ff',
        connections: n.wikiLinks,
      };
    });

    nodesRef.current = initialNodes;
  }, [neurons]);

  // Animation physics loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);
      ctx.save();

      // Apply Pan and Zoom
      ctx.translate(width / 2 + pan.x, height / 2 + pan.y);
      ctx.scale(zoom, zoom);
      ctx.translate(-width / 2, -height / 2);

      const nodes = nodesRef.current;

      // Simple physics repulsion & link attraction
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i]!;
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j]!;
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.sqrt(dx * dy + dy * dy) || 1;

          // Repulsion
          if (dist < 120) {
            const force = (120 - dist) / 120;
            n1.vx -= (dx / dist) * force * 0.2;
            n1.vy -= (dy / dist) * force * 0.2;
            n2.vx += (dx / dist) * force * 0.2;
            n2.vy += (dy / dist) * force * 0.2;
          }
        }

        // Damping and movement
        if (dragNodeRef.current !== n1) {
          n1.x += n1.vx;
          n1.y += n1.vy;
          n1.vx *= 0.92;
          n1.vy *= 0.92;
        }
      }

      // Draw Connections
      ctx.strokeStyle = 'rgba(128, 82, 255, 0.25)';
      ctx.lineWidth = 1.5;

      nodes.forEach((n1) => {
        n1.connections.forEach((targetTitle) => {
          const n2 = nodes.find((n) => n.title.toLowerCase() === targetTitle.toLowerCase());
          if (n2) {
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();
          }
        });
      });

      // Draw Nodes
      nodes.forEach((node) => {
        const isSelected = selectedNode?.id === node.id;

        // Glow
        if (isSelected) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 6, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(128, 82, 255, 0.35)';
          ctx.fill();
        }

        // Main Node Circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
        ctx.fillStyle = node.color;
        ctx.shadowColor = node.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Node Title
        ctx.fillStyle = '#ffffff';
        ctx.font = '11px Plus Jakarta Sans, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.title, node.x, node.y + node.radius + 14);
      });

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [zoom, pan, selectedNode]);

  // Touch Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && e.touches[0]) {
      const touch = e.touches[0];
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const clientX = touch.clientX - rect.left;
      const clientY = touch.clientY - rect.top;

      // Transform to world coords
      const worldX = (clientX - rect.width / 2 - pan.x) / zoom + rect.width / 2;
      const worldY = (clientY - rect.height / 2 - pan.y) / zoom + rect.height / 2;

      // Check if node tapped
      const clicked = nodesRef.current.find((n) => {
        const d = Math.hypot(n.x - worldX, n.y - worldY);
        return d <= n.radius + 10;
      });

      if (clicked) {
        dragNodeRef.current = clicked;
        setSelectedNode(clicked);
      } else {
        lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
        setSelectedNode(null);
      }
      isDraggingRef.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;

    if (dragNodeRef.current && e.touches[0]) {
      const touch = e.touches[0];
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const clientX = touch.clientX - rect.left;
      const clientY = touch.clientY - rect.top;

      dragNodeRef.current.x = (clientX - rect.width / 2 - pan.x) / zoom + rect.width / 2;
      dragNodeRef.current.y = (clientY - rect.height / 2 - pan.y) / zoom + rect.height / 2;
    } else if (lastTouchRef.current && e.touches[0]) {
      const touch = e.touches[0];
      const dx = touch.clientX - lastTouchRef.current.x;
      const dy = touch.clientY - lastTouchRef.current.y;
      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    dragNodeRef.current = null;
    lastTouchRef.current = null;
  };

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-[#0c0d12]">
      {/* Floating Controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 bg-[#14151e]/80 backdrop-blur-md p-1.5 rounded-2xl border border-[#232533]">
        <button
          onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
          className="p-2 rounded-xl text-[#94a3b8] active:text-white active:bg-white/[0.08]"
        >
          <ZoomIn size={18} />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.4, z - 0.2))}
          className="p-2 rounded-xl text-[#94a3b8] active:text-white active:bg-white/[0.08]"
        >
          <ZoomOut size={18} />
        </button>
        <button
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          className="p-2 rounded-xl text-[#94a3b8] active:text-white active:bg-white/[0.08]"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Selected Node Card info */}
      {selectedNode && (
        <div className="absolute bottom-4 left-4 right-4 z-10 bg-[#14151e]/95 backdrop-blur-lg border border-[#8052ff]/40 p-3.5 rounded-2xl flex items-center justify-between shadow-2xl animate-fade-in">
          <div className="truncate mr-2">
            <h4 className="text-xs font-bold text-white truncate">{selectedNode.title}</h4>
            <span className="text-[10px] text-[#8052ff]">
              Связей: {selectedNode.connections.length}
            </span>
          </div>
          <button
            onClick={() => {
              setActiveNeuronId(selectedNode.id);
              setActiveTab('notes');
            }}
            className="px-3 py-1.5 rounded-xl bg-[#8052ff] text-white font-semibold text-xs shrink-0 shadow-md"
          >
            Открыть
          </button>
        </div>
      )}

      {/* Canvas view */}
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight - 130}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="w-full h-full touch-none"
      />
    </div>
  );
};
