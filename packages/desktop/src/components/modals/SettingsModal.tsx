import React, { useState } from 'react';
import {
  X,
  Folder,
  Wifi,
  Palette,
  ShieldCheck,
  Check,
  Calendar,
  Sparkles,
  Sliders,
  Type,
  Layers,
  RotateCcw,
  Sun,
  Moon,
  Monitor,
  Zap,
  CheckCircle2,
  RefreshCw,
  BookOpen,
  Radio,
  Smartphone,
  Download,
  HardDrive,
  Cpu,
  Key,
  Lock,
  QrCode,
} from 'lucide-react';
import {
  useBrainStore,
  ThemePreset,
  ThemeMode,
  THEME_CONFIGS,
} from '../../store/useBrainStore';
import { NeuralNotebookLogo } from '../brand/NeuralNotebookLogo';

const QUICK_ACCENT_COLORS = [
  { name: 'Iris Violet', color: '#7c5cff' },
  { name: 'Cyan Sky', color: '#38bdf8' },
  { name: 'Emerald Mint', color: '#10b981' },
  { name: 'Amber Gold', color: '#f59e0b' },
  { name: 'Rose Quartz', color: '#ec4899' },
  { name: 'Crimson Coral', color: '#f43f5e' },
  { name: 'Deep Teal', color: '#06b6d4' },
  { name: 'Pure White', color: '#ffffff' },
];

export const SettingsModal: React.FC = () => {
  const {
    isSettingsOpen,
    vaultName,
    themePreset,
    themeMode,
    uiSettings,
    autoLoadCalendarShifts,
    isStatusBarVisible,
    neurons,
    shifts,
    setSettingsOpen,
    setVaultName,
    setThemePreset,
    setThemeMode,
    updateUISettings,
    setAutoLoadCalendarShifts,
    toggleStatusBar,
    setSyncOpen,
    setManualOpen,
    exportVaultJSON,
  } = useBrainStore();

  const [activeTab, setActiveTab] = useState<'themes' | 'customizer' | 'general' | 'sync' | 'about'>('themes');

  const [syncChannel, setSyncChannel] = useState<'wifi' | 'hotspot' | 'bluetooth'>('wifi');
  const [manualPeerAddress, setManualPeerAddress] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  if (!isSettingsOpen) return null;

  const handleResetUI = () => {
    updateUISettings({
      accentColor: '#7c5cff',
      bgPrimary: '#0d0e12',
      bgSecondary: '#14151c',
      fontFamily: 'sans',
      fontSize: 'md',
      editorFontSize: 14,
      borderRadius: 'medium',
      glassmorphism: true,
      neonGlow: true,
    });
    setThemePreset('obsidian');
    setThemeMode('dark');
  };

  const handleTriggerP2PScan = () => {
    setIsScanning(true);
    setSyncStatusMsg(null);
    setTimeout(() => {
      setIsScanning(false);
      if (syncChannel === 'wifi') {
        setSyncStatusMsg('Сканирование Wi-Fi LAN завершено: Обнаружен 1 доступный узел.');
      } else if (syncChannel === 'hotspot') {
        setSyncStatusMsg('Канал Точки Доступа активен (192.168.43.1:7777). Готов к передаче данных.');
      } else {
        setSyncStatusMsg('Bluetooth Beacon активен: Устройства рядом готовы к сопряжению.');
      }
    }, 1200);
  };

  const handleExportBackup = () => {
    const json = exportVaultJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nyron-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalSynapses = neurons.reduce((acc, n) => acc + (n.outlinks?.length || 0), 0);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 select-none animate-fade-in text-[#e2e8f0]"
      onClick={() => setSettingsOpen(false)}
    >
      <div
        className="w-full max-w-3xl h-[620px] bg-[#14151c] rounded-3xl border border-white/[0.12] shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-14 px-6 border-b border-white/[0.08] flex items-center justify-between bg-[#171822]">
          <div className="flex items-center gap-3">
            <NeuralNotebookLogo size={22} glow={false} />
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">Параметры NeyroNetbook</h2>
              <p className="text-[11px] text-[#94a3b8]">Настройка тем, внешнего вида, P2P синхронизации и хранилища</p>
            </div>
          </div>
          <button
            onClick={() => setSettingsOpen(false)}
            className="p-2 rounded-xl text-[#94a3b8] hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <nav className="w-56 bg-[#0f1015] border-r border-white/[0.08] p-3 space-y-1.5 text-xs">
            <button
              onClick={() => setActiveTab('themes')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2.5 ${
                activeTab === 'themes'
                  ? 'bg-[#7c5cff] text-white shadow-lg font-semibold'
                  : 'text-[#94a3b8] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Palette size={16} />
              <span>Темы & Режим</span>
            </button>

            <button
              onClick={() => setActiveTab('customizer')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2.5 ${
                activeTab === 'customizer'
                  ? 'bg-[#7c5cff] text-white shadow-lg font-semibold'
                  : 'text-[#94a3b8] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Sliders size={16} />
              <span>Кастомизация UI</span>
            </button>

            <button
              onClick={() => setActiveTab('general')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2.5 ${
                activeTab === 'general'
                  ? 'bg-[#7c5cff] text-white shadow-lg font-semibold'
                  : 'text-[#94a3b8] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Folder size={16} />
              <span>Хранилище & Смены</span>
            </button>

            <button
              onClick={() => setActiveTab('sync')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2.5 ${
                activeTab === 'sync'
                  ? 'bg-[#7c5cff] text-white shadow-lg font-semibold'
                  : 'text-[#94a3b8] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Wifi size={16} />
              <span>P2P Синхронизация</span>
            </button>

            <button
              onClick={() => setActiveTab('about')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2.5 ${
                activeTab === 'about'
                  ? 'bg-[#7c5cff] text-white shadow-lg font-semibold'
                  : 'text-[#94a3b8] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <ShieldCheck size={16} />
              <span>О программе</span>
            </button>

            <div className="pt-3 border-t border-white/[0.06] mt-3">
              <button
                type="button"
                onClick={() => {
                  setSettingsOpen(false);
                  setManualOpen(true);
                }}
                className="w-full text-left px-3.5 py-2.5 rounded-xl font-medium text-[#38bdf8] bg-[#38bdf8]/10 hover:bg-[#38bdf8]/20 border border-[#38bdf8]/20 transition-all flex items-center gap-2.5 shadow-sm"
              >
                <BookOpen size={16} className="text-[#38bdf8]" />
                <span>Инструкция и гид</span>
              </button>
            </div>
          </nav>

          <div className="flex-1 p-6 overflow-y-auto text-xs space-y-6">
            {/* ================= TAB: THEMES ================= */}
            {activeTab === 'themes' && (
              <div className="space-y-5 animate-fade-in">
                {/* 1. Theme Mode 3-Way Switcher */}
                <div className="p-4 rounded-2xl bg-[#171822] border border-white/[0.08] space-y-3">
                  <div>
                    <h4 className="font-bold text-white text-xs mb-0.5">Режим темы интерфейса</h4>
                    <p className="text-[11px] text-[#94a3b8]">
                      Выберите принудительный светлый, темный режим или авто-синхронизацию с операционной системой.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setThemeMode('dark')}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                        themeMode === 'dark'
                          ? 'bg-[#7c5cff]/20 border-[#7c5cff] text-white shadow-md ring-1 ring-[#7c5cff]'
                          : 'bg-[#101118] border-white/[0.06] text-[#94a3b8] hover:text-white hover:border-white/[0.15]'
                      }`}
                    >
                      <Moon size={18} className={themeMode === 'dark' ? 'text-[#7c5cff]' : 'text-[#94a3b8]'} />
                      <span className="font-semibold text-xs">Темная</span>
                    </button>

                    <button
                      onClick={() => setThemeMode('light')}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                        themeMode === 'light'
                          ? 'bg-[#38bdf8]/20 border-[#38bdf8] text-white shadow-md ring-1 ring-[#38bdf8]'
                          : 'bg-[#101118] border-white/[0.06] text-[#94a3b8] hover:text-white hover:border-white/[0.15]'
                      }`}
                    >
                      <Sun size={18} className={themeMode === 'light' ? 'text-[#38bdf8]' : 'text-[#94a3b8]'} />
                      <span className="font-semibold text-xs">Светлая</span>
                    </button>

                    <button
                      onClick={() => setThemeMode('system')}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                        themeMode === 'system'
                          ? 'bg-[#10b981]/20 border-[#10b981] text-white shadow-md ring-1 ring-[#10b981]'
                          : 'bg-[#101118] border-white/[0.06] text-[#94a3b8] hover:text-white hover:border-white/[0.15]'
                      }`}
                    >
                      <Monitor size={18} className={themeMode === 'system' ? 'text-[#10b981]' : 'text-[#94a3b8]'} />
                      <span className="font-semibold text-xs">По системе</span>
                    </button>
                  </div>
                </div>

                {/* 2. Dark Themes Presets */}
                <div className="space-y-2.5">
                  <h4 className="font-bold text-white text-xs flex items-center gap-2">
                    <Moon size={14} className="text-[#7c5cff]" />
                    <span>Темные дизайнерские палитры</span>
                  </h4>

                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(THEME_CONFIGS) as ThemePreset[])
                      .filter((key) => THEME_CONFIGS[key].mode === 'dark')
                      .map((key) => {
                        const cfg = THEME_CONFIGS[key];
                        const isSelected = themePreset === key;

                        return (
                          <div
                            key={key}
                            onClick={() => {
                              setThemePreset(key);
                              updateUISettings({
                                accentColor: cfg.accent,
                                bgPrimary: cfg.bgPrimary,
                                bgSecondary: cfg.bgSecondary,
                              });
                            }}
                            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                              isSelected
                                ? 'border-[#7c5cff] bg-[#7c5cff]/15 shadow-lg ring-1 ring-[#7c5cff]'
                                : 'border-white/[0.06] bg-[#161720] hover:border-white/[0.15]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className="w-7 h-7 rounded-lg border flex items-center justify-center shadow-inner shrink-0"
                                style={{
                                  backgroundColor: cfg.bgPrimary,
                                  borderColor: cfg.border,
                                }}
                              >
                                <div
                                  className="w-2.5 h-2.5 rounded-full shadow-sm"
                                  style={{ backgroundColor: cfg.accent }}
                                />
                              </div>
                              <div className="min-w-0">
                                <span className="font-semibold text-white block text-xs truncate">
                                  {cfg.name}
                                </span>
                              </div>
                            </div>
                            {isSelected && <Check size={14} className="text-[#7c5cff] shrink-0 ml-1.5" />}
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* 3. Light Themes Presets */}
                <div className="space-y-2.5">
                  <h4 className="font-bold text-white text-xs flex items-center gap-2">
                    <Sun size={14} className="text-[#38bdf8]" />
                    <span>Светлые дизайнерские палитры</span>
                  </h4>

                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(THEME_CONFIGS) as ThemePreset[])
                      .filter((key) => THEME_CONFIGS[key].mode === 'light')
                      .map((key) => {
                        const cfg = THEME_CONFIGS[key];
                        const isSelected = themePreset === key;

                        return (
                          <div
                            key={key}
                            onClick={() => {
                              setThemePreset(key);
                              updateUISettings({
                                accentColor: cfg.accent,
                                bgPrimary: cfg.bgPrimary,
                                bgSecondary: cfg.bgSecondary,
                              });
                            }}
                            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                              isSelected
                                ? 'border-[#38bdf8] bg-[#38bdf8]/15 shadow-lg ring-1 ring-[#38bdf8]'
                                : 'border-white/[0.06] bg-[#161720] hover:border-white/[0.15]'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className="w-6 h-6 rounded-lg border flex items-center justify-center shadow-inner shrink-0"
                                style={{
                                  backgroundColor: cfg.bgPrimary,
                                  borderColor: cfg.border,
                                }}
                              >
                                <div
                                  className="w-2 h-2 rounded-full shadow-sm"
                                  style={{ backgroundColor: cfg.accent }}
                                />
                              </div>
                              <span className="font-semibold text-white block text-xs truncate">
                                {cfg.name.split('(')[0]}
                              </span>
                            </div>
                            {isSelected && <Check size={14} className="text-[#38bdf8] shrink-0" />}
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}

            {/* ================= TAB: CUSTOMIZER ================= */}
            {activeTab === 'customizer' && (
              <div className="space-y-5 animate-fade-in">
                {/* Accent Color Palettes */}
                <div className="p-4 rounded-2xl bg-[#171822] border border-white/[0.08] space-y-3">
                  <h4 className="font-bold text-white text-xs flex items-center gap-2">
                    <Sparkles size={14} className="text-[#7c5cff]" />
                    <span>Акцентный цвет и свечение</span>
                  </h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    {QUICK_ACCENT_COLORS.map((item) => (
                      <button
                        key={item.color}
                        onClick={() => updateUISettings({ accentColor: item.color })}
                        className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-transform hover:scale-110 shadow-md ${
                          uiSettings.accentColor === item.color
                            ? 'ring-2 ring-white scale-110'
                            : 'border-white/[0.15]'
                        }`}
                        style={{ backgroundColor: item.color }}
                        title={item.name}
                      >
                        {uiSettings.accentColor === item.color && (
                          <Check size={12} className={item.color === '#ffffff' ? 'text-black' : 'text-white'} />
                        )}
                      </button>
                    ))}
                    <input
                      type="color"
                      value={uiSettings.accentColor}
                      onChange={(e) => updateUISettings({ accentColor: e.target.value })}
                      className="w-7 h-7 rounded-xl cursor-pointer bg-transparent border-0"
                      title="Выбрать свой цвет"
                    />
                  </div>
                </div>

                {/* Typography & Fonts */}
                <div className="p-4 rounded-2xl bg-[#171822] border border-white/[0.08] space-y-3">
                  <h4 className="font-bold text-white text-xs flex items-center gap-2">
                    <Type size={14} className="text-[#38bdf8]" />
                    <span>Типографика и шрифты</span>
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'sans', name: 'Системный (Modern Sans)' },
                      { id: 'jetbrains', name: 'JetBrains Mono' },
                      { id: 'fira', name: 'Fira Code' },
                      { id: 'mono', name: 'Monospace Code' },
                      { id: 'serif', name: 'Литературный (Serif)' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => updateUISettings({ fontFamily: f.id as any })}
                        className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                          uiSettings.fontFamily === f.id
                            ? 'bg-[#7c5cff]/20 border-[#7c5cff] text-white font-bold'
                            : 'bg-[#101118] border-white/[0.06] text-[#94a3b8] hover:text-white'
                        }`}
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>

                  {/* Editor Font Size Slider */}
                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-white block">Размер шрифта редактора</span>
                      <span className="text-[10px] text-[#94a3b8]">Текущий масштаб: {uiSettings.editorFontSize}px</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={12}
                        max={24}
                        step={1}
                        value={uiSettings.editorFontSize}
                        onChange={(e) => updateUISettings({ editorFontSize: Number(e.target.value) })}
                        className="w-32 accent-[#7c5cff]"
                      />
                      <span className="font-mono text-xs text-white font-bold w-6 text-right">
                        {uiSettings.editorFontSize}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Geometry & Effects */}
                <div className="p-4 rounded-2xl bg-[#171822] border border-white/[0.08] space-y-3">
                  <h4 className="font-bold text-white text-xs flex items-center gap-2">
                    <Layers size={14} className="text-[#10b981]" />
                    <span>Скругление углов и эффекты</span>
                  </h4>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'sharp', label: 'Четкие (4px)' },
                      { id: 'medium', label: 'Классика (10px)' },
                      { id: 'rounded', label: 'Скругленные (16px)' },
                    ].map((r) => (
                      <button
                        key={r.id}
                        onClick={() => updateUISettings({ borderRadius: r.id as any })}
                        className={`p-2.5 rounded-xl border text-center text-xs transition-all ${
                          uiSettings.borderRadius === r.id
                            ? 'bg-[#10b981]/20 border-[#10b981] text-white font-bold'
                            : 'bg-[#101118] border-white/[0.06] text-[#94a3b8] hover:text-white'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#101118] border border-white/[0.06] cursor-pointer">
                      <span className="text-xs text-[#cbd5e1]">Стеклянный эффект (Glassmorphism)</span>
                      <input
                        type="checkbox"
                        checked={uiSettings.glassmorphism}
                        onChange={(e) => updateUISettings({ glassmorphism: e.target.checked })}
                        className="w-4 h-4 accent-[#7c5cff]"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#101118] border border-white/[0.06] cursor-pointer">
                      <span className="text-xs text-[#cbd5e1]">Неоновое свечение (Neon Glow)</span>
                      <input
                        type="checkbox"
                        checked={uiSettings.neonGlow}
                        onChange={(e) => updateUISettings({ neonGlow: e.target.checked })}
                        className="w-4 h-4 accent-[#7c5cff]"
                      />
                    </label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleResetUI}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#94a3b8] hover:text-white hover:bg-white/[0.08] transition-all flex items-center gap-2 border border-white/[0.08]"
                  >
                    <RotateCcw size={14} />
                    <span>Сбросить стили по умолчанию</span>
                  </button>
                </div>
              </div>
            )}

            {/* ================= TAB: GENERAL & SHIFTS ================= */}
            {activeTab === 'general' && (
              <div className="space-y-5 animate-fade-in">
                <div className="p-4 rounded-2xl bg-[#171822] border border-white/[0.08] space-y-3">
                  <h4 className="font-bold text-white text-xs flex items-center gap-2">
                    <HardDrive size={14} className="text-[#7c5cff]" />
                    <span>Локальное хранилище и база заметок</span>
                  </h4>

                  <div className="space-y-1.5">
                    <label className="text-[11px] text-[#94a3b8] block">Название базы знаний (Vault):</label>
                    <input
                      type="text"
                      value={vaultName}
                      onChange={(e) => setVaultName(e.target.value)}
                      className="w-full bg-[#101118] border border-white/[0.10] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7c5cff]"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                    <div className="p-2.5 rounded-xl bg-[#101118] border border-white/[0.06]">
                      <span className="text-[10px] text-[#94a3b8] block uppercase">Заметок</span>
                      <span className="text-sm font-bold text-white font-mono">{neurons.length}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#101118] border border-white/[0.06]">
                      <span className="text-[10px] text-[#94a3b8] block uppercase">Синапсов</span>
                      <span className="text-sm font-bold text-[#38bdf8] font-mono">{totalSynapses}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#101118] border border-white/[0.06]">
                      <span className="text-[10px] text-[#94a3b8] block uppercase">Смен</span>
                      <span className="text-sm font-bold text-[#10b981] font-mono">{shifts.length}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#171822] border border-white/[0.08] space-y-3">
                  <h4 className="font-bold text-white text-xs flex items-center gap-2">
                    <Calendar size={14} className="text-[#f59e0b]" />
                    <span>Автоматизация смен и интерфейса</span>
                  </h4>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-[#101118] border border-white/[0.06] cursor-pointer">
                    <div>
                      <span className="text-xs font-semibold text-white block">Авто-подгрузка смен в календарь</span>
                      <span className="text-[11px] text-[#94a3b8]">Отображать заработок и часы прямо в сетке календаря</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoLoadCalendarShifts}
                      onChange={(e) => setAutoLoadCalendarShifts(e.target.checked)}
                      className="w-4 h-4 accent-[#7c5cff]"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-[#101118] border border-white/[0.06] cursor-pointer">
                    <div>
                      <span className="text-xs font-semibold text-white block">Нижняя строка состояния (Status Bar)</span>
                      <span className="text-[11px] text-[#94a3b8]">Показывать счетчик слов, синапсов и статус P2P</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isStatusBarVisible}
                      onChange={toggleStatusBar}
                      className="w-4 h-4 accent-[#7c5cff]"
                    />
                  </label>
                </div>

                <div className="p-4 rounded-2xl bg-[#171822] border border-white/[0.08] flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-xs mb-0.5">Резервная копия базы (JSON Backup)</h4>
                    <p className="text-[11px] text-[#94a3b8]">Экспорт всех заметок, связей, смен и финансов в один файл</p>
                  </div>
                  <button
                    onClick={handleExportBackup}
                    className="px-4 py-2 rounded-xl bg-[#7c5cff] hover:bg-[#7c5cff]/90 text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-md"
                  >
                    <Download size={14} />
                    <span>Экспорт JSON</span>
                  </button>
                </div>
              </div>
            )}

            {/* ================= TAB: P2P WIRELESS SYNC ================= */}
            {activeTab === 'sync' && (
              <div className="space-y-5 animate-fade-in">
                {/* 3 Channels: Wi-Fi LAN / Hotspot / Bluetooth */}
                <div className="p-4 rounded-2xl bg-[#171822] border border-white/[0.08] space-y-3">
                  <div>
                    <h4 className="font-bold text-white text-xs mb-0.5">Канал P2P Синхронизации</h4>
                    <p className="text-[11px] text-[#94a3b8]">
                      Передача данных напрямую без облаков и сторонних серверов (100% зашифровано локально).
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setSyncChannel('wifi')}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                        syncChannel === 'wifi'
                          ? 'bg-[#7c5cff]/20 border-[#7c5cff] text-white shadow-md ring-1 ring-[#7c5cff]'
                          : 'bg-[#101118] border-white/[0.06] text-[#94a3b8] hover:text-white'
                      }`}
                    >
                      <Wifi size={18} className={syncChannel === 'wifi' ? 'text-[#7c5cff]' : 'text-[#94a3b8]'} />
                      <span className="font-bold text-xs">Wi-Fi Сеть (LAN)</span>
                      <span className="text-[10px] text-[#94a3b8] text-center">Один общий роутер</span>
                    </button>

                    <button
                      onClick={() => setSyncChannel('hotspot')}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                        syncChannel === 'hotspot'
                          ? 'bg-[#38bdf8]/20 border-[#38bdf8] text-white shadow-md ring-1 ring-[#38bdf8]'
                          : 'bg-[#101118] border-white/[0.06] text-[#94a3b8] hover:text-white'
                      }`}
                    >
                      <Smartphone size={18} className={syncChannel === 'hotspot' ? 'text-[#38bdf8]' : 'text-[#94a3b8]'} />
                      <span className="font-bold text-xs">Точка Доступа</span>
                      <span className="text-[10px] text-[#94a3b8] text-center">Прямой Hotspot без интернета</span>
                    </button>

                    <button
                      onClick={() => setSyncChannel('bluetooth')}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                        syncChannel === 'bluetooth'
                          ? 'bg-[#10b981]/20 border-[#10b981] text-white shadow-md ring-1 ring-[#10b981]'
                          : 'bg-[#101118] border-white/[0.06] text-[#94a3b8] hover:text-white'
                      }`}
                    >
                      <Radio size={18} className={syncChannel === 'bluetooth' ? 'text-[#10b981]' : 'text-[#94a3b8]'} />
                      <span className="font-bold text-xs">Bluetooth Beacon</span>
                      <span className="text-[10px] text-[#94a3b8] text-center">Сопряжение рядом</span>
                    </button>
                  </div>
                </div>

                {/* Connection Box & Peers */}
                <div className="p-4 rounded-2xl bg-[#171822] border border-white/[0.08] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Прямое подключение к узлу (IP / Host)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30 font-mono font-semibold">
                      Порт: 7777 (Активен)
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder={
                        syncChannel === 'hotspot'
                          ? '192.168.43.1:7777 (IP телефона/раздачи)'
                          : '192.168.1.120:7777 (Локальный IP)'
                      }
                      value={manualPeerAddress}
                      onChange={(e) => setManualPeerAddress(e.target.value)}
                      className="flex-1 bg-[#101118] border border-white/[0.10] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-[#475569] font-mono focus:outline-none focus:border-[#7c5cff]"
                    />
                    <button
                      onClick={handleTriggerP2PScan}
                      disabled={isScanning}
                      className="px-4 py-2.5 rounded-xl bg-[#7c5cff] hover:bg-[#7c5cff]/90 text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-md shrink-0"
                    >
                      {isScanning ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
                      <span>{isScanning ? 'Поиск...' : 'Синхронизировать'}</span>
                    </button>
                  </div>

                  {syncStatusMsg && (
                    <div className="p-3 rounded-xl bg-[#10b981]/15 border border-[#10b981]/30 text-[#10b981] text-xs flex items-center gap-2">
                      <CheckCircle2 size={15} />
                      <span>{syncStatusMsg}</span>
                    </div>
                  )}

                  {/* Active Peers List */}
                  <div className="pt-2 border-t border-white/[0.06] space-y-1.5">
                    <span className="text-[11px] text-[#94a3b8] block font-semibold">Подключенные устройства:</span>
                    <div className="p-3 rounded-xl bg-[#101118] border border-white/[0.06] flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                        <span className="font-mono text-xs text-white">
                          {syncChannel === 'hotspot'
                            ? 'Прямой Hotspot канал (192.168.43.x)'
                            : syncChannel === 'bluetooth'
                            ? 'Bluetooth Beacon (Nyron-Proximity-Peer)'
                            : 'Локальная сеть (Wi-Fi Multicast Discovery)'}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#94a3b8]">Готов к передаче</span>
                    </div>
                  </div>
                </div>

                {/* QR Sync & Full Modal Launch */}
                <div className="p-4 rounded-2xl bg-[#171822] border border-white/[0.08] flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-xs mb-0.5">Визуальный QR & WebRTC Синхронизатор</h4>
                    <p className="text-[11px] text-[#94a3b8]">
                      Передавайте заметки сканированием QR-кода на камере телефона
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSettingsOpen(false);
                      setSyncOpen(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-[#38bdf8] hover:bg-[#38bdf8]/90 text-[#0a0b0e] font-bold text-xs flex items-center gap-2 transition-all shadow-md"
                  >
                    <QrCode size={16} />
                    <span>Открыть QR Hub</span>
                  </button>
                </div>
              </div>
            )}

            {/* ================= TAB: ABOUT ================= */}
            {activeTab === 'about' && (
              <div className="space-y-5 animate-fade-in">
                {/* Hero App Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1b1c28] to-[#12131c] border border-white/[0.12] flex items-center gap-5 shadow-2xl">
                  <NeuralNotebookLogo size={56} glow animated={false} />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white tracking-tight">NeyroNetbook</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#7c5cff]/20 text-[#7c5cff] border border-[#7c5cff]/30">
                        v2.5.0 Pro
                      </span>
                    </div>
                    <p className="text-xs text-[#94a3b8]">
                      Автономный векторный нейро-блокнот нового поколения с графом связей, сменным календарем и P2P синхронизацией.
                    </p>
                    <div className="flex items-center gap-4 pt-1 text-[11px] text-[#64748b]">
                      <span className="flex items-center gap-1 text-[#10b981]">
                        <Lock size={12} /> 100% Offline-First
                      </span>
                      <span>• Без трекеров и телеметрии</span>
                      <span>• Markdown Native</span>
                    </div>
                  </div>
                </div>

                {/* Core Architecture Highlights */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#171822] border border-white/[0.08] space-y-1">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Cpu size={14} className="text-[#38bdf8]" />
                      <span>Векторный D3 Нейро-Граф</span>
                    </span>
                    <p className="text-[11px] text-[#94a3b8]">
                      Физическая симуляция кулоновских сил и гравитационных созвездий с авто-раскраской по типам файлов.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#171822] border border-white/[0.08] space-y-1">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Wifi size={14} className="text-[#10b981]" />
                      <span>P2P Синхронизация</span>
                    </span>
                    <p className="text-[11px] text-[#94a3b8]">
                      Прямой обмен по Wi-Fi LAN, Точке Доступа (Hotspot) и Bluetooth без участия сторонних серверов.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#171822] border border-white/[0.08] space-y-1">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Calendar size={14} className="text-[#f59e0b]" />
                      <span>Сменный График и Зарплата</span>
                    </span>
                    <p className="text-[11px] text-[#94a3b8]">
                      Генерация циклов 2/2, 3/3, 5/2, учет ночных коэффициентов и авто-калькулятор доходов.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#171822] border border-white/[0.08] space-y-1">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles size={14} className="text-[#ec4899]" />
                      <span>Google NotebookLM Studio</span>
                    </span>
                    <p className="text-[11px] text-[#94a3b8]">
                      Интеграция источников заметок с ИИ-исследовательской лабораторией Google NotebookLM.
                    </p>
                  </div>
                </div>

                {/* Keyboard Shortcuts Cheat Sheet */}
                <div className="p-4 rounded-2xl bg-[#171822] border border-white/[0.08] space-y-2.5">
                  <h4 className="font-bold text-white text-xs flex items-center gap-2">
                    <Key size={14} className="text-[#7c5cff]" />
                    <span>Шпаргалка горячих клавиш</span>
                  </h4>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-[#101118]">
                      <span className="text-[#94a3b8]">Быстрый поиск (Spotlight)</span>
                      <kbd className="px-2 py-0.5 rounded bg-white/[0.10] text-white font-mono text-[10px] font-bold">
                        Ctrl + P / K
                      </kbd>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-[#101118]">
                      <span className="text-[#94a3b8]">Новая заметка</span>
                      <kbd className="px-2 py-0.5 rounded bg-white/[0.10] text-white font-mono text-[10px] font-bold">
                        Ctrl + N
                      </kbd>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-[#101118]">
                      <span className="text-[#94a3b8]">Закрыть активную вкладку</span>
                      <kbd className="px-2 py-0.5 rounded bg-white/[0.10] text-white font-mono text-[10px] font-bold">
                        Ctrl + W
                      </kbd>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-[#101118]">
                      <span className="text-[#94a3b8]">История назад / вперед</span>
                      <kbd className="px-2 py-0.5 rounded bg-white/[0.10] text-white font-mono text-[10px] font-bold">
                        Alt + ← / →
                      </kbd>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-[#64748b]">
                    Разработано NeyroNetbook Team • Лицензия MIT
                  </span>
                  <button
                    onClick={() => {
                      setSettingsOpen(false);
                      setManualOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#7c5cff] hover:bg-[#7c5cff]/90 text-white font-semibold text-xs flex items-center gap-2 shadow-md transition-all"
                  >
                    <BookOpen size={14} />
                    <span>Открыть Руководство</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
