import { describe, it, expect } from 'vitest';
import { getPets } from './pets.service';

describe('pets.service', () => {
  it('returns mock pets list', async () => {
    const pets = await getPets();
    expect(Array.isArray(pets)).toBe(true);
    expect(pets.length).toBeGreaterThanOrEqual(2);
    expect(pets[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
    });
  });
});
