import React, { useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Filter,
  Search,
  Sparkles,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CreditCard,
  CheckCircle2,
  Layers,
  Edit2,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  EyeOff,
  Percent,
  Sliders,
  BarChart3,
  PieChart,
  TrendingUp,
} from 'lucide-react';
import {
  IconTargetGoal,
  IconBankDeposit,
  IconYieldPercent,
  IconWalletCapital,
  IconGrooming,
} from '../icons/CustomNeironoIcons';
import {
  useBrainStore,
  FinanceTransaction,
  TransactionType,
  SavingsGoal,
  BankDeposit,
} from '../../store/useBrainStore';
import { FinanceInteractiveChart } from './FinanceInteractiveChart';

const CATEGORY_COLORS: Record<string, string> = {
  'Зарплата за смены': '#10b981',
  'Зарплата': '#10b981',
  'Подработка': '#38bdf8',
  'Еда/Продукты': '#f59e0b',
  'Стрижка/Уход': '#ec4899',
  'Жилье/ЖКХ': '#8b5cf6',
  'Транспорт': '#06b6d4',
  'Покупки': '#f43f5e',
  'Здоровье': '#10b981',
  'Развлечения': '#eab308',
  'Прочее': '#94a3b8',
};

function sanitizeNumericInput(val: string): string {
  const digits = val.replace(/\D/g, '');
  return digits ? digits.replace(/^0+(?=\d)/, '') : '';
}

function toLocalDateStr(d: Date = new Date()): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const MONTH_NAMES = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];

export const FinanceManagerView: React.FC = () => {
  const {
    transactions,
    shifts,
    calendarEvents,
    shiftSettings,
    monthlyBudgetLimit,
    savingsGoals,
    bankDeposits,
    addTransaction,
    deleteTransaction,
    deleteShift,
    deleteCalendarEvent,
    setMonthlyBudgetLimit,
    importSalaryFromShifts,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    depositToGoal,
    withdrawFromGoal,
    addBankDeposit,
    updateBankDeposit,
    deleteBankDeposit,
    updateDepositBalance,
    addNeuron,
    openNote,
  } = useBrainStore();

  const [activeTab, setActiveTab] = useState<'transactions' | 'analytics' | 'goals' | 'deposits'>('transactions');
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'calendar'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);
  const [isGroupShiftsSingleEntry, setIsGroupShiftsSingleEntry] = useState(true);
  const [hoveredChartDay, setHoveredChartDay] = useState<{
    day: number;
    dateStr: string;
    income: number;
    expense: number;
    net: number;
    runningBalance: number;
  } | null>(null);

  // Hideable UI components state (User request: "возможность скрывать что то")
  const [isHeaderKpiVisible, setIsHeaderKpiVisible] = useState(true);
  const [isSidebarCategoriesVisible, setIsSidebarCategoriesVisible] = useState(true);

  // Modals state
  const [isAddTxModalOpen, setIsAddTxModalOpen] = useState(false);
  const [modalTxType, setModalTxType] = useState<TransactionType>('expense');
  const [modalTxCategory, setModalTxCategory] = useState('Еда/Продукты');
  const [modalTxAmount, setModalTxAmount] = useState('');
  const [modalTxDesc, setModalTxDesc] = useState('');
  const [modalTxDate, setModalTxDate] = useState(() => toLocalDateStr());
  const [modalTxPayment, setModalTxPayment] = useState('Карта');

  // Goal Modal
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTargetAmount, setGoalTargetAmount] = useState('');
  const [goalCurrentAmount, setGoalCurrentAmount] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');
  const [goalCategory, setGoalCategory] = useState('Техника');
  const [goalColor, setGoalColor] = useState('#7c5cff');

  // Deposit Modal
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depTitle, setDepTitle] = useState('');
  const [depBank, setDepBank] = useState('Т-Банк');
  const [depBalance, setDepBalance] = useState('');
  const [depRate, setDepRate] = useState('18.0');
  const [depStartDate, setDepStartDate] = useState(() => toLocalDateStr());
  const [depEndDate, setDepEndDate] = useState('');
  const [depCapitalization, setDepCapitalization] = useState(true);
  const [depPayout, setDepPayout] = useState<'monthly' | 'at_maturity'>('monthly');
  const [depColor, setDepColor] = useState('#10b981');

  // Quick Deposit Replenish / Withdraw Modal
  const [depositAdjustTarget, setDepositAdjustTarget] = useState<BankDeposit | null>(null);
  const [depositAdjustAmount, setDepositAdjustAmount] = useState('10000');
  const [depositAdjustMode, setDepositAdjustMode] = useState<'replenish' | 'withdraw'>('replenish');

  // Full Deposit Editor Modal
  const [editingDeposit, setEditingDeposit] = useState<BankDeposit | null>(null);

  // Quick Goal Deposit Pop-up
  const [depositGoalTarget, setDepositGoalTarget] = useState<SavingsGoal | null>(null);
  const [depositGoalAmountInput, setDepositGoalAmountInput] = useState('');

  // Budget settings modal
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [budgetLimitInput, setBudgetLimitInput] = useState(monthlyBudgetLimit.toString());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const todayStr = toLocalDateStr();

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleSelectMonth = (newMonth: number) => setCurrentDate(new Date(year, newMonth, 1));
  const handleSelectYear = (newYear: number) => setCurrentDate(new Date(newYear, month, 1));
  const handleToday = () => setCurrentDate(new Date());

  // Detailed Shift Stats for Selected Month
  const shiftStats = useMemo(() => {
    const monthShifts = (shifts || []).filter((s) => (s.date || '').startsWith(monthPrefix));
    const workShifts = monthShifts.filter((s) => s.type !== 'off' && s.type !== 'vacation');
    const totalEarnings = workShifts.reduce((sum, s) => sum + (s.earnings || 0), 0);
    const totalHours = workShifts.reduce((sum, s) => sum + (s.hours || 0), 0);
    const avgEarningsPerShift = workShifts.length > 0 ? Math.round(totalEarnings / workShifts.length) : 0;
    const completedEarnings = workShifts.filter((s) => s.date <= todayStr).reduce((sum, s) => sum + (s.earnings || 0), 0);
    const upcomingEarnings = workShifts.filter((s) => s.date > todayStr).reduce((sum, s) => sum + (s.earnings || 0), 0);

    return {
      totalShifts: workShifts.length,
      totalHours,
      totalEarnings,
      avgEarningsPerShift,
      completedEarnings,
      upcomingEarnings,
    };
  }, [shifts, monthPrefix, todayStr]);

  // Combined Seamless Month Transactions (Manual + Automatic Shifts + Automatic Calendar Expenses)
  const monthTransactions = useMemo(() => {
    const list: (FinanceTransaction & { isAutoCalendar?: boolean; isShift?: boolean; eventId?: string })[] = [];

    // 1. Manual user transactions
    (transactions || [])
      .filter((t) => (t.date || '').startsWith(monthPrefix))
      .forEach((t) => {
        list.push({
          ...t,
          isAutoCalendar: t.paymentMethod === 'Календарь' || t.paymentMethod === 'Смена' ? true : undefined,
        });
      });

    // 2. Automatic Calendar Work Shifts (as Income)
    (shifts || [])
      .filter((s) => (s.date || '').startsWith(monthPrefix) && (s.earnings || 0) > 0)
      .forEach((s) => {
        // Prevent duplicate if user manually imported identical date & amount
        const isDuplicate = list.some(
          (t) => t.date === s.date && t.amount === s.earnings && t.type === 'income' && !t.id.startsWith('auto-')
        );
        if (!isDuplicate) {
          const shiftLabel =
            s.type === 'day'
              ? 'Дневная смена'
              : s.type === 'night'
              ? 'Ночная смена'
              : s.type === 'full'
              ? 'Суточная смена'
              : 'Смена';
          list.push({
            id: `auto-shift-${s.date}`,
            date: s.date,
            type: 'income',
            category: 'Зарплата за смены',
            amount: s.earnings,
            description: s.note ? `${shiftLabel}: ${s.note}` : `${shiftLabel} (${s.hours} ч × ${s.rate} ₽)`,
            paymentMethod: 'Смена',
            isAutoCalendar: true,
            isShift: true,
          });
        }
      });

    // 3. Automatic Calendar Shift Expenses (as Expense: road, food, etc.)
    (shifts || [])
      .filter((s) => (s.date || '').startsWith(monthPrefix))
      .forEach((s) => {
        const shiftExp = s.expense !== undefined ? s.expense : (s.roadExpense || 0) + (s.foodExpense || 0);
        if (shiftExp > 0) {
          const isDuplicate = list.some(
            (t) => t.date === s.date && t.amount === shiftExp && t.type === 'expense' && !t.id.startsWith('auto-')
          );
          if (!isDuplicate) {
            list.push({
              id: `auto-shift-exp-${s.date}`,
              date: s.date,
              type: 'expense',
              category: 'Траты на смене',
              amount: shiftExp,
              description: `Траты на смене (${s.date})`,
              paymentMethod: 'Смена',
              isAutoCalendar: true,
              isShift: true,
            });
          }
        }
      });

    // 4. Automatic Calendar Events with amounts / expenses
    (calendarEvents || [])
      .filter((ev) => (ev.date || '').startsWith(monthPrefix) && (ev.amount || 0) > 0)
      .forEach((ev) => {
        const isDuplicate = list.some(
          (t) => t.date === ev.date && t.amount === ev.amount && t.type === 'expense' && !t.id.startsWith('auto-')
        );
        if (!isDuplicate) {
          const catMap: Record<string, string> = {
            beauty: 'Стрижка/Уход',
            shopping: 'Покупки',
            health: 'Здоровье',
            personal: 'Прочее',
            finance: 'Прочее',
            work: 'Прочее',
            other: 'Прочее',
          };
          list.push({
            id: `auto-event-${ev.id}`,
            date: ev.date,
            type: 'expense',
            category: catMap[ev.category] || 'Прочее',
            amount: ev.amount!,
            description: `${ev.title}${ev.time ? ` (${ev.time})` : ''}`,
            paymentMethod: 'Календарь',
            isAutoCalendar: true,
            eventId: ev.id,
          });
        }
      });

    // Sort descending by date
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, shifts, calendarEvents, monthPrefix]);

  // Full Year Synthesized Transactions (for Yearly Analytics & Charts)
  const allYearTransactions = useMemo(() => {
    const yearPrefix = `${year}-`;
    const list: (FinanceTransaction & { isAutoCalendar?: boolean; isShift?: boolean; eventId?: string })[] = [];

    (transactions || [])
      .filter((t) => (t.date || '').startsWith(yearPrefix))
      .forEach((t) => {
        list.push({ ...t });
      });

    // 1. Calendar Shifts with earnings for all months of the year
    (shifts || [])
      .filter((s) => (s.date || '').startsWith(yearPrefix))
      .forEach((s) => {
        if (s.earnings > 0) {
          const isDuplicate = list.some(
            (t) => t.date === s.date && t.amount === s.earnings && t.type === 'income' && !t.id.startsWith('auto-')
          );
          if (!isDuplicate) {
            const shiftLabel =
              s.type === 'day'
                ? 'Дневная смена'
                : s.type === 'night'
                ? 'Ночная смена'
                : s.type === 'full'
                ? 'Суточная смена'
                : 'Смена';
            list.push({
              id: `auto-shift-${s.date}`,
              date: s.date,
              type: 'income',
              category: 'Зарплата за смены',
              amount: s.earnings,
              description: s.note ? `${shiftLabel}: ${s.note}` : `${shiftLabel} (${s.hours} ч × ${s.rate} ₽)`,
              paymentMethod: 'Смена',
              isAutoCalendar: true,
              isShift: true,
            });
          }
        }

        // Shift expense
        const shiftExp = s.expense !== undefined ? s.expense : (s.roadExpense || 0) + (s.foodExpense || 0);
        if (shiftExp > 0) {
          list.push({
            id: `auto-shift-exp-${s.date}`,
            date: s.date,
            type: 'expense',
            category: 'Прочее',
            amount: shiftExp,
            description: `Траты на смене (${s.date})`,
            paymentMethod: 'Календарь',
            isAutoCalendar: true,
            isShift: true,
          });
        }
      });

    // 2. Calendar Events with expenses for all months of the year
    (calendarEvents || [])
      .filter((ev) => (ev.date || '').startsWith(yearPrefix) && (ev.amount || 0) > 0)
      .forEach((ev) => {
        const isDuplicate = list.some(
          (t) => t.date === ev.date && t.amount === ev.amount && t.type === 'expense' && !t.id.startsWith('auto-')
        );
        if (!isDuplicate) {
          const catMap: Record<string, string> = {
            beauty: 'Стрижка/Уход',
            shopping: 'Покупки',
            health: 'Здоровье',
            personal: 'Прочее',
            finance: 'Прочее',
            work: 'Прочее',
            other: 'Прочее',
          };
          list.push({
            id: `auto-event-${ev.id}`,
            date: ev.date,
            type: 'expense',
            category: catMap[ev.category] || 'Прочее',
            amount: ev.amount!,
            description: `${ev.title}${ev.time ? ` (${ev.time})` : ''}`,
            paymentMethod: 'Календарь',
            isAutoCalendar: true,
            eventId: ev.id,
          });
        }
      });

    return list;
  }, [transactions, shifts, calendarEvents, year]);

  // Financial Stats Calculation
  const stats = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    const categoryTotals: Record<string, number> = {};

    monthTransactions.forEach((t) => {
      if (t.type === 'income') {
        totalIncome += t.amount;
      } else {
        totalExpense += t.amount;
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      }
    });

    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;
    const budgetSpentPercent =
      monthlyBudgetLimit > 0 ? Math.min(100, Math.round((totalExpense / monthlyBudgetLimit) * 100)) : 0;

    // Total Savings in Goals
    const totalGoalsSaved = (savingsGoals || []).reduce((sum, g) => sum + (g.currentAmount || 0), 0);
    const totalGoalsTarget = (savingsGoals || []).reduce((sum, g) => sum + (g.targetAmount || 0), 0);

    // Total Deposits & Yield
    const totalDepositsBalance = (bankDeposits || []).reduce((sum, d) => sum + (d.balance || 0), 0);
    const totalMonthlyYield = (bankDeposits || []).reduce(
      (sum, d) => sum + Math.round(((d.balance || 0) * ((d.interestRate || 0) / 100)) / 12),
      0
    );
    const totalAnnualYield = (bankDeposits || []).reduce(
      (sum, d) => sum + Math.round((d.balance || 0) * ((d.interestRate || 0) / 100)),
      0
    );

    const calendarExpenses = monthTransactions
      .filter((t) => t.isAutoCalendar && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const projectedTotalIncome = totalIncome + shiftStats.upcomingEarnings;

    return {
      totalIncome,
      totalExpense,
      netSavings,
      savingsRate,
      budgetSpentPercent,
      categoryTotals,
      totalGoalsSaved,
      totalGoalsTarget,
      totalDepositsBalance,
      totalMonthlyYield,
      totalAnnualYield,
      calendarExpenses,
      projectedTotalIncome,
    };
  }, [monthTransactions, monthlyBudgetLimit, savingsGoals, bankDeposits, shiftStats.upcomingEarnings]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dailyChartData = useMemo(() => {
    const data = [];
    let runningBalance = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = `${monthPrefix}-${String(d).padStart(2, '0')}`;
      const dayTxs = monthTransactions.filter((t) => t.date === dayStr);

      let income = 0;
      let expense = 0;

      dayTxs.forEach((t) => {
        if (t.type === 'income') income += t.amount;
        else expense += t.amount;
      });

      runningBalance += income - expense;

      data.push({
        day: d,
        dateStr: dayStr,
        income,
        expense,
        net: income - expense,
        runningBalance,
      });
    }

    return data;
  }, [monthPrefix, monthTransactions, daysInMonth]);

  const maxDailyAmount = useMemo(() => {
    let max = 1000;
    dailyChartData.forEach((d) => {
      if (d.income > max) max = d.income;
      if (d.expense > max) max = d.expense;
      if (Math.abs(d.runningBalance) > max) max = Math.abs(d.runningBalance);
    });
    return max;
  }, [dailyChartData]);

  const categoryBreakdown = useMemo(() => {
    const list = Object.entries(stats.categoryTotals).map(([cat, amount]) => ({
      category: cat,
      amount,
      color: CATEGORY_COLORS[cat] || '#94a3b8',
      percent: stats.totalExpense > 0 ? Math.round((amount / stats.totalExpense) * 100) : 0,
    }));
    return list.sort((a, b) => b.amount - a.amount);
  }, [stats.categoryTotals, stats.totalExpense]);

  // Prepared Transactions for Table Display (Supports single aggregated shift entry)
  const tableTransactions = useMemo(() => {
    if (!isGroupShiftsSingleEntry) {
      return monthTransactions;
    }

    const manualAndEventTxs = monthTransactions.filter((t) => !t.isShift);
    const shiftIncomeTxs = monthTransactions.filter((t) => t.isShift && t.type === 'income');
    const shiftExpenseTxs = monthTransactions.filter((t) => t.isShift && t.type === 'expense');

    const result = [...manualAndEventTxs];

    // Single consolidated shift income entry
    if (shiftIncomeTxs.length > 0) {
      const totalShiftIncome = shiftIncomeTxs.reduce((sum, t) => sum + t.amount, 0);
      const latestShiftDate = [...shiftIncomeTxs].sort((a, b) => b.date.localeCompare(a.date))[0]?.date || `${monthPrefix}-01`;
      const totalHours = shifts
        .filter((s) => (s.date || '').startsWith(monthPrefix) && (s.earnings || 0) > 0)
        .reduce((sum, s) => sum + (s.hours || 0), 0);

      result.push({
        id: 'auto-shifts-consolidated-income',
        date: latestShiftDate,
        type: 'income',
        category: 'Зарплата за смены',
        amount: totalShiftIncome,
        description: `Зарплата со смен за ${MONTH_NAMES[month]} (${shiftIncomeTxs.length} смен, ${totalHours} ч)`,
        paymentMethod: 'Календарь',
        isAutoCalendar: true,
        isShift: true,
      });
    }

    // Single consolidated shift expense entry (if any)
    if (shiftExpenseTxs.length > 0) {
      const totalShiftExpense = shiftExpenseTxs.reduce((sum, t) => sum + t.amount, 0);
      const latestShiftExpDate = [...shiftExpenseTxs].sort((a, b) => b.date.localeCompare(a.date))[0]?.date || `${monthPrefix}-01`;

      result.push({
        id: 'auto-shifts-consolidated-expense',
        date: latestShiftExpDate,
        type: 'expense',
        category: 'Прочее',
        amount: totalShiftExpense,
        description: `Траты на смене за ${MONTH_NAMES[month]} (${shiftExpenseTxs.length} смен)`,
        paymentMethod: 'Календарь',
        isAutoCalendar: true,
        isShift: true,
      });
    }

    return result.sort((a, b) => b.date.localeCompare(a.date));
  }, [monthTransactions, isGroupShiftsSingleEntry, monthPrefix, month, shifts]);

  // Filtered & Sorted List for Transactions Table
  const filteredTransactions = useMemo(() => {
    return tableTransactions
      .filter((t) => {
        if (filterType === 'income' && t.type !== 'income') return false;
        if (filterType === 'expense' && t.type !== 'expense') return false;
        if (filterType === 'calendar' && !t.isAutoCalendar) return false;
        if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            t.description.toLowerCase().includes(q) ||
            t.category.toLowerCase().includes(q) ||
            t.amount.toString().includes(q) ||
            (t.paymentMethod || '').toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date-asc') return a.date.localeCompare(b.date);
        if (sortBy === 'amount-desc') return b.amount - a.amount;
        if (sortBy === 'amount-asc') return a.amount - b.amount;
        return b.date.localeCompare(a.date); // default: date-desc
      });
  }, [tableTransactions, filterType, selectedCategory, searchQuery, sortBy]);

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(modalTxAmount);
    if (!amountNum || amountNum <= 0) return;

    addTransaction({
      date: modalTxDate,
      type: modalTxType,
      category: modalTxCategory,
      amount: amountNum,
      description: modalTxDesc || modalTxCategory,
      paymentMethod: modalTxPayment,
    });

    setIsAddTxModalOpen(false);
    setModalTxAmount('');
    setModalTxDesc('');
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const targetNum = Number(goalTargetAmount);
    if (!targetNum || targetNum <= 0) return;

    addSavingsGoal({
      title: goalTitle || 'Новая цель',
      targetAmount: targetNum,
      currentAmount: Number(goalCurrentAmount) || 0,
      deadline: goalDeadline || undefined,
      category: goalCategory,
      color: goalColor,
    });

    setIsGoalModalOpen(false);
    setGoalTitle('');
    setGoalTargetAmount('');
    setGoalCurrentAmount('');
  };

  const handleCreateDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const balanceNum = Number(depBalance);
    const rateNum = Number(depRate);
    if (!balanceNum || balanceNum <= 0 || !rateNum) return;

    addBankDeposit({
      title: depTitle || `Вклад в ${depBank}`,
      bankName: depBank,
      balance: balanceNum,
      interestRate: rateNum,
      startDate: depStartDate,
      endDate: depEndDate || undefined,
      capitalization: depCapitalization,
      payoutFrequency: depPayout,
      color: depColor,
    });

    setIsDepositModalOpen(false);
    setDepTitle('');
    setDepBalance('');
  };

  const handleApplyDepositToGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositGoalTarget) return;
    const amountNum = Number(depositGoalAmountInput);
    if (!amountNum || amountNum <= 0) return;

    depositToGoal(depositGoalTarget.id, amountNum);
    setDepositGoalTarget(null);
    setDepositGoalAmountInput('');
  };

  // Export Financial Summary to Markdown Note
  const handleExportFinanceReport = () => {
    const monthTitle = `${MONTH_NAMES[month]} ${year}`;
    const noteTitle = `Финансовый отчет и Капитал — ${monthTitle}`;

    let md = `# ${noteTitle}\n\n`;
    md += `> [!tip] Финансовые итоги за ${monthTitle}\n`;
    md += `> **Общий доход**: ${stats.totalIncome.toLocaleString('ru-RU')} ₽\n`;
    md += `> **Общие расходы**: ${stats.totalExpense.toLocaleString('ru-RU')} ₽\n`;
    md += `> **Чистый остаток**: ${stats.netSavings.toLocaleString('ru-RU')} ₽\n`;
    md += `> **Норма сбережений**: ${stats.savingsRate}%\n\n`;

    md += `## Цели накоплений\n\n`;
    md += `| Цель | Накоплено | Целевая сумма | Прогресс | Срок |\n`;
    md += `| :--- | -: | -: | -: | :--- |\n`;
    savingsGoals.forEach((g) => {
      const pct = Math.round((g.currentAmount / g.targetAmount) * 100);
      md += `| ${g.title} | ${g.currentAmount.toLocaleString('ru-RU')} ₽ | ${g.targetAmount.toLocaleString('ru-RU')} ₽ | ${pct}% | ${g.deadline || '-'} |\n`;
    });

    md += `\n## Вклады и Накопительные счета\n\n`;
    md += `| Название | Банк | Баланс | Ставка | Доход в мес | Выплата |\n`;
    md += `| :--- | :--- | -: | :---: | -: | :--- |\n`;
    bankDeposits.forEach((d) => {
      const mYield = Math.round((d.balance * (d.interestRate / 100)) / 12);
      md += `| ${d.title} | ${d.bankName} | ${d.balance.toLocaleString('ru-RU')} ₽ | ${d.interestRate}% | +${mYield.toLocaleString('ru-RU')} ₽/мес | ${d.payoutFrequency === 'monthly' ? 'Ежемесячно' : 'В конце'} |\n`;
    });

    md += `\n## Журнал операций за месяц\n\n`;
    md += `| Дата | Тип | Категория | Описание | Сумма | Оплата |\n`;
    md += `| :--- | :---: | :--- | :--- | -: | :--- |\n`;
    monthTransactions.forEach((t) => {
      const sign = t.type === 'income' ? '+' : '-';
      const typeLabel = t.type === 'income' ? 'Доход' : 'Расход';
      md += `| ${t.date} | ${typeLabel} | ${t.category} | ${t.description} | **${sign}${t.amount.toLocaleString('ru-RU')} ₽** | ${t.paymentMethod || 'Карта'} |\n`;
    });

    const newNote = addNeuron(noteTitle, md, 'Work');
    openNote(newNote.id);
  };

  return (
    <div className="w-full h-full bg-[#0d0e12] flex flex-col overflow-hidden select-none text-[#e2e8f0]">
      {/* Top Header Controls */}
      <div className="p-3.5 border-b border-white/[0.08] bg-[#111217]/90 backdrop-blur-md flex flex-col gap-3">
        {/* Row 1: Title, Live Sync Status, Navigation & Top Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#10b981]/25 to-[#06b6d4]/20 text-[#10b981] border border-[#10b981]/35 flex items-center justify-center shadow-lg shadow-emerald-950/40">
              <IconWalletCapital size={19} color="#10b981" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-sm font-bold text-white tracking-wide">
                  Финансы и Капитал — {MONTH_NAMES[month]} {year}
                </h2>
                {/* Glowing Live Auto-Sync Status Badge */}
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#10b981]/15 border border-[#10b981]/30 text-[#10b981] text-[10px] font-bold shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10b981]"></span>
                  </span>
                  <span>Автосинхронизация с Календарем</span>
                </div>
              </div>
              <p className="text-[10px] text-[#94a3b8] mt-0.5">
                Автономный учет доходов, расходов, смен из календаря и банковских счетов
              </p>
            </div>
          </div>

          {/* Navigation & Controls */}
          <div className="flex items-center gap-2">
            {/* Toggle Header KPI visibility */}
            <button
              onClick={() => setIsHeaderKpiVisible((v) => !v)}
              className="p-1.5 rounded-xl bg-[#161720] border border-white/[0.08] text-[#94a3b8] hover:text-white transition-colors"
              title={isHeaderKpiVisible ? 'Скрыть панель статистики' : 'Показать панель статистики'}
            >
              {isHeaderKpiVisible ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>

            <span className="w-[1px] h-4 bg-white/10" />

            {/* Direct Month & Year Dropdown Selectors */}
            <div className="flex items-center gap-1 bg-[#161720] border border-white/[0.08] p-1 rounded-xl shadow-sm">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/[0.06] transition-colors"
                title="Предыдущий месяц"
              >
                <ChevronLeft size={13} />
              </button>

              <select
                value={month}
                onChange={(e) => handleSelectMonth(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer px-1.5 py-0.5"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={idx} value={idx} className="bg-[#191a24] text-white">
                    {name}
                  </option>
                ))}
              </select>

              <select
                value={year}
                onChange={(e) => handleSelectYear(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-[#7c5cff] focus:outline-none cursor-pointer px-1 py-0.5 font-mono"
              >
                {[2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                  <option key={y} value={y} className="bg-[#191a24] text-white">
                    {y}
                  </option>
                ))}
              </select>

              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/[0.06] transition-colors"
                title="Следующий месяц"
              >
                <ChevronRight size={13} />
              </button>

              <button
                onClick={handleToday}
                className="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-xs font-semibold text-[#cbd5e1] transition-colors ml-0.5"
                title="Текущий месяц"
              >
                Сегодня
              </button>
            </div>

            <span className="w-[1px] h-4 bg-white/10 mx-1" />

            {/* + Расход */}
            <button
              onClick={() => {
                setModalTxType('expense');
                setIsAddTxModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-[#f43f5e]/20 hover:bg-[#f43f5e]/30 text-[#f43f5e] border border-[#f43f5e]/40 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-950/30 transition-all active:scale-95"
            >
              <Plus size={13} />
              <span>Расход</span>
            </button>

            {/* + Доход */}
            <button
              onClick={() => {
                setModalTxType('income');
                setModalTxCategory('Зарплата');
                setIsAddTxModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-[#10b981]/20 hover:bg-[#10b981]/30 text-[#10b981] border border-[#10b981]/40 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/30 transition-all active:scale-95"
            >
              <Plus size={13} />
              <span>Доход</span>
            </button>

            {/* Export Note */}
            <button
              onClick={handleExportFinanceReport}
              className="px-3 py-1.5 rounded-xl bg-[#7c5cff]/20 hover:bg-[#7c5cff]/30 text-[#7c5cff] border border-[#7c5cff]/40 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <FileText size={13} />
              <span>Отчет</span>
            </button>
          </div>
        </div>

        {/* Row 2: Hideable KPI Cards Banner */}
        {isHeaderKpiVisible && (
          <div className="grid grid-cols-4 gap-3 animate-fade-in">
            {/* Income */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-b from-[#161824] to-[#12131c] border border-white/[0.08] flex items-center justify-between shadow-lg relative overflow-hidden">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#94a3b8] tracking-wider block">
                  Доходы за месяц
                </span>
                <span className="text-lg font-black text-[#10b981] font-mono tracking-tight block">
                  +{stats.totalIncome.toLocaleString('ru-RU')} ₽
                </span>
                <div className="flex items-center gap-1.5 text-[10px] text-[#38bdf8] font-medium">
                  <span>{shiftStats.totalEarnings.toLocaleString('ru-RU')} ₽ со смен</span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-xl bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/20 flex items-center justify-center shrink-0">
                <ArrowUpRight size={17} />
              </div>
            </div>

            {/* Expenses */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-b from-[#161824] to-[#12131c] border border-white/[0.08] flex items-center justify-between shadow-lg relative overflow-hidden">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#94a3b8] tracking-wider block">
                  Расходы / Траты
                </span>
                <span className="text-lg font-black text-[#f43f5e] font-mono tracking-tight block">
                  -{stats.totalExpense.toLocaleString('ru-RU')} ₽
                </span>
                <div className="flex items-center gap-1.5 text-[10px] text-[#f43f5e] font-medium">
                  {stats.calendarExpenses > 0 ? (
                    <span>{stats.calendarExpenses.toLocaleString('ru-RU')} ₽ из календаря</span>
                  ) : monthlyBudgetLimit > 0 ? (
                    <span className="text-[#f59e0b] font-medium">{stats.budgetSpentPercent}% от лимита</span>
                  ) : (
                    <span className="text-[#94a3b8]">Лимит не задан</span>
                  )}
                </div>
              </div>
              <div className="w-8 h-8 rounded-xl bg-[#f43f5e]/15 text-[#f43f5e] border border-[#f43f5e]/20 flex items-center justify-center shrink-0">
                <ArrowDownRight size={17} />
              </div>
            </div>

            {/* Net Savings & In Goals */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-b from-[#161824] to-[#12131c] border border-white/[0.08] flex items-center justify-between shadow-lg relative overflow-hidden">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#94a3b8] tracking-wider block">
                  Чистый остаток (Баланс)
                </span>
                <span
                  className={`text-lg font-black font-mono tracking-tight block ${
                    stats.netSavings >= 0 ? 'text-[#38bdf8]' : 'text-[#f43f5e]'
                  }`}
                >
                  {stats.netSavings >= 0 ? '+' : ''}
                  {stats.netSavings.toLocaleString('ru-RU')} ₽
                </span>
                <div className="text-[10px] text-[#10b981] font-medium">
                  <span>{stats.savingsRate}% сохранено</span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-xl bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/20 flex items-center justify-center shrink-0">
                <IconWalletCapital size={17} color="#38bdf8" />
              </div>
            </div>

            {/* Bank Deposits KPI Card */}
            <div
              onClick={() => setActiveTab('deposits')}
              className="p-3.5 rounded-2xl bg-gradient-to-b from-[#161824] to-[#12131c] border border-white/[0.08] hover:border-amber-500/40 flex items-center justify-between shadow-lg relative overflow-hidden cursor-pointer transition-all group"
              title="Перейти к управлению банковскими вкладами"
            >
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#94a3b8] group-hover:text-[#f59e0b] transition-colors tracking-wider block">
                  Вклады в банках
                </span>
                <span className="text-lg font-black text-[#f59e0b] font-mono tracking-tight block">
                  {stats.totalDepositsBalance.toLocaleString('ru-RU')} ₽
                </span>
                <div className="text-[10px] text-[#10b981] font-medium flex items-center gap-1">
                  <span>+{stats.totalMonthlyYield.toLocaleString('ru-RU')} ₽/мес. доход</span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-xl bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <IconBankDeposit size={17} color="#f59e0b" />
              </div>
            </div>
          </div>
        )}

        {/* Row 3: Navigation Tab Switcher (Transactions / Goals / Deposits) */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center p-0.5 bg-[#14151c] border border-white/[0.08] rounded-xl text-xs">
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'transactions'
                  ? 'bg-[#7c5cff] text-white shadow-md'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <CreditCard size={13} />
              <span>Журнал операций ({monthTransactions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'analytics'
                  ? 'bg-[#7c5cff] text-white shadow-md'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <BarChart3 size={13} />
              <span>График и Аналитика</span>
            </button>

            <button
              onClick={() => setActiveTab('goals')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'goals'
                  ? 'bg-[#7c5cff] text-white shadow-md'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <IconTargetGoal size={13} color="currentColor" />
              <span>Цели накоплений ({savingsGoals.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('deposits')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'deposits'
                  ? 'bg-[#7c5cff] text-white shadow-md'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <IconBankDeposit size={13} color="currentColor" />
              <span>Вклады и счета ({bankDeposits.length})</span>
            </button>
          </div>

          {/* Context button for active tab */}
          {activeTab === 'goals' && (
            <button
              onClick={() => setIsGoalModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#7c5cff] hover:bg-[#7c5cff]/90 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95"
            >
              <Plus size={13} />
              <span>+ Новая цель</span>
            </button>
          )}

          {activeTab === 'deposits' && (
            <button
              onClick={() => setIsDepositModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#10b981] hover:bg-[#10b981]/90 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95"
            >
              <Plus size={13} />
              <span>+ Добавить вклад</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area based on Active Tab */}
      <div className="flex-1 flex overflow-hidden">
        {/* ================= TAB 1: TRANSACTIONS ================= */}
        {activeTab === 'transactions' && (
          <>
            {/* Left: Hideable Category & Shifts Breakdown */}
            {isSidebarCategoriesVisible ? (
              <div className="w-76 border-r border-white/[0.08] bg-[#111217] p-3.5 flex flex-col justify-between overflow-y-auto space-y-4">
                <div className="space-y-3.5">
                  {/* Calendar Shifts Live Sync Badge & Summary */}
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-[#10b981]/15 via-[#10b981]/5 to-[#06b6d4]/10 border border-[#10b981]/30 space-y-2.5 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-[#10b981] uppercase font-black tracking-wider flex items-center gap-1.5 shrink-0">
                        <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                        Смены из Календаря
                      </span>
                      <span className="text-[11px] text-[#38bdf8] font-black font-mono px-2 py-0.5 rounded-lg bg-black/40 border border-[#38bdf8]/30 shrink-0">
                        {shiftStats.totalShifts} смен
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      <div className="p-2 rounded-xl bg-black/30 border border-white/[0.06]">
                        <span className="text-[9px] text-[#94a3b8] block">Часов работы</span>
                        <span className="font-bold text-white font-mono text-xs">{shiftStats.totalHours} ч</span>
                      </div>
                      <div className="p-2 rounded-xl bg-black/30 border border-white/[0.06]">
                        <span className="text-[9px] text-[#94a3b8] block">В среднем / смена</span>
                        <span className="font-bold text-[#10b981] font-mono text-xs">
                          {shiftStats.avgEarningsPerShift.toLocaleString('ru-RU')} ₽
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-white/[0.08] text-xs">
                      <span className="text-[#cbd5e1] font-semibold text-[11px]">Заработано со смен:</span>
                      <span className="font-extrabold text-[#10b981] font-mono text-sm">
                        +{shiftStats.totalEarnings.toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                  </div>

                  {/* Categories Breakdown */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Layers size={13} className="text-[#7c5cff]" />
                        <span>Категории расходов</span>
                      </h3>
                      {selectedCategory !== 'all' && (
                        <button
                          onClick={() => setSelectedCategory('all')}
                          className="text-[10px] text-[#38bdf8] hover:underline"
                        >
                          Сбросить ✕
                        </button>
                      )}
                    </div>

                    {Object.keys(stats.categoryTotals).length > 0 ? (
                      <div className="space-y-1.5">
                        {Object.entries(stats.categoryTotals)
                          .sort((a, b) => b[1] - a[1])
                          .map(([cat, amount]) => {
                            const percent =
                              stats.totalExpense > 0 ? Math.round((amount / stats.totalExpense) * 100) : 0;
                            const color = CATEGORY_COLORS[cat] || '#94a3b8';
                            const isCatActive = selectedCategory === cat;

                            return (
                              <div
                                key={cat}
                                onClick={() => setSelectedCategory(isCatActive ? 'all' : cat)}
                                className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                                  isCatActive
                                    ? 'bg-[#7c5cff]/20 border-[#7c5cff] shadow-md ring-1 ring-[#7c5cff]/40'
                                    : 'bg-[#14151c] border-white/[0.04] hover:bg-[#181924]'
                                }`}
                              >
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span
                                      className="w-2 h-2 rounded-full shrink-0"
                                      style={{ backgroundColor: color }}
                                    />
                                    <span className={`truncate font-semibold ${isCatActive ? 'text-white font-bold' : 'text-[#cbd5e1]'}`}>
                                      {cat}
                                    </span>
                                  </div>
                                  <span className="font-bold text-[#e2e8f0] font-mono">
                                    {amount.toLocaleString('ru-RU')} ₽
                                  </span>
                                </div>

                                <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full"
                                    style={{ width: `${percent}%`, backgroundColor: color }}
                                  />
                                </div>
                                <div className="text-[10px] text-[#64748b] text-right mt-0.5">
                                  {percent}% от трат
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <p className="text-xs text-[#64748b] italic">В этом месяце еще нет расходов.</p>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-[#14151c] rounded-xl border border-white/[0.06] text-xs space-y-1">
                  <span className="text-[10px] text-[#94a3b8] uppercase font-bold">Совет по накоплениям</span>
                  <p className="text-[#cbd5e1] leading-relaxed">
                    Вы сохраняете <strong className="text-[#10b981]">{stats.savingsRate}%</strong> от общего дохода.
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsSidebarCategoriesVisible(true)}
                className="w-7 border-r border-white/[0.08] bg-[#111217] hover:bg-[#161720] text-[#94a3b8] flex items-center justify-center text-[10px] uppercase font-bold tracking-widest [writing-mode:vertical-lr] transition-colors"
                title="Показать структуру категорий"
              >
                Категории
              </button>
            )}

            {/* Right: Transactions Table */}
            <div className="flex-1 flex flex-col p-4 overflow-hidden">
              {/* Filter Toolbar */}
              <div className="flex items-center justify-between gap-2.5 mb-3 flex-wrap">
                {/* Type Filter Pills */}
                <div className="flex items-center p-0.5 bg-[#14151c] border border-white/[0.08] rounded-xl text-xs shrink-0">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                      filterType === 'all'
                        ? 'bg-[#7c5cff] text-white shadow-sm'
                        : 'text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    Все ({monthTransactions.length})
                  </button>
                  <button
                    onClick={() => setFilterType('income')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                      filterType === 'income'
                        ? 'bg-[#10b981] text-white shadow-sm'
                        : 'text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    Доходы
                  </button>
                  <button
                    onClick={() => setFilterType('expense')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                      filterType === 'expense'
                        ? 'bg-[#f43f5e] text-white shadow-sm'
                        : 'text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    Расходы
                  </button>
                  <button
                    onClick={() => setFilterType('calendar')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1 ${
                      filterType === 'calendar'
                        ? 'bg-[#06b6d4] text-white shadow-sm'
                        : 'text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    <span>Из Календаря</span>
                    <span className="text-[10px] opacity-75">
                      ({monthTransactions.filter((t) => t.isAutoCalendar).length})
                    </span>
                  </button>
                </div>

                {/* Category & Sorting Selectors */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Category Dropdown Filter */}
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-[#14151c] border border-white/[0.08] rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#7c5cff]"
                  >
                    <option value="all">Все категории</option>
                    {Object.keys(CATEGORY_COLORS).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>

                  {/* Sort Order Selector */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-[#14151c] border border-white/[0.08] rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#7c5cff]"
                  >
                    <option value="date-desc">По дате (новые)</option>
                    <option value="date-asc">По дате (старые)</option>
                    <option value="amount-desc">По сумме (макс)</option>
                    <option value="amount-asc">По сумме (мин)</option>
                  </select>

                  {/* Group Shifts Consolidated Toggle Button */}
                  <button
                    onClick={() => setIsGroupShiftsSingleEntry(!isGroupShiftsSingleEntry)}
                    className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      isGroupShiftsSingleEntry
                        ? 'bg-[#7c5cff]/20 text-[#a78bfa] border-[#7c5cff]/50 shadow-sm'
                        : 'bg-[#14151c] text-[#94a3b8] border-white/[0.08] hover:text-white'
                    }`}
                    title={
                      isGroupShiftsSingleEntry
                        ? 'Смены объединены в 1 общее поступление за месяц. Нажмите, чтобы развернуть по отдельности.'
                        : 'Смены отображаются по дням. Нажмите, чтобы объединить в 1 общее поступление.'
                    }
                  >
                    <Layers size={13} />
                    <span>{isGroupShiftsSingleEntry ? 'Смены: Объединены в 1' : 'Смены: По дням'}</span>
                  </button>

                  {/* Active category clear button */}
                  {selectedCategory !== 'all' && (
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className="px-2 py-1 rounded-lg bg-[#7c5cff]/20 text-[#a78bfa] border border-[#7c5cff]/40 text-xs font-semibold flex items-center gap-1 hover:bg-[#7c5cff]/30 transition-all"
                    >
                      <span>{selectedCategory}</span>
                      <span>✕</span>
                    </button>
                  )}
                </div>

                {/* Search Bar */}
                <div className="relative flex-1 min-w-[180px] max-w-xs">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#64748b]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск по описанию или сумме..."
                    className="w-full bg-[#14151c] border border-white/[0.08] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-[#475569] focus:outline-none focus:border-[#7c5cff]"
                  />
                </div>
              </div>

              {/* Batch Action Floating Pill */}
              {selectedTxIds.length > 0 && (
                <div className="mb-2 p-2 px-3 rounded-xl bg-[#7c5cff]/20 border border-[#7c5cff]/50 flex items-center justify-between animate-fade-in shadow-lg">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#7c5cff] animate-pulse" />
                    <span className="text-xs font-bold text-white">
                      Выбрано: <strong className="text-[#a78bfa]">{selectedTxIds.length}</strong> операций
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedTxIds([])}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-xs text-[#cbd5e1] font-medium"
                    >
                      Снять выделение
                    </button>
                    <button
                      onClick={() => {
                        selectedTxIds.forEach((id) => {
                          const tx = monthTransactions.find((t) => t.id === id);
                          if (tx) {
                            if (tx.isShift) {
                              deleteShift(tx.date);
                            } else if (tx.eventId) {
                              deleteCalendarEvent(tx.eventId);
                            } else {
                              deleteTransaction(tx.id);
                            }
                          }
                        });
                        setSelectedTxIds([]);
                      }}
                      className="px-3 py-1 rounded-lg bg-[#f43f5e] hover:bg-[#f43f5e]/90 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
                    >
                      <Trash2 size={12} />
                      <span>Удалить выбранные ({selectedTxIds.length})</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Transactions Table Container */}
              <div className="flex-1 overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#14151c]">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#191a22] text-[#94a3b8] uppercase font-bold text-[10px] tracking-wider border-b border-white/[0.08] sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={
                            filteredTransactions.length > 0 &&
                            filteredTransactions.every((tx) => selectedTxIds.includes(tx.id))
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTxIds(filteredTransactions.map((tx) => tx.id));
                            } else {
                              setSelectedTxIds([]);
                            }
                          }}
                          className="w-4 h-4 rounded accent-[#7c5cff] cursor-pointer"
                          title="Выбрать все"
                        />
                      </th>
                      <th className="px-4 py-3">Дата</th>
                      <th className="px-4 py-3">Тип</th>
                      <th className="px-4 py-3">Категория</th>
                      <th className="px-4 py-3">Описание</th>
                      <th className="px-4 py-3 text-right">Сумма</th>
                      <th className="px-4 py-3">Способ</th>
                      <th className="px-4 py-3 text-center">Действие</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {filteredTransactions.map((tx) => {
                      const isInc = tx.type === 'income';
                      const color = CATEGORY_COLORS[tx.category] || '#94a3b8';
                      const isSelected = selectedTxIds.includes(tx.id);

                      return (
                        <tr
                          key={tx.id}
                          className={`transition-colors ${
                            isSelected ? 'bg-[#7c5cff]/10' : 'hover:bg-white/[0.02]'
                          }`}
                        >
                          <td className="px-3 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedTxIds((prev) => [...prev, tx.id]);
                                } else {
                                  setSelectedTxIds((prev) => prev.filter((id) => id !== tx.id));
                                }
                              }}
                              className="w-4 h-4 rounded accent-[#7c5cff] cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-3 text-[#94a3b8] font-mono">{tx.date}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                  isInc
                                    ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30'
                                    : 'bg-[#f43f5e]/15 text-[#f43f5e] border-[#f43f5e]/30'
                                }`}
                              >
                                {isInc ? 'Доход' : 'Расход'}
                              </span>
                              {tx.isAutoCalendar && (
                                <span className="px-1.5 py-0.5 rounded-md bg-[#8b5cf6]/15 text-[#a78bfa] border border-[#8b5cf6]/30 text-[9px] font-extrabold flex items-center gap-1">
                                  Календарь
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-1.5 font-semibold text-white">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                              <span>{tx.category}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[#e2e8f0] font-medium">{tx.description}</td>
                          <td
                            className={`px-4 py-3 text-right font-extrabold text-sm font-mono ${
                              isInc ? 'text-[#10b981]' : 'text-[#f43f5e]'
                            }`}
                          >
                            {isInc ? '+' : '-'}
                            {tx.amount.toLocaleString('ru-RU')} ₽
                          </td>
                          <td className="px-4 py-3 text-[#94a3b8]">{tx.paymentMethod || 'Карта'}</td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => {
                                if (tx.isShift) {
                                  deleteShift(tx.date);
                                } else if (tx.eventId) {
                                  deleteCalendarEvent(tx.eventId);
                                } else {
                                  deleteTransaction(tx.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-[#94a3b8] hover:text-[#f43f5e] hover:bg-white/[0.08] transition-colors"
                              title={tx.isAutoCalendar ? 'Удалить из календаря' : 'Удалить операцию'}
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredTransactions.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center py-10 text-xs text-[#64748b] italic">
                          Операций не найдено
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ================= TAB: ANALYTICS & CHARTS ================= */}
        {activeTab === 'analytics' && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {/* Header Title */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart3 size={17} className="text-[#7c5cff]" />
                  <span>Финансовая аналитика и динамика капитала</span>
                </h3>
                <p className="text-xs text-[#94a3b8]">
                  Наглядный график доходов, расходов и траектории накоплений за {MONTH_NAMES[month]} {year}
                </p>
              </div>
            </div>

            {/* Quick KPI Stat Cards */}
            <div className="grid grid-cols-4 gap-3">
              <div className="p-3.5 bg-[#14151c] border border-white/[0.08] rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold text-[#94a3b8] tracking-wider">
                  Норма сбережений
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className={`text-xl font-bold font-mono ${stats.savingsRate >= 0 ? 'text-[#10b981]' : 'text-[#f43f5e]'}`}>
                    {stats.savingsRate}%
                  </span>
                  <span className="text-[10px] text-[#94a3b8]">от доходов</span>
                </div>
              </div>

              <div className="p-3.5 bg-[#14151c] border border-white/[0.08] rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold text-[#94a3b8] tracking-wider">
                  Расход в день (средний)
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-bold font-mono text-[#f59e0b]">
                    {Math.round(stats.totalExpense / daysInMonth).toLocaleString('ru-RU')} ₽
                  </span>
                  <span className="text-[10px] text-[#94a3b8]">/ сутки</span>
                </div>
              </div>

              <div className="p-3.5 bg-[#14151c] border border-white/[0.08] rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold text-[#94a3b8] tracking-wider">
                  Бюджетный лимит
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className={`text-xl font-bold font-mono ${stats.budgetSpentPercent > 90 ? 'text-[#f43f5e]' : 'text-[#38bdf8]'}`}>
                    {stats.budgetSpentPercent}%
                  </span>
                  <span className="text-[10px] text-[#94a3b8]">
                    из {monthlyBudgetLimit.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-[#14151c] border border-white/[0.08] rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold text-[#94a3b8] tracking-wider">
                  Пассивный доход
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-bold font-mono text-[#10b981]">
                    +{stats.totalMonthlyYield.toLocaleString('ru-RU')} ₽
                  </span>
                  <span className="text-[10px] text-[#94a3b8]">/ месяц</span>
                </div>
              </div>
            </div>

            {/* Interactive Multi-Mode Financial Chart Suite */}
            <FinanceInteractiveChart
              monthTransactions={monthTransactions}
              year={year}
              month={month}
              monthNames={MONTH_NAMES}
              categoryColors={CATEGORY_COLORS}
              allYearTransactions={allYearTransactions}
              onYearChange={handleSelectYear}
              onMonthSelect={handleSelectMonth}
            />

            {/* Category Expenses Breakdown Section */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 bg-[#14151c] border border-white/[0.08] rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <PieChart size={14} className="text-[#ec4899]" />
                  <span>Структура расходов по категориям</span>
                </h4>
                <div className="space-y-2.5">
                  {categoryBreakdown.map((item) => (
                    <div key={item.category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-[#cbd5e1]">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                          <span>{item.category}</span>
                        </span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-[#94a3b8] text-[11px]">{item.percent}%</span>
                          <span className="font-bold text-white">{item.amount.toLocaleString('ru-RU')} ₽</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${item.percent}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}

                  {categoryBreakdown.length === 0 && (
                    <p className="text-xs text-[#64748b] italic py-4 text-center">
                      В этом месяце еще нет расходов
                    </p>
                  )}
                </div>
              </div>

              {/* Monthly Overview & Advice Card */}
              <div className="p-5 bg-[#14151c] border border-white/[0.08] rounded-2xl space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <TrendingUp size={14} className="text-[#10b981]" />
                    <span>Финансовый вердикт за месяц</span>
                  </h4>
                  <div className="mt-3 space-y-2 text-xs text-[#94a3b8] leading-relaxed">
                    <p>
                      {stats.netSavings >= 0 ? (
                        <span className="text-[#10b981] font-semibold">
                          Положительный баланс: вы сохранили {stats.netSavings.toLocaleString('ru-RU')} ₽ ({stats.savingsRate}% от дохода).
                        </span>
                      ) : (
                        <span className="text-[#f43f5e] font-semibold">
                          Дефицит бюджета: расходы превысили доходы на {Math.abs(stats.netSavings).toLocaleString('ru-RU')} ₽.
                        </span>
                      )}
                    </p>
                    <p>
                      Крупнейшая статья затрат —{' '}
                      <strong className="text-white">
                        {categoryBreakdown[0]?.category || 'Отсутствует'}
                      </strong>{' '}
                      ({categoryBreakdown[0]?.amount.toLocaleString('ru-RU') || 0} ₽).
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#94a3b8] flex items-center gap-1.5">
                      <IconBankDeposit size={12} color="#f59e0b" />
                      <span>Вклады в банках:</span>
                    </span>
                    <span className="font-bold text-[#f59e0b] font-mono">
                      {stats.totalDepositsBalance.toLocaleString('ru-RU')} ₽ (+{stats.totalMonthlyYield.toLocaleString('ru-RU')} ₽/мес)
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
                    <span className="text-[#94a3b8] flex items-center gap-1.5">
                      <IconTargetGoal size={12} color="#7c5cff" />
                      <span>Накоплено на цели:</span>
                    </span>
                    <span className="font-bold text-[#a78bfa] font-mono">
                      {stats.totalGoalsSaved.toLocaleString('ru-RU')} ₽ из {stats.totalGoalsTarget.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: SAVINGS GOALS (ЦЕЛИ НАКОПЛЕНИЙ) ================= */}
        {activeTab === 'goals' && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <IconTargetGoal size={16} color="#7c5cff" glow />
                  <span>Ваши цели накоплений и финансовые ориентиры</span>
                </h3>
                <p className="text-xs text-[#94a3b8]">
                  Всего накоплено по целям:{' '}
                  <strong className="text-[#10b981] font-mono">
                    {stats.totalGoalsSaved.toLocaleString('ru-RU')} ₽
                  </strong>{' '}
                  из {stats.totalGoalsTarget.toLocaleString('ru-RU')} ₽
                </p>
              </div>
            </div>

            {/* Goals Cards Grid */}
            <div className="grid grid-cols-3 gap-4">
              {savingsGoals.map((goal) => {
                const percent = Math.min(
                  100,
                  Math.round((goal.currentAmount / goal.targetAmount) * 100)
                );
                const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

                return (
                  <div
                    key={goal.id}
                    className="p-4 rounded-2xl bg-[#14151c] border border-white/[0.08] hover:border-white/[0.16] transition-all flex flex-col justify-between space-y-3 relative group"
                  >
                    <div>
                      {/* Top Goal Title & Delete */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: goal.color }}
                          />
                          <h4 className="text-xs font-bold text-white truncate">{goal.title}</h4>
                        </div>
                        <button
                          onClick={() => deleteSavingsGoal(goal.id)}
                          className="text-[#64748b] hover:text-[#f43f5e] opacity-0 group-hover:opacity-100 transition-opacity p-1"
                          title="Удалить цель"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <div className="mt-3 flex items-baseline justify-between">
                        <div>
                          <span className="text-base font-bold text-white font-mono">
                            {goal.currentAmount.toLocaleString('ru-RU')} ₽
                          </span>
                          <span className="text-xs text-[#64748b] font-mono">
                            {' '}
                            / {goal.targetAmount.toLocaleString('ru-RU')} ₽
                          </span>
                        </div>
                        <span className="text-xs font-bold text-[#7c5cff] font-mono">
                          {percent}%
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-white/[0.06] h-2 rounded-full overflow-hidden my-2">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: goal.color || '#7c5cff',
                          }}
                        />
                      </div>

                      {/* Info & Remaining */}
                      <div className="flex items-center justify-between text-[11px] text-[#94a3b8]">
                        <span>Осталось накопить:</span>
                        <strong className="text-white font-mono">
                          {remaining.toLocaleString('ru-RU')} ₽
                        </strong>
                      </div>

                      {goal.deadline && (
                        <div className="flex items-center justify-between text-[10px] text-[#64748b] mt-1">
                          <span>Срок: {goal.deadline}</span>
                          <span>{goal.category}</span>
                        </div>
                      )}
                    </div>

                    {/* Quick Deposit Button */}
                    <div className="pt-2 border-t border-white/[0.06] flex gap-2">
                      <button
                        onClick={() => {
                          setDepositGoalTarget(goal);
                          setDepositGoalAmountInput('5000');
                        }}
                        className="flex-1 py-1.5 rounded-lg bg-[#7c5cff]/20 hover:bg-[#7c5cff]/30 text-[#7c5cff] border border-[#7c5cff]/40 text-xs font-semibold transition-all flex items-center justify-center gap-1"
                      >
                        <Plus size={12} />
                        <span>Пополнить цель</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Add New Goal Card trigger */}
              <div
                onClick={() => setIsGoalModalOpen(true)}
                className="p-6 rounded-2xl border-2 border-dashed border-white/[0.08] hover:border-[#7c5cff]/50 bg-white/[0.01] hover:bg-[#7c5cff]/5 cursor-pointer flex flex-col items-center justify-center text-center transition-all min-h-[180px] space-y-2"
              >
                <div className="w-10 h-10 rounded-full bg-[#7c5cff]/15 text-[#7c5cff] flex items-center justify-center">
                  <Plus size={18} />
                </div>
                <span className="text-xs font-bold text-white">Создать новую цель</span>
                <span className="text-[10px] text-[#64748b] max-w-[180px]">
                  Покупка техники, резерв, авто или отпуск
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: BANK DEPOSITS & SAVINGS ACCOUNTS ================= */}
        {activeTab === 'deposits' && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <IconBankDeposit size={16} color="#10b981" glow />
                  <span>Банковские вклады и накопительные счета с процентами</span>
                </h3>
                <p className="text-xs text-[#94a3b8]">
                  Общий капитал во вкладах:{' '}
                  <strong className="text-[#10b981] font-mono">
                    {stats.totalDepositsBalance.toLocaleString('ru-RU')} ₽
                  </strong>{' '}
                  • Пассивный доход:{' '}
                  <strong className="text-[#38bdf8] font-mono">
                    +{stats.totalMonthlyYield.toLocaleString('ru-RU')} ₽/мес
                  </strong>{' '}
                  (~{stats.totalAnnualYield.toLocaleString('ru-RU')} ₽/год)
                </p>
              </div>
            </div>

            {/* Deposits Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bankDeposits.map((dep) => {
                const monthlyYield = Math.round((dep.balance * (dep.interestRate / 100)) / 12);
                const annualYield = Math.round(dep.balance * (dep.interestRate / 100));

                let bankBadgeStyle = { bg: 'bg-[#10b981]/15', text: 'text-[#10b981]', border: 'border-[#10b981]/30' };
                if (dep.bankName.includes('Т-Банк') || dep.bankName.includes('Тинькофф')) {
                  bankBadgeStyle = { bg: 'bg-[#f59e0b]/15', text: 'text-[#f59e0b]', border: 'border-[#f59e0b]/30' };
                } else if (dep.bankName.includes('Сбер')) {
                  bankBadgeStyle = { bg: 'bg-[#10b981]/15', text: 'text-[#10b981]', border: 'border-[#10b981]/30' };
                } else if (dep.bankName.includes('ВТБ')) {
                  bankBadgeStyle = { bg: 'bg-[#38bdf8]/15', text: 'text-[#38bdf8]', border: 'border-[#38bdf8]/30' };
                } else if (dep.bankName.includes('Альфа')) {
                  bankBadgeStyle = { bg: 'bg-[#f43f5e]/15', text: 'text-[#f43f5e]', border: 'border-[#f43f5e]/30' };
                } else if (dep.bankName.includes('Газпром')) {
                  bankBadgeStyle = { bg: 'bg-[#6366f1]/15', text: 'text-[#6366f1]', border: 'border-[#6366f1]/30' };
                }

                // Days remaining calculation if endDate is provided
                let daysRemainingText = null;
                if (dep.endDate) {
                  const endD = new Date(dep.endDate + 'T00:00:00');
                  const nowD = new Date();
                  const diffTime = endD.getTime() - nowD.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  daysRemainingText = diffDays > 0 ? `Осталось: ${diffDays} дн. (до ${dep.endDate})` : `Срок завершен (${dep.endDate})`;
                }

                return (
                  <div
                    key={dep.id}
                    className="p-5 rounded-2xl bg-[#14151c] border border-white/[0.08] hover:border-white/[0.18] transition-all flex flex-col justify-between space-y-4 relative group shadow-lg"
                  >
                    <div>
                      {/* Top Bank & Title */}
                      <div className="flex items-start justify-between">
                        <div>
                          <span
                            className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${bankBadgeStyle.bg} ${bankBadgeStyle.text} ${bankBadgeStyle.border}`}
                          >
                            {dep.bankName}
                          </span>
                          <h4 className="text-sm font-bold text-white mt-1.5">{dep.title}</h4>
                        </div>

                        <div className="text-right">
                          <span className="text-xl font-black text-[#10b981] font-mono block">
                            {dep.interestRate}%
                          </span>
                          <span className="text-[10px] text-[#64748b]">годовых</span>
                        </div>
                      </div>

                      {/* Balance & Monthly Yield */}
                      <div className="grid grid-cols-2 gap-3 mt-4 p-3.5 bg-[#191a22] rounded-xl border border-white/[0.06]">
                        <div>
                          <span className="text-[10px] text-[#94a3b8] uppercase font-semibold block mb-0.5">
                            Текущий баланс
                          </span>
                          <span className="text-lg font-black text-white font-mono">
                            {dep.balance.toLocaleString('ru-RU')} ₽
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-[#94a3b8] uppercase font-semibold block mb-0.5">
                            Доход в месяц
                          </span>
                          <span className="text-lg font-black text-[#38bdf8] font-mono">
                            +{monthlyYield.toLocaleString('ru-RU')} ₽
                          </span>
                        </div>
                      </div>

                      {/* Deposit properties & term */}
                      <div className="space-y-1.5 mt-3 text-xs text-[#94a3b8]">
                        <div className="flex justify-between">
                          <span>Капитализация:</span>
                          <strong className="text-white">
                            {dep.capitalization ? 'Включена (на остаток)' : 'Без капитализации'}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Выплата процентов:</span>
                          <strong className="text-white">
                            {dep.payoutFrequency === 'monthly' ? 'Ежемесячно' : 'В конце срока'}
                          </strong>
                        </div>
                        {daysRemainingText && (
                          <div className="flex justify-between pt-1 border-t border-white/[0.04]">
                            <span>Срок действия:</span>
                            <strong className="text-[#38bdf8] font-mono">{daysRemainingText}</strong>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions: Quick Replenish, Withdraw, Edit & Delete */}
                    <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => {
                            setDepositAdjustTarget(dep);
                            setDepositAdjustMode('replenish');
                            setDepositAdjustAmount('10000');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#10b981]/15 hover:bg-[#10b981]/25 text-[#10b981] border border-[#10b981]/30 text-xs font-bold transition-all flex items-center gap-1"
                        >
                          <Plus size={12} />
                          <span>Пополнить</span>
                        </button>

                        <button
                          onClick={() => {
                            setDepositAdjustTarget(dep);
                            setDepositAdjustMode('withdraw');
                            setDepositAdjustAmount('5000');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#cbd5e1] border border-white/[0.08] text-xs font-semibold transition-all"
                        >
                          Снять
                        </button>

                        <button
                          onClick={() => {
                            setEditingDeposit(dep);
                            setDepTitle(dep.title);
                            setDepBank(dep.bankName);
                            setDepBalance(dep.balance.toString());
                            setDepRate(dep.interestRate.toString());
                            setDepStartDate(dep.startDate);
                            setDepEndDate(dep.endDate || '');
                            setDepCapitalization(dep.capitalization);
                            setDepPayout(dep.payoutFrequency);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#94a3b8] hover:text-white border border-white/[0.08] text-xs font-medium transition-all"
                          title="Редактировать параметры вклада"
                        >
                          Изменить
                        </button>
                      </div>

                      <button
                        onClick={() => deleteBankDeposit(dep.id)}
                        className="p-1.5 rounded-lg text-[#94a3b8] hover:text-[#f43f5e] hover:bg-white/[0.08] transition-colors ml-auto"
                        title="Удалить вклад"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Add Deposit Card Trigger */}
              <div
                onClick={() => setIsDepositModalOpen(true)}
                className="p-6 rounded-2xl border-2 border-dashed border-white/[0.08] hover:border-[#10b981]/50 bg-white/[0.01] hover:bg-[#10b981]/5 cursor-pointer flex flex-col items-center justify-center text-center transition-all min-h-[180px] space-y-2"
              >
                <div className="w-10 h-10 rounded-full bg-[#10b981]/15 text-[#10b981] flex items-center justify-center">
                  <Plus size={18} />
                </div>
                <span className="text-xs font-bold text-white">Добавить вклад или счет</span>
                <span className="text-[10px] text-[#64748b] max-w-[180px]">
                  Укажите ставку % годовых и получайте точный расчет дохода
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Add Transaction */}
      {isAddTxModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsAddTxModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#14151c] rounded-2xl border border-white/[0.12] p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-sm font-semibold text-white">
                {modalTxType === 'income' ? 'Добавить доход' : 'Добавить расход'}
              </h3>
              <button onClick={() => setIsAddTxModalOpen(false)} className="text-[#94a3b8] hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateTransaction} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalTxType('income');
                    setModalTxCategory('Зарплата');
                  }}
                  className={`py-2 rounded-xl text-xs font-semibold border ${
                    modalTxType === 'income'
                      ? 'border-[#10b981] bg-[#10b981]/20 text-[#10b981]'
                      : 'border-white/[0.08] bg-[#191a22] text-[#94a3b8]'
                  }`}
                >
                  Доход
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalTxType('expense');
                    setModalTxCategory('Еда/Продукты');
                  }}
                  className={`py-2 rounded-xl text-xs font-semibold border ${
                    modalTxType === 'expense'
                      ? 'border-[#f43f5e] bg-[#f43f5e]/20 text-[#f43f5e]'
                      : 'border-white/[0.08] bg-[#191a22] text-[#94a3b8]'
                  }`}
                >
                  Расход
                </button>
              </div>

              <div>
                <label className="block text-[#94a3b8] mb-1 font-medium">Сумма (₽)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  autoFocus
                  value={modalTxAmount}
                  onChange={(e) => setModalTxAmount(sanitizeNumericInput(e.target.value))}
                  placeholder="Например: 1500"
                  className="w-full bg-[#191a22] border border-white/[0.08] rounded-xl p-2.5 text-base font-bold text-white font-mono focus:outline-none focus:border-[#7c5cff]"
                />
              </div>

              <div>
                <label className="block text-[#94a3b8] mb-1 font-medium">Категория</label>
                <select
                  value={modalTxCategory}
                  onChange={(e) => setModalTxCategory(e.target.value)}
                  className="w-full bg-[#191a22] border border-white/[0.08] rounded-xl p-2 text-white focus:outline-none"
                >
                  {modalTxType === 'income' ? (
                    <>
                      <option value="Зарплата за смены">Зарплата за смены</option>
                      <option value="Зарплата">Зарплата / Аванс</option>
                      <option value="Подработка">Подработка / Фриланс</option>
                      <option value="Прочее">Прочий доход</option>
                    </>
                  ) : (
                    <>
                      <option value="Еда/Продукты">Еда и продукты</option>
                      <option value="Стрижка/Уход">Стрижка и уход</option>
                      <option value="Жилье/ЖКХ">Жилье и ЖКХ</option>
                      <option value="Транспорт">Транспорт / бензин</option>
                      <option value="Покупки">Покупки и одежда</option>
                      <option value="Здоровье">Здоровье и спорт</option>
                      <option value="Развлечения">Развлечения и кафе</option>
                      <option value="Прочее">Прочие траты</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[#94a3b8] mb-1 font-medium">Описание</label>
                <input
                  type="text"
                  value={modalTxDesc}
                  onChange={(e) => setModalTxDesc(e.target.value)}
                  placeholder="Например: Стрижка в барбершопе"
                  className="w-full bg-[#191a22] border border-white/[0.08] rounded-xl p-2 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#94a3b8] mb-1 font-medium">Дата</label>
                  <input
                    type="date"
                    value={modalTxDate}
                    onChange={(e) => setModalTxDate(e.target.value)}
                    className="w-full bg-[#191a22] border border-white/[0.08] rounded-xl p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[#94a3b8] mb-1 font-medium">Оплата</label>
                  <select
                    value={modalTxPayment}
                    onChange={(e) => setModalTxPayment(e.target.value)}
                    className="w-full bg-[#191a22] border border-white/[0.08] rounded-xl p-2 text-white"
                  >
                    <option value="Карта">Карта</option>
                    <option value="СБП">СБП</option>
                    <option value="Наличные">Наличные</option>
                    <option value="Банковский перевод">Перевод</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className={`w-full py-2.5 rounded-xl text-xs font-bold text-white shadow-md mt-2 ${
                  modalTxType === 'income' ? 'bg-[#10b981]' : 'bg-[#f43f5e]'
                }`}
              >
                Сохранить операцию
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Savings Goal */}
      {isGoalModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsGoalModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#14151c] rounded-2xl border border-white/[0.12] p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <IconTargetGoal size={16} color="#7c5cff" />
                <span>Новая финансовая цель</span>
              </h3>
              <button onClick={() => setIsGoalModalOpen(false)} className="text-[#94a3b8] hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#94a3b8] mb-1 font-medium">Название цели</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="Например: Новый ПК / Отпуск / Резерв"
                  className="w-full bg-[#191a22] border border-white/[0.08] rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#94a3b8] mb-1 font-medium">Целевая сумма (₽)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={goalTargetAmount}
                    onChange={(e) => setGoalTargetAmount(sanitizeNumericInput(e.target.value))}
                    placeholder="100 000"
                    className="w-full bg-[#191a22] border border-white/[0.08] rounded-xl p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#94a3b8] mb-1 font-medium">Уже накоплено (₽)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={goalCurrentAmount}
                    onChange={(e) => setGoalCurrentAmount(sanitizeNumericInput(e.target.value))}
                    placeholder="0"
                    className="w-full bg-[#191a22] border border-white/[0.08] rounded-xl p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#94a3b8] mb-1 font-medium">Категория</label>
                  <select
                    value={goalCategory}
                    onChange={(e) => setGoalCategory(e.target.value)}
                    className="w-full bg-[#191a22] border border-white/[0.08] rounded-xl p-2 text-white"
                  >
                    <option value="Техника">Техника</option>
                    <option value="Резерв">Резерв / Подушка</option>
                    <option value="Отдых">Отпуск и поездки</option>
                    <option value="Авто">Автомобиль</option>
                    <option value="Жилье">Жилье / Ремонт</option>
                    <option value="Прочее">Прочее</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#94a3b8] mb-1 font-medium">Срок (необязательно)</label>
                  <input
                    type="date"
                    value={goalDeadline}
                    onChange={(e) => setGoalDeadline(e.target.value)}
                    className="w-full bg-[#191a22] border border-white/[0.08] rounded-xl p-2 text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#7c5cff] text-white text-xs font-semibold hover:bg-[#7c5cff]/90 mt-2"
              >
                Создать цель
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Bank Deposit */}
      {isDepositModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsDepositModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#14151c] rounded-2xl border border-white/[0.12] p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <IconBankDeposit size={16} color="#10b981" />
                <span>Добавить вклад или накопительный счет</span>
              </h3>
              <button onClick={() => setIsDepositModalOpen(false)} className="text-[#94a3b8] hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateDeposit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#94a3b8] mb-1 font-medium">Название счета / вклада</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={depTitle}
                  onChange={(e) => setDepTitle(e.target.value)}
                  placeholder="Например: Накопительный счет «Сейф»"
                  className="w-full bg-[#191a22] border border-white/[0.08] rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#94a3b8] mb-1 font-medium">Банк</label>
                  <input
                    type="text"
                    value={depBank}
                    onChange={(e) => setDepBank(e.target.value)}
                    placeholder="Т-Банк / Сбер / Альфа / ВТБ"
                    className="w-full bg-[#191a22] border border-white/[0.08] rounded-xl p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[#94a3b8] mb-1 font-medium">Ставка (% годовых)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    value={depRate}
                    onChange={(e) => setDepRate(sanitizeNumericInput(e.target.value))}
                    placeholder="18.5"
                    className="w-full bg-[#191a22] border border-white/[0.08] rounded-xl p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#94a3b8] mb-1 font-medium">Сумма вклада / баланс (₽)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={depBalance}
                  onChange={(e) => setDepBalance(sanitizeNumericInput(e.target.value))}
                  placeholder="200 000"
                  className="w-full bg-[#191a22] border border-white/[0.08] rounded-xl p-2.5 text-white font-mono text-base font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#94a3b8] mb-1 font-medium">Дата открытия</label>
                  <input
                    type="date"
                    value={depStartDate}
                    onChange={(e) => setDepStartDate(e.target.value)}
                    className="w-full bg-[#191a22] border border-white/[0.08] rounded-xl p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[#94a3b8] mb-1 font-medium">Срок окончания</label>
                  <input
                    type="date"
                    value={depEndDate}
                    onChange={(e) => setDepEndDate(e.target.value)}
                    className="w-full bg-[#191a22] border border-white/[0.08] rounded-xl p-2 text-white"
                  />
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={depCapitalization}
                    onChange={(e) => setDepCapitalization(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#10b981]"
                  />
                  <span className="text-[#e2e8f0]">Капитализация процентов (проценты на проценты)</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#10b981] text-white text-xs font-semibold hover:bg-[#10b981]/90 mt-2"
              >
                Добавить вклад
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Quick Deposit to Goal */}
      {depositGoalTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setDepositGoalTarget(null)}
        >
          <div
            className="w-full max-w-sm bg-[#14151c] rounded-2xl border border-white/[0.12] p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-sm font-semibold text-white">
                Пополнить цель: {depositGoalTarget.title}
              </h3>
              <button onClick={() => setDepositGoalTarget(null)} className="text-[#94a3b8] hover:text-white">✕</button>
            </div>

            <form onSubmit={handleApplyDepositToGoal} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#94a3b8] mb-1 font-medium">Сумма пополнения (₽)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  autoFocus
                  value={depositGoalAmountInput}
                  onChange={(e) => setDepositGoalAmountInput(sanitizeNumericInput(e.target.value))}
                  placeholder="5000"
                  className="w-full bg-[#191a22] border border-white/[0.08] rounded-xl p-2.5 text-base font-bold text-white font-mono focus:outline-none focus:border-[#7c5cff]"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDepositGoalTarget(null)}
                  className="flex-1 py-2 rounded-xl bg-[#191a22] text-[#94a3b8]"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-[#7c5cff] text-white font-bold"
                >
                  Пополнить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Quick Deposit Replenish / Withdraw */}
      {depositAdjustTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setDepositAdjustTarget(null)}
        >
          <div
            className="w-full max-w-sm bg-[#14151c] rounded-2xl border border-white/[0.12] p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#10b981] tracking-wider">
                  {depositAdjustTarget.bankName}
                </span>
                <h3 className="text-sm font-bold text-white">
                  {depositAdjustMode === 'replenish' ? 'Пополнить счет' : 'Снять со счета'}
                </h3>
              </div>
              <button onClick={() => setDepositAdjustTarget(null)} className="text-[#94a3b8] hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#191a22] rounded-xl border border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setDepositAdjustMode('replenish')}
                  className={`py-1.5 rounded-lg font-bold transition-all ${
                    depositAdjustMode === 'replenish'
                      ? 'bg-[#10b981] text-white shadow-md'
                      : 'text-[#94a3b8] hover:text-white'
                  }`}
                >
                  + Пополнить
                </button>
                <button
                  type="button"
                  onClick={() => setDepositAdjustMode('withdraw')}
                  className={`py-1.5 rounded-lg font-bold transition-all ${
                    depositAdjustMode === 'withdraw'
                      ? 'bg-[#f43f5e] text-white shadow-md'
                      : 'text-[#94a3b8] hover:text-white'
                  }`}
                >
                  - Снять
                </button>
              </div>

              <div>
                <label className="block text-[#94a3b8] mb-1 font-medium">
                  Сумма {depositAdjustMode === 'replenish' ? 'пополнения' : 'снятия'} (₽)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  autoFocus
                  value={depositAdjustAmount}
                  onChange={(e) => setDepositAdjustAmount(sanitizeNumericInput(e.target.value))}
                  placeholder="10000"
                  className="w-full bg-[#191a22] border border-white/[0.08] rounded-xl p-2.5 text-base font-bold text-white font-mono focus:outline-none focus:border-[#10b981]"
                />
              </div>

              {/* Quick Amount Chips */}
              <div className="flex gap-1.5 flex-wrap">
                {[5000, 10000, 25000, 50000, 100000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositAdjustAmount(amt.toString())}
                    className="px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#cbd5e1] border border-white/[0.08] text-[11px] font-mono"
                  >
                    +{amt >= 1000 ? `${amt / 1000}k` : amt}
                  </button>
                ))}
              </div>

              {/* Live Balance & Yield Calculation Preview */}
              {(() => {
                const num = Number(depositAdjustAmount) || 0;
                const newBal =
                  depositAdjustMode === 'replenish'
                    ? depositAdjustTarget.balance + num
                    : Math.max(0, depositAdjustTarget.balance - num);
                const oldYield = Math.round((depositAdjustTarget.balance * (depositAdjustTarget.interestRate / 100)) / 12);
                const newYield = Math.round((newBal * (depositAdjustTarget.interestRate / 100)) / 12);
                const diffYield = newYield - oldYield;

                return (
                  <div className="p-3 bg-[#191a22] rounded-xl border border-white/[0.06] space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-[#94a3b8]">Новый баланс:</span>
                      <strong className="text-white font-bold">{newBal.toLocaleString('ru-RU')} ₽</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#94a3b8]">Новый доход в месяц:</span>
                      <strong className="text-[#38bdf8] font-bold">
                        +{newYield.toLocaleString('ru-RU')} ₽/мес
                        {diffYield !== 0 && (
                          <span className={`text-[10px] ml-1.5 ${diffYield > 0 ? 'text-[#10b981]' : 'text-[#f43f5e]'}`}>
                            ({diffYield > 0 ? '+' : ''}{diffYield.toLocaleString('ru-RU')} ₽)
                          </span>
                        )}
                      </strong>
                    </div>
                  </div>
                );
              })()}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDepositAdjustTarget(null)}
                  className="flex-1 py-2 rounded-xl bg-[#191a22] text-[#94a3b8] hover:bg-white/[0.06]"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const num = Number(depositAdjustAmount) || 0;
                    if (num > 0) {
                      const newBal =
                        depositAdjustMode === 'replenish'
                          ? depositAdjustTarget.balance + num
                          : Math.max(0, depositAdjustTarget.balance - num);
                      updateDepositBalance(depositAdjustTarget.id, newBal);
                    }
                    setDepositAdjustTarget(null);
                  }}
                  className={`flex-1 py-2 rounded-xl font-bold text-white shadow-lg ${
                    depositAdjustMode === 'replenish' ? 'bg-[#10b981]' : 'bg-[#f43f5e]'
                  }`}
                >
                  {depositAdjustMode === 'replenish' ? 'Пополнить' : 'Снять'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Full Deposit Editor */}
      {editingDeposit && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setEditingDeposit(null)}
        >
          <div
            className="w-full max-w-md bg-[#14151c] rounded-2xl border border-white/[0.12] p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <IconBankDeposit size={16} color="#10b981" />
                <span>Редактировать вклад / счет</span>
              </h3>
              <button onClick={() => setEditingDeposit(null)} className="text-[#94a3b8] hover:text-white">✕</button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const balanceNum = Number(depBalance);
                const rateNum = Number(depRate);
                if (!balanceNum || !rateNum) return;

                updateBankDeposit(editingDeposit.id, {
                  title: depTitle || `Вклад в ${depBank}`,
                  bankName: depBank,
                  balance: balanceNum,
                  interestRate: rateNum,
                  startDate: depStartDate,
                  endDate: depEndDate || undefined,
                  capitalization: depCapitalization,
                  payoutFrequency: depPayout,
                });

                setEditingDeposit(null);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-[#94a3b8] mb-1 font-medium">Название счета / вклада</label>
                <input
                  type="text"
                  required
                  value={depTitle}
                  onChange={(e) => setDepTitle(e.target.value)}
                  className="w-full bg-[#191a22] border border-white/[0.08] rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#94a3b8] mb-1 font-medium">Банк</label>
                  <input
                    type="text"
                    value={depBank}
                    onChange={(e) => setDepBank(e.target.value)}
                    className="w-full bg-[#191a22] border border-white/[0.08] rounded-xl p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[#94a3b8] mb-1 font-medium">Ставка (% годовых)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    value={depRate}
                    onChange={(e) => setDepRate(sanitizeNumericInput(e.target.value))}
                    placeholder="18.5"
                    className="w-full bg-[#191a22] border border-white/[0.08] rounded-xl p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#94a3b8] mb-1 font-medium">Текущий баланс (₽)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={depBalance}
                  onChange={(e) => setDepBalance(sanitizeNumericInput(e.target.value))}
                  placeholder="200 000"
                  className="w-full bg-[#191a22] border border-white/[0.08] rounded-xl p-2.5 text-white font-mono text-base font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#94a3b8] mb-1 font-medium">Дата открытия</label>
                  <input
                    type="date"
                    value={depStartDate}
                    onChange={(e) => setDepStartDate(e.target.value)}
                    className="w-full bg-[#191a22] border border-white/[0.08] rounded-xl p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[#94a3b8] mb-1 font-medium">Срок окончания</label>
                  <input
                    type="date"
                    value={depEndDate}
                    onChange={(e) => setDepEndDate(e.target.value)}
                    className="w-full bg-[#191a22] border border-white/[0.08] rounded-xl p-2 text-white"
                  />
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={depCapitalization}
                    onChange={(e) => setDepCapitalization(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#10b981]"
                  />
                  <span className="text-[#e2e8f0]">Капитализация процентов</span>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingDeposit(null)}
                  className="flex-1 py-2.5 rounded-xl bg-[#191a22] text-[#94a3b8]"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#10b981] text-white font-bold"
                >
                  Сохранить изменения
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
