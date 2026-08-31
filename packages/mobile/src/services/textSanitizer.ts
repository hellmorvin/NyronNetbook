/**
 * Utility to strip raw HTML tags, code blocks, Markdown artifacts,
 * callouts and entities so that raw code NEVER leaks into the UI previews or snippets.
 */
export function stripCodeAndHtml(raw?: string): string {
  if (!raw || typeof raw !== 'string') return '';

  let text = raw;

  // 1. Remove YAML frontmatter if present (--- ... ---)
  text = text.replace(/^---[\s\S]*?---\s*/m, ' ');

  // 2. Remove script / style / svg / iframe blocks entirely with their contents
  text = text.replace(/<(script|style|svg|iframe)[\s\S]*?<\/\1>/gi, ' ');

  // 3. Remove markdown fenced code blocks (``` ... ```)
  text = text.replace(/```[\s\S]*?```/g, ' ');

  // 4. Remove inline code (`code`)
  text = text.replace(/`([^`]+)`/g, '$1');

  // 5. Remove HTML tags (<...>)
  text = text.replace(/<[^>]+>/g, ' ');

  // 6. Decode common HTML entities
  text = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–')
    .replace(/&copy;/gi, '©')
    .replace(/&#\d+;/g, ' ');

  // 7. Strip Markdown Callout tags like [!tip], [!note], [!warning], [!important], [!caution]
  text = text.replace(/\[!(tip|note|warning|important|caution|info|summary|quote)\]/gi, ' ');

  // 8. Strip Markdown Links & Images
  text = text.replace(/!\[.*?\]\(.*?\)/g, ' ');
  text = text.replace(/\[(.*?)\]\(.*?\)/g, '$1');
  text = text.replace(/\[\[.*?\|(.*?)\]\]/g, '$1');
  text = text.replace(/\[\[(.*?)\]\]/g, '$1');

  // 9. Strip Markdown headers, formatting symbols, and table pipes
  text = text
    .replace(/#+/g, '')
    .replace(/[*_~`]/g, '')
    .replace(/^>\s+/gm, ' ')
    .replace(/^[*-+]\s+/gm, ' ')
    .replace(/\|/g, ' ')
    .replace(/[-=]{3,}/g, ' ');

  // 10. Normalize multiple spaces and line breaks into single space
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

/**
 * Returns a human-friendly clean text snippet for note cards and lists.
 * If the note contains only empty tags, returns a friendly placeholder.
 */
export function getCleanSnippet(content?: string, maxLength = 120): string {
  const clean = stripCodeAndHtml(content);
  if (!clean) return 'Заметка пока пуста... Нажмите, чтобы наполнить мыслями.';
  return clean.slice(0, maxLength) + (clean.length > maxLength ? '...' : '');
}
