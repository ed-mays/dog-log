import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { checkSnapshot } from './run';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('cli-snapshots — exports', () => {
  it('exports checkSnapshot', () => {
    expect(typeof checkSnapshot).toBe('function');
  });
});

describe('cli-snapshots — snapshot files exist', () => {
  const SNAPSHOT_DIR = resolve(__dirname, 'snapshots');
  const expected = [
    'prepare-T-02.snapshot.md',
    'cold-read-T-01-no-diff.snapshot.md',
    'arbitrate-T-01-V2-spec-gap.snapshot.md',
  ];

  for (const file of expected) {
    it(`has ${file}`, () => {
      expect(existsSync(resolve(SNAPSHOT_DIR, file))).toBe(true);
    });
  }
});
