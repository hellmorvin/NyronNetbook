import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  PieChart,
  Percent,
  Sliders,
  Zap,
} from 'lucide-react';
import { FinanceTransaction } from '../../store/useBrainStore';

interface DailyDataPoint {
  day: number;
  dateStr: string;
  income: number;
  expense: number;
  net: number;
  runningBalance: number;
  transactions: FinanceTransaction[];
}

interface YearlyMonthDataPoint {
  monthIndex: number;
  name: string;
  income: number;
  expense: number;
  net: number;
  runningBalance: number;
  transactionsCount: number;
}

interface FinanceInteractiveChartProps {
  monthTransactions: FinanceTransaction[];
  year: number;
  month: number;
  monthNames: string[];
  categoryColors: Record<string, string>;
  allYearTransactions?: FinanceTransaction[];
  onYearChange?: (newYear: number) => void;
  onMonthSelect?: (newMonth: number) => void;
}

export const FinanceInteractiveChart: React.FC<FinanceInteractiveChartProps> = ({
  monthTransactions,
  year,
  month,
  monthNames,
  categoryColors,
  allYearTransactions = [],
  onYearChange,
  onMonthSelect,
}) => {
  const [viewScope, setViewScope] = useState<'month' | 'year'>('month');
  const [displayMode, setDisplayMode] = useState<'combo' | 'bars' | 'line'>('combo');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'd1' | 'd2' | 'd3'>('all');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

  const monthTotalIncome = useMemo(() => {
    return monthTransactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  }, [monthTransactions]);

  const monthTotalExpense = useMemo(() => {
    return monthTransactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  }, [monthTransactions]);

  const monthNetSavings = monthTotalIncome - monthTotalExpense;
  const monthSavingsRate = monthTotalIncome > 0 ? Math.round((monthNetSavings / monthTotalIncome) * 100) : 0;

  const yearTotalIncome = useMemo(() => {
    return allYearTransactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  }, [allYearTransactions]);

  const yearTotalExpense = useMemo(() => {
    return allYearTransactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  }, [allYearTransactions]);

  const yearNetSavings = yearTotalIncome - yearTotalExpense;

  const allDailyData = useMemo<DailyDataPoint[]>(() => {
    const data: DailyDataPoint[] = [];
    let runningBalance = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = `${monthPrefix}-${String(d).padStart(2, '0')}`;
      const dayTxs = monthTransactions.filter((t) => t.date === dayStr);

      let dayIncome = 0;
      let dayExpense = 0;

      dayTxs.forEach((t) => {
        if (t.type === 'income') dayIncome += t.amount;
        else dayExpense += t.amount;
      });

      runningBalance += dayIncome - dayExpense;

      data.push({
        day: d,
        dateStr: dayStr,
        income: dayIncome,
        expense: dayExpense,
        net: dayIncome - dayExpense,
        runningBalance,
        transactions: dayTxs,
      });
    }
    return data;
  }, [monthTransactions, daysInMonth, monthPrefix]);

  const displayedDailyData = useMemo(() => {
    if (periodFilter === 'd1') return allDailyData.filter((d) => d.day <= 10);
    if (periodFilter === 'd2') return allDailyData.filter((d) => d.day > 10 && d.day <= 20);
    if (periodFilter === 'd3') return allDailyData.filter((d) => d.day > 20);
    return allDailyData;
  }, [allDailyData, periodFilter]);

  const yearly12MonthsData = useMemo<YearlyMonthDataPoint[]>(() => {
    let runningBalance = 0;
    return Array.from({ length: 12 }, (_, mIdx) => {
      const prefix = `${year}-${String(mIdx + 1).padStart(2, '0')}`;
      const txs = allYearTransactions.filter((t) => t.date.startsWith(prefix));
      let income = 0;
      let expense = 0;
      txs.forEach((t) => {
        if (t.type === 'income') income += t.amount;
        else expense += t.amount;
      });
      runningBalance += income - expense;
      return {
        monthIndex: mIdx,
        name: monthNames[mIdx] || '',
        income,
        expense,
        net: income - expense,
        runningBalance,
        transactionsCount: txs.length,
      };
    });
  }, [allYearTransactions, year, monthNames]);

  const topExpenseCategories = useMemo(() => {
    const map: Record<string, number> = {};
    monthTransactions.forEach((t) => {
      if (t.type === 'expense') {
        map[t.category] = (map[t.category] || 0) + t.amount;
      }
    });
    const list = Object.entries(map).map(([name, amount]) => ({
      name,
      amount,
      color: categoryColors[name] || '#f43f5e',
      percent: monthTotalExpense > 0 ? Math.round((amount / monthTotalExpense) * 100) : 0,
    }));
    return list.sort((a, b) => b.amount - a.amount).slice(0, 4);
  }, [monthTransactions, monthTotalExpense, categoryColors]);

  const maxOpsFlow = useMemo(() => {
    let max = 500;
    if (viewScope === 'month') {
      displayedDailyData.forEach((d) => {
        if (d.income > max) max = d.income;
        if (d.expense > max) max = d.expense;
      });
    } else {
      yearly12MonthsData.forEach((m) => {
        if (m.income > max) max = m.income;
        if (m.expense > max) max = m.expense;
      });
    }
    return Math.ceil(max / 500) * 500 || 3000;
  }, [viewScope, displayedDailyData, yearly12MonthsData]);

  const maxBalanceFlow = useMemo(() => {
    let max = 1000;
    if (viewScope === 'month') {
      displayedDailyData.forEach((d) => {
        if (Math.abs(d.runningBalance) > max) max = Math.abs(d.runningBalance);
      });
    } else {
      yearly12MonthsData.forEach((m) => {
        if (Math.abs(m.runningBalance) > max) max = Math.abs(m.runningBalance);
      });
    }
    return Math.ceil(max / 1000) * 1000 || 5000;
  }, [viewScope, displayedDailyData, yearly12MonthsData]);

  const svgWidth = 920;
  const svgHeight = 250;
  const chartTop = 25;
  const chartBottom = 205;
  const chartHeight = chartBottom - chartTop;
  const chartLeft = 65;
  const chartRight = 855;
  const chartWidth = chartRight - chartLeft;

  const currentHoveredPoint = useMemo(() => {
    if (hoveredIndex === null) return null;
    if (viewScope === 'month') {
      return displayedDailyData[hoveredIndex] || null;
    } else {
      return yearly12MonthsData[hoveredIndex] || null;
    }
  }, [hoveredIndex, viewScope, displayedDailyData, yearly12MonthsData]);

  const hasData = viewScope === 'month' ? monthTransactions.length > 0 : allYearTransactions.length > 0;

  return (
    <div className="p-3 sm:p-4 bg-[#14151c] border border-white/[0.08] rounded-2xl sm:rounded-3xl space-y-3 sm:space-y-4 shadow-2xl select-none text-[#e2e8f0]">
      {/* 1. Mobile Optimized Controls Toolbar */}
      <div className="space-y-2">
        {/* Top controls: Scope & Mode */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          {/* Scope: Month vs Year */}
          <div className="flex items-center p-0.5 bg-[#0e0f13] border border-white/[0.08] rounded-xl text-xs shrink-0">
            <button
              onClick={() => {
                setViewScope('month');
                setHoveredIndex(null);
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 text-xs ${
                viewScope === 'month'
                  ? 'bg-[#7c5cff] text-white shadow-md'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <BarChart3 size={13} />
              <span>{monthNames[month]}</span>
            </button>

            <button
              onClick={() => {
                setViewScope('year');
                setHoveredIndex(null);
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 text-xs ${
                viewScope === 'year'
                  ? 'bg-[#7c5cff] text-white shadow-md'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <Calendar size={13} />
              <span>{year} г.</span>
            </button>
          </div>

          {/* Mode: Combo / Bars / Trend */}
          <div className="flex items-center p-0.5 bg-[#0e0f13] border border-white/[0.08] rounded-xl text-xs shrink-0">
            <button
              onClick={() => setDisplayMode('combo')}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all text-xs ${
                displayMode === 'combo'
                  ? 'bg-gradient-to-r from-[#7c5cff] to-[#38bdf8] text-white shadow-md'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
              title="Комбо"
            >
              <Zap size={12} />
              <span>Комбо</span>
            </button>

            <button
              onClick={() => setDisplayMode('bars')}
              className={`px-2 py-1 rounded-lg font-bold flex items-center gap-1 transition-all text-xs ${
                displayMode === 'bars'
                  ? 'bg-[#10b981] text-white shadow-md'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
              title="Столбцы"
            >
              <BarChart3 size={12} />
              <span>Столбцы</span>
            </button>

            <button
              onClick={() => setDisplayMode('line')}
              className={`px-2 py-1 rounded-lg font-bold flex items-center gap-1 transition-all text-xs ${
                displayMode === 'line'
                  ? 'bg-[#38bdf8] text-[#0d0e14] shadow-md font-extrabold'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
              title="Тренд"
            >
              <TrendingUp size={12} />
              <span>Тренд</span>
            </button>
          </div>
        </div>

        {/* Second row: Period selector (when in month mode) or Year switcher */}
        {viewScope === 'month' && (
          <div className="flex items-center gap-1 bg-[#0e0f13] p-1 rounded-xl border border-white/[0.06] text-xs overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-bold text-[#64748b] px-1.5 shrink-0">Период:</span>
            <button
              onClick={() => setPeriodFilter('all')}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition-colors shrink-0 ${
                periodFilter === 'all' ? 'bg-[#7c5cff] text-white' : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              Весь месяц
            </button>
            <button
              onClick={() => setPeriodFilter('d1')}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition-colors shrink-0 ${
                periodFilter === 'd1' ? 'bg-[#7c5cff] text-white' : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              1-10
            </button>
            <button
              onClick={() => setPeriodFilter('d2')}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition-colors shrink-0 ${
                periodFilter === 'd2' ? 'bg-[#7c5cff] text-white' : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              11-20
            </button>
            <button
              onClick={() => setPeriodFilter('d3')}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition-colors shrink-0 ${
                periodFilter === 'd3' ? 'bg-[#7c5cff] text-white' : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              21-{daysInMonth}
            </button>
          </div>
        )}

        {viewScope === 'year' && (
          <div className="flex items-center justify-between bg-[#0e0f13] p-1 rounded-xl border border-white/[0.06] text-xs">
            <button
              onClick={() => onYearChange?.(year - 1)}
              className="p-1 rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/[0.06] transition-all flex items-center gap-1 text-[11px]"
            >
              <ChevronLeft size={13} />
              <span>{year - 1}</span>
            </button>
            <span className="font-extrabold font-mono text-[#7c5cff] px-1.5">{year} год</span>
            <button
              onClick={() => onYearChange?.(year + 1)}
              className="p-1 rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/[0.06] transition-all flex items-center gap-1 text-[11px]"
            >
              <span>{year + 1}</span>
              <ChevronRight size={13} />
            </button>
          </div>
        )}
      </div>

      {/* 2. Interactive Tap Info Bar */}
      <div className="min-h-[44px] py-2 px-3 bg-[#191a24] border border-white/[0.06] rounded-2xl flex flex-wrap items-center justify-between text-xs gap-2 transition-all shadow-inner">
        {currentHoveredPoint ? (
          <div className="flex flex-wrap items-center justify-between w-full animate-fade-in font-medium gap-1.5">
            <div className="flex items-center gap-2">
              <span className="text-white font-black font-mono">
                {'day' in currentHoveredPoint
                  ? `${currentHoveredPoint.day} ${monthNames[month]}`
                  : `${currentHoveredPoint.name} ${year}`}
              </span>
              {'transactions' in currentHoveredPoint && currentHoveredPoint.transactions.length > 0 && (
                <span className="text-[10px] text-[#94a3b8] px-1.5 py-0.5 rounded bg-white/[0.06]">
                  {currentHoveredPoint.transactions.length} оп.
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              {(displayMode === 'combo' || displayMode === 'bars') && (
                <>
                  <span className="text-[#10b981] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                    +{currentHoveredPoint.income.toLocaleString('ru-RU')} ₽
                  </span>
                  <span className="text-[#f43f5e] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                    -{currentHoveredPoint.expense.toLocaleString('ru-RU')} ₽
                  </span>
                </>
              )}
              {(displayMode === 'combo' || displayMode === 'line') && (
                <span className="text-[#38bdf8] font-black px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">
                  {currentHoveredPoint.runningBalance >= 0 ? '+' : ''}
                  {currentHoveredPoint.runningBalance.toLocaleString('ru-RU')} ₽
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full text-[#94a3b8]">
            <div className="flex items-center gap-2 text-xs">
              <Sparkles size={13} className="text-[#7c5cff]" />
              <span>
                {viewScope === 'month'
                  ? 'Нажмите на любой день для детальной расшифровки'
                  : 'Нажмите на любой месяц для перехода к деталям'}
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#64748b]">
              {viewScope === 'month' ? `${monthNames[month]} ${year}` : `${year}`}
            </span>
          </div>
        )}
      </div>

      {/* 3. SVG Graph Canvas */}
      <div className="w-full h-72 relative bg-[#0e0f14]/80 rounded-2xl border border-white/[0.04] p-1 overflow-hidden">
        <svg className="w-full h-full" viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
          <defs>
            <linearGradient id="luminousBalanceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
              <stop offset="60%" stopColor="#7c5cff" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#7c5cff" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="incomePillGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="expensePillGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>
            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = chartBottom - pct * chartHeight;
            const leftVal = Math.round(maxOpsFlow * pct);
            const rightVal = Math.round(maxBalanceFlow * pct);
            const formatShort = (val: number) => {
              if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
              if (val >= 1000) return `${Math.round(val / 1000)}k`;
              return `${val}`;
            };
            return (
              <g key={i}>
                <line
                  x1={chartLeft}
                  y1={y}
                  x2={chartRight}
                  y2={y}
                  stroke="#ffffff"
                  strokeOpacity={pct === 0 ? 0.15 : 0.04}
                  strokeDasharray={pct === 0 ? undefined : '4 4'}
                />
                {(displayMode === 'combo' || displayMode === 'bars') && (
                  <text
                    x={chartLeft - 6}
                    y={y + 3.5}
                    textAnchor="end"
                    fill="#10b981"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                    opacity={0.8}
                  >
                    {formatShort(leftVal)} ₽
                  </text>
                )}
                {(displayMode === 'combo' || displayMode === 'line') && (
                  <text
                    x={chartRight + 6}
                    y={y + 3.5}
                    textAnchor="start"
                    fill="#38bdf8"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                    opacity={0.8}
                  >
                    {formatShort(rightVal)} ₽
                  </text>
                )}
              </g>
            );
          })}

          {viewScope === 'month' && (() => {
            const count = displayedDailyData.length;
            if (count === 0) return null;

            const colWidth = chartWidth / count;
            const barW = Math.max(4, Math.min(14, (colWidth - 6) / 2));

            const points = displayedDailyData.map((d, i) => {
              const x = chartLeft + i * colWidth + colWidth / 2;
              const y = chartBottom - (Math.max(0, Math.min(d.runningBalance, maxBalanceFlow)) / maxBalanceFlow) * chartHeight;
              return { x, y, d };
            });

            let splineD = '';
            let areaD = '';
            if (points.length > 0) {
              splineD = `M ${points[0].x} ${points[0].y}`;
              areaD = `M ${points[0].x} ${chartBottom} L ${points[0].x} ${points[0].y}`;
              for (let i = 0; i < points.length - 1; i++) {
                const p0 = points[i];
                const p1 = points[i + 1];
                const cx = (p0.x + p1.x) / 2;
                splineD += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
                areaD += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
              }
              const last = points[points.length - 1];
              areaD += ` L ${last.x} ${chartBottom} Z`;
            }

            return (
              <>
                {(displayMode === 'combo' || displayMode === 'line') && areaD && (
                  <path d={areaD} fill="url(#luminousBalanceGrad)" pointerEvents="none" />
                )}
                {(displayMode === 'combo' || displayMode === 'line') && splineD && (
                  <path
                    d={splineD}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#neonGlow)"
                    pointerEvents="none"
                  />
                )}
                {displayedDailyData.map((d, idx) => {
                  const xCenter = chartLeft + idx * colWidth + colWidth / 2;
                  const xColLeft = chartLeft + idx * colWidth;
                  const isHovered = hoveredIndex === idx;

                  const incH = maxOpsFlow > 0 ? (d.income / maxOpsFlow) * (chartHeight * 0.85) : 0;
                  const expH = maxOpsFlow > 0 ? (d.expense / maxOpsFlow) * (chartHeight * 0.85) : 0;

                  return (
                    <g
                      key={d.day}
                      className="cursor-pointer"
                      onClick={() => setHoveredIndex(idx === hoveredIndex ? null : idx)}
                      onTouchStart={() => setHoveredIndex(idx)}
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      <rect
                        x={xColLeft}
                        y={chartTop}
                        width={colWidth}
                        height={chartHeight + 24}
                        fill={isHovered ? 'rgba(124, 92, 255, 0.22)' : 'transparent'}
                        rx={5}
                      />
                      {isHovered && (
                        <line
                          x1={xCenter}
                          y1={chartTop}
                          x2={xCenter}
                          y2={chartBottom}
                          stroke="#7c5cff"
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                          opacity={0.9}
                        />
                      )}
                      {(displayMode === 'combo' || displayMode === 'bars') && incH > 0 && (
                        <rect
                          x={expH > 0 ? xCenter - barW - 1.5 : xCenter - barW / 2}
                          y={chartBottom - incH}
                          width={barW}
                          height={incH}
                          rx={3}
                          fill="url(#incomePillGrad)"
                          opacity={isHovered ? 1 : 0.9}
                        />
                      )}
                      {(displayMode === 'combo' || displayMode === 'bars') && expH > 0 && (
                        <rect
                          x={incH > 0 ? xCenter + 1.5 : xCenter - barW / 2}
                          y={chartBottom - expH}
                          width={barW}
                          height={expH}
                          rx={3}
                          fill="url(#expensePillGrad)"
                          opacity={isHovered ? 1 : 0.9}
                        />
                      )}
                      {(displayMode === 'combo' || displayMode === 'line') && (
                        <circle
                          cx={points[idx]?.x || xCenter}
                          cy={points[idx]?.y || chartBottom}
                          r={isHovered ? 6 : 3}
                          fill={isHovered ? '#ffffff' : '#38bdf8'}
                          stroke="#0e0f14"
                          strokeWidth="2"
                        />
                      )}
                      {(count <= 15 || d.day === 1 || d.day % 5 === 0 || d.day === count || isHovered) && (
                        <text
                          x={xCenter}
                          y={chartBottom + 16}
                          textAnchor="middle"
                          fill={isHovered ? '#ffffff' : '#94a3b8'}
                          fontSize={isHovered ? '10' : '9'}
                          fontWeight={isHovered ? 'bold' : 'normal'}
                          fontFamily="monospace"
                        >
                          {d.day}
                        </text>
                      )}
                    </g>
                  );
                })}
              </>
            );
          })()}

          {viewScope === 'year' && (() => {
            const colWidth = chartWidth / 12;
            const barW = Math.max(6, Math.min(18, (colWidth - 12) / 2));

            const points = yearly12MonthsData.map((m, i) => {
              const x = chartLeft + i * colWidth + colWidth / 2;
              const y = chartBottom - (Math.max(0, Math.min(m.runningBalance, maxBalanceFlow)) / maxBalanceFlow) * chartHeight;
              return { x, y, m };
            });

            let splineD = '';
            let areaD = '';
            if (points.length > 0) {
              splineD = `M ${points[0].x} ${points[0].y}`;
              areaD = `M ${points[0].x} ${chartBottom} L ${points[0].x} ${points[0].y}`;
              for (let i = 0; i < points.length - 1; i++) {
                const p0 = points[i];
                const p1 = points[i + 1];
                const cx = (p0.x + p1.x) / 2;
                splineD += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
                areaD += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
              }
              const last = points[points.length - 1];
              areaD += ` L ${last.x} ${chartBottom} Z`;
            }

            return (
              <>
                {(displayMode === 'combo' || displayMode === 'line') && areaD && (
                  <path d={areaD} fill="url(#luminousBalanceGrad)" pointerEvents="none" />
                )}
                {(displayMode === 'combo' || displayMode === 'line') && splineD && (
                  <path
                    d={splineD}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#neonGlow)"
                    pointerEvents="none"
                  />
                )}
                {yearly12MonthsData.map((m, idx) => {
                  const xCenter = chartLeft + idx * colWidth + colWidth / 2;
                  const xColLeft = chartLeft + idx * colWidth;
                  const isHovered = hoveredIndex === idx;
                  const isCurrent = idx === month;

                  const incH = maxOpsFlow > 0 ? (m.income / maxOpsFlow) * (chartHeight * 0.85) : 0;
                  const expH = maxOpsFlow > 0 ? (m.expense / maxOpsFlow) * (chartHeight * 0.85) : 0;

                  return (
                    <g
                      key={m.monthIndex}
                      className="cursor-pointer"
                      onClick={() => {
                        onMonthSelect?.(m.monthIndex);
                        setViewScope('month');
                      }}
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      <rect
                        x={xColLeft}
                        y={chartTop}
                        width={colWidth}
                        height={chartHeight + 20}
                        fill={isHovered ? 'rgba(124, 92, 255, 0.16)' : isCurrent ? 'rgba(124, 92, 255, 0.08)' : 'transparent'}
                        rx={6}
                      />
                      {isHovered && (
                        <line
                          x1={xCenter}
                          y1={chartTop}
                          x2={xCenter}
                          y2={chartBottom}
                          stroke="#7c5cff"
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                          opacity={0.9}
                        />
                      )}
                      {(displayMode === 'combo' || displayMode === 'bars') && incH > 0 && (
                        <rect
                          x={expH > 0 ? xCenter - barW - 2 : xCenter - barW / 2}
                          y={chartBottom - incH}
                          width={barW}
                          height={incH}
                          rx={3}
                          fill="url(#incomePillGrad)"
                          opacity={isHovered ? 1 : 0.9}
                        />
                      )}
                      {(displayMode === 'combo' || displayMode === 'bars') && expH > 0 && (
                        <rect
                          x={incH > 0 ? xCenter + 2 : xCenter - barW / 2}
                          y={chartBottom - expH}
                          width={barW}
                          height={expH}
                          rx={3}
                          fill="url(#expensePillGrad)"
                          opacity={isHovered ? 1 : 0.9}
                        />
                      )}
                      {(displayMode === 'combo' || displayMode === 'line') && (
                        <circle
                          cx={points[idx]?.x || xCenter}
                          cy={points[idx]?.y || chartBottom}
                          r={isHovered ? 6 : isCurrent ? 4 : 3}
                          fill={isHovered ? '#ffffff' : '#38bdf8'}
                          stroke="#0e0f14"
                          strokeWidth="2"
                        />
                      )}
                      <text
                        x={xCenter}
                        y={chartBottom + 16}
                        textAnchor="middle"
                        fill={isCurrent ? '#7c5cff' : isHovered ? '#ffffff' : '#64748b'}
                        fontSize="10"
                        fontWeight={isCurrent || isHovered ? 'bold' : 'normal'}
                      >
                        {m.name}
                      </text>
                    </g>
                  );
                })}
              </>
            );
          })()}
        </svg>

        {!hasData && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center bg-black/40 backdrop-blur-xs">
            <Sparkles size={24} className="text-[#7c5cff] mb-2 opacity-60" />
            <p className="text-xs font-semibold text-[#cbd5e1]">В выбранном периоде пока нет финансовых операций</p>
            <p className="text-[11px] text-[#64748b] mt-0.5">Добавьте смену в календаре или создайте операцию расхода/дохода</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
        <div className="md:col-span-2 p-3.5 rounded-2xl bg-[#191a24] border border-white/[0.06] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <PieChart size={13} className="text-[#ec4899]" />
              <span>Главные категории трат ({monthNames[month]})</span>
            </span>
            <span className="text-[11px] text-[#94a3b8] font-mono">
              Всего: -{monthTotalExpense.toLocaleString('ru-RU')} ₽
            </span>
          </div>

          {topExpenseCategories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {topExpenseCategories.map((cat) => (
                <div key={cat.name} className="p-2 rounded-xl bg-[#11121a] border border-white/[0.04] space-y-1.5">
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="flex items-center gap-1.5 text-white font-medium truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="truncate">{cat.name}</span>
                    </span>
                    <div className="flex items-center gap-1.5 font-mono text-[11px] shrink-0">
                      <span className="font-bold text-white">
                        {cat.amount.toLocaleString('ru-RU')} ₽
                      </span>
                      <span className="text-[#94a3b8] text-[10px]">
                        ({cat.percent}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, cat.percent)}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#64748b] italic py-2">
              В этом месяце еще нет расходов
            </p>
          )}
        </div>

        <div className="p-3.5 rounded-2xl bg-[#191a24] border border-white/[0.06] flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Percent size={13} className="text-[#10b981]" />
              <span>Норма сбережений</span>
            </span>
            <span className="font-black text-[#10b981] font-mono text-sm">
              {monthSavingsRate}%
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#10b981] to-[#38bdf8] transition-all duration-500"
              style={{ width: `${Math.max(0, Math.min(100, monthSavingsRate))}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#94a3b8] pt-1 border-t border-white/[0.06]">
            <span>Чистыми:</span>
            <span className={`font-mono font-bold ${monthNetSavings >= 0 ? 'text-[#38bdf8]' : 'text-[#f43f5e]'}`}>
              {monthNetSavings >= 0 ? '+' : ''}{monthNetSavings.toLocaleString('ru-RU')} ₽
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
