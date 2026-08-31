import { AIChatMessage, QuizCard } from '../types/index.js';

export function createBookDistillerPrompt(
  chapterText: string,
  existingNeuronTitles: string[]
): AIChatMessage[] {
  return [
    {
      role: 'system',
      content: `You are a cognitive neuroscientist and knowledge architect. Your task is to analyze book chapters or texts and distill them into an interconnected neural cluster of concepts.
Output strictly valid JSON with this structure:
{
  "chapterTitle": "Title of the chapter/topic",
  "coreInsight": "The 1-2 sentence core breakthrough insight",
  "neurons": [
    {
      "title": "Clear Concept Title",
      "content": "Detailed markdown explanation with key principles, formulas, or takeaways.",
      "tags": ["tag1", "tag2"],
      "suggestedLinks": ["Existing Or New Concept Title"]
    }
  ]
}`,
    },
    {
      role: 'user',
      content: `Analyze this text and break it down into 3-5 distinct, linked neural notes.
Existing known notes in the vault: ${existingNeuronTitles.slice(0, 50).join(', ')}

TEXT:
${chapterText}`,
    },
  ];
}

export function createLinkSuggesterPrompt(
  currentNoteTitle: string,
  currentNoteContent: string,
  allVaultTitles: string[]
): AIChatMessage[] {
  return [
    {
      role: 'system',
      content: `You are an AI Synaptic Linker for a second-brain knowledge base. Your goal is to find non-obvious and meaningful conceptual connections between notes.
Always write the "reason" and "suggestedSentence" in Russian.
Output strictly a JSON array of objects without code fences:
[
  {
    "targetTitle": "Точное название заметки из списка",
    "reason": "Краткое объяснение связи на русском языке",
    "suggestedSentence": "Пример фразы с [[Название заметки]] для вставки в текст"
  }
]`,
    },
    {
      role: 'user',
      content: `Текущая заметка: "${currentNoteTitle}"
Текст:
${currentNoteContent}

Доступные заметки в базе:
${allVaultTitles.join(', ')}

Предложи 3-5 лучших связей для объединения в кластер.`,
    },
  ];
}

export function createQuizGeneratorPrompt(
  noteTitle: string,
  noteContent: string,
  count = 5
): AIChatMessage[] {
  return [
    {
      role: 'system',
      content: `You are an expert tutor creating active-recall flashcards and exam questions for spaced repetition.
Output strictly a JSON array of objects matching this schema:
[
  {
    "question": "Clear, challenging question testing understanding",
    "options": ["A", "B", "C", "D"], // Optional 4 multiple-choice options
    "correctAnswer": "The exact correct answer or letter",
    "explanation": "Why this answer is correct and key memory cue",
    "sourceNeuronId": ""
  }
]`,
    },
    {
      role: 'user',
      content: `Create ${count} active-recall quiz cards based on this note:
Topic: "${noteTitle}"

Content:
${noteContent}`,
    },
  ];
}

export function createCondenserPrompt(
  text: string,
  mode: 'compress' | 'socratic' | 'reformat' | 'eli5'
): AIChatMessage[] {
  let systemPrompt = '';
  switch (mode) {
    case 'compress':
      systemPrompt =
        'You are an executive editor. Compress the provided text by 50% without losing any factual depth, nuance, or critical details. Format with clean bullet points and bold key terms.';
      break;
    case 'socratic':
      systemPrompt =
        'You are Socrates. Do not summarize or give direct answers. Instead, analyze the text and ask 3-4 probing, deep questions that force the learner to test their assumptions and uncover deeper connections.';
      break;
    case 'eli5':
      systemPrompt =
        'Explain the core concept in this text simply and intuitively (like to a 12-year-old), using a vivid real-world metaphor, followed by a concise 3-bullet takeaway.';
      break;
    case 'reformat':
    default:
      systemPrompt =
        'Transform this raw stream-of-consciousness text into polished, structured GitHub-flavored Markdown with clear headings (##), key bullet points, callout quotes, and code/math blocks where appropriate.';
      break;
  }

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: text },
  ];
}

export function createFreeChatPrompt(
  userQuery: string,
  contextNote?: { title: string; content: string },
  vaultTitles?: string[],
  chatHistory: AIChatMessage[] = []
): AIChatMessage[] {
  let contextBlock = '';
  if (contextNote) {
    contextBlock += `\n\n[ТЕКУЩАЯ АКТИВНАЯ ЗАМЕТКА]:\nНазвание: "${contextNote.title}"\nТекст:\n${contextNote.content.slice(0, 4000)}`;
  }
  if (vaultTitles && vaultTitles.length > 0) {
    contextBlock += `\n\n[СПИСОК ВСЕХ ЗАМЕТОК В БАЗЕ ЗНАНИЙ]:\n${vaultTitles.slice(0, 100).join(', ')}`;
  }

  const systemMessage: AIChatMessage = {
    role: 'system',
    content: `Ты — интеллектуальный Нейро-Ассистент и персональный второй мозг в приложении NeironoBoock.
Твоя цель: помогать пользователю работать с заметками, структурировать мысли, генерировать идеи, писать код, объяснять сложные концепции и находить связи в базе знаний.
Отвечай грамотно, структурированно, используя красивый Markdown, списки, выделения ключевых мыслей и вики-ссылки формата [[Название Заметки]] там, где это уместно.${contextBlock}`,
  };

  return [systemMessage, ...chatHistory, { role: 'user', content: userQuery }];
}

/**
 * NotebookLM Audio Overview (Deep Dive Podcast) Prompt Generator.
 * Creates an engaging dialogue between two expert AI podcast hosts based on vault notes.
 */
export function createNotebookLMPodcastPrompt(
  sources: Array<{ title: string; content: string }>
): AIChatMessage[] {
  const formattedSources = sources
    .map((s, idx) => `### [Источник ${idx + 1}]: "${s.title}"\n${s.content.slice(0, 3000)}`)
    .join('\n\n---\n\n');

  return [
    {
      role: 'system',
      content: `You are the executive director of Google NotebookLM "Deep Dive" Audio Overviews.
Your mission is to generate a lively, intelligent, captivating podcast conversation between two hosts:
- **Алексей** (любознательный ведущий, задаёт наводящие вопросы, приводит жизненные примеры и метафоры)
- **Елена** (эксперт-аналитик, объясняет неочевидные связи, ссылается на первоисточники и выстраивает структуру)

Rules for output:
1. Write in natural conversational Russian (живой подкаст, непринужденный диалог, юмор, глубокие инсайты).
2. Ground all claims STRICTLY in the provided Sources. When referencing an idea, specify which source it came from.
3. Structure each speech line strictly as:
**Алексей:** <текст реплики>
или
**Елена:** <текст реплики>
4. Keep the pace engaging: opening hook -> exploration of main themes -> surprising counter-intuitive facts -> practical conclusion.`,
    },
    {
      role: 'user',
      content: `Создай увлекательный подкаст (Audio Overview) формата NotebookLM Deep Dive на основе следующих ${sources.length} источников базы знаний:

${formattedSources}

Создай живой сценарий подкаста (10-16 реплик), который глубоко раскрывает смысл этих материалов.`,
    },
  ];
}

/**
 * NotebookLM Research & Grounded Study Document Generator (Study Guide, Briefing Doc, FAQ, Timeline).
 */
export function createNotebookLMBriefingPrompt(
  sources: Array<{ title: string; content: string }>,
  docType: 'guide' | 'briefing' | 'faq' | 'timeline'
): AIChatMessage[] {
  const formattedSources = sources
    .map((s, idx) => `### [Источник ${idx + 1}]: "${s.title}"\n${s.content.slice(0, 3000)}`)
    .join('\n\n---\n\n');

  let typeDescription = '';
  switch (docType) {
    case 'guide':
      typeDescription = 'Руководство по изучению (Study Guide): Ключевые понятия и глоссарий, вопросы для самопроверки с ответами, практические кейсы применения и ментальная карта связей.';
      break;
    case 'briefing':
      typeDescription = 'Брифинг-документ (Briefing Document): Резюме для руководства (Executive Summary), главные выводы, критические тезисы, потенциальные риски и рекомендации к действию.';
      break;
    case 'faq':
      typeDescription = 'Часто задаваемые вопросы (FAQ): 6-8 важнейших вопросов, возникающих при чтении материалов, с исчерпывающими ответами и цитатами.';
      break;
    case 'timeline':
      typeDescription = 'Хронология и таймлайн (Timeline & Sequence): Логическая или историческая цепочка развития идей/событий, причинно-следственные связи и ключевые вехи.';
      break;
  }

  return [
    {
      role: 'system',
      content: `You are the Google NotebookLM Research Engine. You generate pristine, executive-level grounded research artifacts.
Every statement must be verifiable against the sources provided. Include citations formatted as [Источник: "Название заметки"].
Output beautiful Markdown with bold terms, neat tables, callouts, and numbered lists.`,
    },
    {
      role: 'user',
      content: `Сгенерируй документ типа: ${typeDescription}

ИСТОЧНИКИ (${sources.length} заметок):
${formattedSources}`,
    },
  ];
}

/**
 * NotebookLM Grounded Q&A with In-line Citations.
 */
export function createNotebookLMGroundedQAPrompt(
  question: string,
  sources: Array<{ title: string; content: string }>
): AIChatMessage[] {
  const formattedSources = sources
    .map((s, idx) => `### [Источник ${idx + 1}]: "${s.title}"\n${s.content.slice(0, 3500)}`)
    .join('\n\n---\n\n');

  return [
    {
      role: 'system',
      content: `You are Google NotebookLM Grounded Assistant.
Your answers are strictly grounded in the provided sources. If the answer cannot be found in the sources, clearly state: "В предоставленных источниках нет информации об этом."
Always cite your sources using inline tags like [Источник 1: "Название"] or [Заметка: "Название"].
Write in clear, structured Russian with Markdown.`,
    },
    {
      role: 'user',
      content: `Вопрос пользователя: "${question}"

ДОСТУПНЫЕ ИСТОЧНИКИ:
${formattedSources}`,
    },
  ];
}

/**
 * Packs notes into a clean, unified NotebookLM Source Bundle with metadata and table of contents.
 */
export function exportVaultAsNotebookLMSourcePack(
  notes: Array<{ title: string; content: string; folder?: string; tags?: string[] }>
): string {
  const dateStr = new Date().toLocaleDateString('ru-RU');
  const header = `# 🧠 ПАКЕТ ИСТОЧНИКОВ NEIRONOBOOCK ДЛЯ NOTEBOOKLM
**Дата сборки:** ${dateStr}
**Всего источников:** ${notes.length} документов
**Формат:** Markdown Optimized for Google Gemini 1.5/2.0 Pro (2M Context)

---

## 📑 Оглавление источников (Table of Sources)
${notes.map((n, i) => `${i + 1}. **${n.title}** ${n.folder ? `(Папка: _${n.folder}_)` : ''} ${n.tags && n.tags.length ? `[${n.tags.join(', ')}]` : ''}`).join('\n')}

---
`;

  const body = notes
    .map((n, i) => {
      const cleanContent = n.content.trim();
      return `## 📄 ИСТОЧНИК ${i + 1}: ${n.title}
${n.folder ? `> 📁 **Раздел:** ${n.folder}\n` : ''}${n.tags && n.tags.length ? `> 🏷️ **Теги:** ${n.tags.map((t) => `#${t}`).join(' ')}\n` : ''}
${cleanContent}

<!-- SOURCE_END -->
`;
    })
    .join('\n---\n\n');

  return `${header}\n${body}`;
}

