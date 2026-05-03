import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { applyAmendment } from './apply-amendment';
import type { ArbiterAmendment } from './arbiter-dispatch';

let workDir: string;
let specDir: string;

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), 'harness-amend-'));
  specDir = join(workDir, 'docs/specs/incident-capture');
  mkdirSync(specDir, { recursive: true });
});

const DESIGN_FIXTURE = `# Design

## §D2 Architecture

\`\`\`
src/
  store/
    useIncidentStore.ts                   # Zustand: activeIncident
\`\`\`

## §D11 Design Changelog

- **2026-05-01** — Initial draft.
- **2026-05-02 round 25** — Amended §D3.
`;

function writeFixture(name: string, body: string): void {
  writeFileSync(join(specDir, name), body, 'utf8');
}

describe('applyAmendment', () => {
  it('applies a clean before→after substitution and appends changelog entry', () => {
    writeFixture('02-design.md', DESIGN_FIXTURE);
    const amendment: ArbiterAmendment = {
      file: '02-design.md',
      anchor: '§D2 useIncidentStore.ts comment',
      before:
        '    useIncidentStore.ts                   # Zustand: activeIncident',
      after:
        '    useIncidentStore.ts                   # Zustand: activeIncident.\n                                            # Post-STOP keeps activeIncident set.',
      changelog_entry:
        '**2026-05-02 round 31** — Amended §D2 file map for post-STOP store invariant.',
    };

    const result = applyAmendment(amendment, { specDir });
    expect(result.ok).toBe(true);
    expect(result.changelog_appended_at_eof).toBe(false);

    const updated = readFileSync(join(specDir, '02-design.md'), 'utf8');
    expect(updated).toContain('Post-STOP keeps activeIncident set.');
    expect(updated).toContain('round 31');
    // Original content preserved
    expect(updated).toContain('Initial draft');
    // Changelog entry inside the §D11 block, before EOF
    const d11Idx = updated.indexOf('## §D11');
    expect(d11Idx).toBeGreaterThan(0);
    expect(updated.slice(d11Idx)).toContain('round 31');
  });

  it('refuses when before does not match exactly', () => {
    writeFixture('02-design.md', DESIGN_FIXTURE);
    const amendment: ArbiterAmendment = {
      file: '02-design.md',
      anchor: '§D2',
      before: 'this text is not in the file',
      after: 'replacement',
      changelog_entry: '2026-05-02 — never applied',
    };

    const result = applyAmendment(amendment, { specDir });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/not found/);
    // File is untouched
    expect(readFileSync(join(specDir, '02-design.md'), 'utf8')).toBe(
      DESIGN_FIXTURE
    );
  });

  it('refuses when before matches multiple times (ambiguous)', () => {
    writeFixture(
      '02-design.md',
      `${DESIGN_FIXTURE}\n\nDuplicate marker.\nDuplicate marker.\n`
    );
    const amendment: ArbiterAmendment = {
      file: '02-design.md',
      anchor: '§D2',
      before: 'Duplicate marker.',
      after: 'Replaced.',
      changelog_entry: '2026-05-02 — never applied',
    };

    const result = applyAmendment(amendment, { specDir });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/matches 2 times/);
  });

  it('refuses pure additions (empty before) in v1', () => {
    writeFixture('02-design.md', DESIGN_FIXTURE);
    const amendment: ArbiterAmendment = {
      file: '02-design.md',
      anchor: '§D2',
      before: '',
      after: 'pure addition',
      changelog_entry: '2026-05-02 — never applied',
    };
    const result = applyAmendment(amendment, { specDir });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/pure additions/);
  });

  it('appends changelog at EOF when block header is missing (with warning marker)', () => {
    writeFixture(
      '02-design.md',
      '# Design\n\n## §D2 Architecture\n\nuseIncidentStore.ts comment\n'
    );
    const amendment: ArbiterAmendment = {
      file: '02-design.md',
      anchor: '§D2',
      before: 'useIncidentStore.ts comment',
      after: 'useIncidentStore.ts amended comment',
      changelog_entry: '2026-05-02 — orphan changelog',
    };
    const result = applyAmendment(amendment, { specDir });
    expect(result.ok).toBe(true);
    expect(result.changelog_appended_at_eof).toBe(true);
    const updated = readFileSync(join(specDir, '02-design.md'), 'utf8');
    expect(updated).toContain('changelog block not found');
    expect(updated).toContain('orphan changelog');
  });

  it('routes changelog by filename', () => {
    writeFixture(
      '01-spec.md',
      '# Spec\n\nBR-7 text\n\n## §10 Spec Changelog\n\n- **2026-05-01** — initial.\n'
    );
    const amendment: ArbiterAmendment = {
      file: '01-spec.md',
      anchor: 'BR-7',
      before: 'BR-7 text',
      after: 'BR-7 amended text',
      changelog_entry: '2026-05-02 — clarify BR-7',
    };
    const result = applyAmendment(amendment, { specDir });
    expect(result.ok).toBe(true);
    expect(result.changelog_appended_at_eof).toBe(false);
    const updated = readFileSync(join(specDir, '01-spec.md'), 'utf8');
    expect(updated.indexOf('## §10')).toBeLessThan(
      updated.indexOf('clarify BR-7')
    );
  });

  it('returns error when target file does not exist', () => {
    const amendment: ArbiterAmendment = {
      file: '99-nonexistent.md',
      anchor: 'X',
      before: 'a',
      after: 'b',
      changelog_entry: 'x',
    };
    const result = applyAmendment(amendment, { specDir });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/file not found/);
  });
});
