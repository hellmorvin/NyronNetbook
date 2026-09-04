import React, { useState, useMemo, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  TrendingUp,
  Briefcase,
  Plus,
  Trash2,
  Settings,
  Sparkles,
  FileText,
  Save,
  RotateCcw,
  Zap,
  CheckSquare,
  Eye,
  EyeOff,
  Copy,
  Printer,
  Calendar,
  Share2,
  PieChart,
  Check,
  Coffee,
  X,
  Layers,
  ArrowRight,
  HelpCircle,
  Sliders,
  Eraser,
  Filter,
  AlertTriangle,
  Wallet,
} from 'lucide-react';
import {
  IconDayShift,
  IconNightShift,
  IconFullShift,
  IconOvertimeShift,
  IconDayOff,
  IconVacation,
  IconGrooming,
  IconWalletCapital,
} from '../icons/CustomNeironoIcons';
import { useBrainStore, ShiftType, WorkShift, CalendarEvent, EventCategory } from '../../store/useBrainStore';

const SHIFT_TYPE_CONFIG: Record<
  ShiftType,
  { label: string; shortLabel: string; icon: React.ComponentType<{ size?: number; color?: string; className?: string }>; color: string; bg: string; border: string; desc: string }
> = {
  day: {
    label: 'Дневная',
    shortLabel: 'Д',
    icon: IconDayShift,
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.14)',
    border: 'rgba(245, 158, 11, 0.35)',
    desc: '12-часовая дневная смена',
  },
  night: {
    label: 'Ночная',
    shortLabel: 'Н',
    icon: IconNightShift,
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.14)',
    border: 'rgba(56, 189, 248, 0.35)',
    desc: '12-часовая ночная смена',
  },
  full: {
    label: 'Сутки',
    shortLabel: 'С',
    icon: IconFullShift,
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.14)',
    border: 'rgba(139, 92, 246, 0.35)',
    desc: '24-часовое суточное дежурство',
  },
  part: {
    label: 'Подработка',
    shortLabel: 'П',
    icon: IconOvertimeShift,
    color: '#ec4899',
    bg: 'rgba(236, 72, 153, 0.14)',
    border: 'rgba(236, 72, 153, 0.35)',
    desc: 'Дополнительные смены / овертайм',
  },
  off: {
    label: 'Выходной',
    shortLabel: 'В',
    icon: IconDayOff,
    color: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.08)',
    border: 'rgba(148, 163, 184, 0.20)',
    desc: 'Отдых и восстановление',
  },
  vacation: {
    label: 'Отпуск',
    shortLabel: 'О',
    icon: IconVacation,
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.14)',
    border: 'rgba(16, 185, 129, 0.35)',
    desc: 'Оплачиваемый отпуск',
  },
};

const CYCLE_PRESET_TEMPLATES = [
  {
    id: 'day_night_48',
    name: 'День / Ночь / 48 (1/1/2)',
    desc: '4 дня: 1 день ➔ 1 ночь ➔ 2 выходных',
    sequence: ['day', 'night', 'off', 'off'] as ShiftType[],
  },
  {
    id: '2day_2night_4off',
    name: '2 Дня / 2 Ночи / 4 вых (2/2/4)',
    desc: '8 дней: 2 дня ➔ 2 ночи ➔ 4 выходных',
    sequence: ['day', 'day', 'night', 'night', 'off', 'off', 'off', 'off'] as ShiftType[],
  },
  {
    id: '2_2_day',
    name: '2 / 2 Дневные',
    desc: '4 дня: 2 дня дневных ➔ 2 выходных',
    sequence: ['day', 'day', 'off', 'off'] as ShiftType[],
  },
  {
    id: '3_3_day',
    name: '3 / 3 Дневные',
    desc: '6 дней: 3 дня дневных ➔ 3 выходных',
    sequence: ['day', 'day', 'day', 'off', 'off', 'off'] as ShiftType[],
  },
  {
    id: 'full_3',
    name: 'Сутки через трое (1/3)',
    desc: '4 дня: 1 сутки ➔ 3 выходных',
    sequence: ['full', 'off', 'off', 'off'] as ShiftType[],
  },
  {
    id: 'full_2',
    name: 'Сутки через двое (1/2)',
    desc: '3 дня: 1 сутки ➔ 2 выходных',
    sequence: ['full', 'off', 'off'] as ShiftType[],
  },
  {
    id: '5_2',
    name: '5 / 2 Пятидневка',
    desc: '7 дней: 5 дневных ➔ 2 выходных (Сб, Вс)',
    sequence: ['day', 'day', 'day', 'day', 'day', 'off', 'off'] as ShiftType[],
  },
  {
    id: 'custom',
    name: 'Конструктор своего цикла',
    desc: 'Произвольная цепочка любой сложности',
    sequence: [] as ShiftType[],
  },
];

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

const WEEKDAY_NAMES = [
  { short: 'Пн', full: 'Понедельник' },
  { short: 'Вт', full: 'Вторник' },
  { short: 'Ср', full: 'Среда' },
  { short: 'Чт', full: 'Четверг' },
  { short: 'Пт', full: 'Пятница' },
  { short: 'Сб', full: 'Суббота' },
  { short: 'Вс', full: 'Воскресенье' },
];

function toLocalDateStr(d: Date = new Date()): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatYMD(y: number, m: number, d: number): string {
  const dateObj = new Date(y, m, d, 12, 0, 0);
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export const CalendarShiftView: React.FC = () => {
  const {
    shifts,
    shiftSettings,
    calendarEvents,
    addOrUpdateShift,
    deleteShift,
    updateShiftSettings,
    generateCustomCycleSchedule,
    addCalendarEvent,
    toggleCalendarEvent,
    deleteCalendarEvent,
    addTransaction,
    addNeuron,
    openNote,
  } = useBrainStore();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => toLocalDateStr());

  const [inspectorTab, setInspectorTab] = useState<'shift' | 'events'>('shift');
  const [isScheduleGeneratorOpen, setIsScheduleGeneratorOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isCleanupModalOpen, setIsCleanupModalOpen] = useState(false);
  const [isTelemetryVisible, setIsTelemetryVisible] = useState(true);

  // Quick Paint Brush Mode ('eraser' or ShiftType or null)
  const [activePaintBrush, setActivePaintBrush] = useState<ShiftType | 'eraser' | null>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsMouseDown(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const [isMobileAddModalOpen, setIsMobileAddModalOpen] = useState(false);
  const [mobileAddTab, setMobileAddTab] = useState<'event' | 'shift' | 'generator'>('event');

  // Listen for top bar + click on mobile
  useEffect(() => {
    const handleMobileAdd = () => {
      setIsMobileAddModalOpen(true);
    };
    window.addEventListener('mobile-calendar-add-event', handleMobileAdd);
    return () => window.removeEventListener('mobile-calendar-add-event', handleMobileAdd);
  }, []);

  // Context Menu State for Right-Click on Day Cells
  const [cellContextMenu, setCellContextMenu] = useState<{
    x: number;
    y: number;
    dateStr: string;
  } | null>(null);

  // Advanced Cycle Schedule Generator State with direct income controls
  const [genStartDate, setGenStartDate] = useState(() => toLocalDateStr());
  const [selectedPresetId, setSelectedPresetId] = useState<string>('day_night_48');
  const [activeSequence, setActiveSequence] = useState<ShiftType[]>(['day', 'night', 'off', 'off']);
  const [genDaysCount, setGenDaysCount] = useState(60);
  const [genRateType, setGenRateType] = useState<'hourly' | 'fixed'>(() => shiftSettings.defaultRateType);
  const [genRate, setGenRate] = useState<number>(() =>
    shiftSettings.defaultRateType === 'hourly' ? shiftSettings.defaultHourlyRate : shiftSettings.defaultFixedRate
  );
  const [genDayHours, setGenDayHours] = useState<number>(() => shiftSettings.defaultDayHours);
  const [genFullHours, setGenFullHours] = useState<number>(() => shiftSettings.defaultFullHours);

  // Granular Bulk Cleanup Modal State
  const [cleanupPeriodType, setCleanupPeriodType] = useState<'current_month' | 'custom_range'>('current_month');
  const [cleanupStartDate, setCleanupStartDate] = useState(() => {
    const d = new Date();
    return formatYMD(d.getFullYear(), d.getMonth(), 1);
  });
  const [cleanupEndDate, setCleanupEndDate] = useState(() => {
    const d = new Date();
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    return formatYMD(d.getFullYear(), d.getMonth(), lastDay);
  });
  const [cleanupDeleteWorkShifts, setCleanupDeleteWorkShifts] = useState(true);
  const [cleanupDeleteDaysOff, setCleanupDeleteDaysOff] = useState(true);
  const [cleanupDeleteEvents, setCleanupDeleteEvents] = useState(false);

  // Day Form State with Simple Unified Shift Expense
  const [formType, setFormType] = useState<ShiftType>('day');
  const [formHours, setFormHours] = useState<number>(12);
  const [formRateType, setFormRateType] = useState<'hourly' | 'fixed'>('hourly');
  const [formRate, setFormRate] = useState<number>(450);
  const [formBonus, setFormBonus] = useState<number>(0);
  const [formExpense, setFormExpense] = useState<number>(0);
  const [formSyncFinance, setFormSyncFinance] = useState<boolean>(true);
  const [formNote, setFormNote] = useState<string>('');

  // Add Event Form State
  const [eventTitle, setEventTitle] = useState('');
  const [eventCategory, setEventCategory] = useState<EventCategory>('beauty');
  const [eventTime, setEventTime] = useState('15:00');
  const [eventAmount, setEventAmount] = useState('');
  const [eventNote, setEventNote] = useState('');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage((c) => (c === msg ? null : c)), 3000);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Close context menu on outside click
  useEffect(() => {
    const handleOutside = () => setCellContextMenu(null);
    window.addEventListener('click', handleOutside);
    return () => window.removeEventListener('click', handleOutside);
  }, []);

  const selectedShift = useMemo(() => {
    return shifts.find((s) => s.date === selectedDateStr);
  }, [shifts, selectedDateStr]);

  const selectedDayEvents = useMemo(() => {
    return calendarEvents.filter((e) => e.date === selectedDateStr);
  }, [calendarEvents, selectedDateStr]);

  useEffect(() => {
    if (selectedShift) {
      setFormType((prev) => (prev !== selectedShift.type ? selectedShift.type : prev));
      setFormHours((prev) => (prev !== selectedShift.hours ? selectedShift.hours : prev));
      setFormRateType((prev) => (prev !== selectedShift.rateType ? selectedShift.rateType : prev));
      setFormRate((prev) => (prev !== selectedShift.rate ? selectedShift.rate : prev));
      setFormBonus((prev) => (prev !== selectedShift.bonus ? selectedShift.bonus : prev));
      const effExpense =
        selectedShift.expense !== undefined
          ? selectedShift.expense
          : (selectedShift.roadExpense || 0) + (selectedShift.foodExpense || 0);
      setFormExpense((prev) => (prev !== effExpense ? effExpense : prev));
      setFormNote((prev) => (prev !== selectedShift.note ? selectedShift.note : prev));
    } else {
      setFormType((prev) => (prev !== 'day' ? 'day' : prev));
      const defaultH = shiftSettings?.defaultDayHours || 12;
      setFormHours((prev) => (prev !== defaultH ? defaultH : prev));
      const defaultRT = shiftSettings?.defaultRateType || 'hourly';
      setFormRateType((prev) => (prev !== defaultRT ? defaultRT : prev));
      const defaultR =
        defaultRT === 'hourly'
          ? shiftSettings?.defaultHourlyRate || 450
          : shiftSettings?.defaultFixedRate || 5000;
      setFormRate((prev) => (prev !== defaultR ? defaultR : prev));
      setFormBonus((prev) => (prev !== 0 ? 0 : prev));
      setFormExpense((prev) => (prev !== 0 ? 0 : prev));
      setFormNote((prev) => (prev !== '' ? '' : prev));
    }
  }, [
    selectedDateStr,
    selectedShift?.type,
    selectedShift?.hours,
    selectedShift?.rateType,
    selectedShift?.rate,
    selectedShift?.bonus,
    selectedShift?.expense,
    selectedShift?.roadExpense,
    selectedShift?.foodExpense,
    selectedShift?.note,
    shiftSettings?.defaultDayHours,
    shiftSettings?.defaultRateType,
    shiftSettings?.defaultHourlyRate,
    shiftSettings?.defaultFixedRate,
  ]);

  // Comprehensive Month Statistics including Expenses and Net Earnings
  const monthStats = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    const monthShifts = shifts.filter((s) => s.date.startsWith(prefix));

    let totalGrossEarnings = 0;
    let totalHours = 0;
    let workShiftsCount = 0;
    let dayShiftsCount = 0;
    let nightShiftsCount = 0;
    let fullShiftsCount = 0;
    let partShiftsCount = 0;
    let daysOffCount = 0;
    let vacationCount = 0;
    let totalBonus = 0;
    let totalExpenses = 0;

    monthShifts.forEach((s) => {
      if (s.type === 'day') dayShiftsCount++;
      else if (s.type === 'night') nightShiftsCount++;
      else if (s.type === 'full') fullShiftsCount++;
      else if (s.type === 'part') partShiftsCount++;
      else if (s.type === 'off') daysOffCount++;
      else if (s.type === 'vacation') vacationCount++;

      if (s.type !== 'off' && s.type !== 'vacation') {
        totalGrossEarnings += s.earnings;
        totalHours += s.hours;
        workShiftsCount += 1;
        totalBonus += s.bonus;
        const shiftExp =
          s.expense !== undefined ? s.expense : (s.roadExpense || 0) + (s.foodExpense || 0);
        totalExpenses += shiftExp;
      }
    });

    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const actualDaysOff = daysInCurrentMonth - workShiftsCount;
    const netEarnings = totalGrossEarnings - totalExpenses;
    const avgPerShift = workShiftsCount > 0 ? Math.round(totalGrossEarnings / workShiftsCount) : 0;
    const avgNetPerShift = workShiftsCount > 0 ? Math.round(netEarnings / workShiftsCount) : 0;
    const avgPerHour = totalHours > 0 ? Math.round(totalGrossEarnings / totalHours) : 0;
    const workLifeRatio = Math.round((workShiftsCount / daysInCurrentMonth) * 100);

    return {
      totalEarnings: totalGrossEarnings,
      totalExpenses,
      netEarnings,
      totalHours,
      workShiftsCount,
      dayShiftsCount,
      nightShiftsCount,
      fullShiftsCount,
      partShiftsCount,
      daysOffCount: actualDaysOff,
      vacationCount,
      totalBonus,
      avgPerShift,
      avgNetPerShift,
      avgPerHour,
      workLifeRatio,
      monthShifts,
      daysInCurrentMonth,
    };
  }, [shifts, year, month]);

  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1, 12, 0, 0).getDay();
    const offset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const daysInMonth = new Date(year, month + 1, 0, 12, 0, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0, 12, 0, 0).getDate();

    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean; dayOfWeek: number }[] = [];

    for (let i = offset - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, d, 12, 0, 0);
      days.push({
        dateStr: formatYMD(year, month - 1, d),
        dayNum: d,
        isCurrentMonth: false,
        dayOfWeek: prevDate.getDay(),
      });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const curDate = new Date(year, month, d, 12, 0, 0);
      days.push({
        dateStr: formatYMD(year, month, d),
        dayNum: d,
        isCurrentMonth: true,
        dayOfWeek: curDate.getDay(),
      });
    }

    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d, 12, 0, 0);
      days.push({
        dateStr: formatYMD(year, month + 1, d),
        dayNum: d,
        isCurrentMonth: false,
        dayOfWeek: nextDate.getDay(),
      });
    }

    return days;
  }, [year, month]);

  // Fast O(1) Lookups for Instant Rendering without Micro-Lags
  const shiftsByDate = useMemo(() => {
    const map = new Map<string, WorkShift>();
    shifts.forEach((s) => map.set(s.date, s));
    return map;
  }, [shifts]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    calendarEvents.forEach((e) => {
      const arr = map.get(e.date) || [];
      arr.push(e);
      map.set(e.date, arr);
    });
    return map;
  }, [calendarEvents]);

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1, 12, 0, 0));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1, 12, 0, 0));
  const handleSelectMonth = (newMonth: number) => setCurrentDate(new Date(year, newMonth, 1, 12, 0, 0));
  const handleSelectYear = (newYear: number) => setCurrentDate(new Date(newYear, month, 1, 12, 0, 0));
  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateStr(toLocalDateStr(now));
  };

  // Save Shift with Auto-Sync to Finance Manager
  const handleSaveSelectedShift = () => {
    addOrUpdateShift({
      date: selectedDateStr,
      type: formType,
      hours: formType === 'off' || formType === 'vacation' ? 0 : formHours,
      rateType: formRateType,
      rate: formRate,
      bonus: formBonus,
      expense: formExpense,
      note: formNote,
    });

    // Auto-record transactions in Finance Manager if enabled
    if (formSyncFinance && formType !== 'off' && formType !== 'vacation' && formExpense > 0) {
      addTransaction({
        date: selectedDateStr,
        type: 'expense',
        category: 'Прочее',
        amount: formExpense,
        description: `Трата на смене (${SHIFT_TYPE_CONFIG[formType].label})`,
        paymentMethod: 'Карта',
      });
    }

    showToast(
      `Смена на ${selectedDateStr} сохранена ${
        formSyncFinance && formExpense > 0 ? '+ трата внесена в Финансы' : ''
      }`
    );
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    const amountNum = Number(eventAmount) || 0;
    const catColor = eventCategory === 'beauty' ? '#ec4899' : eventCategory === 'health' ? '#10b981' : '#38bdf8';

    addCalendarEvent({
      date: selectedDateStr,
      time: eventTime,
      title: eventTitle,
      category: eventCategory,
      amount: amountNum,
      completed: false,
      note: eventNote,
      color: catColor,
    });

    if (amountNum > 0) {
      addTransaction({
        date: selectedDateStr,
        type: 'expense',
        category: eventCategory === 'beauty' ? 'Стрижка/Уход' : eventCategory === 'shopping' ? 'Покупки' : 'Прочее',
        amount: amountNum,
        description: eventTitle,
        paymentMethod: 'Карта',
      });
    }

    setEventTitle('');
    setEventAmount('');
    setEventNote('');
    showToast(`Дело «${eventTitle}» добавлено`);
  };

  // Switch Schedule Preset
  const handleSelectPreset = (preset: typeof CYCLE_PRESET_TEMPLATES[0]) => {
    setSelectedPresetId(preset.id);
    if (preset.id !== 'custom') {
      setActiveSequence([...preset.sequence]);
    }
  };

  // Live calculation of the schedule generator preview using custom rate in modal
  const generatorPreview = useMemo(() => {
    if (!activeSequence || activeSequence.length === 0) return null;
    const cycleLen = activeSequence.length;
    let workDays = 0;
    let offDays = 0;
    let totalHours = 0;

    for (let i = 0; i < genDaysCount; i++) {
      const type = activeSequence[i % cycleLen]!;
      if (type !== 'off' && type !== 'vacation') {
        workDays++;
        totalHours += type === 'full' ? genFullHours : genDayHours;
      } else {
        offDays++;
      }
    }

    const projectedEarnings = genRateType === 'hourly' ? totalHours * genRate : workDays * genRate;

    return {
      workDays,
      offDays,
      totalHours,
      projectedEarnings,
    };
  }, [activeSequence, genDaysCount, genRate, genRateType, genDayHours, genFullHours]);

  // Execute Schedule Generation with custom rate configuration
  const handleGenerateSchedule = () => {
    if (!activeSequence || activeSequence.length === 0) {
      showToast('Добавьте хотя бы 1 день в цикл');
      return;
    }

    generateCustomCycleSchedule(genStartDate, activeSequence, genDaysCount, {
      rate: genRate,
      rateType: genRateType,
      dayHours: genDayHours,
      fullHours: genFullHours,
    });

    setIsScheduleGeneratorOpen(false);
    showToast(`График успешно построен на ${genDaysCount} дней (${generatorPreview?.workDays || 0} рабочих смен)!`);
  };

  // Instant Paint Brush or Eraser Click Handler
  const handleDayClick = (dateStr: string) => {
    if (activePaintBrush === 'eraser') {
      deleteShift(dateStr);
      showToast(`Смена на ${dateStr} удалена`);
    } else if (activePaintBrush) {
      const isWork = activePaintBrush !== 'off' && activePaintBrush !== 'vacation';
      const hours = isWork
        ? activePaintBrush === 'full'
          ? shiftSettings.defaultFullHours
          : shiftSettings.defaultDayHours
        : 0;
      const rate =
        shiftSettings.defaultRateType === 'hourly'
          ? shiftSettings.defaultHourlyRate
          : shiftSettings.defaultFixedRate;

      addOrUpdateShift({
        date: dateStr,
        type: activePaintBrush,
        hours,
        rateType: shiftSettings.defaultRateType,
        rate,
        bonus: 0,
        note: isWork ? `Смена ${SHIFT_TYPE_CONFIG[activePaintBrush].label}` : 'Выходной',
      });
    }
    setSelectedDateStr(dateStr);
  };

  // Open Context Menu on Right Click
  const handleCellContextMenu = (e: React.MouseEvent, dateStr: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedDateStr(dateStr);
    setCellContextMenu({
      x: Math.min(window.innerWidth - 220, e.clientX),
      y: Math.min(window.innerHeight - 300, e.clientY),
      dateStr,
    });
  };

  // Set Shift from Context Menu
  const handleQuickSetShift = (type: ShiftType) => {
    if (!cellContextMenu) return;
    const dateStr = cellContextMenu.dateStr;
    const isWork = type !== 'off' && type !== 'vacation';
    const hours = isWork
      ? type === 'full'
        ? shiftSettings.defaultFullHours
        : shiftSettings.defaultDayHours
      : 0;
    const rate =
      shiftSettings.defaultRateType === 'hourly'
        ? shiftSettings.defaultHourlyRate
        : shiftSettings.defaultFixedRate;

    addOrUpdateShift({
      date: dateStr,
      type,
      hours,
      rateType: shiftSettings.defaultRateType,
      rate,
      bonus: 0,
      note: isWork ? `Смена ${SHIFT_TYPE_CONFIG[type].label}` : 'Выходной',
    });
    setCellContextMenu(null);
    showToast(`Установлена смена: ${SHIFT_TYPE_CONFIG[type].label}`);
  };

  // Clear Events on a single day
  const handleClearDayEvents = (dateStr: string) => {
    const dayEvts = calendarEvents.filter((e) => e.date === dateStr);
    dayEvts.forEach((ev) => deleteCalendarEvent(ev.id));
    showToast(`Удалены дела за ${dateStr} (${dayEvts.length} шт.)`);
  };

  // Granular Bulk Cleanup Calculation
  const cleanupPreviewStats = useMemo(() => {
    let startStr = cleanupStartDate;
    let endStr = cleanupEndDate;

    if (cleanupPeriodType === 'current_month') {
      startStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const daysInM = new Date(year, month + 1, 0).getDate();
      endStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInM).padStart(2, '0')}`;
    }

    const targetShifts = shifts.filter((s) => s.date >= startStr && s.date <= endStr);
    const targetEvents = calendarEvents.filter((e) => e.date >= startStr && e.date <= endStr);

    const workShiftsCount = targetShifts.filter((s) => s.type !== 'off' && s.type !== 'vacation').length;
    const daysOffCount = targetShifts.filter((s) => s.type === 'off' || s.type === 'vacation').length;
    const eventsCount = targetEvents.length;

    return {
      startStr,
      endStr,
      workShiftsCount,
      daysOffCount,
      eventsCount,
    };
  }, [cleanupPeriodType, cleanupStartDate, cleanupEndDate, year, month, shifts, calendarEvents]);

  // Execute Bulk Granular Cleanup
  const handleExecuteGranularCleanup = () => {
    const { startStr, endStr } = cleanupPreviewStats;
    let deletedShiftsCount = 0;
    let deletedEventsCount = 0;

    shifts.forEach((s) => {
      if (s.date >= startStr && s.date <= endStr) {
        const isWork = s.type !== 'off' && s.type !== 'vacation';
        const isOff = s.type === 'off' || s.type === 'vacation';

        if ((isWork && cleanupDeleteWorkShifts) || (isOff && cleanupDeleteDaysOff)) {
          deleteShift(s.date);
          deletedShiftsCount++;
        }
      }
    });

    if (cleanupDeleteEvents) {
      calendarEvents.forEach((e) => {
        if (e.date >= startStr && e.date <= endStr) {
          deleteCalendarEvent(e.id);
          deletedEventsCount++;
        }
      });
    }

    setIsCleanupModalOpen(false);
    showToast(`Очищено: ${deletedShiftsCount} смен/выходных, ${deletedEventsCount} дел`);
  };

  // Export Full Premium Report to Vault Note
  const handleExportReportToNote = () => {
    const monthTitle = `${MONTH_NAMES[month]} ${year}`;
    const noteTitle = `Отчет по сменам и заработку — ${monthTitle}`;

    let md = `# 📊 ${noteTitle}\n\n`;
    md += `> [!tip] Финансовая сводка за ${monthTitle}\n`;
    md += `> **Начислено (Gross)**: ${monthStats.totalEarnings.toLocaleString('ru-RU')} ₽\n`;
    md += `> **Траты на сменах**: -${monthStats.totalExpenses.toLocaleString('ru-RU')} ₽\n`;
    md += `> **💎 Чистый остаток на руках (Net)**: **${monthStats.netEarnings.toLocaleString('ru-RU')} ₽**\n`;
    md += `> **💼 Отработано смен**: ${monthStats.workShiftsCount} (Дневных: ${monthStats.dayShiftsCount}, Ночных: ${monthStats.nightShiftsCount}, Суточных: ${monthStats.fullShiftsCount})\n`;
    md += `> **⏱️ Всего отработано**: ${monthStats.totalHours} ч\n`;
    md += `> **Средний чистый доход за смену**: ${monthStats.avgNetPerShift.toLocaleString('ru-RU')} ₽\n\n`;

    md += `## Подробная ведомость смен и трат\n\n`;
    md += `| Дата | День | Смена | Часы | Начислено | Трата | Чистыми | Примечание |\n`;
    md += `| :--- | :---: | :--- | :---: | :---: | :---: | :---: | :--- |\n`;

    monthStats.monthShifts
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach((s) => {
        const typeLabel = SHIFT_TYPE_CONFIG[s.type]?.label || s.type;
        const dayOfWeek = new Date(s.date).toLocaleDateString('ru-RU', { weekday: 'short' });
        const exp = s.expense !== undefined ? s.expense : (s.roadExpense || 0) + (s.foodExpense || 0);
        const expStr = exp ? `-${exp} ₽` : '-';
        const net = s.earnings - exp;
        md += `| **${s.date}** | ${dayOfWeek} | ${typeLabel} | ${s.hours}ч | ${s.earnings.toLocaleString('ru-RU')} ₽ | ${expStr} | **${net.toLocaleString('ru-RU')} ₽** | ${s.note || '-'} |\n`;
      });

    const newNote = addNeuron(noteTitle, md, 'Work');
    openNote(newNote.id);
    setIsReportModalOpen(false);
    showToast(`Заметка «${noteTitle}» сохранена в блокноте!`);
  };

  // Copy Messenger Text
  const handleCopyMessengerSummary = () => {
    const monthTitle = `${MONTH_NAMES[month]} ${year}`;
    let text = `Отчет по сменам — ${monthTitle}\n\n`;
    text += `Начислено: ${monthStats.totalEarnings.toLocaleString('ru-RU')} ₽\n`;
    text += `Траты на сменах: -${monthStats.totalExpenses.toLocaleString('ru-RU')} ₽\n`;
    text += `Чистыми на руках: ${monthStats.netEarnings.toLocaleString('ru-RU')} ₽\n`;
    text += `Смен: ${monthStats.workShiftsCount} (${monthStats.totalHours} ч.)\n`;
    text += `В среднем чистыми за смену: ${monthStats.avgNetPerShift.toLocaleString('ru-RU')} ₽\n`;

    navigator.clipboard.writeText(text);
    showToast('Сводка скопирована в буфер для отправки');
  };

  return (
    <div className="w-full h-full bg-[#0d0e14] flex flex-col overflow-hidden select-none text-[#e2e8f0]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-[#171822]/95 backdrop-blur-xl border border-white/[0.14] text-white shadow-2xl text-xs font-semibold flex items-center gap-2 animate-fade-in pointer-events-none">
          <Sparkles size={14} className="text-[#8b5cf6]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Telemetry Dashboard */}
      <div className="p-3 border-b border-white/[0.08] bg-[#111217]/95 backdrop-blur-md flex flex-col gap-2.5">
        {/* Row 1: Title & Main Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#8b5cf6]/20 text-[#8b5cf6] border border-[#8b5cf6]/30 flex items-center justify-center shadow-md">
              <Calendar size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-none">
                {MONTH_NAMES[month]} {year}
              </h2>
              <span className="text-[10px] text-[#94a3b8] block mt-0.5">
                {monthStats.workShiftsCount} смен • {monthStats.totalHours}ч
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Schedule Generator */}
            <button
              onClick={() => setIsScheduleGeneratorOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-[#8b5cf6]/20 hover:bg-[#8b5cf6]/30 text-[#8b5cf6] border border-[#8b5cf6]/35 text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 shadow-sm"
              title="Генератор циклического графика"
            >
              <Sparkles size={13} />
              <span className="hidden sm:inline">Генератор</span>
            </button>

            {/* Beautiful Report Button */}
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-[#10b981]/20 hover:bg-[#10b981]/30 text-[#10b981] border border-[#10b981]/35 text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 shadow-sm"
              title="Финансовый отчет за месяц"
            >
              <PieChart size={13} />
              <span className="hidden sm:inline">Отчет</span>
            </button>

            {/* Granular Cleanup Modal Button */}
            <button
              onClick={() => setIsCleanupModalOpen(true)}
              className="p-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-[#f43f5e] border border-red-500/30 text-xs font-semibold flex items-center justify-center transition-all active:scale-95"
              title="Очистить смены/дела"
            >
              <Eraser size={14} />
            </button>

            {/* Settings */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 rounded-xl bg-[#161720] border border-white/[0.08] text-[#94a3b8] hover:text-white transition-colors active:scale-95"
              title="Настройки ставок"
            >
              <Settings size={14} />
            </button>

            {/* Toggle Telemetry */}
            <button
              onClick={() => setIsTelemetryVisible((v) => !v)}
              className="p-1.5 rounded-xl bg-[#161720] border border-white/[0.08] text-[#94a3b8] hover:text-white transition-colors active:scale-95"
              title={isTelemetryVisible ? 'Скрыть панель статистики' : 'Показать панель статистики'}
            >
              {isTelemetryVisible ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        {/* Row 2: Month & Year Dropdown Selectors Bar */}
        <div className="flex items-center justify-between gap-1.5 bg-[#161720] border border-white/[0.08] p-1.5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/[0.06] transition-colors"
              title="Предыдущий месяц"
            >
              <ChevronLeft size={15} />
            </button>

            <select
              value={month}
              onChange={(e) => handleSelectMonth(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer px-1.5 py-1 rounded-lg hover:bg-white/[0.05]"
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
              className="bg-transparent text-xs font-bold text-[#8b5cf6] focus:outline-none cursor-pointer px-1 py-1 font-mono rounded-lg hover:bg-white/[0.05]"
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
              <ChevronRight size={15} />
            </button>
          </div>

          <button
            onClick={handleToday}
            className="px-3 py-1 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] active:scale-95 text-xs font-bold text-white transition-all shadow-sm"
            title="Перейти к сегодняшней дате"
          >
            Сегодня
          </button>
        </div>

        {/* Hideable Premium Telemetry KPI Cards */}
        {isTelemetryVisible && (
          <>
            {/* Mobile 1-Line Compact Summary */}
            <div className="flex md:hidden items-center justify-between px-3 py-2 bg-[#14151c] border border-white/[0.08] rounded-2xl text-xs shadow-sm">
              <div className="flex items-center gap-2 font-bold">
                <span className="text-[#10b981] font-mono">
                  +{monthStats.netEarnings >= 100000 ? Math.round(monthStats.netEarnings / 1000) + 'к' : monthStats.netEarnings.toLocaleString('ru-RU')} ₽
                </span>
                <span className="text-[#475569]">·</span>
                <span className="text-[#38bdf8] font-mono font-semibold">{monthStats.totalHours}ч</span>
                <span className="text-[#475569]">·</span>
                <span className="text-[#f59e0b] font-semibold">{monthStats.workShiftsCount} см.</span>
              </div>
              <span className="text-[11px] text-[#94a3b8]">
                {monthStats.daysOffCount} вых.
              </span>
            </div>

            {/* Desktop Detailed 5 KPI Cards */}
            <div className="hidden md:grid md:grid-cols-3 xl:grid-cols-5 gap-2 animate-fade-in pt-1 pb-1">
            <div className="min-w-[170px] md:min-w-0 shrink-0 p-2.5 rounded-2xl bg-[#14151c]/90 border border-white/[0.08] flex items-center justify-between shadow-lg">
              <div>
                <span className="text-[9px] uppercase font-bold text-[#94a3b8] tracking-wider block mb-0.5">
                  Чистый доход (На руках)
                </span>
                <span className="text-base font-extrabold text-[#10b981] font-mono">
                  {monthStats.netEarnings.toLocaleString('ru-RU')} ₽
                </span>
                {monthStats.totalExpenses > 0 && (
                  <span className="text-[9px] text-[#f43f5e] block">
                    Траты: -{monthStats.totalExpenses} ₽
                  </span>
                )}
              </div>
              <div className="w-8 h-8 rounded-xl bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 flex items-center justify-center shrink-0">
                <DollarSign size={16} />
              </div>
            </div>

            <div className="min-w-[170px] md:min-w-0 shrink-0 p-2.5 rounded-2xl bg-[#14151c]/90 border border-white/[0.08] flex items-center justify-between shadow-lg">
              <div>
                <span className="text-[9px] uppercase font-bold text-[#94a3b8] tracking-wider block mb-0.5">
                  Отработано смен
                </span>
                <span className="text-base font-extrabold text-white">
                  {monthStats.workShiftsCount} <span className="text-xs text-[#94a3b8] font-normal">смен</span>
                </span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-[#8b5cf6]/15 text-[#8b5cf6] border border-[#8b5cf6]/30 flex items-center justify-center shrink-0">
                <Briefcase size={16} />
              </div>
            </div>

            <div className="min-w-[170px] md:min-w-0 shrink-0 p-2.5 rounded-2xl bg-[#14151c]/90 border border-white/[0.08] flex items-center justify-between shadow-lg">
              <div>
                <span className="text-[9px] uppercase font-bold text-[#94a3b8] tracking-wider block mb-0.5">
                  Всего часов
                </span>
                <span className="text-base font-extrabold text-[#38bdf8] font-mono">
                  {monthStats.totalHours} <span className="text-xs text-[#94a3b8] font-normal">ч</span>
                </span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30 flex items-center justify-center shrink-0">
                <Clock size={16} />
              </div>
            </div>

            <div className="min-w-[170px] md:min-w-0 shrink-0 p-2.5 rounded-2xl bg-[#14151c]/90 border border-white/[0.08] flex items-center justify-between shadow-lg">
              <div>
                <span className="text-[9px] uppercase font-bold text-[#94a3b8] tracking-wider block mb-0.5">
                  Средний чистый / смена
                </span>
                <span className="text-base font-extrabold text-[#f59e0b] font-mono">
                  {monthStats.avgNetPerShift.toLocaleString('ru-RU')} ₽
                </span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30 flex items-center justify-center shrink-0">
                <TrendingUp size={16} />
              </div>
            </div>

            <div className="min-w-[170px] md:min-w-0 shrink-0 p-2.5 rounded-2xl bg-[#14151c]/90 border border-white/[0.08] flex items-center justify-between shadow-lg">
              <div>
                <span className="text-[9px] uppercase font-bold text-[#94a3b8] tracking-wider block mb-0.5">
                  Выходные / Баланс
                </span>
                <span className="text-base font-extrabold text-[#94a3b8]">
                  {monthStats.daysOffCount} <span className="text-xs text-[#64748b] font-normal">вых.</span>
                </span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-slate-500/15 text-[#cbd5e1] border border-slate-500/30 flex items-center justify-center shrink-0">
                <Coffee size={16} />
              </div>
            </div>
          </div>
          </>
        )}
      </div>

      {/* Main Calendar View Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-y-auto min-h-0 pb-20 md:pb-6">
        {/* Calendar Grid Container */}
        <div className="w-full md:flex-1 flex flex-col p-2 sm:p-3 shrink-0">
          {/* Quick Shift Paint Brush & Eraser Bar (Single Row, Sleek & Compact) */}
          <div className="hidden md:flex items-center gap-1 p-1 mb-2 bg-[#14151c] border border-white/[0.08] rounded-xl text-xs overflow-x-auto no-scrollbar shadow-sm shrink-0">
            <span className="text-[10px] text-[#94a3b8] font-bold px-1 uppercase tracking-wider shrink-0">
               Кисть:
            </span>
            <button
              onClick={() => setActivePaintBrush(null)}
              className={`px-2 py-1 rounded-lg text-xs transition-all shrink-0 ${
                activePaintBrush === null
                  ? 'bg-white/15 text-white font-bold shadow-sm'
                  : 'text-[#94a3b8] hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              Инспектор
            </button>
            {(['day', 'night', 'full', 'part', 'off', 'vacation'] as const).map((type) => {
              const cfg = SHIFT_TYPE_CONFIG[type];
              const isCurrent = activePaintBrush === type;
              return (
                <button
                  key={type}
                  onClick={() => setActivePaintBrush(isCurrent ? null : type)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all border shrink-0 ${
                    isCurrent
                      ? 'border-white text-white shadow-md ring-1 ring-white/40'
                      : 'border-transparent text-[#94a3b8] hover:text-white hover:bg-white/[0.04]'
                  }`}
                  style={{ backgroundColor: isCurrent ? cfg.bg : undefined }}
                >
                  <cfg.icon size={12} color={isCurrent ? '#ffffff' : cfg.color} />
                  <span>{cfg.label}</span>
                </button>
              );
            })}

            {/* Quick 1-Click Eraser Tool */}
            <button
              onClick={() => setActivePaintBrush(activePaintBrush === 'eraser' ? null : 'eraser')}
              className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all border ml-auto shrink-0 ${
                activePaintBrush === 'eraser'
                  ? 'bg-red-500/25 border-red-500 text-white shadow-md ring-1 ring-red-500/40'
                  : 'border-transparent text-[#f43f5e] hover:bg-red-500/10'
              }`}
              title="Кликайте или зажимайте мышь, чтобы стирать смены"
            >
              <Eraser size={12} />
              <span>Ластик</span>
            </button>
          </div>

          {/* Quick Bulk Eraser Banner */}
          {activePaintBrush === 'eraser' && (
            <div className="mb-2 p-2 px-3 bg-red-500/15 border border-red-500/40 rounded-xl text-xs flex items-center justify-between gap-2 animate-fade-in flex-wrap shadow-md shrink-0">
              <div className="flex items-center gap-2">
                <Eraser size={14} className="text-[#f43f5e] animate-bounce" />
                <span className="text-white font-semibold text-xs">
                  Ластик: кликайте по дням для очистки
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => {
                    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
                    const count = shifts.filter((s) => s.date.startsWith(monthPrefix) && s.type !== 'off' && s.type !== 'vacation').length;
                    shifts.filter((s) => s.date.startsWith(monthPrefix) && s.type !== 'off' && s.type !== 'vacation').forEach((s) => deleteShift(s.date));
                    showToast(`Стерты рабочие смены за месяц (${count} шт.)`);
                  }}
                  className="px-2 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-[#f43f5e] border border-red-500/40 text-xs font-bold transition-all"
                >
                  Стереть смены
                </button>

                <button
                  onClick={() => {
                    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
                    shifts.filter((s) => s.date.startsWith(monthPrefix)).forEach((s) => deleteShift(s.date));
                    calendarEvents.filter((e) => e.date.startsWith(monthPrefix)).forEach((e) => deleteCalendarEvent(e.id));
                    showToast(`Очищен весь месяц`);
                  }}
                  className="px-2 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md"
                >
                  Очистить всё
                </button>
              </div>
            </div>
          )}

          {/* Weekdays Header */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-1.5 shrink-0">
            {WEEKDAY_NAMES.map(({ short }, idx) => (
              <div
                key={short}
                className={`text-center text-[11px] sm:text-xs font-bold py-1 rounded-lg sm:rounded-xl ${
                  idx >= 5 ? 'text-[#f43f5e] bg-red-500/10 border border-red-500/15' : 'text-[#94a3b8] bg-white/[0.03]'
                }`}
              >
                {short}
              </div>
            ))}
          </div>

          {/* Day Cells Grid (Adaptive, Responsive & Clean) */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 flex-1 auto-rows-fr min-h-0">
            {calendarDays.map(({ dateStr, dayNum, isCurrentMonth, dayOfWeek }) => {
              const isSelected = dateStr === selectedDateStr;
              const isToday = dateStr === toLocalDateStr();
              const shift = shiftsByDate.get(dateStr);
              const config = shift ? SHIFT_TYPE_CONFIG[shift.type] : null;
              const dayEvts = eventsByDate.get(dateStr) || [];
              const dayExpense = shift
                ? shift.expense !== undefined
                  ? shift.expense
                  : (shift.roadExpense || 0) + (shift.foodExpense || 0)
                : 0;

              return (
                <div
                  key={dateStr}
                  onClick={() => handleDayClick(dateStr)}
                  onMouseDown={(e) => {
                    if (e.button === 0) {
                      setIsMouseDown(true);
                      handleDayClick(dateStr);
                    }
                  }}
                  onMouseEnter={() => {
                    if (isMouseDown && activePaintBrush) {
                      handleDayClick(dateStr);
                    }
                  }}
                  onContextMenu={(e) => handleCellContextMenu(e, dateStr)}
                  className={`min-h-[56px] sm:min-h-[72px] 2xl:min-h-[82px] p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border flex flex-col justify-between transition-all cursor-pointer relative group select-none overflow-hidden ${
                    isSelected
                      ? 'border-[#8b5cf6] bg-[#8b5cf6]/20 shadow-lg shadow-purple-500/25 ring-2 ring-[#8b5cf6]'
                      : isToday
                      ? 'border-[#f59e0b] bg-[#14151c] shadow-md ring-1 ring-[#f59e0b]/50'
                      : isCurrentMonth
                      ? 'border-white/[0.08] bg-[#14151c] hover:border-white/[0.22] hover:bg-[#181924]'
                      : 'border-transparent bg-white/[0.01] opacity-20'
                  }`}
                >
                  {/* Top Bar: Date + Compact Shift Pill */}
                  <div className="flex items-center justify-between gap-0.5">
                    <span
                      className={`text-[11px] sm:text-xs font-bold w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg flex items-center justify-center shrink-0 ${
                        isToday
                          ? 'bg-[#f59e0b] text-black font-extrabold shadow-sm'
                          : isSelected
                          ? 'bg-[#8b5cf6] text-white font-extrabold shadow-sm'
                          : dayOfWeek === 0 || dayOfWeek === 6
                          ? 'text-[#f43f5e]'
                          : 'text-[#e2e8f0]'
                      }`}
                    >
                      {dayNum}
                    </span>

                    {config && shift && (
                      <span
                        className="px-1 py-0.5 rounded-md text-[9px] font-black border flex items-center gap-0.5 shadow-sm shrink-0 leading-none"
                        style={{
                          backgroundColor: config.bg,
                          color: config.color,
                          borderColor: config.border,
                        }}
                      >
                        <config.icon size={10} color={config.color} />
                        <span className="hidden sm:inline font-bold text-[10px]">{config.label}</span>
                        <span className="sm:hidden font-black text-[9px]">{config.shortLabel}</span>
                      </span>
                    )}
                  </div>

                  {/* Middle / Bottom Content: Compact & Non-Overflowing */}
                  <div className="flex flex-col gap-0.5 mt-auto pt-0.5 overflow-hidden">
                    {shift && shift.type !== 'off' && shift.type !== 'vacation' && (
                      <div className="flex items-center justify-between text-[9px] font-mono font-semibold leading-none gap-0.5 overflow-hidden">
                        <span className="text-[#38bdf8] truncate shrink-0">
                          {shift.hours}ч
                        </span>
                        <span className="text-[#10b981] font-bold truncate">
                          +{shift.earnings >= 10000 ? Math.round(shift.earnings / 1000) + 'к' : shift.earnings}
                        </span>
                      </div>
                    )}

                    {/* Clean Event Dots */}
                    {dayEvts.length > 0 && (
                      <div className="flex items-center gap-1 py-0.5 overflow-hidden">
                        {dayEvts.slice(0, 3).map((ev) => (
                          <span
                            key={ev.id}
                            className="w-1.5 h-1.5 rounded-full ring-1 ring-black/40 shrink-0"
                            style={{ backgroundColor: ev.color || '#ec4899' }}
                            title={ev.title}
                          />
                        ))}
                        {dayEvts.length > 3 && (
                          <span className="text-[8px] text-[#64748b] font-mono leading-none">
                            +{dayEvts.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Inspector Drawer: Selected Day (Desktop only; mobile uses top + modal) */}
        <div className="hidden md:flex md:w-80 2xl:w-84 shrink-0 border-l border-white/[0.08] bg-[#111217] p-4 flex-col justify-between">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <div>
                <span className="text-[10px] uppercase text-[#8b5cf6] font-bold tracking-wider">
                  Параметры дня
                </span>
                <h3 className="text-xs font-bold text-white">
                  {new Date(selectedDateStr + 'T12:00:00').toLocaleDateString('ru-RU', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </h3>
              </div>

              {selectedShift && (
                <button
                  onClick={() => {
                    deleteShift(selectedDateStr);
                    showToast('Смена удалена');
                  }}
                  className="p-1.5 rounded-lg text-[#94a3b8] hover:text-[#f43f5e] hover:bg-white/[0.08] transition-colors"
                  title="Очистить смену этого дня"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>

            <div className="flex p-0.5 bg-[#161720] border border-white/[0.08] rounded-xl text-xs">
              <button
                onClick={() => setInspectorTab('shift')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                  inspectorTab === 'shift'
                    ? 'bg-[#8b5cf6] text-white shadow-sm'
                    : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                Смена
              </button>
              <button
                onClick={() => setInspectorTab('events')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                  inspectorTab === 'events'
                    ? 'bg-[#8b5cf6] text-white shadow-sm'
                    : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                Дела ({selectedDayEvents.length})
              </button>
            </div>

            {inspectorTab === 'shift' ? (
              <div className="space-y-3.5">
                {/* 1. Shift Type Selector (Ergonomic 3x2 Grid) */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider flex items-center justify-between">
                    <span>1. Выберите тип смены</span>
                    {formType !== 'off' && formType !== 'vacation' && (
                      <span className="text-white font-mono text-xs">{formHours} ч</span>
                    )}
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(Object.keys(SHIFT_TYPE_CONFIG) as ShiftType[]).map((type) => {
                      const cfg = SHIFT_TYPE_CONFIG[type];
                      const isCur = formType === type;
                      const IconComp = cfg.icon;
                      const defaultH =
                        type === 'full'
                          ? shiftSettings.defaultFullHours
                          : type === 'day' || type === 'night'
                          ? shiftSettings.defaultDayHours
                          : type === 'part'
                          ? 8
                          : 0;

                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            setFormType(type);
                            if (type === 'full') setFormHours(shiftSettings.defaultFullHours);
                            if (type === 'day' || type === 'night') setFormHours(shiftSettings.defaultDayHours);
                            if (type === 'part') setFormHours(8);
                            if (type === 'off' || type === 'vacation') setFormHours(0);
                          }}
                          className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between gap-1.5 transition-all active:scale-95 ${
                            isCur
                              ? 'border-[#8b5cf6] bg-[#8b5cf6]/20 text-white shadow-lg ring-2 ring-[#8b5cf6]/60'
                              : 'border-white/[0.08] bg-[#161720] text-[#94a3b8] hover:bg-white/[0.06] hover:text-white'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div
                              className="w-6 h-6 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${cfg.color}20` }}
                            >
                              <IconComp size={14} color={cfg.color} />
                            </div>
                            {defaultH > 0 && (
                              <span className="text-[10px] font-mono text-[#94a3b8] font-semibold">
                                {defaultH}ч
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-bold truncate block">{cfg.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {formType !== 'off' && formType !== 'vacation' && (
                  <div className="space-y-3 pt-1 animate-fade-in">
                    {/* 2. Hours Stepper & Quick Hour Chips */}
                    <div className="p-3 rounded-2xl bg-[#161720] border border-white/[0.08] space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">
                          2. Длительность смены
                        </label>
                        <div className="flex items-center gap-1.5 bg-[#111218] border border-white/[0.08] rounded-xl px-2 py-0.5">
                          <button
                            type="button"
                            onClick={() => setFormHours((h) => Math.max(1, h - 1))}
                            className="w-5 h-5 rounded-lg bg-white/[0.06] hover:bg-white/[0.14] text-white flex items-center justify-center font-bold text-xs active:scale-90"
                          >
                            -
                          </button>
                          <span className="font-mono text-sm font-extrabold text-[#38bdf8] px-1">
                            {formHours} ч
                          </span>
                          <button
                            type="button"
                            onClick={() => setFormHours((h) => Math.min(24, h + 1))}
                            className="w-5 h-5 rounded-lg bg-white/[0.06] hover:bg-white/[0.14] text-white flex items-center justify-center font-bold text-xs active:scale-90"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* 1-Tap Quick Hour Chips */}
                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
                        {[4, 8, 10, 12, 14, 16, 24].map((h) => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => setFormHours(h)}
                            className={`flex-1 min-w-[38px] py-1 rounded-xl text-xs font-mono font-bold transition-all text-center border ${
                              formHours === h
                                ? 'bg-[#38bdf8]/20 border-[#38bdf8] text-[#38bdf8] shadow-sm'
                                : 'bg-white/[0.04] border-white/[0.06] text-[#94a3b8] hover:text-white'
                            }`}
                          >
                            {h}ч
                          </button>
                        ))}
                      </div>

                      <input
                        type="range"
                        min="1"
                        max="24"
                        value={formHours}
                        onChange={(e) => setFormHours(Number(e.target.value))}
                        className="w-full accent-[#38bdf8] cursor-pointer"
                      />
                    </div>

                    {/* 3. Rate & Bonus Grid */}
                    <div className="p-3 rounded-2xl bg-[#161720] border border-white/[0.08] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">
                          3. Оплата и бонусы
                        </label>
                        <div className="flex items-center p-0.5 bg-[#111218] border border-white/[0.06] rounded-lg text-[10px]">
                          <button
                            type="button"
                            onClick={() => setFormRateType('hourly')}
                            className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                              formRateType === 'hourly'
                                ? 'bg-[#8b5cf6] text-white'
                                : 'text-[#94a3b8] hover:text-white'
                            }`}
                          >
                            ₽/час
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormRateType('fixed')}
                            className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                              formRateType === 'fixed'
                                ? 'bg-[#8b5cf6] text-white'
                                : 'text-[#94a3b8] hover:text-white'
                            }`}
                          >
                            ₽/смена
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-[#94a3b8] mb-1 font-medium">
                            {formRateType === 'hourly' ? 'Ставка в час (₽/ч)' : 'Ставка за смену (₽)'}
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={formRate === 0 ? '' : String(formRate)}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
                              setFormRate(clean === '' ? 0 : Number(clean));
                            }}
                            placeholder="0"
                            className="w-full bg-[#111218] border border-white/[0.08] rounded-xl p-2 text-white font-mono text-xs focus:outline-none focus:border-[#8b5cf6]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-[#94a3b8] mb-1 font-medium">
                            Премия / бонус (₽)
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={formBonus === 0 ? '' : String(formBonus)}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
                              setFormBonus(clean === '' ? 0 : Number(clean));
                            }}
                            placeholder="0"
                            className="w-full bg-[#111218] border border-white/[0.08] rounded-xl p-2 text-white font-mono text-xs focus:outline-none focus:border-[#8b5cf6]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 4. Shift Expense Box */}
                    <div className="p-3 rounded-2xl bg-[#161720] border border-white/[0.08] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-[#f43f5e] font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <Wallet size={13} />
                          <span>4. Трата за смену (обед / дорога)</span>
                        </span>
                        <span className="font-mono text-sm text-[#f43f5e] font-extrabold">{formExpense} ₽</span>
                      </div>

                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formExpense === 0 ? '' : String(formExpense)}
                          onChange={(e) => {
                            const clean = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
                            setFormExpense(clean === '' ? 0 : Number(clean));
                          }}
                          placeholder="0"
                          className="w-full bg-[#111218] border border-white/[0.08] rounded-xl pl-3 pr-8 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#8b5cf6]"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#94a3b8]">
                          ₽
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {[100, 200, 300, 500, 1000].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setFormExpense(amt)}
                            className={`flex-1 min-w-[42px] py-1 px-1.5 rounded-lg text-[11px] font-mono font-bold border transition-all text-center active:scale-95 ${
                              formExpense === amt
                                ? 'bg-[#f43f5e]/25 border-[#f43f5e] text-white'
                                : 'bg-white/[0.04] hover:bg-white/[0.12] text-[#cbd5e1] border-white/[0.06]'
                            }`}
                          >
                            +{amt}
                          </button>
                        ))}
                        {formExpense > 0 && (
                          <button
                            type="button"
                            onClick={() => setFormExpense(0)}
                            className="py-1 px-2 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-[#f43f5e] text-[10px] font-bold border border-red-500/20 transition-all active:scale-95"
                            title="Сбросить трату"
                          >
                            ✕ 0
                          </button>
                        )}
                      </div>

                      <label className="flex items-center gap-2 pt-0.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formSyncFinance}
                          onChange={(e) => setFormSyncFinance(e.target.checked)}
                          className="w-3.5 h-3.5 rounded accent-[#8b5cf6] cursor-pointer"
                        />
                        <span className="text-[10px] text-[#94a3b8]">
                          Автоматически внести в модуль «Финансы»
                        </span>
                      </label>
                    </div>

                    {/* 5. Net Earnings Live Calculation Summary */}
                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#161824] to-[#12131c] border border-white/[0.10] space-y-1.5 shadow-lg">
                      <div className="flex items-center justify-between text-xs text-[#94a3b8]">
                        <span>Начислено ({formRateType === 'hourly' ? `${formHours}ч × ${formRate}₽` : `${formRate}₽`}{formBonus > 0 ? ` + ${formBonus}₽ премия` : ''}):</span>
                        <span className="font-bold text-white font-mono">
                          {((formRateType === 'hourly' ? formHours * formRate : formRate) + formBonus).toLocaleString('ru-RU')} ₽
                        </span>
                      </div>
                      {formExpense > 0 && (
                        <div className="flex items-center justify-between text-xs text-[#f43f5e]">
                          <span>Трата за смену:</span>
                          <span className="font-mono font-bold">
                            -{formExpense.toLocaleString('ru-RU')} ₽
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs pt-1.5 border-t border-white/[0.08]">
                        <span className="font-bold text-white">Чистый доход на руках:</span>
                        <span className="text-lg font-black text-[#10b981] font-mono">
                          {(
                            (formRateType === 'hourly' ? formHours * formRate : formRate) +
                            formBonus -
                            formExpense
                          ).toLocaleString('ru-RU')}{' '}
                          ₽
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. Optional Note */}
                <div>
                  <label className="block text-[10px] font-semibold text-[#94a3b8] mb-1">
                    Примечание к смене (по желанию)
                  </label>
                  <textarea
                    value={formNote}
                    onChange={(e) => setFormNote(e.target.value)}
                    placeholder="Особые задачи, переработки, заметки..."
                    rows={2}
                    className="w-full bg-[#161720] border border-white/[0.08] rounded-xl p-2.5 text-white text-xs resize-none focus:outline-none focus:border-[#8b5cf6]"
                  />
                </div>

                {/* 7. Primary Save & Delete Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleSaveSelectedShift}
                    className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#8b5cf6] to-[#7c5cff] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30 hover:brightness-110 active:scale-95 transition-all"
                  >
                    <Save size={15} />
                    <span>Сохранить смену в график</span>
                  </button>

                  {selectedShift && (
                    <button
                      onClick={() => {
                        deleteShift(selectedDateStr);
                        showToast('Смена удалена');
                      }}
                      className="p-3 rounded-2xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-[#f43f5e] text-xs font-bold flex items-center justify-center transition-all active:scale-95"
                      title="Удалить смену с этой даты"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {selectedDayEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-2.5 rounded-xl bg-[#161720] border border-white/[0.08] flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <input
                          type="checkbox"
                          checked={ev.completed}
                          onChange={() => toggleCalendarEvent(ev.id)}
                          className="w-4 h-4 rounded accent-[#8b5cf6] cursor-pointer"
                        />
                        <div className="truncate">
                          <p
                            className={`font-semibold truncate ${
                              ev.completed ? 'line-through text-[#64748b]' : 'text-white'
                            }`}
                          >
                            {ev.title}
                          </p>
                          <span className="text-[10px] text-[#94a3b8]">
                            {ev.time} {ev.amount ? `• ${ev.amount} ₽` : ''}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => deleteCalendarEvent(ev.id)}
                        className="text-[#94a3b8] hover:text-[#f43f5e] opacity-0 group-hover:opacity-100 p-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}

                  {selectedDayEvents.length === 0 && (
                    <p className="text-[11px] text-[#64748b] italic text-center py-4">
                      На этот день еще нет запланированных дел.
                    </p>
                  )}
                </div>

                <form onSubmit={handleAddEvent} className="p-3 bg-[#161720] rounded-2xl border border-white/[0.08] space-y-2">
                  <span className="text-[10px] text-[#8b5cf6] font-bold uppercase tracking-wider block">
                    + Добавить дело / стрижку / покупку
                  </span>

                  <input
                    type="text"
                    required
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="Например: Стрижка в барбершопе"
                    className="w-full bg-[#111217] border border-white/[0.08] rounded-xl p-2 text-white text-xs focus:outline-none focus:border-[#8b5cf6]"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-[#94a3b8]">Категория:</label>
                      <select
                        value={eventCategory}
                        onChange={(e) => setEventCategory(e.target.value as EventCategory)}
                        className="w-full bg-[#111217] border border-white/[0.08] rounded-xl p-1.5 text-white text-xs"
                      >
                        <option value="beauty">Стрижка / Уход</option>
                        <option value="health">Здоровье / Спорт</option>
                        <option value="shopping">Покупки</option>
                        <option value="personal">Личное</option>
                        <option value="finance">Платеж / Счета</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-[#94a3b8]">Время:</label>
                      <input
                        type="time"
                        value={eventTime}
                        onChange={(e) => setEventTime(e.target.value)}
                        className="w-full bg-[#111217] border border-white/[0.08] rounded-xl p-1.5 text-white text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#94a3b8]">Сумма расхода (₽, если есть):</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={eventAmount}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
                        setEventAmount(clean);
                      }}
                      placeholder="0"
                      className="w-full bg-[#111217] border border-white/[0.08] rounded-xl p-2 text-white font-mono text-xs focus:outline-none focus:border-[#8b5cf6]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 rounded-xl bg-[#8b5cf6] text-white font-bold text-xs shadow-md hover:bg-[#8b5cf6]/90 transition-all"
                  >
                    Добавить дело
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right-Click Context Menu on Day Cells */}
      {cellContextMenu && (
        <div
          className="fixed z-50 bg-[#171822] border border-white/[0.14] rounded-2xl shadow-2xl p-1.5 min-w-[200px] text-xs font-semibold space-y-0.5 animate-scale-up"
          style={{ top: cellContextMenu.y, left: cellContextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2.5 py-1 text-[10px] text-[#8b5cf6] uppercase font-bold tracking-wider border-b border-white/[0.08]">
            {cellContextMenu.dateStr}
          </div>

          <button
            onClick={() => handleQuickSetShift('day')}
            className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/[0.08] text-left flex items-center gap-2 text-white"
          >
            <IconDayShift size={13} color="#f59e0b" />
            <span>Дневная смена</span>
          </button>

          <button
            onClick={() => handleQuickSetShift('night')}
            className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/[0.08] text-left flex items-center gap-2 text-white"
          >
            <IconNightShift size={13} color="#38bdf8" />
            <span>Ночная смена</span>
          </button>

          <button
            onClick={() => handleQuickSetShift('full')}
            className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/[0.08] text-left flex items-center gap-2 text-white"
          >
            <IconFullShift size={13} color="#8b5cf6" />
            <span>⏳ Суточная смена</span>
          </button>

          <button
            onClick={() => handleQuickSetShift('off')}
            className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/[0.08] text-left flex items-center gap-2 text-white"
          >
            <IconDayOff size={13} color="#94a3b8" />
            <span>Сделать выходным</span>
          </button>

          <div className="h-[1px] bg-white/[0.08] my-1" />

          <button
            onClick={() => {
              deleteShift(cellContextMenu.dateStr);
              setCellContextMenu(null);
              showToast('Смена удалена');
            }}
            className="w-full px-2.5 py-1.5 rounded-xl hover:bg-red-500/20 text-left flex items-center gap-2 text-[#f43f5e]"
          >
            <Trash2 size={13} />
            <span>Удалить смену</span>
          </button>

          <button
            onClick={() => {
              handleClearDayEvents(cellContextMenu.dateStr);
              setCellContextMenu(null);
            }}
            className="w-full px-2.5 py-1.5 rounded-xl hover:bg-red-500/20 text-left flex items-center gap-2 text-[#f43f5e]"
          >
            <Eraser size={13} />
            <span>Удалить дела дня</span>
          </button>
        </div>
      )}

      {/* Modal: Granular Bulk Cleanup & Selective Wipe */}
      {isCleanupModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsCleanupModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-[#14151c] rounded-3xl border border-white/[0.14] p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-red-500/20 text-[#f43f5e] border border-red-500/30 flex items-center justify-center">
                  <Eraser size={17} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Выборочная и пакетная очистка</h3>
                  <p className="text-[11px] text-[#94a3b8]">
                    Удаляйте только то, что нужно, без ручного удаления каждой ячейки
                  </p>
                </div>
              </div>
              <button onClick={() => setIsCleanupModalOpen(false)} className="text-[#94a3b8] hover:text-white p-1">
                <X size={16} />
              </button>
            </div>

            {/* Range Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white block">1. Выберите период очистки:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setCleanupPeriodType('current_month')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    cleanupPeriodType === 'current_month'
                      ? 'border-[#8b5cf6] bg-[#8b5cf6]/20 text-white ring-1 ring-[#8b5cf6]'
                      : 'border-white/[0.08] bg-[#171822] text-[#94a3b8] hover:text-white'
                  }`}
                >
                  <span className="font-bold text-xs text-white block">Весь текущий месяц</span>
                  <span className="text-[10px] text-[#94a3b8] block">{MONTH_NAMES[month]} {year}</span>
                </button>

                <button
                  onClick={() => setCleanupPeriodType('custom_range')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    cleanupPeriodType === 'custom_range'
                      ? 'border-[#8b5cf6] bg-[#8b5cf6]/20 text-white ring-1 ring-[#8b5cf6]'
                      : 'border-white/[0.08] bg-[#171822] text-[#94a3b8] hover:text-white'
                  }`}
                >
                  <span className="font-bold text-xs text-white block">Выбранный диапазон</span>
                  <span className="text-[10px] text-[#94a3b8] block">Произвольные даты</span>
                </button>
              </div>

              {cleanupPeriodType === 'custom_range' && (
                <div className="grid grid-cols-2 gap-2 pt-1 animate-fade-in">
                  <div>
                    <label className="text-[10px] text-[#94a3b8] block mb-1">С даты:</label>
                    <input
                      type="date"
                      value={cleanupStartDate}
                      onChange={(e) => setCleanupStartDate(e.target.value)}
                      className="w-full bg-[#161720] border border-white/[0.08] rounded-xl p-2 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#94a3b8] block mb-1">По дату:</label>
                    <input
                      type="date"
                      value={cleanupEndDate}
                      onChange={(e) => setCleanupEndDate(e.target.value)}
                      className="w-full bg-[#161720] border border-white/[0.08] rounded-xl p-2 text-white text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Granular Item Checkboxes */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white block">2. Что именно удалить (выберите категории):</label>
              <div className="space-y-1.5">
                <label className="flex items-center justify-between p-3 rounded-2xl bg-[#171822] border border-white/[0.08] cursor-pointer hover:bg-white/[0.04]">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={cleanupDeleteWorkShifts}
                      onChange={(e) => setCleanupDeleteWorkShifts(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#8b5cf6] cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-white block">Рабочие смены</span>
                      <span className="text-[10px] text-[#94a3b8]">Дневные, ночные, суточные и подработки</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#f59e0b]">
                    {cleanupPreviewStats.workShiftsCount} шт.
                  </span>
                </label>

                <label className="flex items-center justify-between p-3 rounded-2xl bg-[#171822] border border-white/[0.08] cursor-pointer hover:bg-white/[0.04]">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={cleanupDeleteDaysOff}
                      onChange={(e) => setCleanupDeleteDaysOff(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#8b5cf6] cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-white block">Выходные и отпуска</span>
                      <span className="text-[10px] text-[#94a3b8]">Записи со статусом «Выходной» или «Отпуск»</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#94a3b8]">
                    {cleanupPreviewStats.daysOffCount} шт.
                  </span>
                </label>

                <label className="flex items-center justify-between p-3 rounded-2xl bg-[#171822] border border-white/[0.08] cursor-pointer hover:bg-white/[0.04]">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={cleanupDeleteEvents}
                      onChange={(e) => setCleanupDeleteEvents(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#8b5cf6] cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-white block">Запланированные дела</span>
                      <span className="text-[10px] text-[#94a3b8]">Все задачи, записи и события в календаре</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#ec4899]">
                    {cleanupPreviewStats.eventsCount} шт.
                  </span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
              <button
                onClick={() => setIsCleanupModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-[#161720] text-xs font-semibold text-[#94a3b8] hover:text-white"
              >
                Отмена
              </button>
              <button
                onClick={handleExecuteGranularCleanup}
                className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-xs font-bold text-white shadow-xl shadow-red-500/25 transition-all flex items-center gap-2"
              >
                <Trash2 size={14} />
                <span>Выполнить очистку</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Visual Executive Report */}
      {isReportModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsReportModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-[#14151c] rounded-3xl border border-white/[0.14] p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30 flex items-center justify-center">
                  <PieChart size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Отчет по сменам и доходу — {MONTH_NAMES[month]} {year}
                  </h3>
                  <p className="text-xs text-[#94a3b8]">
                    Сводный табель отработанных смен, часов и начислений
                  </p>
                </div>
              </div>
              <button onClick={() => setIsReportModalOpen(false)} className="text-[#94a3b8] hover:text-white p-1">
                <X size={16} />
              </button>
            </div>

            {/* Financial Dashboard Pill Highlights */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#171822] border border-white/[0.08] space-y-1">
                <span className="text-[10px] text-[#94a3b8] uppercase font-bold tracking-wider">Чистый доход (Net)</span>
                <div className="text-xl font-extrabold text-[#10b981] font-mono">
                  {monthStats.netEarnings.toLocaleString('ru-RU')} ₽
                </div>
                <span className="text-[10px] text-[#64748b]">Начислено: {monthStats.totalEarnings} ₽</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#171822] border border-white/[0.08] space-y-1">
                <span className="text-[10px] text-[#94a3b8] uppercase font-bold tracking-wider">Траты на сменах</span>
                <div className="text-xl font-extrabold text-[#f43f5e] font-mono">
                  -{monthStats.totalExpenses.toLocaleString('ru-RU')} ₽
                </div>
                <span className="text-[10px] text-[#94a3b8]">Всего сменных расходов</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#171822] border border-white/[0.08] space-y-1">
                <span className="text-[10px] text-[#94a3b8] uppercase font-bold tracking-wider">Средний чистый доход</span>
                <div className="text-xl font-extrabold text-[#f59e0b] font-mono">
                  {monthStats.avgNetPerShift.toLocaleString('ru-RU')} ₽
                </div>
                <span className="text-[10px] text-[#64748b]">За смену на руках</span>
              </div>
            </div>

            {/* Shift Breakdown Progress Bar */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-[#171822] border border-white/[0.08]">
              <div className="flex items-center justify-between text-xs font-semibold text-[#94a3b8]">
                <span>Структура месяца:</span>
                <span>{monthStats.workShiftsCount} рабочих / {monthStats.daysOffCount} выходных</span>
              </div>
              <div className="h-3 rounded-full bg-white/[0.06] overflow-hidden flex">
                <div style={{ width: `${(monthStats.dayShiftsCount / monthStats.daysInCurrentMonth) * 100}%` }} className="bg-[#f59e0b]" title="Дневные" />
                <div style={{ width: `${(monthStats.nightShiftsCount / monthStats.daysInCurrentMonth) * 100}%` }} className="bg-[#38bdf8]" title="Ночные" />
                <div style={{ width: `${(monthStats.fullShiftsCount / monthStats.daysInCurrentMonth) * 100}%` }} className="bg-[#8b5cf6]" title="Сутки" />
                <div style={{ width: `${(monthStats.daysOffCount / monthStats.daysInCurrentMonth) * 100}%` }} className="bg-slate-600" title="Выходные" />
              </div>
              <div className="flex items-center gap-4 text-[10px] text-[#94a3b8] pt-1">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#f59e0b]" /> Дневные ({monthStats.dayShiftsCount})</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#38bdf8]" /> Ночные ({monthStats.nightShiftsCount})</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#8b5cf6]" /> Сутки ({monthStats.fullShiftsCount})</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-600" /> Выходные ({monthStats.daysOffCount})</span>
              </div>
            </div>

            {/* Export Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-white/[0.08]">
              <button
                onClick={handleExportReportToNote}
                className="flex-1 py-2.5 rounded-xl bg-[#8b5cf6] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-[#8b5cf6]/90 transition-all"
              >
                <FileText size={14} />
                <span>Создать заметку в блокноте</span>
              </button>

              <button
                onClick={handleCopyMessengerSummary}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.08] text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-white/[0.14] transition-all"
              >
                <Copy size={14} />
                <span>Скопировать для Telegram</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Next-Gen Schedule Generator with Live Rate & Income Controls */}
      {isScheduleGeneratorOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsScheduleGeneratorOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-[#14151c] rounded-3xl border border-white/[0.14] p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#8b5cf6]/20 text-[#8b5cf6] border border-[#8b5cf6]/30 flex items-center justify-center">
                  <Sparkles size={17} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Авто-генератор и конструктор графика смен</h3>
                  <p className="text-[11px] text-[#94a3b8]">
                    Мгновенное заполнение расписания по шаблонам или собственному циклу
                  </p>
                </div>
              </div>
              <button onClick={() => setIsScheduleGeneratorOpen(false)} className="text-[#94a3b8] hover:text-white p-1">
                <X size={16} />
              </button>
            </div>

            {/* Template Selection Cards */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white block">
                1. Выберите шаблон графика или создайте свой:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CYCLE_PRESET_TEMPLATES.map((preset) => {
                  const isSelected = selectedPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset)}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                        isSelected
                          ? 'border-[#8b5cf6] bg-[#8b5cf6]/20 text-white ring-2 ring-[#8b5cf6]/60 shadow-lg shadow-purple-500/15'
                          : 'border-white/[0.08] bg-[#171822] text-[#94a3b8] hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <div>
                        <span className="font-bold text-xs text-white block truncate">{preset.name}</span>
                        <span className="text-[10px] text-[#94a3b8] block truncate">{preset.desc}</span>
                      </div>

                      {/* Mini colored preview badges */}
                      {preset.sequence.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap pt-0.5">
                          {preset.sequence.slice(0, 8).map((t, idx) => {
                            const cfg = SHIFT_TYPE_CONFIG[t];
                            return (
                              <span
                                key={idx}
                                className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold border border-white/10"
                                style={{ backgroundColor: cfg.bg, color: cfg.color }}
                                title={cfg.label}
                              >
                                {t === 'day' ? '☀️' : t === 'night' ? '🌙' : t === 'full' ? '⏳' : '☕'}
                              </span>
                            );
                          })}
                          {preset.sequence.length > 8 && (
                            <span className="text-[9px] text-[#64748b]">+{preset.sequence.length - 8}</span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interactive Cycle Constructor / Sequence Editor */}
            <div className="p-3.5 bg-[#111218] border border-white/[0.08] rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white flex items-center gap-1.5">
                  <Sliders size={13} className="text-[#8b5cf6]" />
                  <span>Последовательность цикла ({activeSequence.length} дн.):</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveSequence([])}
                    className="text-[10px] text-[#f43f5e] hover:underline"
                  >
                    Очистить
                  </button>
                  <button
                    onClick={() => setActiveSequence(['day', 'night', 'off', 'off'])}
                    className="text-[10px] text-[#8b5cf6] hover:underline"
                  >
                    Сброс (1/1/2)
                  </button>
                </div>
              </div>

              {/* Sequence Visual Pills */}
              <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-[#171822] rounded-xl border border-white/[0.06] items-center">
                {activeSequence.length === 0 ? (
                  <span className="text-xs text-[#64748b] italic">
                    Цикл пуст. Нажмите кнопки ниже, чтобы составить график.
                  </span>
                ) : (
                  activeSequence.map((type, idx) => {
                    const cfg = SHIFT_TYPE_CONFIG[type];
                    return (
                      <div
                        key={idx}
                        className="px-2 py-1 rounded-lg border flex items-center gap-1.5 text-xs text-white shadow-sm"
                        style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}
                      >
                        <cfg.icon size={11} color={cfg.color} />
                        <span className="font-semibold text-[11px]">
                          {idx + 1}. {cfg.label}
                        </span>
                        <button
                          onClick={() => setActiveSequence((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-[#94a3b8] hover:text-white ml-0.5 font-bold text-xs"
                          title="Удалить день"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Single Day Addition Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[10px] text-[#94a3b8] font-bold">+ Добавить:</span>
                {(['day', 'night', 'full', 'part', 'off', 'vacation'] as const).map((t) => {
                  const cfg = SHIFT_TYPE_CONFIG[t];
                  return (
                    <button
                      key={t}
                      onClick={() => {
                        setSelectedPresetId('custom');
                        setActiveSequence((prev) => [...prev, t]);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#1a1c26] border border-white/[0.08] text-[11px] font-semibold text-white hover:border-white/30 flex items-center gap-1 transition-all"
                    >
                      <cfg.icon size={11} color={cfg.color} />
                      <span>{cfg.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Quick Batch Additions */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[10px] text-[#94a3b8] font-bold">+ Пакетом:</span>
                {[
                  { label: '+ 2 Дня', seq: ['day', 'day'] },
                  { label: '+ 2 Ночи', seq: ['night', 'night'] },
                  { label: '+ 2 Вых', seq: ['off', 'off'] },
                  { label: '+ 3 Вых', seq: ['off', 'off', 'off'] },
                  { label: '+ 4 Вых', seq: ['off', 'off', 'off', 'off'] },
                ].map((b) => (
                  <button
                    key={b.label}
                    onClick={() => {
                      setSelectedPresetId('custom');
                      setActiveSequence((prev) => [...prev, ...(b.seq as ShiftType[])]);
                    }}
                    className="px-2 py-0.5 rounded-md bg-white/[0.06] hover:bg-white/[0.12] text-[10px] font-mono text-[#cbd5e1]"
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Income Rate Controls Directly in Generator */}
            <div className="p-3.5 bg-[#171822] border border-white/[0.08] rounded-2xl space-y-2.5">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Wallet size={13} className="text-[#10b981]" />
                <span>2. Настройка дохода для генерации:</span>
              </span>

              <div className="grid grid-cols-3 gap-2.5 text-xs">
                <div>
                  <label className="block text-[10px] text-[#94a3b8] mb-1 font-semibold">Тип ставки:</label>
                  <select
                    value={genRateType}
                    onChange={(e) => setGenRateType(e.target.value as 'hourly' | 'fixed')}
                    className="w-full bg-[#111218] border border-white/[0.08] rounded-xl p-2 text-white"
                  >
                    <option value="hourly">Почасовая (₽/ч)</option>
                    <option value="fixed">За смену (₽/см)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-[#94a3b8] mb-1 font-semibold">
                    {genRateType === 'hourly' ? 'Ставка в час (₽/ч):' : 'Ставка за смену (₽):'}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={genRate === 0 ? '' : String(genRate)}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
                      setGenRate(clean === '' ? 0 : Number(clean));
                    }}
                    placeholder="0"
                    className="w-full bg-[#111218] border border-white/[0.08] rounded-xl p-2 text-white font-mono font-bold focus:outline-none focus:border-[#8b5cf6]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-[#94a3b8] mb-1 font-semibold">Часов в смене:</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={genDayHours === 0 ? '' : String(genDayHours)}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
                      setGenDayHours(clean === '' ? 0 : Number(clean));
                    }}
                    placeholder="12"
                    className="w-full bg-[#111218] border border-white/[0.08] rounded-xl p-2 text-white font-mono focus:outline-none focus:border-[#8b5cf6]"
                  />
                </div>
              </div>
            </div>

            {/* Generation Date & Duration Settings */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-white mb-1.5">
                  3. Дата начала графика:
                </label>
                <input
                  type="date"
                  value={genStartDate}
                  onChange={(e) => setGenStartDate(e.target.value)}
                  className="w-full bg-[#161720] border border-white/[0.08] rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-[#8b5cf6]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white mb-1.5">
                  4. Период заполнения:
                </label>
                <select
                  value={genDaysCount}
                  onChange={(e) => setGenDaysCount(Number(e.target.value))}
                  className="w-full bg-[#161720] border border-white/[0.08] rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-[#8b5cf6]"
                >
                  <option value={30}>1 месяц (30 дней)</option>
                  <option value={60}>2 месяца (60 дней)</option>
                  <option value={90}>Квартал (90 дней)</option>
                  <option value={180}>Полгода (180 дней)</option>
                  <option value={365}>1 Год (365 дней)</option>
                </select>
              </div>
            </div>

            {/* Live Financial & Workload Preview Box */}
            {generatorPreview && (
              <div className="p-3.5 rounded-2xl bg-[#171822] border border-white/[0.08] grid grid-cols-4 gap-2 text-center shadow-inner">
                <div>
                  <span className="text-[9px] text-[#94a3b8] uppercase font-bold block">Смен будет создано</span>
                  <span className="text-sm font-extrabold text-white">{generatorPreview.workDays} смен</span>
                </div>
                <div>
                  <span className="text-[9px] text-[#94a3b8] uppercase font-bold block">Рабочих часов</span>
                  <span className="text-sm font-extrabold text-[#38bdf8] font-mono">{generatorPreview.totalHours} ч</span>
                </div>
                <div>
                  <span className="text-[9px] text-[#94a3b8] uppercase font-bold block">Выходных дней</span>
                  <span className="text-sm font-extrabold text-[#94a3b8]">{generatorPreview.offDays} дн.</span>
                </div>
                <div>
                  <span className="text-[9px] text-[#94a3b8] uppercase font-bold block">Прогноз дохода</span>
                  <span className="text-sm font-extrabold text-[#10b981] font-mono">
                    ~{generatorPreview.projectedEarnings.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
              <button
                onClick={() => setIsScheduleGeneratorOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-[#161720] text-xs font-semibold text-[#94a3b8] hover:text-white"
              >
                Отмена
              </button>
              <button
                onClick={handleGenerateSchedule}
                className="px-6 py-2.5 rounded-xl bg-[#8b5cf6] text-xs font-bold text-white shadow-xl shadow-purple-500/25 hover:bg-[#8b5cf6]/90 transition-all flex items-center gap-2"
              >
                <Sparkles size={14} />
                <span>Применить и заполнить график</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Default Rate Settings */}
      {isSettingsOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsSettingsOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#14151c] rounded-3xl border border-white/[0.14] p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-sm font-bold text-white">Базовые настройки ставок</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-[#94a3b8] hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#94a3b8] mb-1 font-medium">Ставка в час (₽/ч)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={shiftSettings.defaultHourlyRate === 0 ? '' : String(shiftSettings.defaultHourlyRate)}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
                    updateShiftSettings({ defaultHourlyRate: clean === '' ? 0 : Number(clean) });
                  }}
                  placeholder="0"
                  className="w-full bg-[#161720] border border-white/[0.08] rounded-xl p-2 text-white font-mono focus:outline-none focus:border-[#8b5cf6]"
                />
              </div>

              <div>
                <label className="block text-[#94a3b8] mb-1 font-medium">Ставка за смену (₽)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={shiftSettings.defaultFixedRate === 0 ? '' : String(shiftSettings.defaultFixedRate)}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
                    updateShiftSettings({ defaultFixedRate: clean === '' ? 0 : Number(clean) });
                  }}
                  placeholder="0"
                  className="w-full bg-[#161720] border border-white/[0.08] rounded-xl p-2 text-white font-mono focus:outline-none focus:border-[#8b5cf6]"
                />
              </div>
            </div>

            <button
              onClick={() => {
                setIsSettingsOpen(false);
                showToast('Настройки ставок сохранены');
              }}
              className="w-full py-2.5 rounded-xl bg-[#8b5cf6] text-white text-xs font-bold hover:bg-[#8b5cf6]/90 transition-all shadow-lg"
            >
              Сохранить настройки
            </button>
          </div>
        </div>
      )}

      {/* Modal: Mobile Quick Add for Calendar */}
      {isMobileAddModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsMobileAddModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#14151c] rounded-3xl border border-white/[0.14] p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#10b981]/20 text-[#10b981] flex items-center justify-center border border-[#10b981]/30">
                  <Calendar size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Добавить в календарь</h3>
                  <p className="text-[10px] text-[#94a3b8]">Дата: {selectedDateStr}</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileAddModalOpen(false)}
                className="text-[#94a3b8] hover:text-white p-1"
              >
                <X size={16} />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex bg-[#101117] p-1 rounded-2xl border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setMobileAddTab('event')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                  mobileAddTab === 'event'
                    ? 'bg-[#10b981] text-black shadow-md'
                    : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                📌 Дело
              </button>
              <button
                type="button"
                onClick={() => setMobileAddTab('shift')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                  mobileAddTab === 'shift'
                    ? 'bg-[#10b981] text-black shadow-md'
                    : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                💼 Смена
              </button>
              <button
                type="button"
                onClick={() => setMobileAddTab('generator')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                  mobileAddTab === 'generator'
                    ? 'bg-[#10b981] text-black shadow-md'
                    : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                ⚡ Цикл
              </button>
            </div>

            {/* Tab 1: Event Form */}
            {mobileAddTab === 'event' && (
              <form
                onSubmit={(e) => {
                  handleAddEvent(e);
                  setIsMobileAddModalOpen(false);
                }}
                className="space-y-3 pt-1"
              >
                <div>
                  <label className="text-[10px] font-bold text-[#94a3b8] uppercase block mb-1">
                    Название дела / события:
                  </label>
                  <input
                    type="text"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="Например: Встреча, Врач, Тренировка..."
                    className="w-full bg-[#161720] border border-white/[0.08] rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-[#10b981]"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-[#94a3b8] uppercase block mb-1">
                      Время:
                    </label>
                    <input
                      type="time"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      className="w-full bg-[#161720] border border-white/[0.08] rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-[#10b981]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#94a3b8] uppercase block mb-1">
                      Сумма (₽, если есть):
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={eventAmount}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
                        setEventAmount(clean);
                      }}
                      placeholder="0"
                      className="w-full bg-[#161720] border border-white/[0.08] rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-[#10b981]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#94a3b8] uppercase block mb-1">
                    Категория:
                  </label>
                  <select
                    value={eventCategory}
                    onChange={(e) => setEventCategory(e.target.value as EventCategory)}
                    className="w-full bg-[#161720] border border-white/[0.08] rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-[#10b981]"
                  >
                    <option value="beauty">🌸 Личное / Красота</option>
                    <option value="health">💊 Здоровье / Спорт</option>
                    <option value="work">💼 Работа / Встречи</option>
                    <option value="shopping">🛒 Покупки / Расходы</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#10b981] to-[#059669] text-white font-bold text-xs shadow-lg shadow-emerald-500/25 active:scale-95 transition-all mt-2"
                >
                  Добавить событие в календарь
                </button>
              </form>
            )}

            {/* Tab 2: Shift Form */}
            {mobileAddTab === 'shift' && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-[10px] font-bold text-[#94a3b8] uppercase block mb-1.5">
                    1. Тип смены на {selectedDateStr}:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(Object.keys(SHIFT_TYPE_CONFIG) as ShiftType[]).map((type) => {
                      const cfg = SHIFT_TYPE_CONFIG[type];
                      const isCur = formType === type;
                      const IconComp = cfg.icon;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            setFormType(type);
                            if (type === 'full') setFormHours(shiftSettings.defaultFullHours);
                            if (type === 'day' || type === 'night') setFormHours(shiftSettings.defaultDayHours);
                            if (type === 'part') setFormHours(8);
                            if (type === 'off' || type === 'vacation') setFormHours(0);
                          }}
                          className={`p-2 rounded-xl border text-left flex flex-col justify-between gap-1 transition-all active:scale-95 ${
                            isCur
                              ? 'border-[#8b5cf6] bg-[#8b5cf6]/20 text-white shadow-md ring-1 ring-[#8b5cf6]'
                              : 'border-white/[0.08] bg-[#161720] text-[#94a3b8] hover:bg-white/[0.06] hover:text-white'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div
                              className="w-5 h-5 rounded-md flex items-center justify-center"
                              style={{ backgroundColor: `${cfg.color}20` }}
                            >
                              <IconComp size={12} color={cfg.color} />
                            </div>
                          </div>
                          <span className="text-[11px] font-bold truncate block">{cfg.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {formType !== 'off' && formType !== 'vacation' && (
                  <div className="space-y-2.5 pt-1">
                    {/* Hours */}
                    <div className="p-2.5 rounded-xl bg-[#161720] border border-white/[0.08] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-[#94a3b8] uppercase">
                          2. Длительность:
                        </label>
                        <div className="flex items-center gap-1.5 bg-[#111218] border border-white/[0.08] rounded-lg px-2 py-0.5">
                          <button
                            type="button"
                            onClick={() => setFormHours((h) => Math.max(1, h - 1))}
                            className="w-5 h-5 rounded bg-white/[0.06] text-white flex items-center justify-center font-bold text-xs active:scale-90"
                          >
                            -
                          </button>
                          <span className="font-mono text-xs font-bold text-[#38bdf8] px-1">
                            {formHours} ч
                          </span>
                          <button
                            type="button"
                            onClick={() => setFormHours((h) => Math.min(24, h + 1))}
                            className="w-5 h-5 rounded bg-white/[0.06] text-white flex items-center justify-center font-bold text-xs active:scale-90"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {[4, 8, 10, 12, 14, 24].map((h) => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => setFormHours(h)}
                            className={`flex-1 py-1 rounded-lg text-[10px] font-mono font-bold border transition-all ${
                              formHours === h
                                ? 'bg-[#38bdf8]/20 border-[#38bdf8] text-[#38bdf8]'
                                : 'bg-white/[0.04] border-white/[0.06] text-[#94a3b8]'
                            }`}
                          >
                            {h}ч
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Rate & Bonus */}
                    <div className="p-2.5 rounded-xl bg-[#161720] border border-white/[0.08] space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-[#94a3b8] uppercase">
                          3. Оплата:
                        </label>
                        <div className="flex items-center p-0.5 bg-[#111218] border border-white/[0.06] rounded-lg text-[9px]">
                          <button
                            type="button"
                            onClick={() => setFormRateType('hourly')}
                            className={`px-2 py-0.5 rounded font-bold transition-all ${
                              formRateType === 'hourly'
                                ? 'bg-[#8b5cf6] text-white'
                                : 'text-[#94a3b8]'
                            }`}
                          >
                            ₽/час
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormRateType('fixed')}
                            className={`px-2 py-0.5 rounded font-bold transition-all ${
                              formRateType === 'fixed'
                                ? 'bg-[#8b5cf6] text-white'
                                : 'text-[#94a3b8]'
                            }`}
                          >
                            ₽/смена
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] text-[#94a3b8] mb-0.5">
                            {formRateType === 'hourly' ? 'Ставка (₽/ч)' : 'Ставка (₽)'}
                          </label>
                          <input
                            type="number"
                            value={formRate}
                            onChange={(e) => setFormRate(Number(e.target.value))}
                            className="w-full bg-[#111218] border border-white/[0.08] rounded-lg p-1.5 text-white font-mono text-xs focus:outline-none focus:border-[#8b5cf6]"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-[#94a3b8] mb-0.5">
                            Бонус (₽)
                          </label>
                          <input
                            type="number"
                            value={formBonus}
                            onChange={(e) => setFormBonus(Number(e.target.value))}
                            placeholder="0"
                            className="w-full bg-[#111218] border border-white/[0.08] rounded-lg p-1.5 text-white font-mono text-xs focus:outline-none focus:border-[#8b5cf6]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Shift Expense */}
                    <div className="p-2.5 rounded-xl bg-[#161720] border border-white/[0.08] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[#f43f5e] font-bold uppercase flex items-center gap-1">
                          <Wallet size={11} />
                          <span>4. Расход за смену:</span>
                        </span>
                        <span className="font-mono text-xs text-[#f43f5e] font-bold">{formExpense} ₽</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[100, 200, 300, 500].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setFormExpense(amt)}
                            className={`flex-1 py-1 rounded-lg text-[10px] font-mono font-bold border transition-all ${
                              formExpense === amt
                                ? 'bg-[#f43f5e]/25 border-[#f43f5e] text-white'
                                : 'bg-white/[0.04] border-white/[0.06] text-[#cbd5e1]'
                            }`}
                          >
                            +{amt}
                          </button>
                        ))}
                        {formExpense > 0 && (
                          <button
                            type="button"
                            onClick={() => setFormExpense(0)}
                            className="py-1 px-2 rounded-lg bg-red-500/15 text-[#f43f5e] text-[10px] font-bold"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Live Calculation */}
                    <div className="p-2 rounded-xl bg-[#161824] border border-white/[0.08] flex items-center justify-between text-xs">
                      <span className="text-[#94a3b8] text-[10px]">На руках:</span>
                      <span className="font-black text-[#10b981] font-mono">
                        {(
                          (formRateType === 'hourly' ? formHours * formRate : formRate) +
                          formBonus -
                          formExpense
                        ).toLocaleString('ru-RU')}{' '}
                        ₽
                      </span>
                    </div>
                  </div>
                )}

                {/* Note */}
                <div>
                  <label className="block text-[9px] font-semibold text-[#94a3b8] mb-1">
                    Примечание:
                  </label>
                  <textarea
                    value={formNote}
                    onChange={(e) => setFormNote(e.target.value)}
                    placeholder="Заметки по смене..."
                    rows={2}
                    className="w-full bg-[#161720] border border-white/[0.08] rounded-xl p-2 text-white text-xs resize-none focus:outline-none focus:border-[#8b5cf6]"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      handleSaveSelectedShift();
                      setIsMobileAddModalOpen(false);
                    }}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#7c5cff] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 active:scale-95 transition-all"
                  >
                    <Save size={14} />
                    <span>Сохранить смену</span>
                  </button>

                  {selectedShift && (
                    <button
                      type="button"
                      onClick={() => {
                        deleteShift(selectedDateStr);
                        showToast('Смена удалена');
                        setIsMobileAddModalOpen(false);
                      }}
                      className="p-3 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-[#f43f5e] text-xs font-bold flex items-center justify-center transition-all active:scale-95"
                      title="Удалить смену"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Tab 3: Full Mobile-Optimized Cycle Generator */}
            {mobileAddTab === 'generator' && (
              <div className="space-y-3.5 pt-1">
                {/* 1. Cycle Presets */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#94a3b8] uppercase block">
                    1. Шаблон графика смен:
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {CYCLE_PRESET_TEMPLATES.map((preset) => {
                      const isSelected = selectedPresetId === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectPreset(preset)}
                          className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1 ${
                            isSelected
                              ? 'border-[#8b5cf6] bg-[#8b5cf6]/20 text-white ring-1 ring-[#8b5cf6]'
                              : 'border-white/[0.08] bg-[#161720] text-[#94a3b8] hover:text-white'
                          }`}
                        >
                          <span className="font-bold text-xs text-white block truncate">{preset.name}</span>
                          <span className="text-[9px] text-[#94a3b8] block truncate">{preset.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Sequence Pills */}
                <div className="p-2.5 bg-[#101117] border border-white/[0.08] rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-white flex items-center gap-1">
                      <Sliders size={12} className="text-[#8b5cf6]" />
                      <span>Цикл: {activeSequence.length} дн.</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveSequence([])}
                        className="text-[9px] text-[#f43f5e] hover:underline"
                      >
                        Очистить
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveSequence(['day', 'night', 'off', 'off'])}
                        className="text-[9px] text-[#8b5cf6] hover:underline"
                      >
                        1/1/2
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 min-h-[30px] p-1.5 bg-[#161720] rounded-lg border border-white/[0.06] items-center">
                    {activeSequence.length === 0 ? (
                      <span className="text-[11px] text-[#64748b] italic">Цикл пуст. Добавьте дни ниже.</span>
                    ) : (
                      activeSequence.map((type, idx) => {
                        const cfg = SHIFT_TYPE_CONFIG[type];
                        return (
                          <div
                            key={idx}
                            className="px-1.5 py-0.5 rounded border flex items-center gap-1 text-[10px] text-white"
                            style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}
                          >
                            <span>{idx + 1}. {cfg.shortLabel}</span>
                            <button
                              type="button"
                              onClick={() => setActiveSequence((prev) => prev.filter((_, i) => i !== idx))}
                              className="text-[#94a3b8] hover:text-white font-bold ml-0.5"
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Add Buttons */}
                  <div className="flex items-center gap-1 flex-wrap">
                    {(['day', 'night', 'full', 'off'] as const).map((t) => {
                      const cfg = SHIFT_TYPE_CONFIG[t];
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            setSelectedPresetId('custom');
                            setActiveSequence((prev) => [...prev, t]);
                          }}
                          className="px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.10] border border-white/[0.06] text-[10px] text-white flex items-center gap-1"
                        >
                          <cfg.icon size={10} color={cfg.color} />
                          <span>+{cfg.shortLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Generation Parameters: Start Date & Duration */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-[#94a3b8] uppercase block mb-1">
                      Старт графика:
                    </label>
                    <input
                      type="date"
                      value={genStartDate}
                      onChange={(e) => setGenStartDate(e.target.value)}
                      className="w-full bg-[#161720] border border-white/[0.08] rounded-xl p-2 text-white text-xs focus:outline-none focus:border-[#8b5cf6]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#94a3b8] uppercase block mb-1">
                      Период:
                    </label>
                    <select
                      value={genDaysCount}
                      onChange={(e) => setGenDaysCount(Number(e.target.value))}
                      className="w-full bg-[#161720] border border-white/[0.08] rounded-xl p-2 text-white text-xs focus:outline-none focus:border-[#8b5cf6]"
                    >
                      <option value={30}>1 месяц (30 дн.)</option>
                      <option value={60}>2 месяца (60 дн.)</option>
                      <option value={90}>Квартал (90 дн.)</option>
                      <option value={180}>Полгода (180 дн.)</option>
                      <option value={365}>1 год (365 дн.)</option>
                    </select>
                  </div>
                </div>

                {/* 4. Rates Without Leading Zero */}
                <div className="p-2.5 bg-[#161720] border border-white/[0.08] rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#94a3b8] uppercase">Ставка для графика:</span>
                    <div className="flex items-center p-0.5 bg-[#111218] rounded-lg text-[9px]">
                      <button
                        type="button"
                        onClick={() => setGenRateType('hourly')}
                        className={`px-2 py-0.5 rounded font-bold ${genRateType === 'hourly' ? 'bg-[#8b5cf6] text-white' : 'text-[#94a3b8]'}`}
                      >
                        ₽/час
                      </button>
                      <button
                        type="button"
                        onClick={() => setGenRateType('fixed')}
                        className={`px-2 py-0.5 rounded font-bold ${genRateType === 'fixed' ? 'bg-[#8b5cf6] text-white' : 'text-[#94a3b8]'}`}
                      >
                        ₽/смена
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={genRate === 0 ? '' : String(genRate)}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
                          setGenRate(clean === '' ? 0 : Number(clean));
                        }}
                        placeholder="Ставка ₽"
                        className="w-full bg-[#111218] border border-white/[0.08] rounded-lg p-1.5 text-white font-mono text-xs focus:outline-none focus:border-[#8b5cf6]"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={genDayHours === 0 ? '' : String(genDayHours)}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
                          setGenDayHours(clean === '' ? 0 : Number(clean));
                        }}
                        placeholder="Часов в смене (12)"
                        className="w-full bg-[#111218] border border-white/[0.08] rounded-lg p-1.5 text-white font-mono text-xs focus:outline-none focus:border-[#8b5cf6]"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Live Preview */}
                {generatorPreview && (
                  <div className="p-2.5 bg-[#161824] rounded-xl border border-white/[0.08] flex items-center justify-between text-xs">
                    <span className="text-[#94a3b8] text-[10px]">
                      {generatorPreview.workDays} смен · {generatorPreview.totalHours}ч
                    </span>
                    <span className="font-extrabold text-[#10b981] font-mono">
                      ~{generatorPreview.projectedEarnings.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      handleGenerateSchedule();
                      setIsMobileAddModalOpen(false);
                    }}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#7c5cff] text-white font-bold text-xs shadow-lg shadow-purple-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles size={14} />
                    <span>Сгенерировать график</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
                      shifts.filter((s) => s.date.startsWith(monthPrefix)).forEach((s) => deleteShift(s.date));
                      showToast('Все смены текущего месяца стерты');
                      setIsMobileAddModalOpen(false);
                    }}
                    className="p-3 rounded-xl bg-red-500/15 text-[#f43f5e] hover:bg-red-500/25 border border-red-500/30 text-xs font-bold transition-all active:scale-95"
                    title="Очистить смены за месяц"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
