import * as Diff from 'diff';
import { MerkleLeaf } from '../types/index.js';

export function computeHash(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function createMerkleRoot(leaves: MerkleLeaf[]): string {
  if (leaves.length === 0) return 'empty_vault_00000000';
  
  // Sort leaves by ID for deterministic hashing
  const sorted = [...leaves].sort((a, b) => a.id.localeCompare(b.id));
  const combined = sorted.map((l) => `${l.id}:${l.contentHash}:${l.updatedAt}`).join('|');
  return computeHash(combined);
}

export interface MergeResult {
  merged: string;
  hasConflicts: boolean;
  conflictDetails?: {
    localSnippet: string;
    remoteSnippet: string;
  };
}

export function threeWayMerge(base: string, local: string, remote: string): MergeResult {
  // Fast-forward checks
  if (local === base) {
    return { merged: remote, hasConflicts: false };
  }
  if (remote === base || local === remote) {
    return { merged: local, hasConflicts: false };
  }

  // Try applying remote patch on local with zero context (disjoint line edits)
  const patch0 = Diff.structuredPatch('note.md', 'note.md', base, remote, '', '', { context: 0 });
  const applied0 = Diff.applyPatch(local, patch0);
  if (typeof applied0 === 'string') {
    return {
      merged: applied0,
      hasConflicts: false,
    };
  }

  // Try standard structured patch
  const patchDefault = Diff.structuredPatch('note.md', 'note.md', base, remote);
  const appliedDefault = Diff.applyPatch(local, patchDefault);
  if (typeof appliedDefault === 'string') {
    return {
      merged: appliedDefault,
      hasConflicts: false,
    };
  }

  // Real conflict occurred - create conflict markers
  const conflictMerged = `<<<<<<< LOCAL\n${local}\n=======\n${remote}\n>>>>>>> REMOTE`;
  return {
    merged: conflictMerged,
    hasConflicts: true,
    conflictDetails: {
      localSnippet: local.slice(0, 200),
      remoteSnippet: remote.slice(0, 200),
    },
  };
}
