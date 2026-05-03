/**
 * Tests for task-contract-check.ts — deterministic pre-flight that extracts
 * named symbols from a task's `What:` line and checks each against the diff.
 *
 * Drives Axis 6 / finding #6: cold-reader scope #7 (task-contract conformance)
 * was previously the model's job; this lifts it to a mechanical check whose
 * results get injected into the cold-reader input.
 */

import { describe, expect, it } from 'vitest';

import {
  checkTaskContract,
  extractTaskWhatSymbols,
} from './task-contract-check';

describe('extractTaskWhatSymbols', () => {
  it('returns an empty list for null/empty input', () => {
    expect(extractTaskWhatSymbols(null)).toEqual([]);
    expect(extractTaskWhatSymbols('')).toEqual([]);
    expect(extractTaskWhatSymbols('   ')).toEqual([]);
  });

  it('extracts backtick-quoted identifiers and classifies them', () => {
    const what =
      'Create `src/features/incidents/types.ts` with `Incident`, `Severity`, `JournalEntry`.';
    const symbols = extractTaskWhatSymbols(what);
    const map = new Map(symbols.map((s) => [s.symbol, s.kind]));
    expect(map.get('src/features/incidents/types.ts')).toBe('path');
    expect(map.get('Incident')).toBe('identifier');
    expect(map.get('Severity')).toBe('identifier');
    expect(map.get('JournalEntry')).toBe('identifier');
  });

  it('strips parens from method-call-style backticks', () => {
    const what = 'Methods: `create(input)`, `get(id)`, `findActiveForUser()`.';
    const symbols = extractTaskWhatSymbols(what);
    const names = symbols.map((s) => s.symbol);
    expect(names).toContain('create');
    expect(names).toContain('get');
    expect(names).toContain('findActiveForUser');
    expect(names).not.toContain('create(input)');
  });

  it('dedupes repeated symbols', () => {
    const what = 'Add `appendJournal` and `appendJournal` again.';
    const symbols = extractTaskWhatSymbols(what);
    expect(symbols.filter((s) => s.symbol === 'appendJournal')).toHaveLength(1);
  });

  it('classifies path-like tokens by slash-or-dot+letter pattern', () => {
    const what =
      'Touch `firestore.rules` and `src/App.tsx` and `package.json`.';
    const map = new Map(
      extractTaskWhatSymbols(what).map((s) => [s.symbol, s.kind])
    );
    expect(map.get('firestore.rules')).toBe('path');
    expect(map.get('src/App.tsx')).toBe('path');
    expect(map.get('package.json')).toBe('path');
  });

  it('skips tokens that look like prose (multi-word, contains spaces)', () => {
    const what = 'Add `RMW per design §D3` somewhere.';
    const symbols = extractTaskWhatSymbols(what);
    expect(symbols.find((s) => s.symbol.includes(' '))).toBeUndefined();
  });

  it('skips citation-style tokens like `BR-7`', () => {
    const what = 'Implements `BR-7` and `AC-3` and `§D5`.';
    const symbols = extractTaskWhatSymbols(what);
    expect(symbols.map((s) => s.symbol)).not.toContain('BR-7');
    expect(symbols.map((s) => s.symbol)).not.toContain('AC-3');
    expect(symbols.map((s) => s.symbol)).not.toContain('§D5');
  });
});

describe('checkTaskContract', () => {
  const sampleDiff = `diff --git a/src/features/incidents/types.ts b/src/features/incidents/types.ts
new file mode 100644
--- /dev/null
+++ b/src/features/incidents/types.ts
@@
+export interface Incident { id: string }
+export type Severity = 'mild' | 'severe';
+export interface JournalEntry { ts: number }
`;

  it('returns all-present when every symbol appears in the diff', () => {
    const what =
      'Create `src/features/incidents/types.ts` with `Incident`, `Severity`, `JournalEntry`.';
    const result = checkTaskContract(what, sampleDiff);
    expect(result.symbols).toHaveLength(4);
    expect(result.missing).toEqual([]);
    expect(result.present.map((s) => s.symbol).sort()).toEqual(
      [
        'Incident',
        'JournalEntry',
        'Severity',
        'src/features/incidents/types.ts',
      ].sort()
    );
  });

  it('flags missing symbols absent from the diff', () => {
    const what = 'Add `Incident`, `Severity`, `JournalEntry`, `MissingThing`.';
    const result = checkTaskContract(what, sampleDiff);
    const missingNames = result.missing.map((s) => s.symbol);
    expect(missingNames).toContain('MissingThing');
    expect(missingNames).not.toContain('Incident');
  });

  it('matches identifier symbols on word boundaries (no substring matches)', () => {
    const diff = `+++ b/foo.ts\n+const Severityish = 1;\n`;
    const what = 'Add `Severity`.';
    const result = checkTaskContract(what, diff);
    expect(result.missing.map((s) => s.symbol)).toContain('Severity');
  });

  it('returns empty result for empty what', () => {
    const result = checkTaskContract(null, sampleDiff);
    expect(result.symbols).toEqual([]);
    expect(result.present).toEqual([]);
    expect(result.missing).toEqual([]);
  });

  it('records evidence (first matching line) for present symbols', () => {
    const what = 'Add `Incident`.';
    const result = checkTaskContract(what, sampleDiff);
    const incident = result.present.find((s) => s.symbol === 'Incident');
    expect(incident?.evidence).toMatch(/interface Incident/);
  });
});
