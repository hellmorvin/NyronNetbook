import MiniSearch from 'minisearch';
import { Neuron, SearchMatch } from '../types/index.js';
import { generatePhoneticKey } from './phonetic.js';

interface IndexedDoc {
  id: string;
  title: string;
  content: string;
  tags: string;
  phoneticTitle: string;
}

export class HybridSearchEngine {
  private miniSearch: MiniSearch<IndexedDoc>;
  private neuronsMap: Map<string, Neuron> = new Map();

  constructor() {
    this.miniSearch = new MiniSearch<IndexedDoc>({
      fields: ['title', 'content', 'tags', 'phoneticTitle'],
      storeFields: ['id', 'title', 'tags'],
      searchOptions: {
        boost: { title: 4, phoneticTitle: 2, tags: 2, content: 1 },
        fuzzy: 0.25,
        prefix: true,
      },
    });
  }

  public indexAll(neurons: Neuron[]): void {
    this.miniSearch.removeAll();
    this.neuronsMap.clear();

    const docs: IndexedDoc[] = neurons.map((n) => {
      this.neuronsMap.set(n.id, n);
      const phoneticTitle = n.title
        .split(/\s+/)
        .map((w) => generatePhoneticKey(w))
        .join(' ');

      return {
        id: n.id,
        title: n.title,
        content: n.content,
        tags: n.tags.join(' '),
        phoneticTitle,
      };
    });

    this.miniSearch.addAll(docs);
  }

  public indexNeuron(neuron: Neuron): void {
    this.neuronsMap.set(neuron.id, neuron);
    if (this.miniSearch.has(neuron.id)) {
      this.miniSearch.discard(neuron.id);
    }
    const phoneticTitle = neuron.title
      .split(/\s+/)
      .map((w) => generatePhoneticKey(w))
      .join(' ');

    this.miniSearch.add({
      id: neuron.id,
      title: neuron.title,
      content: neuron.content,
      tags: neuron.tags.join(' '),
      phoneticTitle,
    });
  }

  public removeNeuron(id: string): void {
    this.neuronsMap.delete(id);
    if (this.miniSearch.has(id)) {
      this.miniSearch.discard(id);
    }
  }

  public search(query: string, limit = 15): SearchMatch[] {
    const trimmed = query.trim();
    if (!trimmed) return [];

    // Search lexical & phonetic
    const queryPhonetics = trimmed
      .split(/\s+/)
      .map((w) => generatePhoneticKey(w))
      .join(' ');

    const combinedQuery = `${trimmed} ${queryPhonetics}`;
    const results = this.miniSearch.search(combinedQuery, {
      prefix: true,
      fuzzy: 0.2,
      boost: { title: 4, tags: 2, content: 1 },
    });

    return results.slice(0, limit).map((r) => {
      const neuron = this.neuronsMap.get(r.id);
      let snippet: string | undefined = undefined;

      if (neuron?.content) {
        const lowerContent = neuron.content.toLowerCase();
        const lowerQuery = trimmed.toLowerCase();
        const matchIdx = lowerContent.indexOf(lowerQuery);

        if (matchIdx !== -1) {
          const start = Math.max(0, matchIdx - 40);
          const end = Math.min(neuron.content.length, matchIdx + lowerQuery.length + 60);
          snippet = (start > 0 ? '...' : '') + neuron.content.slice(start, end) + (end < neuron.content.length ? '...' : '');
        } else {
          snippet = neuron.content.slice(0, 100) + (neuron.content.length > 100 ? '...' : '');
        }
      }

      return {
        id: r.id,
        title: r.title,
        score: r.score,
        matchedField: (r.match && Object.keys(r.match)[0] as 'title' | 'content' | 'tags') || 'title',
        snippet,
      };
    });
  }
}
