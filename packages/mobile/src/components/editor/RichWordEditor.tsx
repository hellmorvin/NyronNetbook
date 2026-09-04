import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  Table as TableIcon,
  Trash2,
  Columns,
  Rows,
  Sparkles,
  Check,
  Calculator,
  RefreshCw,
} from 'lucide-react';
import { WordStyleRibbon, WordRibbonActionHandlers } from './WordStyleRibbon';
import { performFullSpellcheck, fixRussianTextLocally } from '../../services/spellcheckService';

interface RichWordEditorProps {
  initialContent: string;
  onChange: (content: string) => void;
  noteTitle: string;
  onTitleChange: (title: string) => void;
  noteId?: string;
}

// Math evaluation helper for inline calculations
function evaluateMathExpression(expr: string): number | null {
  try {
    let clean = expr
      .replace(/[\s₽$€]/g, '')
      .replace(/,/g, '.')
      .replace(/×/g, '*')
      .replace(/÷/g, '/');

    clean = clean.replace(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)%/g, '($1 * (1 - $2 / 100))');
    clean = clean.replace(/(\d+(?:\.\d+)?)\s*\+\s*(\d+(?:\.\d+)?)%/g, '($1 * (1 + $2 / 100))');
    clean = clean.replace(/(\d+(?:\.\d+)?)%/g, '($1 / 100)');

    if (!/^[0-9+\-*/().]+$/.test(clean)) return null;

    const res = Function(`"use strict"; return (${clean})`)();
    if (typeof res === 'number' && !isNaN(res) && isFinite(res)) {
      return Math.round(res * 100) / 100;
    }
    return null;
  } catch {
    return null;
  }
}

// Recursively traverse and fix text inside DOM text nodes using universal spellcheck service
function walkAndFixTextNodes(node: Node): number {
  let count = 0;
  if (node.nodeType === Node.TEXT_NODE) {
    if (node.nodeValue && node.nodeValue.length > 0) {
      const fixed = fixRussianTextLocally(node.nodeValue);
      if (fixed !== node.nodeValue) {
        node.nodeValue = fixed;
        count++;
      }
    }
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement;
    if (['SCRIPT', 'STYLE', 'INPUT', 'TEXTAREA'].includes(el.tagName)) return 0;
    for (let i = 0; i < node.childNodes.length; i++) {
      count += walkAndFixTextNodes(node.childNodes[i]!);
    }
  }
  return count;
}

// Calculate table column summaries in real-time
export function recalculateTableSummaries(table: HTMLTableElement) {
  const tfoot = table.querySelector('tfoot');
  if (!tfoot) return;
  const summaryRow = tfoot.querySelector('tr');
  if (!summaryRow) return;

  const tbody = table.querySelector('tbody');
  if (!tbody) return;

  const bodyRows = Array.from(tbody.querySelectorAll<HTMLTableRowElement>('tr'));
  const headerRow = (table.querySelector('thead tr') || table.rows[0]) as HTMLTableRowElement | null;
  const colCount = headerRow ? headerRow.cells.length : summaryRow.cells.length;

  for (let c = 1; c < colCount; c++) {
    const summaryCell = summaryRow.cells[c];
    if (!summaryCell) continue;

    const calcType = summaryCell.getAttribute('data-calc') || 'sum';
    if (calcType === 'none') {
      summaryCell.innerHTML = '<span style="color: #64748b; font-weight: normal;">—</span>';
      continue;
    }

    const nums: number[] = [];
    let nonEmptyCount = 0;

    bodyRows.forEach((row) => {
      const cell = row.cells[c];
      if (cell) {
        const text = cell.innerText.trim();
        if (text) {
          nonEmptyCount++;
          const cleanNum = text.replace(/\s+/g, '').replace(/[^\d.-]/g, '');
          const n = Number(cleanNum);
          if (!isNaN(n) && isFinite(n)) {
            nums.push(n);
          }
        }
      }
    });

    if (calcType === 'count') {
      summaryCell.innerHTML = `<span style="color: #38bdf8; font-weight: bold;"># ${nonEmptyCount}</span>`;
      continue;
    }

    if (nums.length === 0) {
      summaryCell.innerHTML = '<span style="color: #64748b; font-weight: normal;">—</span>';
      continue;
    }

    if (calcType === 'sum') {
      const sum = nums.reduce((a, b) => a + b, 0);
      summaryCell.innerHTML = `<span style="color: #10b981; font-weight: bold;">∑ ${sum.toLocaleString('ru-RU')}</span>`;
    } else if (calcType === 'avg') {
      const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
      summaryCell.innerHTML = `<span style="color: #a855f7; font-weight: bold;">Ø ${Math.round(avg * 10) / 10}</span>`;
    } else if (calcType === 'min') {
      const min = Math.min(...nums);
      summaryCell.innerHTML = `<span style="color: #f59e0b; font-weight: bold;">↓ ${min.toLocaleString('ru-RU')}</span>`;
    } else if (calcType === 'max') {
      const max = Math.max(...nums);
      summaryCell.innerHTML = `<span style="color: #ec4899; font-weight: bold;">↑ ${max.toLocaleString('ru-RU')}</span>`;
    }
  }
}

export function recalculateAllTables(container: HTMLElement | null) {
  if (!container) return;
  const tables = container.querySelectorAll<HTMLTableElement>('table.visual-doc-table, table');
  tables.forEach((t) => recalculateTableSummaries(t));
}

// Convert existing markdown/html content into clean visual HTML
function prepareInitialHTML(content: string): string {
  if (!content || !content.trim()) {
    return '<p><br></p>';
  }

  let html = content;

  // Clean raw escaped span tags
  html = html.replace(/&lt;span style="[^"]*"&gt;\s*&lt;\/span&gt;/g, '');

  if (!html.includes('<p>') && !html.includes('<div>') && !html.includes('<h1>') && !html.includes('<table>')) {
    const lines = html.split('\n');
    const processedLines: string[] = [];
    let inTable = false;
    let tableRows: string[][] = [];

    const flushTable = () => {
      if (tableRows.length > 0) {
        let tableHtml = '<table class="visual-doc-table" style="border-collapse: collapse; width: 100%; margin: 16px 0; border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; overflow: hidden;"><thead><tr style="background: rgba(255,255,255,0.06);">';
        tableHtml += '<th style="border: 1px solid rgba(255,255,255,0.12); padding: 10px 12px; width: 48px; text-align: center; color: #94a3b8; font-weight: bold; user-select: none;">#</th>';
        const headers = tableRows[0] || [];
        headers.forEach((col, cIdx) => {
          tableHtml += `<th style="border: 1px solid rgba(255,255,255,0.12); padding: 10px 14px; font-weight: bold; text-align: left; color: #ffffff;">${col || `Столбец ${cIdx + 1}`}</th>`;
        });
        tableHtml += '</tr></thead><tbody>';

        for (let r = 1; r < tableRows.length; r++) {
          tableHtml += '<tr>';
          tableHtml += `<td style="border: 1px solid rgba(255,255,255,0.1); padding: 10px 12px; width: 48px; text-align: center; color: #64748b; font-weight: bold; user-select: none; background: rgba(255,255,255,0.02);">${r}</td>`;
          headers.forEach((_, cIdx) => {
            const val = tableRows[r]?.[cIdx] || '';
            tableHtml += `<td style="border: 1px solid rgba(255,255,255,0.1); padding: 10px 14px; min-width: 120px; color: #e2e8f0;">${val || '<br>'}</td>`;
          });
          tableHtml += '</tr>';
        }
        tableHtml += '</tbody></table><p><br></p>';
        processedLines.push(tableHtml);
        tableRows = [];
      }
      inTable = false;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;

      // Tables
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        inTable = true;
        if (!line.includes('---')) {
          const cells = line.slice(1, -1).split('|').map((c) => c.trim());
          tableRows.push(cells);
        }
        continue;
      } else if (inTable) {
        flushTable();
      }

      // Headings
      if (line.startsWith('# ')) {
        processedLines.push(`<h1 style="font-size: 22px; font-weight: 800; color: #ffffff; margin: 16px 0 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px;">${line.slice(2)}</h1>`);
        continue;
      }
      if (line.startsWith('## ')) {
        processedLines.push(`<h2 style="font-size: 18px; font-weight: 700; color: #a78bfa; margin: 12px 0 6px 0;">${line.slice(3)}</h2>`);
        continue;
      }
      if (line.startsWith('### ')) {
        processedLines.push(`<h3 style="font-size: 15px; font-weight: 600; color: #38bdf8; margin: 8px 0 4px 0;">${line.slice(4)}</h3>`);
        continue;
      }

      // Blockquote
      if (line.startsWith('> ')) {
        processedLines.push(`<blockquote style="border-left: 3px solid #7c5cff; padding-left: 12px; margin: 8px 0; color: #cbd5e1; font-style: italic;">${line.slice(2)}</blockquote>`);
        continue;
      }

      // Horizontal Rule
      if (line.trim() === '---' || line.trim() === '***') {
        processedLines.push('<hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 16px 0;" />');
        continue;
      }

      // Tasks
      if (line.startsWith('- [ ] ') || line.startsWith('- [x] ')) {
        const isChecked = line.startsWith('- [x] ');
        const taskText = line.slice(6);
        processedLines.push(
          `<div class="visual-task-item" style="display: flex; align-items: center; gap: 8px; margin: 4px 0;"><input type="checkbox" contenteditable="false" ${isChecked ? 'checked' : ''} style="cursor: pointer; width: 18px; height: 18px; accent-color: #7c5cff; margin: 0;" /><div contenteditable="true" style="flex: 1; outline: none; ${isChecked ? 'text-decoration: line-through; color: #64748b;' : ''}">${taskText}</div></div>`
        );
        continue;
      }

      // Bullets
      if (line.startsWith('- ') || line.startsWith('* ')) {
        processedLines.push(`<ul style="list-style-type: disc; list-style-position: inside; margin: 6px 0;"><li style="display: list-item;">${line.slice(2)}</li></ul>`);
        continue;
      }

      // Numbered lists
      const numMatch = /^(\d+)\.\s+(.*)$/.exec(line);
      if (numMatch) {
        processedLines.push(`<ol style="list-style-type: decimal; list-style-position: inside; margin: 6px 0;"><li style="display: list-item;">${numMatch[2]}</li></ol>`);
        continue;
      }

      if (line.trim() === '') {
        processedLines.push('<p><br></p>');
      } else {
        let pl = line
          .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
          .replace(/\*([^*]+)\*/g, '<i>$1</i>')
          .replace(/~~([^~]+)~~/g, '<s>$1</s>')
          .replace(/==([^=]+)==/g, '<mark style="background: rgba(254, 240, 138, 0.25); color: #fef08a; padding: 1px 4px; border-radius: 4px;">$1</mark>')
          .replace(/\[\[(.*?)\]\]/g, '<span class="wikilink-node" data-link="$1" style="background: rgba(124, 92, 255, 0.2); color: #a78bfa; font-weight: bold; border-radius: 4px; padding: 1px 6px; text-decoration: underline; cursor: pointer;">[[$1]]</span>');
        processedLines.push(`<p style="margin: 6px 0; line-height: 1.6;">${pl}</p>`);
      }
    }

    if (inTable) flushTable();
    return processedLines.join('');
  }

  return html;
}

export const RichWordEditor: React.FC<RichWordEditorProps> = ({
  initialContent,
  onChange,
  noteTitle,
  onTitleChange,
  noteId,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChangeRef = useRef(false);
  const lastLoadedNoteId = useRef<string | undefined>(undefined);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Active Formatting State
  const [currentSize, setCurrentSize] = useState<number>(14);
  const [currentAlign, setCurrentAlign] = useState<'left' | 'center' | 'right' | 'justify'>('left');

  // Active Selected Table Info
  const [selectedTableElement, setSelectedTableElement] = useState<HTMLTableElement | null>(null);
  const [selectedCellElement, setSelectedCellElement] = useState<HTMLTableCellElement | null>(null);

  // Inline Math Suggestion State
  const [inlineMathSuggestion, setInlineMathSuggestion] = useState<{ expr: string; result: number } | null>(null);
  const [isRibbonExpanded, setIsRibbonExpanded] = useState(true);

  // Saved Selection Range for rock-solid mobile touch formatting without caret jumps
  const savedRangeRef = useRef<Range | null>(null);

  const saveCurrentSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current && sel.anchorNode && editorRef.current.contains(sel.anchorNode)) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  }, []);

  const restoreSelection = useCallback(() => {
    if (savedRangeRef.current && editorRef.current) {
      editorRef.current.focus();
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedRangeRef.current);
      }
    }
  }, []);

  useEffect(() => {
    const handleSel = () => {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && editorRef.current && sel.anchorNode && editorRef.current.contains(sel.anchorNode)) {
        savedRangeRef.current = sel.getRangeAt(0).cloneRange();
      }
    };
    document.addEventListener('selectionchange', handleSel);
    return () => document.removeEventListener('selectionchange', handleSel);
  }, []);

  // Initialize editor content ONLY ONCE per noteId
  useEffect(() => {
    if (editorRef.current && (lastLoadedNoteId.current !== noteId || !lastLoadedNoteId.current)) {
      lastLoadedNoteId.current = noteId;
      editorRef.current.innerHTML = prepareInitialHTML(initialContent);
      recalculateAllTables(editorRef.current);
    }
  }, [noteId]);

  // Sync content back to store
  const syncTimerRef = useRef<any>(null);
  const handleEditorInput = useCallback(() => {
    if (!editorRef.current) return;
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);

    // Live table column recalculations
    recalculateAllTables(editorRef.current);

    // Inline math auto-detection ending with '='
    const sel = window.getSelection();
    if (sel && sel.anchorNode && sel.anchorNode.nodeType === 3) {
      const text = sel.anchorNode.nodeValue || '';
      const offset = sel.anchorOffset;
      const textBefore = text.slice(0, offset);
      const mathMatch = /([0-9\s.,+\-*/()]+)=\s*$/.exec(textBefore);
      if (mathMatch && mathMatch[1]) {
        const res = evaluateMathExpression(mathMatch[1]);
        if (res !== null) {
          setInlineMathSuggestion({ expr: mathMatch[1].trim(), result: res });
        } else {
          setInlineMathSuggestion(null);
        }
      } else {
        setInlineMathSuggestion(null);
      }
    }

    syncTimerRef.current = setTimeout(() => {
      if (editorRef.current) {
        isInternalChangeRef.current = true;
        onChangeRef.current(editorRef.current.innerHTML);
        setTimeout(() => {
          isInternalChangeRef.current = false;
        }, 50);
      }
    }, 150);
  }, []);

  // Immediate flush on blur
  const handleEditorBlur = useCallback(() => {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    if (editorRef.current) {
      isInternalChangeRef.current = true;
      onChangeRef.current(editorRef.current.innerHTML);
      setTimeout(() => {
        isInternalChangeRef.current = false;
      }, 50);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, []);

  // Apply inline math suggestion when pressing Tab
  const applyInlineMath = useCallback(() => {
    if (!inlineMathSuggestion) return;
    document.execCommand('insertText', false, ` ${inlineMathSuggestion.result.toLocaleString('ru-RU')} `);
    setInlineMathSuggestion(null);
    handleEditorInput();
  }, [inlineMathSuggestion, handleEditorInput]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Tab' && inlineMathSuggestion) {
        e.preventDefault();
        applyInlineMath();
        return;
      }

      // Enter inside a task item
      if (e.key === 'Enter') {
        const sel = window.getSelection();
        if (sel && sel.anchorNode) {
          const taskNode = (sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode as HTMLElement)?.closest('.visual-task-item');
          if (taskNode) {
            e.preventDefault();
            const newTask = document.createElement('div');
            newTask.className = 'visual-task-item';
            newTask.style.cssText = 'display: flex; align-items: center; gap: 8px; margin: 4px 0;';
            newTask.innerHTML = '<input type="checkbox" contenteditable="false" style="cursor: pointer; width: 18px; height: 18px; accent-color: #7c5cff; margin: 0;" /><div contenteditable="true" style="flex: 1; outline: none;"><br></div>';
            taskNode.insertAdjacentElement('afterend', newTask);
            
            const editableDiv = newTask.querySelector('[contenteditable="true"]');
            if (editableDiv) {
              const range = document.createRange();
              range.selectNodeContents(editableDiv);
              range.collapse(true);
              sel.removeAllRanges();
              sel.addRange(range);
            }
            handleEditorInput();
          }
        }
      }
    },
    [inlineMathSuggestion, applyInlineMath, handleEditorInput]
  );

  // Track selection styles
  const updateSelectionFormatting = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || !sel.anchorNode || !editorRef.current?.contains(sel.anchorNode)) {
      setSelectedTableElement(null);
      setSelectedCellElement(null);
      return;
    }

    let node = sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : (sel.anchorNode as HTMLElement);
    if (!node) return;

    const table = node.closest('table');
    const cell = node.closest('td, th') as HTMLTableCellElement | null;
    setSelectedTableElement(table || null);
    setSelectedCellElement(cell || null);

    const computed = window.getComputedStyle(node);
    if (computed.fontSize) {
      const parsed = parseInt(computed.fontSize, 10);
      if (!isNaN(parsed)) setCurrentSize(parsed);
    }
    if (computed.textAlign) {
      const align = computed.textAlign as 'left' | 'center' | 'right' | 'justify';
      if (['left', 'center', 'right', 'justify'].includes(align)) {
        setCurrentAlign(align);
      }
    }
  }, []);

  // Helper: Apply font size cleanly to selection or active block
  const handleFontSizeChange = useCallback((size: number) => {
    setCurrentSize(size);
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    if (sel.isCollapsed) {
      let anchor = sel.anchorNode;
      let block = (anchor?.nodeType === 3 ? anchor.parentElement : (anchor as HTMLElement))?.closest<HTMLElement>('li, p, h1, h2, h3, td, th, div.visual-task-item');
      if (block && editorRef.current?.contains(block)) {
        block.style.fontSize = `${size}px`;
        block.style.lineHeight = '1.35';
        
        // Synchronize all highlight spans and nested font spans inside this block
        const nestedFontSpans = block.querySelectorAll<HTMLElement>('span[style*="font-size"]');
        nestedFontSpans.forEach((s) => {
          s.style.fontSize = '';
        });
        const highlightSpans = block.querySelectorAll<HTMLElement>('span[style*="background-color"], mark');
        highlightSpans.forEach((h) => {
          h.style.fontSize = `${size}px`;
          h.style.lineHeight = 'normal';
        });
        handleEditorInput();
      }
      return;
    }

    const range = sel.getRangeAt(0);
    const commonAncestor = range.commonAncestorContainer;
    const parentBlock = (commonAncestor.nodeType === 3 ? commonAncestor.parentElement : (commonAncestor as HTMLElement))?.closest<HTMLElement>('li, p, h1, h2, h3, td, th, div.visual-task-item');
    const existingHighlight = (commonAncestor.nodeType === 3 ? commonAncestor.parentElement : (commonAncestor as HTMLElement))?.closest<HTMLElement>('span[style*="background-color"], mark');

    // If selection is inside or covers a highlight span
    if (existingHighlight && editorRef.current?.contains(existingHighlight)) {
      existingHighlight.style.fontSize = `${size}px`;
      existingHighlight.style.lineHeight = 'normal';
      if (parentBlock && parentBlock.tagName === 'LI') {
        parentBlock.style.fontSize = `${size}px`;
      }
      handleEditorInput();
      return;
    }

    // If selection covers the full block or li
    if (parentBlock && parentBlock.innerText.trim() === sel.toString().trim()) {
      parentBlock.style.fontSize = `${size}px`;
      parentBlock.style.lineHeight = '1.35';
      const nested = parentBlock.querySelectorAll<HTMLElement>('span[style*="font-size"]');
      nested.forEach((s) => {
        s.style.fontSize = '';
      });
      const hl = parentBlock.querySelectorAll<HTMLElement>('span[style*="background-color"], mark');
      hl.forEach((h) => {
        h.style.fontSize = `${size}px`;
        h.style.lineHeight = 'normal';
      });
      handleEditorInput();
      return;
    }

    // Apply to selected text fragment
    try {
      const frag = range.extractContents();
      const nested = frag.querySelectorAll<HTMLElement>('span[style*="font-size"]');
      nested.forEach((s) => {
        s.style.fontSize = '';
      });

      const span = document.createElement('span');
      span.style.fontSize = `${size}px`;
      span.style.display = 'inline';
      span.style.lineHeight = 'inherit';
      span.style.verticalAlign = 'baseline';
      span.appendChild(frag);

      range.insertNode(span);
      sel.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      sel.addRange(newRange);

      // If inside an li, sync the li font-size as well so the marker matches
      if (parentBlock && parentBlock.tagName === 'LI') {
        parentBlock.style.fontSize = `${size}px`;
      }

      handleEditorInput();
    } catch (e) {
      console.error('Font size apply error', e);
    }
  }, [handleEditorInput]);

  const [fixNotification, setFixNotification] = useState<string | null>(null);

  // Robust Auto-Fix Orthography & Punctuation
  const handleAutoFixOrthography = useCallback(async () => {
    if (!editorRef.current) return;
    
    // First, run instant local morphological and layout fix
    let count = walkAndFixTextNodes(editorRef.current);
    
    if (noteTitle) {
      const fixedTitle = fixRussianTextLocally(noteTitle);
      if (fixedTitle !== noteTitle) {
        onTitleChange(fixedTitle);
        count++;
      }
    }

    isInternalChangeRef.current = true;
    onChange(editorRef.current.innerHTML);
    handleEditorInput();

    // Second, perform online spellcheck via Yandex Speller API
    try {
      const textNodes: Node[] = [];
      const collect = (n: Node) => {
        if (n.nodeType === Node.TEXT_NODE && n.nodeValue && n.nodeValue.trim()) {
          textNodes.push(n);
        } else if (n.nodeType === Node.ELEMENT_NODE) {
          const el = n as HTMLElement;
          if (!['SCRIPT', 'STYLE', 'INPUT', 'TEXTAREA'].includes(el.tagName)) {
            for (let i = 0; i < n.childNodes.length; i++) collect(n.childNodes[i]!);
          }
        }
      };
      collect(editorRef.current);

      for (const node of textNodes) {
        if (node.nodeValue) {
          const res = await performFullSpellcheck(node.nodeValue);
          if (res.result !== node.nodeValue) {
            node.nodeValue = res.result;
            count += res.count;
          }
        }
      }

      if (noteTitle) {
        const titleRes = await performFullSpellcheck(noteTitle);
        if (titleRes.result !== noteTitle) {
          onTitleChange(titleRes.result);
          count += titleRes.count;
        }
      }

      isInternalChangeRef.current = true;
      onChange(editorRef.current.innerHTML);
      handleEditorInput();
    } catch (e) {
      console.warn('Spellcheck API error:', e);
    }

    setFixNotification(`✓ Проверено: исправлено опечаток и ошибок: ${Math.max(1, count)}`);
    setTimeout(() => setFixNotification(null), 3500);
  }, [handleEditorInput, noteTitle, onTitleChange, onChange]);

  // Ribbon Handlers
  const ribbonHandlers: WordRibbonActionHandlers = useMemo(
    () => ({
      onFontSizeChange: handleFontSizeChange,
      onClearFormat: () => {
        const sel = window.getSelection();
        if (sel && sel.anchorNode) {
          let node = sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : (sel.anchorNode as HTMLElement);
          let cell = node?.closest<HTMLTableCellElement>('td, th');
          if (cell && editorRef.current?.contains(cell)) {
            cell.style.textDecoration = 'none';
            cell.style.fontStyle = 'normal';
            cell.style.fontWeight = 'normal';
            cell.style.fontSize = '';
            cell.style.backgroundColor = '';
            cell.style.color = '';
            const allStyled = cell.querySelectorAll<HTMLElement>('*');
            allStyled.forEach((el) => {
              el.removeAttribute('style');
            });
            const uTags = cell.querySelectorAll('u');
            uTags.forEach((u) => {
              const p = u.parentNode;
              while (u.firstChild) p?.insertBefore(u.firstChild, u);
              u.remove();
            });
            handleEditorInput();
            return;
          }
        }
        document.execCommand('removeFormat', false);
        handleEditorInput();
      },
      onHeading: (level: 1 | 2 | 3) => {
        restoreSelection();
        const sel = window.getSelection();
        if (sel && sel.anchorNode) {
          let node = sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : (sel.anchorNode as HTMLElement);
          let heading = node?.closest<HTMLElement>('h1, h2, h3');
          if (heading && heading.tagName.toLowerCase() === `h${level}`) {
            document.execCommand('formatBlock', false, '<p>');
          } else {
            document.execCommand('formatBlock', false, `<h${level}>`);
          }
        } else {
          document.execCommand('formatBlock', false, `<h${level}>`);
        }
        saveCurrentSelection();
        handleEditorInput();
      },
      onBold: () => {
        restoreSelection();
        document.execCommand('bold', false);
        saveCurrentSelection();
        handleEditorInput();
      },
      onItalic: () => {
        restoreSelection();
        document.execCommand('italic', false);
        saveCurrentSelection();
        handleEditorInput();
      },
      onUnderline: () => {
        restoreSelection();
        const sel = window.getSelection();
        if (sel && sel.anchorNode) {
          let node = sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : (sel.anchorNode as HTMLElement);
          let cell = node?.closest<HTMLTableCellElement>('td, th');
          if (cell && editorRef.current?.contains(cell)) {
            const currentDec = window.getComputedStyle(cell).textDecorationLine || '';
            const isUnderlined = currentDec.includes('underline') || cell.style.textDecoration.includes('underline') || cell.querySelector('u') !== null;
            if (isUnderlined) {
              cell.style.textDecoration = 'none';
              const uTags = cell.querySelectorAll('u');
              uTags.forEach((u) => {
                const p = u.parentNode;
                while (u.firstChild) p?.insertBefore(u.firstChild, u);
                u.remove();
              });
              saveCurrentSelection();
              handleEditorInput();
              return;
            }
          }
        }
        document.execCommand('underline', false);
        saveCurrentSelection();
        handleEditorInput();
      },
      onStrikethrough: () => {
        restoreSelection();
        document.execCommand('strikeThrough', false);
        saveCurrentSelection();
        handleEditorInput();
      },
      onHighlight: (color: string, autoTextColor?: string) => {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;

        // Check if selection is already inside an existing highlight span
        let anchor = sel.anchorNode;
        let existingHighlightSpan = (
          anchor?.nodeType === 3 ? anchor.parentElement : (anchor as HTMLElement)
        )?.closest<HTMLElement>('span[style*="background"], mark');

        if (existingHighlightSpan && editorRef.current?.contains(existingHighlightSpan)) {
          const currentBg = existingHighlightSpan.style.backgroundColor;
          
          // Helper to check if colors match
          const isSameColor =
            currentBg &&
            (currentBg.toLowerCase() === color.toLowerCase() ||
              (color === 'transparent' && (currentBg === 'transparent' || currentBg === '')));

          if (isSameColor || color === 'transparent') {
            // TOGGLE OFF / REMOVE HIGHLIGHT
            existingHighlightSpan.style.backgroundColor = 'transparent';
            existingHighlightSpan.style.color = 'inherit';
            existingHighlightSpan.style.padding = '0';
            existingHighlightSpan.style.borderRadius = '0';
            
            // Clean any forced dark text colors inside so text is visible on dark theme
            const coloredChildren = existingHighlightSpan.querySelectorAll<HTMLElement>('[style*="color"], font');
            coloredChildren.forEach((c) => {
              c.style.color = '';
              if (c.tagName === 'FONT') c.removeAttribute('color');
            });
            handleEditorInput();
            return;
          } else {
            // REPLACE EXISTING HIGHLIGHT COLOR (NO NESTING!)
            existingHighlightSpan.style.backgroundColor = color;
            if (autoTextColor) {
              existingHighlightSpan.style.color = autoTextColor;
              const coloredChildren = existingHighlightSpan.querySelectorAll<HTMLElement>('[style*="color"], font');
              coloredChildren.forEach((c) => {
                c.style.color = autoTextColor;
              });
            }
            existingHighlightSpan.style.padding = '2px 6px';
            existingHighlightSpan.style.borderRadius = '4px';
            existingHighlightSpan.style.display = 'inline';
            existingHighlightSpan.style.lineHeight = 'normal';
            existingHighlightSpan.style.verticalAlign = 'baseline';
            handleEditorInput();
            return;
          }
        }

        if (sel.isCollapsed) {
          return;
        }

        if (color === 'transparent') {
          const range = sel.getRangeAt(0);
          const ancestor = range.commonAncestorContainer;
          const container = (ancestor.nodeType === 3 ? ancestor.parentElement : (ancestor as HTMLElement));
          if (container) {
            const hls = container.querySelectorAll<HTMLElement>('span[style*="background"], mark');
            hls.forEach((h) => {
              h.style.backgroundColor = 'transparent';
              h.style.color = 'inherit';
              h.style.padding = '0';
              const cColors = h.querySelectorAll<HTMLElement>('[style*="color"], font');
              cColors.forEach((c) => {
                c.style.color = '';
                if (c.tagName === 'FONT') c.removeAttribute('color');
              });
            });
          }
          document.execCommand('hiliteColor', false, 'transparent');
          document.execCommand('foreColor', false, '#e2e8f0');
          handleEditorInput();
          return;
        }

        // Apply new highlight cleanly without nesting
        const range = sel.getRangeAt(0);
        const frag = range.extractContents();

        // Clean any existing nested highlight spans inside the extracted fragment
        const existingNested = frag.querySelectorAll('span[style*="background"], mark');
        existingNested.forEach((n) => {
          const el = n as HTMLElement;
          el.style.backgroundColor = '';
          el.style.padding = '';
          el.style.borderRadius = '';
          el.style.color = '';
        });

        const span = document.createElement('span');
        span.style.backgroundColor = color;
        if (autoTextColor) span.style.color = autoTextColor;
        span.style.padding = '2px 6px';
        span.style.borderRadius = '4px';
        span.style.display = 'inline';
        span.style.lineHeight = 'normal';
        span.style.verticalAlign = 'baseline';

        try {
          span.appendChild(frag);
          range.insertNode(span);
          sel.removeAllRanges();
          const newRange = document.createRange();
          newRange.selectNodeContents(span);
          sel.addRange(newRange);
          handleEditorInput();
        } catch {
          document.execCommand('hiliteColor', false, color);
          if (autoTextColor) document.execCommand('foreColor', false, autoTextColor);
          handleEditorInput();
        }
      },
      onTextColor: (color: string) => {
        document.execCommand('foreColor', false, color);
        handleEditorInput();
      },
      onAlign: (align: 'left' | 'center' | 'right' | 'justify') => {
        setCurrentAlign(align);
        const sel = window.getSelection();
        if (sel && sel.anchorNode) {
          let block = (sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : (sel.anchorNode as HTMLElement))?.closest<HTMLElement>('li, p, div, h1, h2, h3, td, th, blockquote');
          if (block && editorRef.current?.contains(block)) {
            block.style.textAlign = align;
            handleEditorInput();
            return;
          }
        }
        const cmd =
          align === 'left'
            ? 'justifyLeft'
            : align === 'center'
            ? 'justifyCenter'
            : align === 'right'
            ? 'justifyRight'
            : 'justifyFull';
        document.execCommand(cmd, false);
        handleEditorInput();
      },
      onBulletList: () => {
        document.execCommand('insertUnorderedList', false);
        handleEditorInput();
      },
      onNumberedList: () => {
        document.execCommand('insertOrderedList', false);
        handleEditorInput();
      },
      onChecklist: () => {
        const taskHtml = `<div class="visual-task-item" style="display: flex; align-items: center; gap: 8px; margin: 4px 0;"><input type="checkbox" contenteditable="false" style="cursor: pointer; width: 18px; height: 18px; accent-color: #7c5cff; margin: 0;" /><div contenteditable="true" style="flex: 1; outline: none;">Новая задача</div></div><p><br></p>`;
        document.execCommand('insertHTML', false, taskHtml);
        handleEditorInput();
      },
      onInsertEmptyTable: (_rows = 2, _cols = 3) => {
        let tableHtml = '<table class="visual-doc-table" style="border-collapse: collapse; width: 100%; margin: 18px 0; border: 1px solid rgba(255,255,255,0.15); border-radius: 14px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.3);"><thead><tr style="background: rgba(255,255,255,0.06);">';
        tableHtml += '<th style="border: 1px solid rgba(255,255,255,0.12); padding: 10px 12px; width: 48px; text-align: center; color: #94a3b8; font-weight: bold; user-select: none;">#</th>';
        for (let c = 0; c < 3; c++) {
          tableHtml += `<th style="border: 1px solid rgba(255,255,255,0.12); padding: 10px 14px; font-weight: bold; text-align: left; color: #ffffff;">Столбец ${c + 1}</th>`;
        }
        tableHtml += '</tr></thead><tbody>';
        for (let r = 1; r <= 2; r++) {
          tableHtml += '<tr>';
          tableHtml += `<td style="border: 1px solid rgba(255,255,255,0.1); padding: 10px 12px; width: 48px; text-align: center; color: #64748b; font-weight: bold; user-select: none; background: rgba(255,255,255,0.02);">${r}</td>`;
          for (let c = 0; c < 3; c++) {
            tableHtml += '<td style="border: 1px solid rgba(255,255,255,0.1); padding: 10px 14px; min-width: 120px; color: #e2e8f0;"><br></td>';
          }
          tableHtml += '</tr>';
        }
        tableHtml += '</tbody>';
        tableHtml += '<tfoot style="background: rgba(16, 185, 129, 0.08); border-top: 2px solid rgba(16, 185, 129, 0.4);"><tr class="table-summary-row">';
        tableHtml += '<td style="border: 1px solid rgba(255,255,255,0.12); padding: 10px 12px; width: 48px; text-align: center; color: #10b981; font-weight: bold; user-select: none;">∑</td>';
        for (let c = 0; c < 3; c++) {
          tableHtml += '<td class="table-calc-cell" data-calc="sum" contenteditable="false" style="border: 1px solid rgba(255,255,255,0.12); padding: 8px 12px; font-family: monospace; font-size: 12px; cursor: pointer; user-select: none; color: #10b981; font-weight: bold;" title="Кликните для смены формулы: ∑ Сумма • Ø Среднее • # Кол-во • ↓ Мин • ↑ Макс">∑ 0</td>';
        }
        tableHtml += '</tr></tfoot></table><p><br></p>';
        document.execCommand('insertHTML', false, tableHtml);
        handleEditorInput();
      },
      onOpenCalculator: () => {},
      onInsertLink: () => {
        restoreSelection();
        const link = prompt('Введите название мысли для связи [[...]]:', '');
        if (link && link.trim()) {
          const clean = link.trim().replace(/^\[\[/, '').replace(/\]\]$/, '');
          const linkHtml = `<span class="wikilink-node" data-link="${clean}" style="background: rgba(124, 92, 255, 0.2); color: #a78bfa; font-weight: bold; border-radius: 4px; padding: 1px 6px; text-decoration: underline; cursor: pointer;">[[${clean}]]</span>&nbsp;`;
          document.execCommand('insertHTML', false, linkHtml);
        } else if (link === '') {
          const linkHtml = '<span class="wikilink-node" style="background: rgba(124, 92, 255, 0.2); color: #a78bfa; font-weight: bold; border-radius: 4px; padding: 1px 6px; text-decoration: underline; cursor: pointer;">[[Новая мысль]]</span>&nbsp;';
          document.execCommand('insertHTML', false, linkHtml);
        }
        saveCurrentSelection();
        handleEditorInput();
      },
      onAutoFixOrthography: handleAutoFixOrthography,
    }),
    [handleFontSizeChange, handleEditorInput, handleAutoFixOrthography]
  );

  // Table In-Place Management Functions
  const handleAddTableRow = () => {
    if (!selectedTableElement) return;
    const tbody = selectedTableElement.querySelector('tbody') || selectedTableElement;
    const rowCount = tbody.querySelectorAll('tr').length + 1;
    const headerRow = (selectedTableElement.querySelector('thead tr') || selectedTableElement.rows[0]) as HTMLTableRowElement | null;
    const colCount = headerRow ? headerRow.cells.length : 4;

    const tr = document.createElement('tr');
    const numTd = document.createElement('td');
    numTd.style.cssText = 'border: 1px solid rgba(255,255,255,0.1); padding: 10px 12px; width: 48px; text-align: center; color: #64748b; font-weight: bold; user-select: none; background: rgba(255,255,255,0.02);';
    numTd.innerText = `${rowCount}`;
    tr.appendChild(numTd);

    for (let c = 1; c < colCount; c++) {
      const td = document.createElement('td');
      td.style.cssText = 'border: 1px solid rgba(255,255,255,0.1); padding: 10px 14px; min-width: 120px; color: #e2e8f0;';
      td.innerHTML = '<br>';
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
    recalculateTableSummaries(selectedTableElement);
    handleEditorInput();
  };

  const handleAddTableColumn = () => {
    if (!selectedTableElement) return;
    const headerRow = (selectedTableElement.querySelector('thead tr') || selectedTableElement.rows[0]) as HTMLTableRowElement | null;
    const colNumber = headerRow ? headerRow.cells.length : 1;

    for (let r = 0; r < selectedTableElement.rows.length; r++) {
      const row = selectedTableElement.rows[r]!;
      const isHeader = row.parentElement?.tagName === 'THEAD' || r === 0;
      const isFooter = row.parentElement?.tagName === 'TFOOT' || row.classList.contains('table-summary-row');

      const cell = document.createElement(isHeader ? 'th' : 'td');
      if (isFooter) {
        cell.className = 'table-calc-cell';
        cell.setAttribute('data-calc', 'sum');
        cell.setAttribute('contenteditable', 'false');
        cell.style.cssText = 'border: 1px solid rgba(255,255,255,0.12); padding: 8px 12px; font-family: monospace; font-size: 12px; cursor: pointer; user-select: none; color: #10b981; font-weight: bold;';
        cell.setAttribute('title', 'Кликните для смены формулы: ∑ Сумма • Ø Среднее • # Кол-во • ↓ Мин • ↑ Макс');
        cell.innerHTML = '<span>∑ 0</span>';
      } else {
        cell.style.cssText = isHeader
          ? 'border: 1px solid rgba(255,255,255,0.12); padding: 10px 14px; font-weight: bold; text-align: left; color: #ffffff;'
          : 'border: 1px solid rgba(255,255,255,0.1); padding: 10px 14px; min-width: 120px; color: #e2e8f0;';
        cell.innerHTML = isHeader ? `Столбец ${colNumber}` : '<br>';
      }
      row.appendChild(cell);
    }
    recalculateTableSummaries(selectedTableElement);
    handleEditorInput();
  };

  const handleDeleteTableRow = () => {
    if (!selectedCellElement || !selectedTableElement) return;
    const row = selectedCellElement.parentElement as HTMLTableRowElement;
    if (row && selectedTableElement.rows.length > 1) {
      row.remove();
      const tbody = selectedTableElement.querySelector('tbody') || selectedTableElement;
      const allRows = tbody.querySelectorAll<HTMLTableRowElement>('tr');
      allRows.forEach((r, idx) => {
        const firstCell = r.cells[0];
        if (firstCell && firstCell.tagName === 'TD') {
          firstCell.innerText = `${idx + 1}`;
        }
      });
      setSelectedCellElement(null);
      recalculateTableSummaries(selectedTableElement);
      handleEditorInput();
    }
  };

  const handleToggleTableSummaryRow = () => {
    if (!selectedTableElement) return;
    const existingTfoot = selectedTableElement.querySelector('tfoot');
    if (existingTfoot) {
      existingTfoot.remove();
      handleEditorInput();
      setFixNotification('Строка итогов скрыта');
      setTimeout(() => setFixNotification(null), 2000);
      return;
    }

    const headerRow = (selectedTableElement.querySelector('thead tr') || selectedTableElement.rows[0]) as HTMLTableRowElement | null;
    const colCount = headerRow ? headerRow.cells.length : 4;

    const tfoot = document.createElement('tfoot');
    tfoot.style.cssText = 'background: rgba(16, 185, 129, 0.08); border-top: 2px solid rgba(16, 185, 129, 0.4);';

    const tr = document.createElement('tr');
    tr.className = 'table-summary-row';

    const sumTitleTd = document.createElement('td');
    sumTitleTd.style.cssText = 'border: 1px solid rgba(255,255,255,0.12); padding: 10px 12px; width: 48px; text-align: center; color: #10b981; font-weight: bold; user-select: none; font-size: 11px;';
    sumTitleTd.innerHTML = '<strong>∑</strong>';
    sumTitleTd.setAttribute('contenteditable', 'false');
    tr.appendChild(sumTitleTd);

    for (let c = 1; c < colCount; c++) {
      const td = document.createElement('td');
      td.className = 'table-calc-cell';
      td.setAttribute('data-calc', 'sum');
      td.setAttribute('contenteditable', 'false');
      td.style.cssText = 'border: 1px solid rgba(255,255,255,0.12); padding: 8px 12px; font-family: monospace; font-size: 12px; cursor: pointer; user-select: none; color: #10b981; font-weight: bold;';
      td.setAttribute('title', 'Кликните для смены формулы: ∑ Сумма • Ø Среднее • # Кол-во • ↓ Мин • ↑ Макс');
      td.innerHTML = '<span>∑ 0</span>';
      tr.appendChild(td);
    }

    tfoot.appendChild(tr);
    selectedTableElement.appendChild(tfoot);
    recalculateTableSummaries(selectedTableElement);
    handleEditorInput();
    setFixNotification('✓ Включена строка итогов и авто-подсчёта');
    setTimeout(() => setFixNotification(null), 2500);
  };

  const handleRecalculateSelectedTable = () => {
    if (selectedTableElement) {
      recalculateTableSummaries(selectedTableElement);
      handleEditorInput();
      setFixNotification('✓ Итоги таблицы пересчитаны');
      setTimeout(() => setFixNotification(null), 2000);
    }
  };

  const handleDeleteTable = () => {
    if (!selectedTableElement) return;
    selectedTableElement.remove();
    setSelectedTableElement(null);
    setSelectedCellElement(null);
    handleEditorInput();
  };

  // Handle clicking on calculation summary cells to cycle formulas
  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const calcCell = target.closest<HTMLTableCellElement>('.table-calc-cell');
    if (calcCell) {
      e.preventDefault();
      e.stopPropagation();
      const currentType = calcCell.getAttribute('data-calc') || 'sum';
      const cycleMap: Record<string, string> = {
        sum: 'avg',
        avg: 'count',
        count: 'min',
        min: 'max',
        max: 'none',
        none: 'sum',
      };
      const nextType = cycleMap[currentType] || 'sum';
      calcCell.setAttribute('data-calc', nextType);

      const typeNames: Record<string, string> = {
        sum: 'Сумма (∑)',
        avg: 'Среднее (Ø)',
        count: 'Количество (#)',
        min: 'Минимум (↓)',
        max: 'Максимум (↑)',
        none: 'Без подсчета (—)',
      };
      setFixNotification(`📊 Подсчёт для столбца: ${typeNames[nextType]}`);
      setTimeout(() => setFixNotification(null), 2500);

      const table = calcCell.closest('table');
      if (table) {
        recalculateTableSummaries(table);
        handleEditorInput();
      }
    }
  };

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* Embedded CSS for explicit rich word styles (lists, strikethrough, highlights) */}
      <style>{`
        .rich-word-content ul {
          list-style-type: disc !important;
          list-style-position: inside !important;
          margin: 8px 0 !important;
          padding: 0 !important;
        }
        .rich-word-content ol {
          list-style-type: decimal !important;
          list-style-position: inside !important;
          margin: 8px 0 !important;
          padding: 0 !important;
        }
        .rich-word-content li {
          display: list-item !important;
          margin: 4px 0 !important;
          line-height: 1.35 !important;
          height: auto !important;
          min-height: unset !important;
        }
        .rich-word-content li::marker {
          font-size: 1em !important;
          color: currentColor !important;
        }
        .rich-word-content s, .rich-word-content strike, .rich-word-content del, .rich-word-content [style*="line-through"] {
          text-decoration: none !important;
          background-image: linear-gradient(to right, currentColor 100%, transparent 0) !important;
          background-position: 0 56% !important;
          background-size: 100% 2px !important;
          background-repeat: no-repeat !important;
        }
        .rich-word-content mark, .rich-word-content span[style*="background-color"] {
          padding: 2px 6px !important;
          border-radius: 4px !important;
          display: inline !important;
          line-height: normal !important;
          vertical-align: baseline !important;
          height: auto !important;
          box-decoration-break: clone !important;
          -webkit-box-decoration-break: clone !important;
        }
        .rich-word-content table {
          border-collapse: collapse !important;
          width: 100% !important;
          max-width: 100% !important;
          table-layout: auto !important;
          margin: 16px 0 !important;
          display: table !important;
        }
        .rich-word-content th, .rich-word-content td {
          min-width: 90px !important;
          max-width: 280px !important;
          word-break: break-word !important;
          overflow-wrap: break-word !important;
        }
        .rich-word-content .table-summary-row {
          background: rgba(16, 185, 129, 0.08) !important;
          border-top: 2px solid rgba(16, 185, 129, 0.4) !important;
        }
        .rich-word-content .table-calc-cell {
          cursor: pointer !important;
          user-select: none !important;
          transition: background 0.15s ease, color 0.15s ease !important;
        }
        .rich-word-content .table-calc-cell:hover {
          background: rgba(16, 185, 129, 0.18) !important;
          box-shadow: inset 0 0 0 1px rgba(16, 185, 129, 0.5) !important;
        }
        .rich-word-content .visual-task-item {
          user-select: text !important;
        }
      `}</style>

      {/* 1. Mobile Format Bar Toggle */}
      <div className="w-full flex items-center justify-start gap-2 px-1 sm:hidden">
        <button
          type="button"
          onClick={() => setIsRibbonExpanded((v) => !v)}
          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
            isRibbonExpanded
              ? 'bg-[#7c5cff] text-white border-[#7c5cff]'
              : 'bg-[#14151e] text-[#cbd5e1] border-white/[0.08] hover:text-white'
          }`}
        >
          <span className="font-serif font-bold text-sm">Aa</span>
          <span>{isRibbonExpanded ? 'Скрыть панель' : 'Форматирование'}</span>
        </button>
      </div>

      {/* 1. Full Word Formatting Ribbon Bar (Always visible on desktop, toggleable on mobile) */}
      <div className={`${isRibbonExpanded ? 'block' : 'hidden sm:block'} transition-all`}>
        <WordStyleRibbon
          handlers={ribbonHandlers}
          currentSize={currentSize}
          currentAlign={currentAlign}
        />
      </div>

      {/* 1.1 Spellcheck Notification Toast */}
      {fixNotification && (
        <div className="p-2.5 px-4 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-between text-xs animate-fade-in shadow-xl text-emerald-200">
          <div className="flex items-center gap-2 font-medium">
            <Sparkles size={14} className="text-emerald-400" />
            <span>{fixNotification}</span>
          </div>
          <span className="text-[11px] text-emerald-400/80">Орфография и пунктуация обновлены</span>
        </div>
      )}

      {/* 2. Live Inline Math Autocomplete Badge */}
      {inlineMathSuggestion && (
        <div className="p-3 rounded-xl bg-[#7c5cff]/20 border border-[#7c5cff]/50 flex items-center justify-between text-xs animate-fade-in shadow-xl">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#f59e0b] animate-pulse" />
            <span className="text-white font-mono text-sm">
              {inlineMathSuggestion.expr} ={' '}
              <strong className="text-[#10b981] font-bold text-base">
                {inlineMathSuggestion.result.toLocaleString('ru-RU')}
              </strong>
            </span>
          </div>
          <button
            onClick={applyInlineMath}
            className="px-3.5 py-1.5 rounded-lg bg-[#7c5cff] text-white font-semibold text-xs hover:bg-[#7c5cff]/90 flex items-center gap-1.5 shadow"
          >
            <span>Вставить (Tab)</span>
            <Check size={14} />
          </button>
        </div>
      )}

      {/* 3. In-Place Table Micro-Toolbar */}
      {selectedTableElement && (
        <div className="flex items-center gap-2 p-2 bg-[#171822] border border-[#10b981]/40 rounded-xl text-xs shadow-2xl animate-fade-in flex-wrap">
          <div className="flex items-center gap-1.5 text-[#10b981] font-bold px-2 py-0.5 border-r border-white/10">
            <TableIcon size={14} />
            <span>Таблица:</span>
          </div>

          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleAddTableRow}
            className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-white flex items-center gap-1.5 transition-colors font-medium"
          >
            <Rows size={13} className="text-[#38bdf8]" />
            <span>+ Строка</span>
          </button>

          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleAddTableColumn}
            className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-white flex items-center gap-1.5 transition-colors font-medium"
          >
            <Columns size={13} className="text-[#7c5cff]" />
            <span>+ Столбец</span>
          </button>

          {/* Summary Row Calculation Toggle */}
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleToggleTableSummaryRow}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all border ${
              selectedTableElement.querySelector('tfoot')
                ? 'bg-[#10b981]/20 border-[#10b981]/50 text-[#10b981]'
                : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/[0.08] text-[#94a3b8] hover:text-white'
            }`}
            title="Включить / выключить строку авто-подсчёта и итогов снизу таблицы"
          >
            <Calculator size={13} className="text-[#10b981]" />
            <span>∑ Строка итогов {selectedTableElement.querySelector('tfoot') ? '(ВКЛ)' : '(ВЫКЛ)'}</span>
          </button>

          {selectedTableElement.querySelector('tfoot') && (
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleRecalculateSelectedTable}
              className="px-2.5 py-1.5 rounded-lg bg-[#10b981]/10 hover:bg-[#10b981]/20 text-[#10b981] flex items-center gap-1 font-semibold transition-colors"
              title="Пересчитать все столбцы"
            >
              <RefreshCw size={12} />
              <span>Пересчитать</span>
            </button>
          )}

          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleDeleteTableRow}
            className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#f43f5e] flex items-center gap-1 transition-colors"
          >
            <Trash2 size={13} />
            <span>Удалить строку</span>
          </button>

          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleDeleteTable}
            className="px-3 py-1.5 rounded-lg bg-[#f43f5e]/15 hover:bg-[#f43f5e]/25 text-[#f43f5e] font-semibold flex items-center gap-1.5 ml-auto transition-colors"
          >
            <Trash2 size={13} />
            <span>Удалить таблицу</span>
          </button>
        </div>
      )}

      {/* 4. Note Title Input */}
      <input
        type="text"
        value={noteTitle || ''}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Заголовок заметки..."
        className="w-full bg-transparent text-2xl sm:text-3xl font-extrabold text-white focus:outline-none placeholder:text-[#475569] tracking-tight px-1 py-1"
      />

      {/* 5. Full Width Visual Content Workspace with clean horizontal table scroll */}
      <div className="w-full max-w-full bg-transparent sm:bg-[#101117]/80 border-0 sm:border sm:border-white/[0.08] rounded-none sm:rounded-2xl p-1.5 sm:p-8 min-h-[60vh] sm:shadow-2xl focus-within:border-[#7c5cff]/50 transition-colors overflow-x-auto">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          spellCheck
          lang="ru"
          onClick={handleEditorClick}
          onInput={handleEditorInput}
          onBlur={handleEditorBlur}
          onKeyDown={handleKeyDown}
          onSelect={updateSelectionFormatting}
          onKeyUp={updateSelectionFormatting}
          onMouseUp={updateSelectionFormatting}
          onTouchEnd={updateSelectionFormatting}
          className="rich-word-content w-full h-full min-h-[500px] max-w-full bg-transparent text-[#e2e8f0] text-base leading-relaxed focus:outline-none select-text font-sans selection:bg-[#7c5cff]/40 overflow-x-auto"
          style={{
            minHeight: '500px',
          }}
        />
      </div>
    </div>
  );
};
