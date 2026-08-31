import matter from 'gray-matter';
import { Neuron, NeuronFrontmatter, LearningState } from '../types/index.js';

export function generateNeuronId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 7);
  return `neu_${timestamp}_${randomPart}`;
}

export function extractWikiLinks(markdown: string): string[] {
  const wikiLinkRegex = /\[\[([^[\]|]+)(?:\|[^[\]]+)?\]\]/g;
  const links: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = wikiLinkRegex.exec(markdown)) !== null) {
    const rawTarget = match[1]?.trim();
    if (rawTarget && !links.includes(rawTarget)) {
      links.push(rawTarget);
    }
  }

  return links;
}

export function parseMarkdown(rawContent: string, filePath = 'untitled.md'): Neuron {
  let frontmatterData: Record<string, unknown> = {};
  let bodyContent = rawContent;

  try {
    const parsed = matter(rawContent);
    frontmatterData = parsed.data || {};
    bodyContent = parsed.content;
  } catch {
    // If frontmatter is malformed, treat entire content as body
    bodyContent = rawContent;
  }

  // Determine Title
  let title = (frontmatterData['title'] as string) || '';
  if (!title) {
    const firstHeaderMatch = /^#\s+(.+)$/m.exec(bodyContent);
    if (firstHeaderMatch && firstHeaderMatch[1]) {
      title = firstHeaderMatch[1].trim();
    } else {
      const baseFilename = filePath.replace(/\\/g, '/').split('/').pop() || 'Untitled';
      title = baseFilename.replace(/\.md$/i, '');
    }
  }

  const id = (frontmatterData['id'] as string) || generateNeuronId();
  const createdAt = frontmatterData['created_at']
    ? new Date(frontmatterData['created_at'] as string).getTime()
    : Date.now();
  const updatedAt = frontmatterData['updated_at']
    ? new Date(frontmatterData['updated_at'] as string).getTime()
    : Date.now();

  const tags = Array.isArray(frontmatterData['tags'])
    ? (frontmatterData['tags'] as string[])
    : [];

  const pinned = Boolean(frontmatterData['pinned']);
  const learningState: LearningState = (['new', 'learning', 'review', 'mastered'].includes(
    frontmatterData['learning_state'] as string
  )
    ? (frontmatterData['learning_state'] as LearningState)
    : 'new');

  const activationLevel = typeof frontmatterData['activation_level'] === 'number'
    ? Math.max(0, Math.min(1, frontmatterData['activation_level']))
    : 0.5;

  const accessCount = typeof frontmatterData['access_count'] === 'number'
    ? Math.max(0, frontmatterData['access_count'])
    : 1;

  // Default colors
  let color = (frontmatterData['color_override'] as string) || '';
  if (!color) {
    if (pinned) {
      color = '#ffb829'; // Saffron Spark
    } else if (learningState === 'mastered') {
      color = '#15846e'; // Deep Verdant
    } else {
      color = '#8052ff'; // Electric Iris
    }
  }

  // 3D position
  const posData = frontmatterData['position'] as { x?: number; y?: number; z?: number } | undefined;
  const position = {
    x: typeof posData?.x === 'number' ? posData.x : (Math.random() - 0.5) * 50,
    y: typeof posData?.y === 'number' ? posData.y : (Math.random() - 0.5) * 50,
    z: typeof posData?.z === 'number' ? posData.z : (Math.random() - 0.5) * 50,
  };

  const wikiLinks = extractWikiLinks(bodyContent);

  const frontmatter: NeuronFrontmatter = {
    id,
    title,
    created_at: new Date(createdAt).toISOString(),
    updated_at: new Date(updatedAt).toISOString(),
    tags,
    pinned,
    color_override: color,
    activation_level: activationLevel,
    access_count: accessCount,
    learning_state: learningState,
    position,
  };

  return {
    id,
    filePath,
    title,
    content: bodyContent.trim(),
    rawContent,
    frontmatter,
    wikiLinks,
    backlinks: [],
    outlinks: [],
    tags,
    pinned,
    color,
    learningState,
    activationLevel,
    accessCount,
    position,
    createdAt,
    updatedAt,
  };
}

export function serializeMarkdown(neuron: Neuron): string {
  const frontmatterObj: Record<string, unknown> = {
    id: neuron.id,
    title: neuron.title,
    created_at: new Date(neuron.createdAt).toISOString(),
    updated_at: new Date(neuron.updatedAt).toISOString(),
    tags: neuron.tags,
    pinned: neuron.pinned,
    color_override: neuron.color,
    activation_level: Math.round(neuron.activationLevel * 100) / 100,
    access_count: neuron.accessCount,
    learning_state: neuron.learningState,
    position: {
      x: Math.round(neuron.position.x * 100) / 100,
      y: Math.round(neuron.position.y * 100) / 100,
      z: Math.round(neuron.position.z * 100) / 100,
    },
  };

  const stringified = matter.stringify(neuron.content, frontmatterObj);
  return stringified;
}
