import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  extractRequirement,
  extractRequirements,
  extractSpecSection,
  extractSpecSections,
} from './spec-parser';

const root = resolve(__dirname, '../../../docs/specs/incident-capture');
const specMd = readFileSync(`${root}/01-spec.md`, 'utf8');
const designMd = readFileSync(`${root}/02-design.md`, 'utf8');

describe('extractSpecSection — against real spec/design', () => {
  it('extracts spec §5 (data model) including the heading', () => {
    const out = extractSpecSection(specMd, '§5');
    expect(out).toBeTruthy();
    expect(out!).toMatch(/^## §5 Data Model/);
    // Should contain the petId field documented in the data model.
    expect(out!).toMatch(/`petId`/);
  });

  it('stops at the next ## heading (does not include §6)', () => {
    const out = extractSpecSection(specMd, '§5')!;
    expect(out).not.toMatch(/^## §6/m);
    expect(out).not.toMatch(/Non-Functional Requirements/);
  });

  it('extracts design §D3 (data model concrete) including TypeScript types', () => {
    const out = extractSpecSection(designMd, '§D3');
    expect(out).toBeTruthy();
    expect(out!).toMatch(/^## §D3 Data Model/);
    // Should contain the Incident interface from the TypeScript section.
    expect(out!).toMatch(/interface Incident/);
  });

  it('returns null for an unknown ref by default', () => {
    expect(extractSpecSection(specMd, '§99')).toBeNull();
    expect(extractSpecSection(designMd, '§D99')).toBeNull();
  });

  it('throws when required: true and ref is missing', () => {
    expect(() => extractSpecSection(specMd, '§99', { required: true })).toThrow(
      /spec section §99 not found/
    );
  });
});

describe('extractRequirement — against real spec', () => {
  it('extracts BR-2 (timer at moment of gesture)', () => {
    const out = extractRequirement(specMd, 'BR-2');
    expect(out).toBeTruthy();
    expect(out!).toMatch(/^- \*\*BR-2\*\*/);
    expect(out!).toMatch(/timer MUST start/i);
  });

  it('extracts AC-1 with Given/When/Then body', () => {
    const out = extractRequirement(specMd, 'AC-1');
    expect(out).toBeTruthy();
    expect(out!).toMatch(/^- \*\*AC-1/);
    expect(out!).toMatch(/_Given_/);
    expect(out!).toMatch(/_when_/);
    expect(out!).toMatch(/_then_/);
  });

  it('extracts NFR-2 (activation latency, reframed)', () => {
    const out = extractRequirement(specMd, 'NFR-2');
    expect(out).toBeTruthy();
    expect(out!).toMatch(/Activation latency/);
  });

  it('extracts the tombstoned AC-14 (does not skip tombstones by default)', () => {
    const out = extractRequirement(specMd, 'AC-14');
    expect(out).toBeTruthy();
    expect(out!).toMatch(/tombstoned/);
  });

  it('returns null for an unknown ref', () => {
    expect(extractRequirement(specMd, 'BR-999')).toBeNull();
  });

  it('does NOT match a citation that just mentions BR-N — only the bullet definition', () => {
    // BR-26 is referenced inside many other BRs' bodies. The function should
    // match only the actual `- **BR-26**` bullet, not the in-text references.
    const out = extractRequirement(specMd, 'BR-26');
    expect(out).toBeTruthy();
    // The body should start with `- **BR-26**`.
    expect(out!.split('\n')[0]).toMatch(/^- \*\*BR-26\*\*/);
  });
});

describe('extractRequirement — fixture cases', () => {
  it('captures continuation lines that are indented', () => {
    const md = `## §4 BRs
- **BR-1** — first line.
  with an indented second line.
  and a third.
- **BR-2** — next bullet starts here.
`;
    const out = extractRequirement(md, 'BR-1');
    expect(out).toBe(
      [
        '- **BR-1** — first line.',
        '  with an indented second line.',
        '  and a third.',
      ].join('\n')
    );
  });

  it('stops at the next ### heading', () => {
    const md = `## §4 BRs

### Group A
- **BR-1** — first.
- **BR-2** — second.

### Group B
- **BR-3** — third.
`;
    const out = extractRequirement(md, 'BR-2');
    expect(out).toBe('- **BR-2** — second.');
  });
});

describe('batch helpers', () => {
  it('extractRequirements returns matched refs in order, skipping unknowns', () => {
    const out = extractRequirements(specMd, ['BR-1', 'BR-999', 'AC-1']);
    expect(out.map((r) => r.ref)).toEqual(['BR-1', 'AC-1']);
    expect(out[0]?.body).toMatch(/^- \*\*BR-1\*\*/);
  });

  it('extractSpecSections returns matched sections in order', () => {
    const out = extractSpecSections(specMd, ['§5', '§99', '§6']);
    expect(out.map((r) => r.ref)).toEqual(['§5', '§6']);
    expect(out[0]?.body).toMatch(/^## §5/);
    expect(out[1]?.body).toMatch(/^## §6/);
  });
});
