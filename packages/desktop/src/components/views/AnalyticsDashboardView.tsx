import React, { useState, useMemo } from 'react';
import {
  Brain,
  TrendingUp,
  Briefcase,
  Layers,
  Sparkles,
  Link2,
  Unlink,
  Folder,
  Tag,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  Copy,
  Check,
  ChevronRight,
  PieChart,
  BarChart3,
  Activity,
  Calendar,
  Zap,
  DollarSign
} from 'lucide-react';
import { useBrainStore } from '../../store/useBrainStore';
import { FinanceInteractiveChart } from './FinanceInteractiveChart';

const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

export const AnalyticsDashboardView: React.FC = () => {
  const {
    neurons,
    shifts,
    transactions,
    savingsGoals,
    openNote,
    openTab,
    selectNeuron,
  } = useBrainStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'graph' | 'finance' | 'productivity'>('overview');
  const [copiedToast, setCopiedToast] = useState(false);

  // Date selectors for finance interactive charts
  const [financeYear, setFinanceYear] = useState<number>(new Date().getFullYear());
  const [financeMonth, setFinanceMonth] = useState<number>(new Date().getMonth());

  // ═══════════════════ 1. GRAPH & KNOWLEDGE METRICS ═══════════════════
  const graphMetrics = useMemo(() => {
    const totalNotes = neurons.length;
    let totalConnections = 0;
    const connectedNodeIds = new Set<string>();

    const hubScores: { neuron: typeof neurons[0]; connectionsCount: number; folder: string }[] = [];
    const isolatedNotes: typeof neurons[0][] = [];

    neurons.forEach((n) => {
      const outCount = n.outlinks?.length || 0;
      const inCount = n.backlinks?.length || 0;
      const totalCount = outCount + inCount;

      totalConnections += outCount;
      if (totalCount > 0) {
        connectedNodeIds.add(n.id);
      } else {
        isolatedNotes.push(n);
      }

      hubScores.push({
        neuron: n,
        connectionsCount: totalCount,
        folder: n.filePath ? n.filePath.split('/')[0] || 'Заметки' : 'Заметки',
      });
    });

    hubScores.sort((a, b) => b.connectionsCount - a.connectionsCount);
    const topHubs = hubScores.slice(0, 6);

    // Folder distribution
    const folderStats: Record<string, number> = {};
    neurons.forEach((n) => {
      const f = n.filePath ? n.filePath.split('/')[0] || 'Без папки' : 'Без папки';
      folderStats[f] = (folderStats[f] || 0) + 1;
    });

    // Tag distribution
    const tagStats: Record<string, number> = {};
    neurons.forEach((n) => {
      (n.tags || []).forEach((t) => {
        tagStats[t] = (tagStats[t] || 0) + 1;
      });
    });
    const sortedTags = Object.entries(tagStats).sort((a, b) => b[1] - a[1]).slice(0, 8);

    // Content length
    let totalWords = 0;
    let totalChars = 0;
    neurons.forEach((n) => {
      const text = n.content || '';
      totalChars += text.length;
      totalWords += text.trim() ? text.trim().split(/\s+/).length : 0;
    });
    const avgWords = totalNotes > 0 ? Math.round(totalWords / totalNotes) : 0;
    const readingTimeMins = Math.ceil(totalWords / 200);

    const density = totalNotes > 0 ? (totalConnections / totalNotes).toFixed(2) : '0';
    const connectivityScore = totalNotes > 0 ? Math.round((connectedNodeIds.size / totalNotes) * 100) : 0;

    return {
      totalNotes,
      totalConnections,
      density,
      connectivityScore,
      isolatedCount: isolatedNotes.length,
      isolatedNotes: isolatedNotes.slice(0, 6),
      topHubs,
      folderStats: Object.entries(folderStats).sort((a, b) => b[1] - a[1]),
      sortedTags,
      totalWords,
      totalChars,
      avgWords,
      readingTimeMins,
    };
  }, [neurons]);

  // ═══════════════════ 2. FINANCE METRICS ═══════════════════
  const financeMetrics = useMemo(() => {
    let income = 0;
    let expense = 0;
    const categoryExpenses: Record<string, number> = {};

    transactions.forEach((tx) => {
      if (tx.type === 'income') {
        income += tx.amount;
      } else {
        expense += tx.amount;
        categoryExpenses[tx.category] = (categoryExpenses[tx.category] || 0) + tx.amount;
      }
    });

    const netBalance = income - expense;
    const savingsRate = income > 0 ? Math.max(0, Math.round((netBalance / income) * 100)) : 0;
    const sortedCategories = Object.entries(categoryExpenses).sort((a, b) => b[1] - a[1]);

    const monthPrefix = `${financeYear}-${String(financeMonth + 1).padStart(2, '0')}`;
    const monthTransactions = transactions.filter((t) => t.date.startsWith(monthPrefix));
    const yearTransactions = transactions.filter((t) => t.date.startsWith(String(financeYear)));

    return {
      income,
      expense,
      netBalance,
      savingsRate,
      sortedCategories,
      txCount: transactions.length,
      monthTransactions,
      yearTransactions,
    };
  }, [transactions, financeYear, financeMonth]);

  // ═══════════════════ 3. SHIFTS METRICS ═══════════════════
  const shiftMetrics = useMemo(() => {
    const totalShifts = shifts.length;
    let totalHours = 0;
    let totalEarnings = 0;

    shifts.forEach((s) => {
      totalHours += s.hours || 0;
      totalEarnings += s.earnings || 0;
    });

    const avgEarningsPerShift = totalShifts > 0 ? Math.round(totalEarnings / totalShifts) : 0;
    const avgHourly = totalHours > 0 ? Math.round(totalEarnings / totalHours) : 0;

    return {
      totalShifts,
      totalHours,
      totalEarnings,
      avgEarningsPerShift,
      avgHourly,
    };
  }, [shifts]);

  const handleCopySummary = () => {
    const text = `📊 Сводный аналитический отчет «НейроноБлокнот»:
🧠 База Знаний:
• Всего мыслей: ${graphMetrics.totalNotes}
• Связей в графе: ${graphMetrics.totalConnections} (Плотность: ${graphMetrics.density})
• Связность графа: ${graphMetrics.connectivityScore}%
• Объем текста: ${graphMetrics.totalWords.toLocaleString()} слов (~${graphMetrics.readingTimeMins} мин чтения)
💰 Финансовый Баланс:
• Доходы: +${financeMetrics.income.toLocaleString()} ₽
• Расходы: -${financeMetrics.expense.toLocaleString()} ₽
• Чистое сальдо: ${financeMetrics.netBalance.toLocaleString()} ₽ (Сбережения: ${financeMetrics.savingsRate}%)
💼 Смены и График:
• Смен: ${shiftMetrics.totalShifts} | Часов: ${shiftMetrics.totalHours} ч. | Заработано: ${shiftMetrics.totalEarnings.toLocaleString()} ₽`;

    navigator.clipboard?.writeText(text);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  const defaultCategoryColors: Record<string, string> = {
    'Продукты': '#10b981',
    'Жилье': '#6366f1',
    'Транспорт': '#f59e0b',
    'Кафе': '#ec4899',
    'Здоровье': '#14b8a6',
    'Развлечения': '#8b5cf6',
    'Шопинг': '#f97316',
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0d0e12] text-[#e2e8f0] select-none overflow-hidden font-sans">
      {/* ═════════ HEADER ═════════ */}
      <div className="p-4 px-6 border-b border-white/[0.08] bg-[#111219]/90 backdrop-blur-md flex items-center justify-between gap-4 flex-wrap shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#7c5cff]/25 to-[#38bdf8]/25 border border-[#7c5cff]/40 flex items-center justify-center text-[#38bdf8] shadow-md">
            <BarChart3 size={20} />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>Аналитика & Метрики Второго Мозга</span>
              <span className="px-2 py-0.5 rounded-full bg-[#10b981]/20 text-[#10b981] text-[11px] font-mono font-bold">
                Live Data
              </span>
            </h1>
            <p className="text-xs text-[#94a3b8]">
              Интеллектуальная связность знаний, финансовые потоки и продуктивность
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Selector */}
          <div className="flex p-0.5 bg-[#0e0f14] border border-white/[0.08] rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'bg-[#7c5cff] text-white shadow-md'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <Zap size={13} />
              <span>Обзор</span>
            </button>

            <button
              onClick={() => setActiveTab('graph')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'graph'
                  ? 'bg-[#7c5cff] text-white shadow-md'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <Brain size={13} />
              <span>База Знаний</span>
            </button>

            <button
              onClick={() => setActiveTab('finance')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'finance'
                  ? 'bg-[#10b981] text-white shadow-md'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <DollarSign size={13} />
              <span>Финансы</span>
            </button>

            <button
              onClick={() => setActiveTab('productivity')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'productivity'
                  ? 'bg-[#f59e0b] text-white shadow-md'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <Briefcase size={13} />
              <span>Смены</span>
            </button>
          </div>

          <button
            onClick={handleCopySummary}
            className="px-3.5 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-xs font-semibold text-white flex items-center gap-1.5 border border-white/[0.08] transition-all shadow-sm active:scale-95"
          >
            {copiedToast ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span>{copiedToast ? 'Скопировано!' : 'Скопировать сводку'}</span>
          </button>
        </div>
      </div>

      {/* ═════════ BODY CONTENT ═════════ */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* ══════════════ TAB 1: OVERVIEW ══════════════ */}
        {(activeTab === 'overview' || activeTab === 'graph') && (
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider flex items-center gap-2">
              <Brain size={14} className="text-[#7c5cff]" />
              <span>Нейро-Граф & Плотность Мышления</span>
            </h2>

            {/* Top 4 KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-2xl bg-[#141520] border border-[#7c5cff]/30 shadow-lg relative overflow-hidden group">
                <div className="flex items-center justify-between text-[#94a3b8] mb-2">
                  <span className="text-xs font-bold">Мысли в базе</span>
                  <BookOpen size={16} className="text-[#7c5cff]" />
                </div>
                <div className="text-3xl font-black text-white font-mono">
                  {graphMetrics.totalNotes}
                </div>
                <div className="text-[11px] text-[#94a3b8] mt-1 flex items-center justify-between">
                  <span>активных заметок</span>
                  <span className="text-[#38bdf8] font-bold">~{graphMetrics.readingTimeMins} мин чтения</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#141520] border border-[#38bdf8]/30 shadow-lg relative overflow-hidden group">
                <div className="flex items-center justify-between text-[#94a3b8] mb-2">
                  <span className="text-xs font-bold">Связей в Графе</span>
                  <Link2 size={16} className="text-[#38bdf8]" />
                </div>
                <div className="text-3xl font-black text-[#38bdf8] font-mono">
                  {graphMetrics.totalConnections}
                </div>
                <div className="text-[11px] text-[#94a3b8] mt-1 flex items-center justify-between">
                  <span>синаптических ребер</span>
                  <span className="text-emerald-400 font-bold">{graphMetrics.density} св./заметку</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#141520] border border-emerald-500/30 shadow-lg relative overflow-hidden group">
                <div className="flex items-center justify-between text-[#94a3b8] mb-2">
                  <span className="text-xs font-bold">Индекс связности</span>
                  <Activity size={16} className="text-emerald-400" />
                </div>
                <div className="text-3xl font-black text-emerald-400 font-mono">
                  {graphMetrics.connectivityScore}%
                </div>
                <div className="text-[11px] text-[#94a3b8] mt-1">
                  заметок имеют прямые связи
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#141520] border border-amber-500/30 shadow-lg relative overflow-hidden group">
                <div className="flex items-center justify-between text-[#94a3b8] mb-2">
                  <span className="text-xs font-bold">Изолированные</span>
                  <Unlink size={16} className="text-amber-400" />
                </div>
                <div className="text-3xl font-black text-amber-400 font-mono">
                  {graphMetrics.isolatedCount}
                </div>
                <div className="text-[11px] text-[#94a3b8] mt-1">
                  мыслей без соединений
                </div>
              </div>
            </div>

            {/* Neuro-Hubs & Structure Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
              {/* Top Hubs */}
              <div className="p-4 rounded-2xl bg-[#141520] border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white flex items-center gap-2">
                    <Sparkles size={15} className="text-[#7c5cff]" />
                    <span>Главные Нейро-Хабы (Ключевые понятия)</span>
                  </h3>
                  <span className="text-[10px] text-[#94a3b8]">По числу связей</span>
                </div>

                <div className="space-y-2">
                  {graphMetrics.topHubs.map(({ neuron, connectionsCount, folder }, idx) => (
                    <div
                      key={neuron.id}
                      onClick={() => openNote(neuron.id)}
                      className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04] flex items-center justify-between gap-3 cursor-pointer transition-all hover:translate-x-1"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-[#7c5cff]/20 text-[#a78bfa] font-mono text-xs font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <span className="font-bold text-white text-xs block truncate">
                            {neuron.title}
                          </span>
                          <span className="text-[10px] text-[#94a3b8] block truncate">
                            📁 {folder}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2 py-0.5 rounded-md bg-[#7c5cff]/20 text-[#38bdf8] font-mono text-xs font-bold">
                          {connectionsCount} связей
                        </span>
                        <ChevronRight size={14} className="text-[#64748b]" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Folders & Tags */}
              <div className="p-4 rounded-2xl bg-[#141520] border border-white/[0.08] space-y-4">
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-white flex items-center gap-2">
                    <Folder size={15} className="text-[#38bdf8]" />
                    <span>Распределение по папкам</span>
                  </h3>

                  <div className="space-y-2">
                    {graphMetrics.folderStats.slice(0, 5).map(([folder, count]) => {
                      const pct = Math.round((count / graphMetrics.totalNotes) * 100);
                      return (
                        <div key={folder} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-white font-medium truncate">{folder}</span>
                            <span className="text-[#94a3b8] font-mono">
                              {count} ({pct}%)
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#7c5cff] to-[#38bdf8] rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Popular Tags */}
                {graphMetrics.sortedTags.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Tag size={13} className="text-[#ec4899]" />
                      <span>Популярные теги</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {graphMetrics.sortedTags.map(([tag, count]) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[11px] text-[#cbd5e1] font-mono flex items-center gap-1.5"
                        >
                          <span className="text-[#ec4899]">#{tag}</span>
                          <span className="text-[#64748b]">({count})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ TAB 2: FINANCE & INTERACTIVE FLOW ══════════════ */}
        {(activeTab === 'overview' || activeTab === 'finance') && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider flex items-center gap-2">
                <DollarSign size={14} className="text-emerald-400" />
                <span>Финансовые Потоки & Динамика Капитала</span>
              </h2>
              <button
                onClick={() => openTab({ type: 'finance', title: 'Финансы' })}
                className="text-xs text-[#38bdf8] hover:underline font-semibold"
              >
                Открыть модуль «Финансы» →
              </button>
            </div>

            {/* Embedded High-Performance Interactive Chart */}
            <FinanceInteractiveChart
              monthTransactions={financeMetrics.monthTransactions}
              year={financeYear}
              month={financeMonth}
              monthNames={MONTH_NAMES}
              categoryColors={defaultCategoryColors}
              allYearTransactions={financeMetrics.yearTransactions}
              onYearChange={setFinanceYear}
              onMonthSelect={setFinanceMonth}
            />
          </div>
        )}

        {/* ══════════════ TAB 3: SHIFTS & PRODUCTIVITY ══════════════ */}
        {(activeTab === 'overview' || activeTab === 'productivity') && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider flex items-center gap-2">
                <Briefcase size={14} className="text-amber-400" />
                <span>Рабочие Смены & Продуктивность</span>
              </h2>
              <button
                onClick={() => openTab({ type: 'calendar', title: 'Календарь' })}
                className="text-xs text-[#f59e0b] hover:underline font-semibold"
              >
                Открыть «Календарь смен» →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-2xl bg-[#141520] border border-amber-500/30">
                <span className="text-xs font-bold text-[#94a3b8] block mb-1">Всего смен</span>
                <span className="text-3xl font-black text-amber-400 font-mono">
                  {shiftMetrics.totalShifts}
                </span>
                <span className="text-[11px] text-[#94a3b8] block mt-1">
                  Отработано: {shiftMetrics.totalHours} ч.
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#141520] border border-[#38bdf8]/30">
                <span className="text-xs font-bold text-[#94a3b8] block mb-1">Суммарный доход смен</span>
                <span className="text-2xl font-black text-[#38bdf8] font-mono">
                  +{shiftMetrics.totalEarnings.toLocaleString('ru-RU')} ₽
                </span>
                <span className="text-[11px] text-[#94a3b8] block mt-1">
                  Средний в час: {shiftMetrics.avgHourly} ₽/ч
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#141520] border border-white/[0.08]">
                <span className="text-xs font-bold text-[#94a3b8] block mb-1">Средний чек смены</span>
                <span className="text-2xl font-black text-white font-mono">
                  {shiftMetrics.avgEarningsPerShift.toLocaleString('ru-RU')} ₽
                </span>
                <span className="text-[11px] text-[#94a3b8] block mt-1">
                  в расчете на одну смену
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#141520] border border-white/[0.08]">
                <span className="text-xs font-bold text-[#94a3b8] block mb-1">Средняя длина смены</span>
                <span className="text-2xl font-black text-white font-mono">
                  {shiftMetrics.totalShifts > 0 ? (shiftMetrics.totalHours / shiftMetrics.totalShifts).toFixed(1) : 0} ч.
                </span>
                <span className="text-[11px] text-[#94a3b8] block mt-1">
                  часов за рабочий день
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
