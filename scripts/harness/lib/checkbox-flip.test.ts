/**
 * Tests for checkbox-flip.ts — pure markdown transform that flips a task's
 * `[ ]` to `[x]` in 03-tasks.md after orchestrate ships the task. Closes
 * the round-43 lesson 2nd-recurrence (T-27, T-28, T-29 all required manual
 * checkbox flips after their orchestrate dispatches).
 */

import { describe, expect, it } from 'vitest';

import { flipTaskCheckbox } from './checkbox-flip';

const SAMPLE = `# Tasks

## Slice 3

### \`[ ]\` T-27 — ActivationPetPicker component

- **Cite:** spec BR-28
- **What:** stuff

### \`[ ]\` T-28 — EmergencyActivationFab (multi-pet + resume)

- **Cite:** spec BR-26

### \`[x]\` T-29 — already done

- **Cite:** something

### \`[!]\` T-30 — blocked
`;

describe('flipTaskCheckbox', () => {
  it('flips [ ] → [x] for the named task and reports flipped=true', () => {
    const r = flipTaskCheckbox(SAMPLE, 'T-28');
    expect(r.flipped).toBe(true);
    expect(r.markdown).toContain('### `[x]` T-28 — EmergencyActivationFab');
    expect(r.markdown).toContain('### `[ ]` T-27 — ActivationPetPicker');
  });

  it('returns flipped=false when the task is already [x]', () => {
    const r = flipTaskCheckbox(SAMPLE, 'T-29');
    expect(r.flipped).toBe(false);
    expect(r.markdown).toBe(SAMPLE);
    expect(r.reason).toMatch(/already/i);
  });

  it('returns flipped=false when the task is [!] (blocked) — does not silently override', () => {
    const r = flipTaskCheckbox(SAMPLE, 'T-30');
    expect(r.flipped).toBe(false);
    expect(r.markdown).toBe(SAMPLE);
    expect(r.reason).toMatch(/blocked/i);
  });

  it('returns flipped=false when the task id is not present', () => {
    const r = flipTaskCheckbox(SAMPLE, 'T-99');
    expect(r.flipped).toBe(false);
    expect(r.markdown).toBe(SAMPLE);
    expect(r.reason).toMatch(/not found/i);
  });

  it('flips only the named task when multiple `[ ]` tasks exist', () => {
    const r = flipTaskCheckbox(SAMPLE, 'T-27');
    expect(r.flipped).toBe(true);
    expect(r.markdown).toContain('### `[x]` T-27');
    expect(r.markdown).toContain('### `[ ]` T-28');
  });

  it('handles task headings tolerating extra spaces', () => {
    const md = '### `[ ]`  T-31  — something\n';
    const r = flipTaskCheckbox(md, 'T-31');
    expect(r.flipped).toBe(true);
    expect(r.markdown).toContain('`[x]`');
  });

  it('does not match a task id that appears in body text only', () => {
    const md = `### \`[ ]\` T-32 — first

- Notes: see T-33 for context

### \`[ ]\` T-33 — second
`;
    const r = flipTaskCheckbox(md, 'T-33');
    expect(r.flipped).toBe(true);
    expect(r.markdown).toContain('### `[x]` T-33');
    expect(r.markdown).toContain('### `[ ]` T-32');
  });
});
