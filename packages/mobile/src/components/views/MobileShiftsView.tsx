import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Clock,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { useMobileBrainStore } from '../../store/useMobileBrainStore';

export const MobileShiftsView: React.FC = () => {
  const {
    shifts,
    hourlyRate,
    nightBonusRate,
    setHourlyRate,
    setShift,
  } = useMobileBrainStore();

  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
  ];

  // Calculate monthly stats
  const monthShifts = shifts.filter((s) => s.date.startsWith(monthPrefix));
  const totalEarnings = monthShifts.reduce((acc, s) => acc + s.earnings, 0);
  const totalHours = monthShifts.reduce((acc, s) => acc + s.hours, 0);

  // Generate calendar days
  const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
  const startOffset = firstDay === 0 ? 6 : firstDay - 1; // Convert to Mon-Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = [];
  for (let i = 0; i < startOffset; i++) {
    days.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d);
  }

  const handleDayClick = (day: number) => {
    const dateStr = `${monthPrefix}-${String(day).padStart(2, '0')}`;
    const existing = shifts.find((s) => s.date === dateStr);

    // Cycle shift: none -> day (12h) -> night (12h) -> full24 (24h) -> off
    if (!existing) {
      setShift(dateStr, 'day', 12);
    } else if (existing.type === 'day') {
      setShift(dateStr, 'night', 12);
    } else if (existing.type === 'night') {
      setShift(dateStr, 'full24', 24);
    } else {
      setShift(dateStr, 'off', 0);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#0c0d12] p-3.5 space-y-4">
      {/* Month Selector & Earnings Card */}
      <div className="bg-gradient-to-tr from-[#8052ff]/25 via-[#14151e] to-[#ec4899]/20 border border-[#232533] p-4 rounded-3xl shadow-xl flex flex-col gap-3">
        {/* Month controls */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
            className="p-1.5 rounded-xl bg-white/[0.06] text-[#94a3b8] active:text-white"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-bold text-white tracking-wide">
            {monthNames[month]} {year}
          </span>
          <button
            onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
            className="p-1.5 rounded-xl bg-white/[0.06] text-[#94a3b8] active:text-white"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.08]">
          <div className="bg-[#0c0d12]/60 p-2.5 rounded-2xl border border-white/[0.05]">
            <span className="text-[10px] text-[#94a3b8] block">Заработок за месяц:</span>
            <span className="text-base font-extrabold text-[#10b981]">
              {totalEarnings.toLocaleString('ru-RU')} ₽
            </span>
          </div>
          <div className="bg-[#0c0d12]/60 p-2.5 rounded-2xl border border-white/[0.05]">
            <span className="text-[10px] text-[#94a3b8] block">Отработано часов:</span>
            <span className="text-base font-extrabold text-[#38bdf8]">
              {totalHours} ч ({monthShifts.length} смен)
            </span>
          </div>
        </div>
      </div>

      {/* Hourly Rate Settings Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#14151e] rounded-2xl border border-[#232533] text-xs">
        <span className="text-[#94a3b8]">Ставка за час (₽):</span>
        <input
          type="number"
          value={hourlyRate}
          onChange={(e) => setHourlyRate(Number(e.target.value) || 0)}
          className="w-20 text-right bg-[#0c0d12] border border-[#232533] px-2 py-1 rounded-lg text-white font-bold focus:outline-none focus:border-[#8052ff]"
        />
      </div>

      {/* Interactive Calendar Grid */}
      <div className="bg-[#14151e] border border-[#232533] rounded-3xl p-3.5 shadow-lg">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-[#64748b] mb-2">
          <span>ПН</span>
          <span>ВТ</span>
          <span>СР</span>
          <span>ЧТ</span>
          <span>ПТ</span>
          <span className="text-[#ec4899]">СБ</span>
          <span className="text-[#ec4899]">ВС</span>
        </div>

        {/* Calendar days cells */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="h-11" />;
            }

            const dateStr = `${monthPrefix}-${String(day).padStart(2, '0')}`;
            const shift = shifts.find((s) => s.date === dateStr);

            let bgClass = 'bg-[#0c0d12]/60 border-white/[0.04] text-[#cbd5e1]';
            let badge = null;

            if (shift) {
              if (shift.type === 'day') {
                bgClass = 'bg-[#f59e0b]/20 border-[#f59e0b]/50 text-white font-bold';
                badge = <Sun size={10} className="text-[#f59e0b]" />;
              } else if (shift.type === 'night') {
                bgClass = 'bg-[#8052ff]/25 border-[#8052ff]/50 text-white font-bold';
                badge = <Moon size={10} className="text-[#8052ff]" />;
              } else if (shift.type === 'full24') {
                bgClass = 'bg-[#ec4899]/25 border-[#ec4899]/50 text-white font-bold';
                badge = <Clock size={10} className="text-[#ec4899]" />;
              }
            }

            return (
              <button
                key={day}
                onClick={() => handleDayClick(day)}
                className={`h-11 rounded-xl border flex flex-col items-center justify-between p-1 transition-all active:scale-95 ${bgClass}`}
              >
                <span className="text-[11px] leading-none">{day}</span>
                {badge}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend & Instructions */}
      <div className="flex items-center justify-around text-[10px] text-[#64748b] pt-1">
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
          <span>День 12ч</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-full bg-[#8052ff]" />
          <span>Ночь 12ч (+20%)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ec4899]" />
          <span>Сутки 24ч</span>
        </div>
      </div>
    </div>
  );
};
