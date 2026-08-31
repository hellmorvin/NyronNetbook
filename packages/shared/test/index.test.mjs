import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseMarkdown,
  serializeMarkdown,
  extractWikiLinks,
  HybridSearchEngine,
  russianSoundex,
  englishSoundex,
  computeHash,
  createMerkleRoot
} from '../dist/index.js';

test('Markdown Parser & Wiki-link extraction', () => {
  const sampleNote = `---
id: "neu_test_123"
title: "Quantum Brain Dynamics"
tags: ["physics", "ai"]
pinned: true
learning_state: "mastered"
---

# Quantum Brain Dynamics

This note links to [[Neural Networks]] and [[Neurobiology|Biological Systems]].
`;

  const neuron = parseMarkdown(sampleNote, 'quantum.md');
  assert.equal(neuron.id, 'neu_test_123');
  assert.equal(neuron.title, 'Quantum Brain Dynamics');
  assert.equal(neuron.pinned, true);
  assert.equal(neuron.learningState, 'mastered');
  assert.deepEqual(neuron.tags, ['physics', 'ai']);
  assert.deepEqual(neuron.wikiLinks, ['Neural Networks', 'Neurobiology']);

  const serialized = serializeMarkdown(neuron);
  assert.match(serialized, /title:\s*["']?Quantum Brain Dynamics["']?/);
  assert.match(serialized, /pinned:\s*true/);
});

test('Phonetic search handles typos in Russian and English', () => {
  const code1 = russianSoundex('привет');
  const code2 = russianSoundex('превед');
  assert.equal(code1, code2, 'Russian Soundex should match привет and превед');

  const en1 = englishSoundex('quantum');
  const en2 = englishSoundex('kwantum');
  assert.equal(en1, en2, 'English Soundex should match quantum and kwantum');
});

test('HybridSearchEngine indexes and retrieves matches', () => {
  const engine = new HybridSearchEngine();
  const n1 = parseMarkdown('# Artificial Intelligence\n\nDeep learning and neural networks.', 'ai.md');
  const n2 = parseMarkdown('# Quantum Computing\n\nQubits and superposition principles.', 'quantum.md');

  engine.indexAll([n1, n2]);

  const res1 = engine.search('learning');
  assert.ok(res1.length > 0);
  assert.equal(res1[0].id, n1.id);

  // Test phonetic match
  const res2 = engine.search('kwantum');
  assert.ok(res2.length > 0);
  assert.equal(res2[0].id, n2.id);
});

test('Merkle root hashing computes deterministic digest', () => {
  const leaves = [
    { id: 'neu_1', filePath: '1.md', contentHash: computeHash('hello'), updatedAt: 1000 },
    { id: 'neu_2', filePath: '2.md', contentHash: computeHash('world'), updatedAt: 2000 },
  ];
  const root1 = createMerkleRoot(leaves);
  const root2 = createMerkleRoot(leaves);
  assert.equal(root1, root2);
  assert.notEqual(root1, 'empty_vault_00000000');
});

test('3-Way Merge Algorithm handles fast-forward, clean non-conflicting patches and conflicts', async () => {
  const { threeWayMerge } = await import('../dist/index.js');
  
  // 1. Fast-forward: local matches base -> returns remote
  const ff1 = threeWayMerge('base text', 'base text', 'remote updated text');
  assert.equal(ff1.hasConflicts, false);
  assert.equal(ff1.merged, 'remote updated text');

  // 2. Fast-forward: remote matches base -> returns local
  const ff2 = threeWayMerge('base text', 'local updated text', 'base text');
  assert.equal(ff2.hasConflicts, false);
  assert.equal(ff2.merged, 'local updated text');

  // 3. Both modified cleanly in different sections
  const baseMulti = 'Line 1: Header\n\nLine 2: Middle Section\n\nLine 3: Footer';
  const localMulti = 'Line 1: Header (Modified by Local)\n\nLine 2: Middle Section\n\nLine 3: Footer';
  const remoteMulti = 'Line 1: Header\n\nLine 2: Middle Section\n\nLine 3: Footer (Modified by Remote)';

  const mergeClean = threeWayMerge(baseMulti, localMulti, remoteMulti);
  assert.equal(mergeClean.hasConflicts, false);
  assert.match(mergeClean.merged, /Modified by Local/);
  assert.match(mergeClean.merged, /Modified by Remote/);

  // 4. Overlapping conflict
  const conflictLocal = 'Line 1: Header\n\nLine 2: Middle LOCAL EDIT\n\nLine 3: Footer';
  const conflictRemote = 'Line 1: Header\n\nLine 2: Middle REMOTE EDIT\n\nLine 3: Footer';
  const mergeConflict = threeWayMerge(baseMulti, conflictLocal, conflictRemote);
  assert.equal(mergeConflict.hasConflicts, true);
  assert.match(mergeConflict.merged, /<<<<<<< LOCAL/);
  assert.match(mergeConflict.merged, />>>>>>> REMOTE/);
});

test('NotebookLM Source Pack Exporter builds well-formatted multi-note markdown', async () => {
  const { exportVaultAsNotebookLMSourcePack } = await import('../dist/index.js');

  const notes = [
    { title: 'Neural Networks', content: 'Deep learning concepts.', folder: 'AI', tags: ['ml', 'math'] },
    { title: 'Dopamine Pathways', content: 'Reward system anatomy.', folder: 'Bio', tags: ['neuro'] },
  ];

  const sourcePack = exportVaultAsNotebookLMSourcePack(notes);
  assert.match(sourcePack, /ПАКЕТ ИСТОЧНИКОВ NEIRONOBOOCK ДЛЯ NOTEBOOKLM/);
  assert.match(sourcePack, /ИСТОЧНИК 1: Neural Networks/);
  assert.match(sourcePack, /ИСТОЧНИК 2: Dopamine Pathways/);
  assert.match(sourcePack, /Deep learning concepts/);
});
