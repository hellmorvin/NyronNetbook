import React from 'react';
import {
  Plus,
  ArrowRight,
  Zap,
  FileText,
} from 'lucide-react';
import { useBrainStore } from '../../store/useBrainStore';
import { NeuralNotebookLogo } from '../brand/NeuralNotebookLogo';
import {
  IconTargetGoal,
  IconDayShift,
  IconGraph2D,
  IconStickyNote,
  IconWalletCapital,
  IconBookGuide,
  IconSearchSpotlight,
} from '../icons/CustomNeironoIcons';

export const WelcomeView: React.FC = () => {
  const {
    vaultName,
    neurons,
    shifts,
    savingsGoals,
    addNeuron,
    openNote,
    openTab,
    setSearchOpen,
    setManualOpen,
  } = useBrainStore();

  const handleCreateNote = () => {
    const newNote = addNeuron('Новая мысль');
    openNote(newNote.id);
  };

  const totalSynapses = neurons.reduce((acc, n) => acc + (n.outlinks?.length || 0), 0);

  const monthEarnings = shifts
    .filter((s) => s.type !== 'off' && s.type !== 'vacation')
    .reduce((acc, s) => acc + s.earnings, 0);

  const mainGoal = savingsGoals[0];

  return (
    <div className="flex-1 h-full bg-[#0d0e12] overflow-y-auto p-8 text-[#e2e8f0] select-none">
      <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-16">
        {/* Header Hero */}
        <div className="flex items-center justify-between p-7 rounded-3xl bg-gradient-to-r from-[#171824] via-[#14151e] to-[#12131a] border border-white/[0.12] shadow-2xl backdrop-blur-xl">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <NeuralNotebookLogo size={28} glow animated={false} />
              <span className="text-xs font-bold uppercase tracking-widest text-[#7c5cff] bg-[#7c5cff]/10 px-2.5 py-1 rounded-full border border-[#7c5cff]/20">
                Командный центр
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Добро пожаловать в {vaultName}
            </h1>
            <p className="text-sm text-[#94a3b8]">
              Автономный векторный блокнот: нейро-граф связей, холст, сменный календарь и финансы
            </p>
          </div>

          <button
            onClick={handleCreateNote}
            className="px-5 py-3 rounded-2xl bg-[#7c5cff] hover:bg-[#7c5cff]/90 text-white font-bold text-sm flex items-center gap-2.5 shadow-xl shadow-[#7c5cff]/25 transition-all hover:scale-105"
          >
            <Plus size={18} />
            <span>+ Новая мысль</span>
          </button>
        </div>

        {/* 4 Large Telemetry Metric Widgets */}
        <div className="grid grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-[#14151e] border border-white/[0.08] flex items-center justify-between shadow-xl hover:border-white/[0.16] transition-all group">
            <div className="space-y-1">
              <span className="text-[11px] text-[#94a3b8] uppercase font-bold tracking-wider block">
                Всего заметок
              </span>
              <span className="text-3xl font-black text-white font-mono block">
                {neurons.length}
              </span>
              <span className="text-[10px] text-[#64748b] font-medium block">
                Локальная база знаний
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#7c5cff]/15 text-[#7c5cff] border border-[#7c5cff]/30 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
              <FileText size={22} />
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-[#14151e] border border-white/[0.08] flex items-center justify-between shadow-xl hover:border-white/[0.16] transition-all group">
            <div className="space-y-1">
              <span className="text-[11px] text-[#94a3b8] uppercase font-bold tracking-wider block">
                Нейро-связи D3
              </span>
              <span className="text-3xl font-black text-[#38bdf8] font-mono block">
                {totalSynapses}
              </span>
              <span className="text-[10px] text-[#64748b] font-medium block">
                Активных синапсов
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
              <Zap size={22} />
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-[#14151e] border border-white/[0.08] flex items-center justify-between shadow-xl hover:border-white/[0.16] transition-all group">
            <div className="space-y-1">
              <span className="text-[11px] text-[#94a3b8] uppercase font-bold tracking-wider block">
                Заработок смен
              </span>
              <span className="text-2xl font-black text-[#10b981] font-mono block">
                {monthEarnings.toLocaleString('ru-RU')} ₽
              </span>
              <span className="text-[10px] text-[#64748b] font-medium block">
                Всего смен: {shifts.length}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
              <IconWalletCapital size={22} color="#10b981" />
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-[#14151e] border border-white/[0.08] flex items-center justify-between shadow-xl hover:border-white/[0.16] transition-all group">
            <div className="space-y-1 min-w-0">
              <span className="text-[11px] text-[#94a3b8] uppercase font-bold tracking-wider block">
                Главная цель
              </span>
              <span className="text-lg font-black text-[#f59e0b] truncate block max-w-[130px]">
                {mainGoal ? mainGoal.title : 'Не задана'}
              </span>
              {mainGoal ? (
                <div className="w-24 bg-white/[0.08] h-1.5 rounded-full overflow-hidden mt-1">
                  <div
                    className="bg-[#f59e0b] h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(((mainGoal.currentAmount || 0) / (mainGoal.targetAmount || 1)) * 100)
                      )}%`,
                    }}
                  />
                </div>
              ) : (
                <span className="text-[10px] text-[#64748b] font-medium block">
                  Финансовый план
                </span>
              )}
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md shrink-0">
              <IconTargetGoal size={22} color="#f59e0b" />
            </div>
          </div>
        </div>

        {/* Main 6 Launch Modules */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">
              Быстрый запуск модулей
            </h3>
            <span className="text-[11px] text-[#64748b]">
              Выберите модуль для начала работы
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div
              onClick={() => openTab({ type: 'graph', title: 'Граф' })}
              className="p-5 rounded-3xl bg-[#14151e] border border-white/[0.08] hover:border-[#7c5cff]/60 hover:bg-[#181926] transition-all cursor-pointer group shadow-xl"
            >
              <div className="flex items-center justify-between mb-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#7c5cff]/15 text-[#7c5cff] border border-[#7c5cff]/30 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                  <IconGraph2D size={24} color="#7c5cff" />
                </div>
                <ArrowRight size={16} className="text-[#64748b] group-hover:text-white transition-colors" />
              </div>
              <h4 className="font-bold text-white text-sm mb-1.5">Нейро-Граф Связей</h4>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                Интерактивная физическая симуляция D3 связей, созвездия мыслей и режим фокуса.
              </p>
            </div>

            <div
              onClick={() => openTab({ type: 'canvas', title: 'Холст' })}
              className="p-5 rounded-3xl bg-[#14151e] border border-white/[0.08] hover:border-[#10b981]/60 hover:bg-[#181926] transition-all cursor-pointer group shadow-xl"
            >
              <div className="flex items-center justify-between mb-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                  <IconStickyNote size={24} color="#10b981" />
                </div>
                <ArrowRight size={16} className="text-[#64748b] group-hover:text-white transition-colors" />
              </div>
              <h4 className="font-bold text-white text-sm mb-1.5">Холст и Стикеры</h4>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                Бесконечное полотно: MindMap, цветные стикеры, соединительные стрелки и заметки.
              </p>
            </div>

            <div
              onClick={() => openTab({ type: 'calendar', title: 'Календарь и смены' })}
              className="p-5 rounded-3xl bg-[#14151e] border border-white/[0.08] hover:border-[#ec4899]/60 hover:bg-[#181926] transition-all cursor-pointer group shadow-xl"
            >
              <div className="flex items-center justify-between mb-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#ec4899]/15 text-[#ec4899] border border-[#ec4899]/30 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                  <IconDayShift size={24} color="#ec4899" />
                </div>
                <ArrowRight size={16} className="text-[#64748b] group-hover:text-white transition-colors" />
              </div>
              <h4 className="font-bold text-white text-sm mb-1.5">Календарь и Смены</h4>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                График 2/2, 3/3, 5/2, ночные коэффициенты, учет стрижек и авто-калькулятор зарплаты.
              </p>
            </div>

            <div
              onClick={() => openTab({ type: 'finance', title: 'Финансы' })}
              className="p-5 rounded-3xl bg-[#14151e] border border-white/[0.08] hover:border-[#f59e0b]/60 hover:bg-[#181926] transition-all cursor-pointer group shadow-xl"
            >
              <div className="flex items-center justify-between mb-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                  <IconWalletCapital size={24} color="#f59e0b" />
                </div>
                <ArrowRight size={16} className="text-[#64748b] group-hover:text-white transition-colors" />
              </div>
              <h4 className="font-bold text-white text-sm mb-1.5">Финансы и Вклады</h4>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                Копилки целей, расчет ежемесячного процента по банковским вкладам и учет баланса.
              </p>
            </div>

            <div
              onClick={() => setManualOpen(true)}
              className="p-5 rounded-3xl bg-[#14151e] border border-white/[0.08] hover:border-[#a855f7]/60 hover:bg-[#181926] transition-all cursor-pointer group shadow-xl"
            >
              <div className="flex items-center justify-between mb-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#a855f7]/15 text-[#a855f7] border border-[#a855f7]/30 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                  <IconBookGuide size={24} color="#a855f7" />
                </div>
                <ArrowRight size={16} className="text-[#64748b] group-hover:text-white transition-colors" />
              </div>
              <h4 className="font-bold text-white text-sm mb-1.5">Инструкция и Гид</h4>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                Справочник по горячим клавишам, формулам, таблицам и P2P-синхронизации.
              </p>
            </div>

            <div
              onClick={() => setSearchOpen(true)}
              className="p-5 rounded-3xl bg-[#14151e] border border-white/[0.08] hover:border-[#38bdf8]/60 hover:bg-[#181926] transition-all cursor-pointer group shadow-xl"
            >
              <div className="flex items-center justify-between mb-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                  <IconSearchSpotlight size={24} color="#38bdf8" />
                </div>
                <ArrowRight size={16} className="text-[#64748b] group-hover:text-white transition-colors" />
              </div>
              <h4 className="font-bold text-white text-sm mb-1.5">Командный Поиск (Ctrl+K)</h4>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                Мгновенный Spotlight поиск по всем мыслям, сменам, тегам и финансовым записям.
              </p>
            </div>
          </div>
        </div>

        {/* Recent Notes Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">
              Недавние мысли и заметки
            </h3>
            <span className="text-[11px] text-[#64748b]">
              Показаны последние 4 записи
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {neurons.slice(0, 4).map((neuron) => (
              <div
                key={neuron.id}
                onClick={() => openNote(neuron.id)}
                className="p-4 rounded-2xl bg-[#14151e] border border-white/[0.08] hover:border-[#7c5cff]/50 hover:bg-[#181926] transition-all cursor-pointer group flex items-start justify-between gap-3 shadow-md"
              >
                <div className="min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: neuron.color || '#7c5cff' }}
                    />
                    <h4 className="font-bold text-xs text-white truncate">
                      {neuron.title}
                    </h4>
                  </div>
                  <p className="text-[11px] text-[#64748b] line-clamp-2 leading-relaxed">
                    {neuron.content.slice(0, 100).replace(/[#*`~]/g, '') || 'Пустая мысль...'}
                  </p>
                </div>

                <div className="text-[10px] text-[#7c5cff] font-mono px-2 py-0.5 rounded-lg bg-[#7c5cff]/10 border border-[#7c5cff]/20 shrink-0">
                  {(neuron.outlinks || []).length} связей
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
