import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Table as TableIcon,
  Calculator,
  Columns,
  Rows,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export type CalcType = 'sum' | 'avg' | 'count' | 'min' | 'max' | 'none';

export interface ExcelTableData {
  headers: string[];
  rows: string[][];
  includeSum: boolean;
  calcTypes?: Record<number, CalcType>;
}

interface InteractiveExcelTableProps {
  initialData?: ExcelTableData;
  onSave?: (tableMarkdown: string) => void;
  onCancel?: () => void;
  isInline?: boolean;
}

export function tableDataToMarkdown(data: ExcelTableData): string {
  const { headers, rows, includeSum, calcTypes = {} } = data;
  if (!headers.length) return '';

  const headerLine = `| ${headers.join(' | ')} |`;
  const separatorLine = `| ${headers.map(() => '---').join(' | ')} |`;

  const rowLines = rows.map((row) => {
    const padded = headers.map((_, i) => (row[i] !== undefined ? row[i] : ''));
    return `| ${padded.join(' | ')} |`;
  });

  let sumLine = '';
  if (includeSum && rows.length > 0) {
    const colSums = headers.map((_, colIdx) => {
      if (colIdx === 0) return '**∑ ИТОГО**';

      const type = calcTypes[colIdx] || 'sum';
      if (type === 'none') return '—';

      const nums: number[] = [];
      let nonEmptyCount = 0;

      rows.forEach((r) => {
        const val = r[colIdx];
        if (val !== undefined && val.trim() !== '') {
          nonEmptyCount++;
          const num = Number(val.replace(/\s+/g, '').replace(/[^\d.-]/g, ''));
          if (!isNaN(num) && isFinite(num)) {
            nums.push(num);
          }
        }
      });

      if (type === 'count') {
        return `**# ${nonEmptyCount}**`;
      }

      if (nums.length === 0) return '—';

      if (type === 'sum') {
        const total = nums.reduce((a, b) => a + b, 0);
        return `**∑ ${total.toLocaleString('ru-RU')}**`;
      } else if (type === 'avg') {
        const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
        return `**Ø ${Math.round(avg * 100) / 100}**`;
      } else if (type === 'min') {
        return `**↓ ${Math.min(...nums).toLocaleString('ru-RU')}**`;
      } else if (type === 'max') {
        return `**↑ ${Math.max(...nums).toLocaleString('ru-RU')}**`;
      }

      return '—';
    });

    sumLine = `\n| ${colSums.join(' | ')} |`;
  }

  return `${headerLine}\n${separatorLine}\n${rowLines.join('\n')}${sumLine}\n`;
}

export function parseMarkdownToTableData(markdown: string): ExcelTableData | null {
  const lines = markdown.trim().split('\n').map((l) => l.trim()).filter((l) => l.startsWith('|') && l.endsWith('|'));
  if (lines.length < 2) return null;

  const extractCells = (line: string) =>
    line
      .slice(1, -1)
      .split('|')
      .map((c) => c.trim());

  const headers = extractCells(lines[0]!);
  const dataRows: string[][] = [];
  let includeSum = false;

  for (let i = 2; i < lines.length; i++) {
    const cells = extractCells(lines[i]!);
    if (cells[0]?.includes('∑ ИТОГО') || cells[0]?.includes('ИТОГО')) {
      includeSum = true;
    } else {
      dataRows.push(cells);
    }
  }

  return {
    headers,
    rows: dataRows.length > 0 ? dataRows : [['', '', ''], ['', '', '']],
    includeSum,
  };
}

export const InteractiveExcelTable: React.FC<InteractiveExcelTableProps> = ({
  initialData,
  onSave,
  onCancel,
  isInline = false,
}) => {
  const [data, setData] = useState<ExcelTableData>(() => {
    return (
      initialData || {
        headers: ['Наименование', 'Количество', 'Цена (₽)'],
        rows: [
          ['Товар 1', '10', '1500'],
          ['Товар 2', '5', '3000'],
        ],
        includeSum: true,
        calcTypes: { 1: 'sum', 2: 'sum' },
      }
    );
  });

  const [activeCalcMenuCol, setActiveCalcMenuCol] = useState<number | null>(null);

  // Calculate live column totals according to each column's calculation type
  const columnCalculations = React.useMemo(() => {
    return data.headers.map((_, colIdx) => {
      const type = data.calcTypes?.[colIdx] || 'sum';
      const nums: number[] = [];
      let count = 0;

      data.rows.forEach((r) => {
        const raw = r[colIdx];
        if (raw && raw.trim()) {
          count++;
          const num = Number(raw.replace(/\s+/g, '').replace(/[^\d.-]/g, ''));
          if (!isNaN(num) && isFinite(num)) {
            nums.push(num);
          }
        }
      });

      if (type === 'none') return { label: '—', type };
      if (type === 'count') return { label: `# ${count}`, type };
      if (nums.length === 0) return { label: '—', type };

      if (type === 'sum') {
        const total = nums.reduce((a, b) => a + b, 0);
        return { label: `∑ ${total.toLocaleString('ru-RU')}`, type };
      } else if (type === 'avg') {
        const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
        return { label: `Ø ${Math.round(avg * 10) / 10}`, type };
      } else if (type === 'min') {
        return { label: `↓ ${Math.min(...nums).toLocaleString('ru-RU')}`, type };
      } else if (type === 'max') {
        return { label: `↑ ${Math.max(...nums).toLocaleString('ru-RU')}`, type };
      }

      return { label: '—', type };
    });
  }, [data]);

  const handleSetCalcType = (colIdx: number, type: CalcType) => {
    setData((prev) => ({
      ...prev,
      includeSum: true,
      calcTypes: {
        ...(prev.calcTypes || {}),
        [colIdx]: type,
      },
    }));
    setActiveCalcMenuCol(null);
  };

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const nextRows = data.rows.map((row, rIdx) => {
      if (rIdx !== rowIndex) return row;
      const nextRow = [...row];
      nextRow[colIndex] = value;
      return nextRow;
    });
    setData((prev) => ({ ...prev, rows: nextRows }));
  };

  const handleHeaderChange = (colIndex: number, value: string) => {
    const nextHeaders = [...data.headers];
    nextHeaders[colIndex] = value;
    setData((prev) => ({ ...prev, headers: nextHeaders }));
  };

  const handleAddRow = () => {
    const newRow = data.headers.map(() => '');
    setData((prev) => ({ ...prev, rows: [...prev.rows, newRow] }));
  };

  const handleAddColumn = () => {
    const newColName = `Столбец ${data.headers.length + 1}`;
    const nextHeaders = [...data.headers, newColName];
    const nextRows = data.rows.map((r) => [...r, '']);
    setData({
      ...data,
      headers: nextHeaders,
      rows: nextRows,
      calcTypes: { ...(data.calcTypes || {}), [data.headers.length]: 'sum' },
    });
  };

  const handleDeleteRow = (rowIndex: number) => {
    if (data.rows.length <= 1) return;
    const nextRows = data.rows.filter((_, idx) => idx !== rowIndex);
    setData((prev) => ({ ...prev, rows: nextRows }));
  };

  const handleDeleteColumn = (colIndex: number) => {
    if (data.headers.length <= 1) return;
    const nextHeaders = data.headers.filter((_, idx) => idx !== colIndex);
    const nextRows = data.rows.map((r) => r.filter((_, idx) => idx !== colIndex));
    setData({
      ...data,
      headers: nextHeaders,
      rows: nextRows,
    });
  };

  const handleSave = () => {
    const md = tableDataToMarkdown(data);
    onSave?.(md);
  };

  return (
    <div
      className="bg-[#14151c] border border-white/[0.12] rounded-3xl p-5 shadow-2xl space-y-4 select-none text-xs text-[#e2e8f0]"
      onClick={() => setActiveCalcMenuCol(null)}
    >
      {/* Table Toolbar */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/[0.08] flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#10b981]/20 to-[#38bdf8]/10 border border-[#10b981]/30 text-[#10b981] flex items-center justify-center shadow-lg shadow-[#10b981]/10">
            <Calculator size={17} />
          </div>
          <div>
            <h4 className="font-extrabold text-white text-xs">Интерактивная таблица с авто-подсчётом</h4>
            <p className="text-[10px] text-[#94a3b8]">Нажмите на ячейку итогов снизу, чтобы выбрать формулу (Сумма, Среднее, Кол-во)</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleAddRow}
            className="px-3 py-1.5 rounded-xl bg-white/[0.06] text-white hover:bg-white/[0.12] flex items-center gap-1.5 font-semibold transition-all shadow-sm"
          >
            <Rows size={13} className="text-[#38bdf8]" />
            <span>+ Строка</span>
          </button>

          <button
            onClick={handleAddColumn}
            className="px-3 py-1.5 rounded-xl bg-white/[0.06] text-white hover:bg-white/[0.12] flex items-center gap-1.5 font-semibold transition-all shadow-sm"
          >
            <Columns size={13} className="text-[#7c5cff]" />
            <span>+ Столбец</span>
          </button>

          <button
            onClick={() => setData((prev) => ({ ...prev, includeSum: !prev.includeSum }))}
            className={`px-3 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm ${
              data.includeSum
                ? 'bg-[#10b981]/20 border-[#10b981]/50 text-[#10b981]'
                : 'bg-white/[0.04] border-white/[0.08] text-[#94a3b8] hover:text-white'
            }`}
          >
            <Calculator size={13} />
            <span>∑ Строка итогов {data.includeSum ? '(ВКЛ)' : '(ВЫКЛ)'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Table Grid */}
      <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#0c0d12] shadow-inner">
        <table className="w-full text-left border-collapse text-xs">
          {/* Column Headers */}
          <thead>
            <tr className="bg-[#171822] border-b border-white/[0.08]">
              <th className="w-12 p-3 text-center text-[#64748b] font-bold border-r border-white/[0.06]">#</th>
              {data.headers.map((header, colIdx) => (
                <th key={colIdx} className="p-2.5 border-r border-white/[0.06] last:border-r-0 relative group min-w-[130px]">
                  <div className="flex items-center justify-between gap-1">
                    <input
                      type="text"
                      value={header}
                      onChange={(e) => handleHeaderChange(colIdx, e.target.value)}
                      placeholder={`Столбец ${colIdx + 1}`}
                      className="bg-transparent font-bold text-white placeholder:text-[#64748b] focus:outline-none focus:bg-white/[0.06] rounded px-1.5 py-0.5 w-full text-xs"
                    />
                    {data.headers.length > 1 && (
                      <button
                        onClick={() => handleDeleteColumn(colIdx)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-[#94a3b8] hover:text-[#f43f5e] transition-opacity rounded"
                        title="Удалить столбец"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Data Rows */}
          <tbody>
            {data.rows.map((row, rowIdx) => (
              <tr key={rowIdx} className="border-b border-white/[0.04] hover:bg-white/[0.02] group">
                <td className="p-2 text-center text-[#64748b] font-mono font-bold border-r border-white/[0.06] select-none bg-white/[0.01]">
                  <div className="flex items-center justify-center gap-1">
                    <span>{rowIdx + 1}</span>
                    {data.rows.length > 1 && (
                      <button
                        onClick={() => handleDeleteRow(rowIdx)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-[#94a3b8] hover:text-[#f43f5e] transition-opacity"
                        title="Удалить строку"
                      >
                        <Trash2 size={10} />
                      </button>
                    )}
                  </div>
                </td>
                {data.headers.map((_, colIdx) => (
                  <td key={colIdx} className="p-1 border-r border-white/[0.04] last:border-r-0">
                    <input
                      type="text"
                      value={row[colIdx] || ''}
                      onChange={(e) => handleCellChange(rowIdx, colIdx, e.target.value)}
                      placeholder="..."
                      className="w-full bg-transparent p-2 text-white focus:outline-none focus:bg-[#7c5cff]/15 rounded-lg font-mono text-xs transition-colors"
                    />
                  </td>
                ))}
              </tr>
            ))}

            {/* Footer Summary Row with Live Calculation Selector */}
            {data.includeSum && (
              <tr className="bg-[#181a26] font-bold border-t-2 border-[#10b981]/40">
                <td className="p-3 text-center text-[#10b981] border-r border-white/[0.08] select-none">
                  <Calculator size={14} className="mx-auto" />
                </td>

                {data.headers.map((_, colIdx) => {
                  const calc = columnCalculations[colIdx] || { label: '—', type: 'sum' };
                  const isMenuOpen = activeCalcMenuCol === colIdx;

                  return (
                    <td
                      key={colIdx}
                      className="p-2 border-r border-white/[0.06] last:border-r-0 relative"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setActiveCalcMenuCol(isMenuOpen ? null : colIdx)}
                        className={`w-full py-1.5 px-2 rounded-lg text-left font-mono font-bold flex items-center justify-between transition-all border ${
                          calc.label !== '—'
                            ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30 hover:border-[#10b981]/60'
                            : 'bg-white/[0.03] text-[#94a3b8] border-white/[0.06] hover:text-white'
                        }`}
                        title="Нажмите, чтобы настроить подсчёт"
                      >
                        <span className="truncate">{calc.label}</span>
                        <span className="text-[10px] text-[#94a3b8] uppercase font-sans font-normal ml-1">
                          ▾
                        </span>
                      </button>

                      {/* Calculation Type Dropdown Menu */}
                      {isMenuOpen && (
                        <div className="absolute left-2 top-11 z-50 w-44 bg-[#1b1c28] border border-white/[0.14] rounded-xl shadow-2xl p-1 space-y-0.5 animate-scale-up">
                          <div className="px-2 py-1 text-[10px] font-bold text-[#94a3b8] uppercase border-b border-white/[0.06]">
                            Тип подсчёта:
                          </div>

                          {[
                            { id: 'sum', label: '∑ Сумма (SUM)', desc: 'Сложить все числа' },
                            { id: 'avg', label: 'Ø Среднее (AVG)', desc: 'Среднее значение' },
                            { id: 'count', label: '# Количество (COUNT)', desc: 'Число строк' },
                            { id: 'min', label: '↓ Минимум (MIN)', desc: 'Минимальное число' },
                            { id: 'max', label: '↑ Максимум (MAX)', desc: 'Максимальное число' },
                            { id: 'none', label: '— Без подсчёта', desc: 'Отключить расчет' },
                          ].map((item) => (
                            <button
                              key={item.id}
                              onClick={() => handleSetCalcType(colIdx, item.id as CalcType)}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-medium flex items-center justify-between hover:bg-white/[0.08] transition-colors ${
                                calc.type === item.id ? 'text-[#10b981] font-bold bg-[#10b981]/10' : 'text-[#cbd5e1]'
                              }`}
                            >
                              <span>{item.label}</span>
                              {calc.type === item.id && <Check size={12} className="text-[#10b981]" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-[#64748b]">
          💡 Вводите числа (например: 1500, 20.5) для автоматического подсчета
        </span>

        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-3.5 py-2 rounded-xl bg-white/[0.06] text-[#94a3b8] hover:text-white text-xs font-semibold transition-colors"
            >
              Отмена
            </button>
          )}
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Check size={14} className="stroke-[2.5]" />
            <span>Вставить таблицу в заметку</span>
          </button>
        </div>
      </div>
    </div>
  );
};
