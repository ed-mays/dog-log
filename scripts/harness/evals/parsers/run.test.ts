import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SNAPSHOT_DIR = resolve(__dirname, 'snapshots');

describe('parser corpus eval — snapshot files exist', () => {
  const expected = [
    'task-parser-03-tasks.snapshot.json',
    'spec-parser-01-spec-sections.snapshot.json',
    'spec-parser-02-design-sections.snapshot.json',
  ];

  for (const file of expected) {
    it(`has ${file}`, () => {
      expect(existsSync(resolve(SNAPSHOT_DIR, file))).toBe(true);
    });
  }
});
