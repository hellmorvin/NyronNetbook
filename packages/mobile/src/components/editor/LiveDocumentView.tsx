import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Table as TableIcon,
  Sparkles,
  Info,
  AlertTriangle,
  Flame,
  CheckSquare,
  Plus,
  Trash2,
  Columns,
  Rows,
  Calculator,
  ListOrdered,
  List,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Type,
} from 'lucide-react';

export interface DocumentBlock {
  id: string;
  type: 'heading' | 'callout' | 'table' | 'task' | 'list' | 'numbered' | 'quote' | 'paragraph';
  level?: 1 | 2 | 3 | 4;
  calloutType?: 'tip' | 'info' | 'warning' | 'danger';
  title?: string;
  content?: string;
  num?: number;
  lines?: string[];
  tableHeaders?: string[];
  tableRows?: string[][];
  tableIncludeSum?: boolean;
  checked?: boolean;
}

interface LiveDocumentViewProps {
  content: string;
  onChange: (newContent: string) => void;
  onOpenWikiLink?: (title: string) => void;
  fontFamily?: string;
  fontSize?: number;
}

// Convert any corrupted HTML strings into clean Markdown / Plain Text
export function htmlToCleanMarkdown(input: string): string {
  if (!input) return '';
  if (!input.includes('<') && !input.includes('>')) return input;

  let text = input;

  // Replace line breaks and headers
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n');
  text = text.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n');
  text = text.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n');
  text = text.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n');
  text = text.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n');
  text = text.replace(/<div[^>]*>(.*?)<\/div>/gi, '$1\n');
  text = text.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  text = text.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  text = text.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  text = text.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
  text = text.replace(/<u[^>]*>(.*?)<\/u>/gi, '$1');
  text = text.replace(/<mark[^>]*>(.*?)<\/mark>/gi, '==$1==');
  text = text.replace(/<span[^>]*>(.*?)<\/span>/gi, '$1');
  text = text.replace(/<font[^>]*>(.*?)<\/font>/gi, '$1');

  // Strip any remaining raw HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Clean redundant newlines
  text = text.replace(/\n{3,}/g, '\n\n').trim();

  return text;
}

// Parse markdown string into structured visual blocks
export function parseMarkdownToBlocks(markdown: string): DocumentBlock[] {
  if (!markdown || !markdown.trim()) {
    return [{ id: `block_p_0`, type: 'paragraph', content: '' }];
  }

  // First sanitize any raw HTML tags into clean Markdown
  const cleanedMarkdown = htmlToCleanMarkdown(markdown);
  const rawLines = cleanedMarkdown.split('\n');
  const blocks: DocumentBlock[] = [];
  let blockIdCounter = 0;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i]!;

    // 1. Table Block: consecutive lines with '|'
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableLines: string[] = [];
      let t = i;
      while (t < rawLines.length && rawLines[t]?.trim().startsWith('|') && rawLines[t]?.trim().endsWith('|')) {
        tableLines.push(rawLines[t]!.trim());
        t++;
      }
      i = t - 1;

      if (tableLines.length >= 2) {
        const extractCells = (l: string) =>
          l
            .slice(1, -1)
            .split('|')
            .map((c) => c.trim());

        const headers = extractCells(tableLines[0]!);
        const dataRows: string[][] = [];
        let includeSum = false;

        // Skip line 1 (the separator |---|---|)
        for (let r = 2; r < tableLines.length; r++) {
          const cells = extractCells(tableLines[r]!);
          if (cells[0]?.includes('∑ ИТОГО') || cells[0]?.includes('ИТОГО')) {
            includeSum = true;
          } else {
            dataRows.push(cells);
          }
        }

        blocks.push({
          id: `block_tbl_${blockIdCounter++}`,
          type: 'table',
          tableHeaders: headers.length > 0 ? headers : ['', '', ''],
          tableRows: dataRows.length > 0 ? dataRows : [['', '', ''], ['', '', '']],
          tableIncludeSum: includeSum,
        });
        continue;
      }
    }

    // 2. Callout Block: > [!type] Title
    const calloutMatch = /^>\s*\[!([a-zA-Z]+)\]\s*(.*)$/.exec(line);
    if (calloutMatch) {
      const cType = (calloutMatch[1]?.toLowerCase() as any) || 'tip';
      const title = calloutMatch[2]?.trim() || 'Важная мысль';
      const calloutLines: string[] = [];

      let j = i + 1;
      while (j < rawLines.length && rawLines[j]?.startsWith('>')) {
        calloutLines.push(rawLines[j]!.replace(/^>\s?/, ''));
        j++;
      }
      i = j - 1;

      blocks.push({
        id: `block_callout_${blockIdCounter++}`,
        type: 'callout',
        calloutType: ['tip', 'info', 'warning', 'danger'].includes(cType) ? cType : 'tip',
        title,
        lines: calloutLines.length > 0 ? calloutLines : [''],
      });
      continue;
    }

    // 3. Headings: #, ##, ###, ####
    if (line.startsWith('# ')) {
      blocks.push({
        id: `block_h1_${blockIdCounter++}`,
        type: 'heading',
        level: 1,
        content: line.slice(2),
      });
      continue;
    }
    if (line.startsWith('## ')) {
      blocks.push({
        id: `block_h2_${blockIdCounter++}`,
        type: 'heading',
        level: 2,
        content: line.slice(3),
      });
      continue;
    }
    if (line.startsWith('### ')) {
      blocks.push({
        id: `block_h3_${blockIdCounter++}`,
        type: 'heading',
        level: 3,
        content: line.slice(4),
      });
      continue;
    }
    if (line.startsWith('#### ')) {
      blocks.push({
        id: `block_h4_${blockIdCounter++}`,
        type: 'heading',
        level: 4,
        content: line.slice(5),
      });
      continue;
    }

    // 4. Task Checkboxes: - [ ] or - [x]
    const taskMatch = /^(\s*-\s*\[)([ xX])(\]\s*)(.*)$/.exec(line);
    if (taskMatch) {
      blocks.push({
        id: `block_task_${blockIdCounter++}`,
        type: 'task',
        checked: taskMatch[2]?.toLowerCase() === 'x',
        content: taskMatch[4] || '',
      });
      continue;
    }

    // 5. Numbered List item: 1. or 2.
    const numMatch = /^(\s*(\d+)[\.\)]\s+)(.*)$/.exec(line);
    if (numMatch) {
      blocks.push({
        id: `block_num_${blockIdCounter++}`,
        type: 'numbered',
        num: Number(numMatch[2]) || 1,
        content: numMatch[3] || '',
      });
      continue;
    }

    // 6. Bullet List item: - or *
    if (line.startsWith('- ') || line.startsWith('* ')) {
      blocks.push({
        id: `block_list_${blockIdCounter++}`,
        type: 'list',
        content: line.slice(2),
      });
      continue;
    }

    // 7. Blockquote
    if (line.startsWith('> ')) {
      blocks.push({
        id: `block_quote_${blockIdCounter++}`,
        type: 'quote',
        content: line.slice(2),
      });
      continue;
    }

    // 8. Standard Paragraph
    blocks.push({
      id: `block_p_${blockIdCounter++}`,
      type: 'paragraph',
      content: line,
    });
  }

  return blocks.length > 0 ? blocks : [{ id: `block_p_0`, type: 'paragraph', content: '' }];
}

// Convert blocks back to clean Markdown
export function blocksToMarkdown(blocks: DocumentBlock[]): string {
  const lines: string[] = [];

  blocks.forEach((block) => {
    switch (block.type) {
      case 'heading': {
        const lvl = block.level || 2;
        const prefix = lvl === 1 ? '# ' : lvl === 2 ? '## ' : lvl === 3 ? '### ' : '#### ';
        lines.push(`${prefix}${block.content || ''}`);
        break;
      }
      case 'callout': {
        const type = block.calloutType || 'tip';
        lines.push(`> [!${type}] ${block.title || ''}`);
        (block.lines || []).forEach((cl) => {
          lines.push(`> ${cl}`);
        });
        break;
      }
      case 'table': {
        const headers = block.tableHeaders || ['', '', ''];
        const rows = block.tableRows || [];
        lines.push(`| ${headers.join(' | ')} |`);
        lines.push(`| ${headers.map(() => '---').join(' | ')} |`);
        rows.forEach((r) => {
          const padded = headers.map((_, idx) => r[idx] || '');
          lines.push(`| ${padded.join(' | ')} |`);
        });
        if (block.tableIncludeSum && rows.length > 0) {
          const colSums = headers.map((_, colIdx) => {
            let isNum = false;
            let sum = 0;
            rows.forEach((r) => {
              const val = r[colIdx];
              if (val && val.trim()) {
                const num = Number(val.replace(/\s+/g, '').replace(/[^\d.-]/g, ''));
                if (!isNaN(num) && isFinite(num) && num !== 0) {
                  isNum = true;
                  sum += num;
                }
              }
            });
            if (colIdx === 0) return '**∑ ИТОГО**';
            if (isNum && sum > 0) return `**${sum.toLocaleString('ru-RU')}**`;
            return '—';
          });
          lines.push(`| ${colSums.join(' | ')} |`);
        }
        break;
      }
      case 'task': {
        const box = block.checked ? '[x]' : '[ ]';
        lines.push(`- ${box} ${block.content || ''}`);
        break;
      }
      case 'numbered': {
        const n = block.num || 1;
        lines.push(`${n}. ${block.content || ''}`);
        break;
      }
      case 'list': {
        lines.push(`- ${block.content || ''}`);
        break;
      }
      case 'quote': {
        lines.push(`> ${block.content || ''}`);
        break;
      }
      case 'paragraph': {
        lines.push(block.content || '');
        break;
      }
    }
  });

  return lines.join('\n');
}

export const LiveDocumentView: React.FC<LiveDocumentViewProps> = ({
  content,
  onChange,
  fontFamily = 'system-ui, -apple-system, sans-serif',
  fontSize = 14,
}) => {
  const blocks = useMemo(() => parseMarkdownToBlocks(content), [content]);

  const handleUpdateBlock = useCallback(
    (blockId: string, updates: Partial<DocumentBlock>) => {
      const nextBlocks = blocks.map((b) => (b.id === blockId ? { ...b, ...updates } : b));
      onChange(blocksToMarkdown(nextBlocks));
    },
    [blocks, onChange]
  );

  const handleDeleteBlock = useCallback(
    (blockId: string) => {
      const nextBlocks = blocks.filter((b) => b.id !== blockId);
      onChange(blocksToMarkdown(nextBlocks.length > 0 ? nextBlocks : [{ id: 'block_p_0', type: 'paragraph', content: '' }]));
    },
    [blocks, onChange]
  );

  const handleAddBlockBelow = useCallback(
    (afterBlockId?: string, newType: DocumentBlock['type'] = 'paragraph', extraParams?: Partial<DocumentBlock>) => {
      const newBlock: DocumentBlock =
        newType === 'table'
          ? {
              id: `block_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              type: 'table',
              tableHeaders: ['', '', ''],
              tableRows: [
                ['', '', ''],
                ['', '', ''],
              ],
              tableIncludeSum: false,
            }
          : newType === 'callout'
          ? {
              id: `block_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              type: 'callout',
              calloutType: 'tip',
              title: 'Важный вывод',
              lines: [''],
            }
          : newType === 'heading'
          ? {
              id: `block_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              type: 'heading',
              level: extraParams?.level || 2,
              content: '',
            }
          : newType === 'numbered'
          ? {
              id: `block_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              type: 'numbered',
              num: extraParams?.num || 1,
              content: '',
            }
          : newType === 'task'
          ? {
              id: `block_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              type: 'task',
              checked: false,
              content: '',
            }
          : newType === 'list'
          ? {
              id: `block_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              type: 'list',
              content: '',
            }
          : {
              id: `block_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              type: 'paragraph',
              content: '',
            };

      if (!afterBlockId) {
        onChange(blocksToMarkdown([...blocks, newBlock]));
        return;
      }

      const idx = blocks.findIndex((b) => b.id === afterBlockId);
      const nextBlocks = [...blocks];
      nextBlocks.splice(idx + 1, 0, newBlock);
      onChange(blocksToMarkdown(nextBlocks));
    },
    [blocks, onChange]
  );

  return (
    <div className="space-y-4 select-text pb-16" style={{ fontFamily, fontSize: `${fontSize}px` }}>
      {blocks.map((block) => {
        // ================= 1. RENDER CALLOUT CARD =================
        if (block.type === 'callout') {
          const type = block.calloutType || 'tip';
          let borderCol = '#f59e0b';
          let bgGradient = 'from-[#f59e0b]/15 to-[#f59e0b]/5';
          let icon = <Sparkles size={16} className="text-[#f59e0b]" />;

          if (type === 'info') {
            borderCol = '#38bdf8';
            bgGradient = 'from-[#38bdf8]/15 to-[#38bdf8]/5';
            icon = <Info size={16} className="text-[#38bdf8]" />;
          } else if (type === 'warning') {
            borderCol = '#f97316';
            bgGradient = 'from-[#f97316]/15 to-[#f97316]/5';
            icon = <AlertTriangle size={16} className="text-[#f97316]" />;
          } else if (type === 'danger') {
            borderCol = '#f43f5e';
            bgGradient = 'from-[#f43f5e]/15 to-[#f43f5e]/5';
            icon = <Flame size={16} className="text-[#f43f5e]" />;
          }

          return (
            <div
              key={block.id}
              className={`p-4 rounded-2xl bg-gradient-to-br ${bgGradient} border border-white/[0.1] shadow-xl relative group transition-all`}
              style={{ borderLeft: `4px solid ${borderCol}` }}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  {icon}
                  <input
                    type="text"
                    value={block.title || ''}
                    onChange={(e) => handleUpdateBlock(block.id, { title: e.target.value })}
                    className="bg-transparent font-bold text-sm text-white focus:outline-none focus:bg-white/[0.06] rounded px-1.5 py-0.5"
                    placeholder="Заголовок подсказки..."
                  />
                </div>

                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                  <select
                    value={block.calloutType || 'tip'}
                    onChange={(e) => handleUpdateBlock(block.id, { calloutType: e.target.value as any })}
                    className="bg-[#14151c] text-[10px] text-white border border-white/20 rounded px-1.5 py-0.5 focus:outline-none"
                  >
                    <option value="tip">Подсказка (Tip)</option>
                    <option value="info">Информация (Info)</option>
                    <option value="warning">Предупреждение (Warning)</option>
                    <option value="danger">Важно (Danger)</option>
                  </select>
                  <button
                    onClick={() => handleDeleteBlock(block.id)}
                    className="p-1 rounded text-[#94a3b8] hover:text-[#f43f5e] hover:bg-white/[0.08]"
                    title="Удалить блок"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Callout Body lines */}
              <div className="space-y-1 pl-6">
                {(block.lines || []).map((line, lIdx) => (
                  <input
                    key={lIdx}
                    type="text"
                    value={line}
                    onChange={(e) => {
                      const nextLines = [...(block.lines || [])];
                      nextLines[lIdx] = e.target.value;
                      handleUpdateBlock(block.id, { lines: nextLines });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const nextLines = [...(block.lines || [])];
                        nextLines.splice(lIdx + 1, 0, '');
                        handleUpdateBlock(block.id, { lines: nextLines });
                      } else if (e.key === 'Backspace' && line === '' && (block.lines?.length || 0) > 1) {
                        e.preventDefault();
                        const nextLines = block.lines!.filter((_, idx) => idx !== lIdx);
                        handleUpdateBlock(block.id, { lines: nextLines });
                      }
                    }}
                    placeholder="Текст..."
                    className="w-full bg-transparent text-xs text-[#e2e8f0] focus:outline-none focus:bg-white/[0.06] rounded px-1 py-0.5"
                  />
                ))}
              </div>
            </div>
          );
        }

        // ================= 2. RENDER CLEAN INTERACTIVE TABLE =================
        if (block.type === 'table') {
          const headers = block.tableHeaders || ['', '', ''];
          const rows = block.tableRows || [];

          // Column sums calculation
          const colSums = headers.map((_, colIdx) => {
            let isNum = false;
            let sum = 0;
            rows.forEach((r) => {
              const val = r[colIdx];
              if (val && val.trim()) {
                const num = Number(val.replace(/\s+/g, '').replace(/[^\d.-]/g, ''));
                if (!isNaN(num) && isFinite(num) && num !== 0) {
                  isNum = true;
                  sum += num;
                }
              }
            });
            return { isNum, sum };
          });

          return (
            <div
              key={block.id}
              className="p-3.5 rounded-2xl bg-[#13141c] border border-white/[0.1] shadow-2xl space-y-3 relative group"
            >
              {/* Header Toolbar */}
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/[0.08] flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#10b981]/15 text-[#10b981] flex items-center justify-center">
                    <TableIcon size={14} />
                  </div>
                  <span className="font-bold text-white text-xs">Таблица</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      const newRow = headers.map(() => '');
                      handleUpdateBlock(block.id, { tableRows: [...rows, newRow] });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.06] text-white hover:bg-white/[0.12] text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    <Rows size={12} className="text-[#38bdf8]" />
                    <span>+ Строка</span>
                  </button>

                  <button
                    onClick={() => {
                      const nextHeaders = [...headers, ''];
                      const nextRows = rows.map((r) => [...r, '']);
                      handleUpdateBlock(block.id, { tableHeaders: nextHeaders, tableRows: nextRows });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.06] text-white hover:bg-white/[0.12] text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    <Columns size={12} className="text-[#7c5cff]" />
                    <span>+ Столбец</span>
                  </button>

                  <label className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30 cursor-pointer text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={block.tableIncludeSum}
                      onChange={(e) => handleUpdateBlock(block.id, { tableIncludeSum: e.target.checked })}
                      className="w-3.5 h-3.5 rounded accent-[#10b981]"
                    />
                    <span>∑ ИТОГО</span>
                  </label>

                  <button
                    onClick={() => handleDeleteBlock(block.id)}
                    className="p-1 rounded text-[#94a3b8] hover:text-[#f43f5e] hover:bg-white/[0.08]"
                    title="Удалить таблицу"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Clean Table Grid */}
              <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-[#0c0d12]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#171822] border-b border-white/[0.08]">
                      {headers.map((h, colIdx) => (
                        <th key={colIdx} className="p-2 border-r border-white/[0.06] last:border-r-0 relative group/col min-w-[120px]">
                          <div className="flex items-center justify-between gap-1">
                            <input
                              type="text"
                              value={h}
                              onChange={(e) => {
                                const nextHeaders = [...headers];
                                nextHeaders[colIdx] = e.target.value;
                                handleUpdateBlock(block.id, { tableHeaders: nextHeaders });
                              }}
                              placeholder={`Столбец ${colIdx + 1}`}
                              className="bg-transparent font-bold text-white placeholder:text-[#64748b] focus:outline-none focus:bg-white/[0.06] rounded px-1 w-full"
                            />
                            {headers.length > 1 && (
                              <button
                                onClick={() => {
                                  const nextHeaders = headers.filter((_, idx) => idx !== colIdx);
                                  const nextRows = rows.map((r) => r.filter((_, idx) => idx !== colIdx));
                                  handleUpdateBlock(block.id, { tableHeaders: nextHeaders, tableRows: nextRows });
                                }}
                                className="opacity-0 group-hover/col:opacity-100 p-0.5 text-[#94a3b8] hover:text-[#f43f5e]"
                                title="Удалить столбец"
                              >
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
                        </th>
                      ))}
                      <th className="w-7 p-2 text-center text-[#64748b]">#</th>
                    </tr>
                  </thead>

                  <tbody>
                    {rows.map((row, rowIdx) => (
                      <tr key={rowIdx} className="border-b border-white/[0.04] hover:bg-white/[0.02] group/row">
                        {headers.map((_, colIdx) => (
                          <td key={colIdx} className="p-1 border-r border-white/[0.04] last:border-r-0">
                            <input
                              type="text"
                              value={row[colIdx] || ''}
                              onChange={(e) => {
                                const nextRows = rows.map((r, rI) => {
                                  if (rI !== rowIdx) return r;
                                  const nextRow = [...r];
                                  nextRow[colIdx] = e.target.value;
                                  return nextRow;
                                });
                                handleUpdateBlock(block.id, { tableRows: nextRows });
                              }}
                              placeholder="..."
                              className="w-full bg-transparent p-1.5 text-white focus:outline-none focus:bg-[#7c5cff]/15 rounded text-xs"
                            />
                          </td>
                        ))}
                        <td className="p-1 text-center">
                          <button
                            onClick={() => {
                              const nextRows = rows.filter((_, idx) => idx !== rowIdx);
                              handleUpdateBlock(block.id, { tableRows: nextRows });
                            }}
                            className="opacity-0 group-hover/row:opacity-100 p-0.5 text-[#94a3b8] hover:text-[#f43f5e] rounded"
                            title="Удалить строку"
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {/* Auto-Calculated Sum */}
                    {block.tableIncludeSum && (
                      <tr className="bg-[#191a24] font-bold text-[#10b981] border-t-2 border-white/[0.12]">
                        {headers.map((_, colIdx) => {
                          const { isNum, sum } = colSums[colIdx] || { isNum: false, sum: 0 };
                          if (colIdx === 0) {
                            return (
                              <td key={colIdx} className="p-2 border-r border-white/[0.06] text-white">
                                <span className="flex items-center gap-1">
                                  <Calculator size={13} className="text-[#10b981]" />
                                  <span>∑ ИТОГО</span>
                                </span>
                              </td>
                            );
                          }
                          return (
                            <td key={colIdx} className="p-2 border-r border-white/[0.06] font-mono">
                              {isNum ? `${sum.toLocaleString('ru-RU')}` : '—'}
                            </td>
                          );
                        })}
                        <td className="p-2 text-center text-[#64748b]">✓</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        }

        // ================= 3. RENDER HEADINGS (H1, H2, H3, H4) =================
        if (block.type === 'heading') {
          const lvl = block.level || 2;

          return (
            <div key={block.id} className="relative group pt-1.5 pb-0.5">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={block.content || ''}
                  onChange={(e) => handleUpdateBlock(block.id, { content: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddBlockBelow(block.id, 'paragraph');
                    }
                  }}
                  placeholder={
                    lvl === 1
                      ? 'Крупный заголовок H1...'
                      : lvl === 2
                      ? 'Заголовок раздела H2...'
                      : lvl === 3
                      ? 'Подзаголовок H3...'
                      : 'Малый заголовок H4...'
                  }
                  className={`flex-1 bg-transparent focus:outline-none focus:bg-white/[0.04] rounded px-1.5 py-0.5 tracking-tight ${
                    lvl === 1
                      ? 'text-2xl font-black text-white border-b border-white/[0.1] pb-1'
                      : lvl === 2
                      ? 'text-xl font-bold text-white'
                      : lvl === 3
                      ? 'text-base font-semibold text-[#cbd5e1]'
                      : 'text-sm font-semibold text-[#a855f7]'
                  }`}
                />

                {/* Level switcher */}
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-[#14151c] p-0.5 rounded-lg border border-white/[0.1] transition-opacity shrink-0">
                  <button
                    onClick={() => handleUpdateBlock(block.id, { level: 1 })}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      lvl === 1 ? 'bg-[#7c5cff] text-white' : 'text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    H1
                  </button>
                  <button
                    onClick={() => handleUpdateBlock(block.id, { level: 2 })}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      lvl === 2 ? 'bg-[#7c5cff] text-white' : 'text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    H2
                  </button>
                  <button
                    onClick={() => handleUpdateBlock(block.id, { level: 3 })}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      lvl === 3 ? 'bg-[#7c5cff] text-white' : 'text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    H3
                  </button>
                  <button
                    onClick={() => handleUpdateBlock(block.id, { level: 4 })}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      lvl === 4 ? 'bg-[#7c5cff] text-white' : 'text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    H4
                  </button>
                  <button
                    onClick={() => handleDeleteBlock(block.id)}
                    className="p-1 text-[#94a3b8] hover:text-[#f43f5e] rounded"
                    title="Удалить заголовок"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          );
        }

        // ================= 4. RENDER NUMBERED LIST ITEM =================
        if (block.type === 'numbered') {
          const curNum = block.num || 1;

          return (
            <div key={block.id} className="flex items-center gap-2 py-0.5 pl-2 group">
              <span className="font-mono font-bold text-xs text-[#f59e0b] min-w-[20px] text-right">
                {curNum}.
              </span>
              <input
                type="text"
                value={block.content || ''}
                onChange={(e) => handleUpdateBlock(block.id, { content: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (!block.content?.trim()) {
                      handleUpdateBlock(block.id, { type: 'paragraph', content: '' });
                    } else {
                      handleAddBlockBelow(block.id, 'numbered', { num: curNum + 1 });
                    }
                  } else if (e.key === 'Backspace' && !block.content) {
                    e.preventDefault();
                    handleDeleteBlock(block.id);
                  }
                }}
                placeholder="Пункт нумерованного списка..."
                className="flex-1 bg-transparent text-sm text-[#e2e8f0] focus:outline-none focus:bg-white/[0.04] rounded px-1.5 py-0.5"
              />
              <button
                onClick={() => handleDeleteBlock(block.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-[#94a3b8] hover:text-[#f43f5e]"
                title="Удалить пункт"
              >
                <Trash2 size={12} />
              </button>
            </div>
          );
        }

        // ================= 5. RENDER TASK ITEM =================
        if (block.type === 'task') {
          return (
            <div key={block.id} className="flex items-center gap-2.5 py-1 px-1 rounded-lg hover:bg-white/[0.02] group">
              <input
                type="checkbox"
                checked={block.checked || false}
                onChange={(e) => handleUpdateBlock(block.id, { checked: e.target.checked })}
                className="w-4 h-4 rounded accent-[#7c5cff] cursor-pointer"
              />
              <input
                type="text"
                value={block.content || ''}
                onChange={(e) => handleUpdateBlock(block.id, { content: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (!block.content?.trim()) {
                      handleUpdateBlock(block.id, { type: 'paragraph', content: '' });
                    } else {
                      handleAddBlockBelow(block.id, 'task');
                    }
                  } else if (e.key === 'Backspace' && !block.content) {
                    e.preventDefault();
                    handleDeleteBlock(block.id);
                  }
                }}
                placeholder="Текст задачи..."
                className={`flex-1 bg-transparent text-sm text-[#e2e8f0] focus:outline-none focus:bg-white/[0.04] rounded px-1 ${
                  block.checked ? 'line-through text-[#64748b]' : ''
                }`}
              />
              <button
                onClick={() => handleDeleteBlock(block.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-[#94a3b8] hover:text-[#f43f5e]"
                title="Удалить задачу"
              >
                <Trash2 size={12} />
              </button>
            </div>
          );
        }

        // ================= 6. RENDER BULLET LIST ITEM =================
        if (block.type === 'list') {
          return (
            <div key={block.id} className="flex items-center gap-2 py-0.5 pl-3 group">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7c5cff] shrink-0" />
              <input
                type="text"
                value={block.content || ''}
                onChange={(e) => handleUpdateBlock(block.id, { content: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (!block.content?.trim()) {
                      handleUpdateBlock(block.id, { type: 'paragraph', content: '' });
                    } else {
                      handleAddBlockBelow(block.id, 'list');
                    }
                  } else if (e.key === 'Backspace' && !block.content) {
                    e.preventDefault();
                    handleDeleteBlock(block.id);
                  }
                }}
                placeholder="Пункт списка..."
                className="flex-1 bg-transparent text-sm text-[#cbd5e1] focus:outline-none focus:bg-white/[0.04] rounded px-1"
              />
              <button
                onClick={() => handleDeleteBlock(block.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-[#94a3b8] hover:text-[#f43f5e]"
                title="Удалить пункт"
              >
                <Trash2 size={12} />
              </button>
            </div>
          );
        }

        // ================= 7. RENDER STANDARD PARAGRAPH =================
        return (
          <div key={block.id} className="relative group">
            <textarea
              value={block.content || ''}
              onChange={(e) => handleUpdateBlock(block.id, { content: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddBlockBelow(block.id, 'paragraph');
                }
              }}
              placeholder="Начните писать текст..."
              rows={Math.max(1, (block.content || '').split('\n').length)}
              className="w-full bg-transparent text-sm text-[#e2e8f0] leading-relaxed resize-none focus:outline-none focus:bg-white/[0.02] rounded px-1.5 py-1 font-sans selection:bg-[#7c5cff]/30"
            />
          </div>
        );
      })}

      {/* Floating Bottom Add Block Toolbar */}
      <div className="pt-4 flex items-center justify-center gap-2 border-t border-white/[0.06] flex-wrap">
        <button
          onClick={() => handleAddBlockBelow(undefined, 'paragraph')}
          className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#94a3b8] hover:text-white flex items-center gap-1.5 transition-all text-xs border border-white/[0.06]"
        >
          <Plus size={13} />
          <span>+ Текст</span>
        </button>

        <button
          onClick={() => handleAddBlockBelow(undefined, 'heading', { level: 1 })}
          className="px-3 py-1.5 rounded-xl bg-[#7c5cff]/15 hover:bg-[#7c5cff]/25 text-[#7c5cff] flex items-center gap-1.5 transition-all text-xs border border-[#7c5cff]/30 font-semibold"
        >
          <Heading1 size={13} />
          <span>+ Заголовок H1</span>
        </button>

        <button
          onClick={() => handleAddBlockBelow(undefined, 'heading', { level: 2 })}
          className="px-3 py-1.5 rounded-xl bg-[#7c5cff]/15 hover:bg-[#7c5cff]/25 text-[#7c5cff] flex items-center gap-1.5 transition-all text-xs border border-[#7c5cff]/30 font-semibold"
        >
          <Heading2 size={13} />
          <span>+ Заголовок H2</span>
        </button>

        <button
          onClick={() => handleAddBlockBelow(undefined, 'numbered', { num: 1 })}
          className="px-3 py-1.5 rounded-xl bg-[#f59e0b]/15 hover:bg-[#f59e0b]/25 text-[#f59e0b] flex items-center gap-1.5 transition-all text-xs border border-[#f59e0b]/30 font-semibold"
        >
          <ListOrdered size={14} />
          <span>+ 1. Нумерация</span>
        </button>

        <button
          onClick={() => handleAddBlockBelow(undefined, 'list')}
          className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#cbd5e1] flex items-center gap-1.5 transition-all text-xs border border-white/[0.06]"
        >
          <List size={14} />
          <span>+ • Список</span>
        </button>

        <button
          onClick={() => handleAddBlockBelow(undefined, 'task')}
          className="px-3 py-1.5 rounded-xl bg-[#38bdf8]/15 hover:bg-[#38bdf8]/25 text-[#38bdf8] flex items-center gap-1.5 transition-all text-xs border border-[#38bdf8]/30 font-semibold"
        >
          <CheckSquare size={14} />
          <span>+ Чеклист</span>
        </button>

        <button
          onClick={() => handleAddBlockBelow(undefined, 'table')}
          className="px-3 py-1.5 rounded-xl bg-[#10b981]/15 hover:bg-[#10b981]/25 text-[#10b981] flex items-center gap-1.5 transition-all text-xs border border-[#10b981]/30 font-semibold"
        >
          <TableIcon size={14} />
          <span>+ Таблица</span>
        </button>

        <button
          onClick={() => handleAddBlockBelow(undefined, 'callout')}
          className="px-3 py-1.5 rounded-xl bg-[#f59e0b]/15 hover:bg-[#f59e0b]/25 text-[#f59e0b] flex items-center gap-1.5 transition-all text-xs border border-[#f59e0b]/30 font-semibold"
        >
          <Sparkles size={14} />
          <span>+ Подсказка</span>
        </button>
      </div>
    </div>
  );
};
