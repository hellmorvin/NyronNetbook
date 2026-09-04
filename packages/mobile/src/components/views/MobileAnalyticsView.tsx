import React, { useState, useMemo } from 'react';
import {
  Brain,
  Network,
  DollarSign,
  Briefcase,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  Link2,
  Unlink,
  Folder,
  Tag,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  Clock,
  FileText,
  Share2,
  Copy,
  Check,
  ChevronRight,
  BarChart2,
  PieChart,
} from 'lucide-react';
import { useBrainStore, LearningState } from '../../store/useBrainStore';

export const MobileAnalyticsView: React.FC = () => {
  const {
    neurons,
    shifts,
    transactions,
    savingsGoals,
    openNote,
    openTab,
    selectNeuron,
  } = useBrainStore();

  const [activeDomain, setActiveDomain] = useState<'graph' | 'finance' | 'shifts'>('graph');
  const [copiedToast, setCopiedToast] = useState(false);

  // ═══════════════════ GRAPH & KNOWLEDGE METRICS ═══════════════════
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
    const topHubs = hubScores.slice(0, 5);

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
    const sortedTags = Object.entries(tagStats).sort((a, b) => b[1] - a[1]);

    // Learning stages
    const learningStats = {
      new: 0,
      learning: 0,
      review: 0,
      mastered: 0,
    };
    neurons.forEach((n) => {
      const state = n.learningState || 'new';
      learningStats[state] = (learningStats[state] || 0) + 1;
    });

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

    return {
      totalNotes,
      totalConnections,
      density,
      isolatedCount: isolatedNotes.length,
      isolatedNotes: isolatedNotes.slice(0, 5),
      topHubs,
      folderStats: Object.entries(folderStats).sort((a, b) => b[1] - a[1]),
      sortedTags,
      learningStats,
      totalWords,
      totalChars,
      avgWords,
      readingTimeMins,
    };
  }, [neurons]);

  // ═══════════════════ FINANCE METRICS ═══════════════════
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

    return {
      income,
      expense,
      netBalance,
      savingsRate,
      sortedCategories,
      txCount: transactions.length,
    };
  }, [transactions]);

  // ═══════════════════ SHIFTS METRICS ═══════════════════
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
    const text = `📊 Сводный отчет базы знаний «НейроноБлокнот»:
• Заметок: ${graphMetrics.totalNotes}
• Связей в графе: ${graphMetrics.totalConnections} (Плотность: ${graphMetrics.density})
• Изолированных мыслей: ${graphMetrics.isolatedCount}
• Всего слов: ${graphMetrics.totalWords.toLocaleString()} (~${graphMetrics.readingTimeMins} мин чтения)
💰 Финансы:
• Доход: ${financeMetrics.income.toLocaleString()} ₽ | Расход: ${financeMetrics.expense.toLocaleString()} ₽ | Сальдо: ${financeMetrics.netBalance.toLocaleString()} ₽
💼 Смены:
• Смен: ${shiftMetrics.totalShifts} | Часов: ${shiftMetrics.totalHours} | Заработано: ${shiftMetrics.totalEarnings.toLocaleString()} ₽`;

    navigator.clipboard?.writeText(text);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b0c13] text-white overflow-hidden select-none">
      {/* ═════════ HEADER ═════════ */}
      <div className="p-4 pb-2 border-b border-white/[0.08] bg-[#0f1019]/90 backdrop-blur-md shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Аналитика & Метрики</span>
              <span className="px-2 py-0.5 rounded-full bg-[#38bdf8]/20 text-[#38bdf8] text-xs font-mono font-bold">
                В реальном времени
              </span>
            </h1>
            <p className="text-[11px] text-[#94a3b8]">
              Комплексный обзор второго мозга и продуктивности
            </p>
          </div>

          <button
            onClick={handleCopySummary}
            className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-[#cbd5e1] active:scale-95 transition-all flex items-center gap-1.5 text-xs font-semibold"
            title="Скопировать сводку"
          >
            {copiedToast ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span className="hidden sm:inline">{copiedToast ? 'Скопировано' : 'Сводка'}</span>
          </button>
        </div>

        {/* Domain Segmented Control */}
        <div className="flex p-1 bg-[#161722] rounded-xl border border-white/[0.06] text-xs">
          <button
            onClick={() => setActiveDomain('graph')}
            className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeDomain === 'graph'
                ? 'bg-[#7c5cff] text-white shadow-md'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            <Brain size={14} />
            <span>Нейро-Граф</span>
          </button>

          <button
            onClick={() => setActiveDomain('finance')}
            className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeDomain === 'finance'
                ? 'bg-[#10b981] text-white shadow-md'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            <DollarSign size={14} />
            <span>Финансы</span>
          </button>

          <button
            onClick={() => setActiveDomain('shifts')}
            className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeDomain === 'shifts'
                ? 'bg-[#f59e0b] text-white shadow-md'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            <Briefcase size={14} />
            <span>Смены</span>
          </button>
        </div>
      </div>

      {/* ═════════ CONTENT BODY ═════════ */}
      <div className="flex-1 overflow-y-auto p-4 pb-28 space-y-4 text-xs">
        {/* ═════════════════ DOMAIN 1: KNOWLEDGE GRAPH ═════════════════ */}
        {activeDomain === 'graph' && (
          <div className="space-y-4">
            {/* Top 4 KPI Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#18192a] to-[#121320] border border-[#7c5cff]/30 shadow-md">
                <div className="flex items-center justify-between text-[#94a3b8] mb-1">
                  <span className="text-[11px] font-bold">Всего мыслей</span>
                  <BookOpen size={14} className="text-[#7c5cff]" />
                </div>
                <div className="text-2xl font-black text-white font-mono">
                  {graphMetrics.totalNotes}
                </div>
                <div className="text-[10px] text-[#94a3b8] mt-1">активных заметок</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#18192a] to-[#121320] border border-[#38bdf8]/30 shadow-md">
                <div className="flex items-center justify-between text-[#94a3b8] mb-1">
                  <span className="text-[11px] font-bold">Связи в графе</span>
                  <Link2 size={14} className="text-[#38bdf8]" />
                </div>
                <div className="text-2xl font-black text-[#38bdf8] font-mono">
                  {graphMetrics.totalConnections}
                </div>
                <div className="text-[10px] text-[#94a3b8] mt-1">синаптических ребер</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#18192a] to-[#121320] border border-white/[0.08] shadow-md">
                <div className="flex items-center justify-between text-[#94a3b8] mb-1">
                  <span className="text-[11px] font-bold">Плотность связей</span>
                  <Activity size={14} className="text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-emerald-400 font-mono">
                  {graphMetrics.density}
                </div>
                <div className="text-[10px] text-[#94a3b8] mt-1">связей на заметку</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#18192a] to-[#121320] border border-white/[0.08] shadow-md">
                <div className="flex items-center justify-between text-[#94a3b8] mb-1">
                  <span className="text-[11px] font-bold">Изолированные</span>
                  <Unlink size={14} className="text-amber-400" />
                </div>
                <div className="text-2xl font-black text-amber-400 font-mono">
                  {graphMetrics.isolatedCount}
                </div>
                <div className="text-[10px] text-[#94a3b8] mt-1">мыслей без связей</div>
              </div>
            </div>

            {/* Neuro-Hubs (Top Connected Notes) */}
            <div className="p-4 rounded-2xl bg-[#141522] border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#7c5cff]" />
                  <span>Нейро-хабы (Ключевые узлы)</span>
                </h3>
                <span className="text-[10px] text-[#94a3b8]">Топ по связям</span>
              </div>

              <div className="space-y-2">
                {graphMetrics.topHubs.map(({ neuron, connectionsCount, folder }, idx) => (
                  <div
                    key={neuron.id}
                    onClick={() => openNote(neuron.id)}
                    className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04] flex items-center justify-between gap-2 cursor-pointer transition-all active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-lg bg-[#7c5cff]/20 text-[#a78bfa] font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <span className="font-bold text-white text-xs block truncate">
                          {neuron.title}
                        </span>
                        <span className="text-[10px] text-[#94a3b8] block truncate">
                          {folder}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-2 py-0.5 rounded-md bg-[#7c5cff]/20 text-[#38bdf8] font-mono text-[11px] font-bold">
                        {connectionsCount} св.
                      </span>
                      <ChevronRight size={14} className="text-[#64748b]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Orphan / Isolated Thoughts (Requiring attention) */}
            {graphMetrics.isolatedCount > 0 && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Unlink size={14} />
                    <span>Изолированные мысли (Требуют внимания)</span>
                  </h3>
                  <span className="text-[10px] text-amber-300/80 font-mono">
                    {graphMetrics.isolatedCount} заметок
                  </span>
                </div>
                <p className="text-[11px] text-[#cbd5e1] leading-relaxed">
                  Мысли без связей быстрее забываются. Рекомендуется соединить их с похожими темами на графе.
                </p>

                <div className="space-y-1.5 pt-1">
                  {graphMetrics.isolatedNotes.map((n) => (
                    <div
                      key={n.id}
                      className="p-2 rounded-xl bg-black/30 flex items-center justify-between gap-2"
                    >
                      <span className="text-xs font-semibold text-white truncate min-w-0">
                        {n.title}
                      </span>
                      <button
                        onClick={() => {
                          selectNeuron(n.id);
                          openTab({ type: 'graph', title: 'Граф' });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#7c5cff] text-white text-[10px] font-bold shrink-0 active:scale-95 transition-all"
                      >
                        Связать на графе
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Folder Distribution */}
            <div className="p-4 rounded-2xl bg-[#141522] border border-white/[0.08] space-y-3">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Folder size={14} className="text-[#38bdf8]" />
                <span>Структура папок</span>
              </h3>

              <div className="space-y-2">
                {graphMetrics.folderStats.map(([folder, count]) => {
                  const pct = Math.round((count / graphMetrics.totalNotes) * 100);
                  return (
                    <div key={folder} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
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

            {/* Content & Reading Stats */}
            <div className="p-4 rounded-2xl bg-[#141522] border border-white/[0.08] space-y-3">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <FileText size={14} className="text-emerald-400" />
                <span>Метрики объема текста</span>
              </h3>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-white/[0.03]">
                  <span className="text-[10px] text-[#94a3b8] block">Всего слов</span>
                  <span className="text-base font-bold text-white font-mono">
                    {graphMetrics.totalWords.toLocaleString()}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white/[0.03]">
                  <span className="text-[10px] text-[#94a3b8] block">Ср. длина</span>
                  <span className="text-base font-bold text-white font-mono">
                    {graphMetrics.avgWords} сл.
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white/[0.03]">
                  <span className="text-[10px] text-[#94a3b8] block">Время чтения</span>
                  <span className="text-base font-bold text-emerald-400 font-mono">
                    ~{graphMetrics.readingTimeMins} мин
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════ DOMAIN 2: FINANCE ═════════════════ */}
        {activeDomain === 'finance' && (
          <div className="space-y-4">
            {/* Finance KPIs */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#18192a] to-[#121320] border border-emerald-500/30">
                <div className="text-[11px] text-[#94a3b8]">Доходы</div>
                <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
                  +{financeMetrics.income.toLocaleString()} ₽
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#18192a] to-[#121320] border border-rose-500/30">
                <div className="text-[11px] text-[#94a3b8]">Расходы</div>
                <div className="text-xl font-bold text-rose-400 font-mono mt-1">
                  -{financeMetrics.expense.toLocaleString()} ₽
                </div>
              </div>
            </div>

            {/* Net Balance Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#181928] via-[#151624] to-[#181928] border border-white/[0.1] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#94a3b8] uppercase font-bold tracking-wider">
                  Чистое Сальдо
                </span>
                <div className={`text-2xl font-black font-mono mt-0.5 ${
                  financeMetrics.netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {financeMetrics.netBalance >= 0 ? '+' : ''}
                  {financeMetrics.netBalance.toLocaleString()} ₽
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-[#94a3b8] block">Норма сбережений</span>
                <span className="text-lg font-bold text-[#38bdf8] font-mono">
                  {financeMetrics.savingsRate}%
                </span>
              </div>
            </div>

            {/* Expenses by Category */}
            <div className="p-4 rounded-2xl bg-[#141522] border border-white/[0.08] space-y-3">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <PieChart size={14} className="text-[#38bdf8]" />
                <span>Расходы по категориям</span>
              </h3>

              <div className="space-y-2">
                {financeMetrics.sortedCategories.map(([cat, amt]) => {
                  const pct =
                    financeMetrics.expense > 0
                      ? Math.round((amt / financeMetrics.expense) * 100)
                      : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-white">{cat}</span>
                        <span className="text-[#94a3b8] font-mono">
                          {amt.toLocaleString()} ₽ ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                {financeMetrics.sortedCategories.length === 0 && (
                  <div className="py-4 text-center text-[#64748b]">Нет транзакций</div>
                )}
              </div>
            </div>

            {/* Open Full Finance Manager Button */}
            <button
              onClick={() => openTab({ type: 'finance', title: 'Финансы' })}
              className="w-full py-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/[0.08] active:scale-95 transition-all"
            >
              <span>Открыть полный модуль «Финансы & Смены»</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* ═════════════════ DOMAIN 3: SHIFTS ═════════════════ */}
        {activeDomain === 'shifts' && (
          <div className="space-y-4">
            {/* Shifts KPIs */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#18192a] to-[#121320] border border-amber-500/30">
                <div className="text-[11px] text-[#94a3b8]">Отработано смен</div>
                <div className="text-2xl font-black text-amber-400 font-mono mt-1">
                  {shiftMetrics.totalShifts}
                </div>
                <div className="text-[10px] text-[#94a3b8] mt-0.5">
                  Суммарно: {shiftMetrics.totalHours} ч.
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#18192a] to-[#121320] border border-[#38bdf8]/30">
                <div className="text-[11px] text-[#94a3b8]">Заработано за смены</div>
                <div className="text-xl font-black text-[#38bdf8] font-mono mt-1 truncate">
                  {shiftMetrics.totalEarnings.toLocaleString()} ₽
                </div>
                <div className="text-[10px] text-[#94a3b8] mt-0.5">
                  Ср. в час: {shiftMetrics.avgHourly} ₽
                </div>
              </div>
            </div>

            {/* Shifts Summary Card */}
            <div className="p-4 rounded-2xl bg-[#141522] border border-white/[0.08] space-y-2">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Clock size={14} className="text-amber-400" />
                <span>Эффективность рабочего времени</span>
              </h3>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 rounded-xl bg-white/[0.03]">
                  <span className="text-[10px] text-[#94a3b8] block">Средний чек смены</span>
                  <span className="text-sm font-bold text-white font-mono">
                    {shiftMetrics.avgEarningsPerShift.toLocaleString()} ₽
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03]">
                  <span className="text-[10px] text-[#94a3b8] block">Часов на смену</span>
                  <span className="text-sm font-bold text-white font-mono">
                    {shiftMetrics.totalShifts > 0
                      ? (shiftMetrics.totalHours / shiftMetrics.totalShifts).toFixed(1)
                      : 0}{' '}
                    ч.
                  </span>
                </div>
              </div>
            </div>

            {/* Open Calendar Shifts Tab Button */}
            <button
              onClick={() => openTab({ type: 'calendar', title: 'Смены' })}
              className="w-full py-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/[0.08] active:scale-95 transition-all"
            >
              <span>Открыть Календарь смен</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
