import React, { useState } from 'react';
import {
  Target,
  PiggyBank,
  TrendingUp,
  Plus,
  Trash2,
  DollarSign,
  Landmark,
} from 'lucide-react';
import { useMobileBrainStore } from '../../store/useMobileBrainStore';

export const MobileFinanceView: React.FC = () => {
  const {
    savingsGoals,
    bankDeposits,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    addBankDeposit,
    deleteBankDeposit,
  } = useMobileBrainStore();

  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');

  // Calculate total monthly interest from bank deposits
  const totalMonthlyInterest = bankDeposits.reduce((sum, d) => {
    const annual = (d.principal * d.interestRate) / 100;
    return sum + Math.round(annual / 12);
  }, 0);

  const totalCapital = bankDeposits.reduce((sum, d) => sum + d.principal, 0);

  const handleAddGoal = () => {
    const target = Number(newGoalTarget);
    if (!newGoalTitle.trim() || !target || target <= 0) return;
    addSavingsGoal(newGoalTitle.trim(), target);
    setNewGoalTitle('');
    setNewGoalTarget('');
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#0c0d12] p-3.5 space-y-4">
      {/* Passive Income Summary Banner */}
      <div className="bg-gradient-to-tr from-[#10b981]/25 via-[#14151e] to-[#38bdf8]/20 border border-[#232533] p-4 rounded-3xl shadow-xl flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#94a3b8] flex items-center gap-1.5">
            <Landmark size={15} className="text-[#10b981]" />
            <span>Пассивный доход по вкладам:</span>
          </span>
          <span className="text-base font-extrabold text-[#10b981]">
            +{totalMonthlyInterest.toLocaleString('ru-RU')} ₽ / мес
          </span>
        </div>
        <div className="text-[11px] text-[#64748b]">
          Общий капитал на вкладах: <b className="text-white">{totalCapital.toLocaleString('ru-RU')} ₽</b>
        </div>
      </div>

      {/* Savings Goals Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <PiggyBank size={15} className="text-[#8052ff]" />
            <span>Цели накоплений</span>
          </h3>
        </div>

        {/* Quick Add Goal */}
        <div className="bg-[#14151e] border border-[#232533] p-3 rounded-2xl flex flex-col gap-2">
          <input
            type="text"
            value={newGoalTitle}
            onChange={(e) => setNewGoalTitle(e.target.value)}
            placeholder="Название цели (например, Ремонт)..."
            className="w-full py-1.5 px-2.5 rounded-xl bg-[#0c0d12] border border-[#232533] text-xs text-white placeholder:text-[#64748b] focus:outline-none focus:border-[#8052ff]"
          />
          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={newGoalTarget}
              onChange={(e) => {
                const clean = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
                setNewGoalTarget(clean);
              }}
              placeholder="Сумма цели (₽)..."
              className="flex-1 py-1.5 px-2.5 rounded-xl bg-[#0c0d12] border border-[#232533] text-xs text-white placeholder:text-[#64748b] focus:outline-none focus:border-[#8052ff]"
            />
            <button
              onClick={handleAddGoal}
              className="py-1.5 px-3 rounded-xl bg-[#8052ff] text-white font-semibold text-xs shrink-0 active:scale-95 shadow-md"
            >
              + Добавить
            </button>
          </div>
        </div>

        {/* Goals List */}
        <div className="space-y-2.5">
          {savingsGoals.map((goal) => {
            const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) || 0;
            return (
              <div
                key={goal.id}
                className="bg-[#14151e] border border-[#232533] p-3.5 rounded-2xl space-y-2.5 shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white truncate mr-2">{goal.title}</span>
                  <button
                    onClick={() => deleteSavingsGoal(goal.id)}
                    className="p-1 rounded-md text-[#64748b] hover:text-[#ff4757] active:bg-white/[0.08]"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-[#0c0d12] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: goal.color || '#8052ff',
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#94a3b8]">
                    {goal.currentAmount.toLocaleString('ru-RU')} / {goal.targetAmount.toLocaleString('ru-RU')} ₽
                  </span>
                  <span className="font-bold text-white">{percent}%</span>
                </div>

                {/* Quick Add money buttons */}
                <div className="flex items-center gap-1.5 pt-1">
                  {[1000, 5000, 10000].map((step) => (
                    <button
                      key={step}
                      onClick={() => updateSavingsGoal(goal.id, goal.currentAmount + step)}
                      className="flex-1 py-1 rounded-lg bg-white/[0.04] text-[10px] font-bold text-[#8052ff] active:bg-[#8052ff]/20"
                    >
                      +{step.toLocaleString('ru-RU')} ₽
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
