import { describe, it, expect } from 'vitest';
import { parseArbiterExit } from './arbiter-dispatch';

describe('parseArbiterExit', () => {
  it('parses an amend_design verdict per the arbiter prompt schema', () => {
    const text = `\`\`\`json
{
  "verdict": "amend_design",
  "rationale": "The post-STOP store invariant is missing from §D2 and is causing T-13 to redirect.",
  "amendment": {
    "file": "02-design.md",
    "anchor": "§D2 file map, useIncidentStore.ts comment",
    "before": "useIncidentStore.ts",
    "after": "useIncidentStore.ts (post-STOP keeps activeIncident)",
    "changelog_entry": "2026-05-02 — Amended §D2 useIncidentStore.ts file-map comment to add post-STOP store invariant."
  }
}
\`\`\``;
    const exit = parseArbiterExit(text);
    expect(exit.verdict).toBe('amend_design');
    expect(exit.amendment?.file).toBe('02-design.md');
    expect(exit.amendment?.anchor).toMatch(/§D2/);
    expect(exit.rationale).toMatch(/post-STOP/);
  });

  it('parses an amend_task verdict', () => {
    const text =
      '```json\n{"verdict":"amend_task","amendment":{"file":"03-tasks.md","anchor":"T-04 Verify line","before":"firebase deploy","after":"pnpm run test:rules","changelog_entry":"2026-05-02 — emulator-only verify"}}\n```';
    expect(parseArbiterExit(text).verdict).toBe('amend_task');
  });

  it('parses an amend_spec verdict', () => {
    const text =
      '```json\n{"verdict":"amend_spec","amendment":{"file":"01-spec.md","anchor":"BR-7","before":"chips dedupe","after":"chips dedupe at write","changelog_entry":"2026-05-02 — clarify dedup-at-write"}}\n```';
    expect(parseArbiterExit(text).verdict).toBe('amend_spec');
  });

  it('parses a pushback verdict (no amendment block)', () => {
    const text =
      '```json\n{"verdict":"pushback","pushback_clarification":"Builder misread; chips are out of T-05 scope per task notes."}\n```';
    const exit = parseArbiterExit(text);
    expect(exit.verdict).toBe('pushback');
    expect(exit.pushback_clarification).toMatch(/misread/);
    expect(exit.amendment).toBeUndefined();
  });

  it('throws on invalid verdict', () => {
    const text = '```json\n{"verdict":"reject_completely"}\n```';
    expect(() => parseArbiterExit(text)).toThrow(/invalid verdict/);
  });

  it('throws when no parseable exit', () => {
    expect(() => parseArbiterExit('plain prose nothing else')).toThrow();
  });
});
