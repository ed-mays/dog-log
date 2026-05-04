/**
 * Tests for derive-verify-command.ts — deterministic mapping from a task's
 * `Verify:` line to a canonical pnpm command, replacing the LLM derivation
 * the builder prompt previously instructed (round 27 cost: $0.71 invented
 * Jest --testPathPattern syntax).
 */

import { describe, expect, it } from 'vitest';

import { deriveVerifyCommand } from './derive-verify-command';

const SCRIPTS = {
  test: 'vitest',
  'test:unit': 'vitest run --exclude "**/*.integration.test.tsx"',
  'test:integration': 'vitest run "**/*.integration.test.tsx"',
  'test:rules': 'firebase emulators:exec --only firestore "vitest rules"',
  lint: 'eslint .',
  build: 'tsc -b && vite build',
  preflight: 'pnpm lint && pnpm knip && pnpm build && pnpm test:coverage',
  typecheck: 'tsc -b',
};

describe('deriveVerifyCommand — verbatim extraction', () => {
  it('returns null command for null verify line', () => {
    const r = deriveVerifyCommand(null, { scripts: SCRIPTS });
    expect(r.command).toBeNull();
    expect(r.source).toBe('unknown');
  });

  it('returns null command for empty verify line', () => {
    const r = deriveVerifyCommand('   ', { scripts: SCRIPTS });
    expect(r.command).toBeNull();
  });

  it('extracts a backtick-fenced command verbatim', () => {
    const verify = '`pnpm run test:rules` passes new ownership assertions.';
    const r = deriveVerifyCommand(verify, { scripts: SCRIPTS });
    expect(r.command).toBe('pnpm run test:rules');
    expect(r.source).toBe('verbatim');
  });

  it('prefers the first backticked pnpm command when multiple appear', () => {
    const verify =
      'Run `pnpm run lint` then `pnpm exec vitest run foo.test.ts`.';
    const r = deriveVerifyCommand(verify, { scripts: SCRIPTS });
    expect(r.command).toBe('pnpm run lint');
  });

  it('extracts a backtick-fenced `pnpm exec vitest` command', () => {
    const verify =
      'Run `pnpm exec vitest run scripts/harness/lib/foo.test.ts`.';
    const r = deriveVerifyCommand(verify, { scripts: SCRIPTS });
    expect(r.command).toBe(
      'pnpm exec vitest run scripts/harness/lib/foo.test.ts'
    );
    expect(r.source).toBe('verbatim');
  });
});

describe('deriveVerifyCommand — descriptive fallback by keyword', () => {
  it('maps "rules" → test:rules when script exists', () => {
    const verify = 'Firestore rules deny cross-user reads.';
    const r = deriveVerifyCommand(verify, { scripts: SCRIPTS });
    expect(r.command).toBe('pnpm run test:rules');
    expect(r.source).toBe('script-match');
  });

  it('maps "lint" → lint script', () => {
    const verify = 'No lint warnings on the new file.';
    const r = deriveVerifyCommand(verify, { scripts: SCRIPTS });
    expect(r.command).toBe('pnpm run lint');
  });

  it('maps "build" → preflight when present', () => {
    const r = deriveVerifyCommand('Production build succeeds.', {
      scripts: SCRIPTS,
    });
    expect(r.command).toBe('pnpm run preflight');
  });

  it('maps "tsc -b" → typecheck (typecheck rule wins over build)', () => {
    const r = deriveVerifyCommand('tsc -b is clean.', { scripts: SCRIPTS });
    expect(r.command).toBe('pnpm run typecheck');
  });

  it('maps "typecheck" → typecheck script when present, else preflight', () => {
    const r1 = deriveVerifyCommand('Types compile.', { scripts: SCRIPTS });
    expect(r1.command).toBe('pnpm run typecheck');
    const r2 = deriveVerifyCommand('Types compile.', {
      scripts: { ...SCRIPTS, typecheck: undefined as unknown as string },
    });
    // typecheck stripped → falls back to preflight
    expect(r2.command).toBe('pnpm run preflight');
  });

  it('maps "integration" → test:integration', () => {
    const verify = 'Integration test: store hydrates from emulator.';
    const r = deriveVerifyCommand(verify, { scripts: SCRIPTS });
    expect(r.command).toBe('pnpm run test:integration');
  });

  it('defaults to test:unit for unmatched descriptive verify lines', () => {
    const verify = 'Component test: tap fires the store action.';
    const r = deriveVerifyCommand(verify, { scripts: SCRIPTS });
    expect(r.command).toBe('pnpm run test:unit');
    expect(r.source).toBe('descriptive-default');
  });
});

describe('deriveVerifyCommand — script presence validation', () => {
  it('falls back to test when test:unit is missing', () => {
    const r = deriveVerifyCommand('Component test passes.', {
      scripts: { test: 'vitest', lint: 'eslint .' },
    });
    expect(r.command).toBe('pnpm run test');
  });

  it('returns unknown source when no test-like script exists at all', () => {
    const r = deriveVerifyCommand('Component test passes.', {
      scripts: { lint: 'eslint .' },
    });
    expect(r.source).toBe('unknown');
    expect(r.command).toBeNull();
  });

  it('returns the verbatim command even if the script does not exist', () => {
    // Verbatim is what the spec author asked for — we do not second-guess.
    const r = deriveVerifyCommand('`pnpm run test:nonexistent` passes.', {
      scripts: SCRIPTS,
    });
    expect(r.command).toBe('pnpm run test:nonexistent');
    expect(r.source).toBe('verbatim');
  });
});

describe('deriveVerifyCommand — reason field', () => {
  it('explains verbatim extraction', () => {
    const r = deriveVerifyCommand('`pnpm run lint` passes.', {
      scripts: SCRIPTS,
    });
    expect(r.reason.toLowerCase()).toMatch(/verbatim|backtick/);
  });

  it('explains script-match derivation', () => {
    const r = deriveVerifyCommand('Firestore rules deny.', {
      scripts: SCRIPTS,
    });
    expect(r.reason).toMatch(/rules/i);
  });

  it('explains the default fallback', () => {
    const r = deriveVerifyCommand('Component test passes.', {
      scripts: SCRIPTS,
    });
    expect(r.reason.toLowerCase()).toMatch(/default|test:unit|unit/);
  });
});
