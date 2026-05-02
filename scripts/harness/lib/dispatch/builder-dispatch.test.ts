import { describe, it, expect } from 'vitest';
import { parseBuilderExit } from './builder-dispatch';

describe('parseBuilderExit', () => {
  it('parses success exit (JSON fenced)', () => {
    const text =
      '```json\n{"status":"success","commit_sha":"abc123","files_touched":["src/a.ts"]}\n```';
    const exit = parseBuilderExit(text);
    expect(exit.status).toBe('success');
    if (exit.status === 'success') {
      expect(exit.commit_sha).toBe('abc123');
      expect(exit.files_touched).toEqual(['src/a.ts']);
    }
  });

  it('parses spec_gap exit (YAML fenced)', () => {
    const text = `here is the gap

\`\`\`yaml
status: spec_gap
cited_section: BR-7
gap_description: |
  The BR is ambiguous on whether chips dedupe at write or read.
suggested_amendment: |
  Add to BR-7: dedupe at write per ChipId.
\`\`\``;
    const exit = parseBuilderExit(text);
    expect(exit.status).toBe('spec_gap');
    if (exit.status === 'spec_gap') {
      expect(exit.cited_section).toBe('BR-7');
      expect(exit.gap_description).toMatch(/ambiguous/);
      expect(exit.suggested_amendment).toMatch(/dedupe at write/);
    }
  });

  it('parses verify_fail exit (bare JSON)', () => {
    const text =
      '{"status":"verify_fail","verify_command":"pnpm run test","attempts":2}';
    const exit = parseBuilderExit(text);
    expect(exit.status).toBe('verify_fail');
    if (exit.status === 'verify_fail') {
      expect(exit.verify_command).toBe('pnpm run test');
      expect(exit.attempts).toBe(2);
    }
  });

  it('parses budget_exceeded exit', () => {
    const text =
      '```json\n{"status":"budget_exceeded","spent":{"tokens":100000},"last_action":"running tests"}\n```';
    const exit = parseBuilderExit(text);
    expect(exit.status).toBe('budget_exceeded');
  });

  it('throws on missing status', () => {
    const text = '```json\n{"commit_sha":"abc"}\n```';
    expect(() => parseBuilderExit(text)).toThrow(/status/);
  });

  it('throws on unrecognized status', () => {
    const text = '```json\n{"status":"weird"}\n```';
    expect(() => parseBuilderExit(text)).toThrow(/invalid status/);
  });

  it('throws when no structured exit can be parsed', () => {
    expect(() => parseBuilderExit('just prose, nothing structured')).toThrow();
  });
});
