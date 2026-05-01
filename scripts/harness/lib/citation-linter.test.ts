import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, lintCommitMessage } from './citation-linter';

describe('lintCommitMessage — happy paths', () => {
  it('accepts a typed BR citation', () => {
    const r = lintCommitMessage('feat(incidents): add timer (BR-3)');
    expect(r.valid).toBe(true);
    expect(r.citations).toEqual(['BR-3']);
    expect(r.exemptReason).toBeNull();
  });

  it('accepts a typed AC citation', () => {
    const r = lintCommitMessage('test(incidents): cover AC-12');
    expect(r.valid).toBe(true);
    expect(r.citations).toEqual(['AC-12']);
  });

  it('accepts a §N section citation', () => {
    const r = lintCommitMessage('feat(incidents): types per §5');
    expect(r.valid).toBe(true);
    expect(r.citations).toEqual(['§5']);
  });

  it('accepts a §DN design section citation', () => {
    const r = lintCommitMessage('feat(incidents): wire ActivationFab per §D2');
    expect(r.valid).toBe(true);
    expect(r.citations).toEqual(['§D2']);
  });

  it('accepts a T-N task citation (process-task carve-out)', () => {
    const r = lintCommitMessage('docs(spec): mark T-46 status flip to shipped');
    expect(r.valid).toBe(true);
    expect(r.citations).toEqual(['T-46']);
  });

  it('extracts multiple distinct citations and dedupes', () => {
    const r = lintCommitMessage(
      'feat(incidents): timer + STOP\n\nImplements BR-2, BR-3, BR-3, AC-1; design §D8.'
    );
    expect(r.valid).toBe(true);
    expect(r.citations).toEqual(['AC-1', 'BR-2', 'BR-3', '§D8']);
  });
});

describe('lintCommitMessage — exemptions', () => {
  it('exempts merge commits', () => {
    const r = lintCommitMessage("Merge branch 'main' into feat/x");
    expect(r.valid).toBe(true);
    expect(r.exemptReason).toBe('merge commit');
  });

  it('exempts revert commits', () => {
    const r = lintCommitMessage(
      'Revert "feat(incidents): timer (BR-3) (#999)"'
    );
    expect(r.valid).toBe(true);
    expect(r.exemptReason).toBe('revert commit');
  });

  it('exempts chore type by default', () => {
    const r = lintCommitMessage('chore(deps): bump react to 19.2');
    expect(r.valid).toBe(true);
    expect(r.exemptReason).toBe("exempt commit type 'chore'");
  });

  it('exempts ci type by default', () => {
    const r = lintCommitMessage('ci: cache pnpm store');
    expect(r.valid).toBe(true);
    expect(r.exemptReason).toBe("exempt commit type 'ci'");
  });

  it('exempts harness scope by default', () => {
    const r = lintCommitMessage('feat(harness): add citation linter');
    expect(r.valid).toBe(true);
    expect(r.exemptReason).toBe("exempt commit scope 'harness'");
  });

  it('exempts via [skip-cite] token in body', () => {
    const r = lintCommitMessage(
      'feat(incidents): one-off prototype\n\n[skip-cite] reason: spike to test something'
    );
    expect(r.valid).toBe(true);
    expect(r.exemptReason).toBe("contains '[skip-cite]' token");
  });

  it('does NOT exempt fix(incidents) — needs a citation', () => {
    const r = lintCommitMessage('fix(incidents): off-by-one in timer');
    expect(r.valid).toBe(false);
    expect(r.failureReason).toContain('no spec-anchored citation');
  });

  it('does NOT exempt scopes that look like exempt types (e.g. feat(chore))', () => {
    const r = lintCommitMessage('feat(chore): not actually a chore');
    // 'feat' is not exempt, scope 'chore' is not in exemptScopes by default.
    expect(r.valid).toBe(false);
  });

  it('respects custom exempt scopes', () => {
    const r = lintCommitMessage('feat(infra): provision dev firestore', {
      ...DEFAULT_CONFIG,
      exemptScopes: ['harness', 'infra'],
    });
    expect(r.valid).toBe(true);
    expect(r.exemptReason).toBe("exempt commit scope 'infra'");
  });
});

describe('lintCommitMessage — failure modes', () => {
  it('rejects an empty message', () => {
    const r = lintCommitMessage('');
    expect(r.valid).toBe(false);
    expect(r.failureReason).toBe('commit message is empty');
  });

  it('rejects a message with only comment lines', () => {
    const r = lintCommitMessage(
      '# Please enter the commit message...\n# Lines starting with # are ignored.'
    );
    expect(r.valid).toBe(false);
    expect(r.failureReason).toBe('commit message is empty');
  });

  it('rejects feat without any citation', () => {
    const r = lintCommitMessage('feat(incidents): add severity chips');
    expect(r.valid).toBe(false);
    expect(r.failureReason).toContain('no spec-anchored citation');
    expect(r.failureReason).toContain('Acceptable citation forms');
  });

  it('rejects refactor without citation', () => {
    const r = lintCommitMessage('refactor(incidents): split surface from page');
    expect(r.valid).toBe(false);
  });

  it('rejects when only a PR-style ref like (#152) is present', () => {
    const r = lintCommitMessage('feat(incidents): timer (#152)');
    expect(r.valid).toBe(false);
  });

  it("does not match 'BR-' or 'AC-' without a number", () => {
    const r = lintCommitMessage('feat(incidents): generic BR- and AC- refs');
    expect(r.valid).toBe(false);
  });
});

describe('lintCommitMessage — comment stripping & subject parsing', () => {
  it('uses the first non-comment line as the subject', () => {
    const msg = [
      '# please enter your commit message',
      '',
      'feat(incidents): wire timer (BR-3)',
      '',
      '# everything below the dashed line is ignored',
    ].join('\n');
    const r = lintCommitMessage(msg);
    expect(r.subject).toBe('feat(incidents): wire timer (BR-3)');
    expect(r.valid).toBe(true);
  });

  it('does NOT strip non-leading # (so #issue-12 in body still counts as text)', () => {
    const msg = 'feat(incidents): wire timer (BR-3)\n\nFixes #issue-12';
    const r = lintCommitMessage(msg);
    expect(r.valid).toBe(true);
    expect(r.subject).toBe('feat(incidents): wire timer (BR-3)');
  });
});
