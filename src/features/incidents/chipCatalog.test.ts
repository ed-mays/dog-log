import { describe, it, expect } from 'vitest';
import { chipCatalog } from './chipCatalog';
import type { IncidentTypeId } from './types';

const expectedTypes: IncidentTypeId[] = [
  'seizure',
  'injury',
  'vomiting',
  'choking',
  'allergic_reaction',
  'collapse',
  'ingestion',
  'other',
];

describe('chipCatalog', () => {
  it('contains exactly the 8 v1 types from design §D5', () => {
    expect(Object.keys(chipCatalog).sort()).toEqual([...expectedTypes].sort());
  });

  it('has at least one chip for every type except "other" (BR-32 / §D5)', () => {
    for (const type of expectedTypes) {
      if (type === 'other') {
        expect(chipCatalog[type]).toEqual([]);
        continue;
      }
      expect(chipCatalog[type].length).toBeGreaterThan(0);
    }
  });

  it('uses unique chip IDs within each type entry', () => {
    for (const type of expectedTypes) {
      const chips = chipCatalog[type];
      expect(new Set(chips).size).toBe(chips.length);
    }
  });
});
