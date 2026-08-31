import React, { useEffect, useState } from 'react';
import { Wifi, Zap, FileText, Activity, ShieldCheck } from 'lucide-react';
import { useBrainStore } from '../../store/useBrainStore';
import { NeuralNotebookLogo } from '../brand/NeuralNotebookLogo';

export const StatusBar: React.FC = () => {
  const { vaultName, neurons, activeNeuronId, tabs, activeTabId, setSyncOpen } = useBrainStore();

  const [fps, setFps] = useState(60);

  // FPS monitor for live telemetry
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const measure = (now: number) => {
      frameCount++;
      if (now - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(measure);
    };

    animId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(animId);
  }, []);

  const totalSynapses = neurons.reduce((acc, n) => acc + (n.outlinks?.length || 0), 0);
  const activeNeuron = neurons.find((n) => n.id === activeNeuronId);
  const activeTab = tabs.find((t) => t.id === activeTabId);

  const wordCount = activeNeuron?.content
    ? activeNeuron.content.split(/\s+/).filter(Boolean).length
    : 0;

  const charCount = activeNeuron?.content ? activeNeuron.content.length : 0;

  return (
    <footer className="h-6 bg-[#0a0b0e] border-t border-white/[0.08] flex items-center justify-between px-3 text-[10px] text-[#94a3b8] select-none z-30 shrink-0 font-sans tracking-tight">
      {/* Left: Vault & Neural Graph Stats */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5 text-white font-semibold">
          <NeuralNotebookLogo size={12} glow={false} />
          <span>{vaultName}</span>
        </div>

        <span className="text-white/10">|</span>
        <span className="text-[#cbd5e1] font-mono">{neurons.length} мыслей</span>

        <span className="text-white/10">|</span>
        <span className="flex items-center gap-1 text-[#38bdf8] font-mono">
          <Zap size={10} />
          <span>{totalSynapses} связей</span>
        </span>
      </div>

      {/* Center: Live Performance Telemetry */}
      <div className="hidden md:flex items-center gap-2.5 text-[#64748b] font-mono">
        <span className="flex items-center gap-1 text-[#10b981]">
          <Activity size={10} />
          <span>{fps} FPS</span>
        </span>
        <span className="text-white/10">·</span>
        <span>0ms задержка</span>
        <span className="text-white/10">·</span>
        <span className="text-[#7c5cff]">WebGL 2.0 Turbo</span>
      </div>

      {/* Right: Active Note Words & Sync Status */}
      <div className="flex items-center gap-2.5">
        {activeTab?.type === 'note' && (
          <>
            <span className="font-mono text-[#cbd5e1]">{wordCount} слов ({charCount} симв.)</span>
            <span className="text-white/10">|</span>
          </>
        )}

        <button
          onClick={() => setSyncOpen(true)}
          className="flex items-center gap-1.5 text-[#10b981] hover:text-white transition-colors cursor-pointer"
          title="Синхронизация по Bluetooth / Local Wi-Fi (P2P)"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
          <span>P2P Mesh: Готов</span>
        </button>
      </div>
    </footer>
  );
};
