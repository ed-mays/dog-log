import { describe, it, expect } from 'vitest';
import { parseArbiterExit } from './arbiter-dispatch';

describe('parseArbiterExit', () => {
  it('parses an amend_design verdict', () => {
    const text = `\`\`\`json
{
  "verdict": "amend_design",
  "amended_section": "§D6",
  "amendment_text": "Add a Deferrals note covering chips and Spanish stubs.",
  "changelog_entry": "2026-05-02 round 24 — added §D6 Deferrals note."
}
\`\`\``;
    const exit = parseArbiterExit(text);
    expect(exit.verdict).toBe('amend_design');
    expect(exit.amended_section).toBe('§D6');
  });

  it('parses an amend_task verdict', () => {
    const text =
      '```json\n{"verdict":"amend_task","amended_section":"T-04","amendment_text":"emulator-only verify"}\n```';
    expect(parseArbiterExit(text).verdict).toBe('amend_task');
  });

  it('parses an amend_spec verdict', () => {
    const text =
      '```json\n{"verdict":"amend_spec","amended_section":"BR-7","amendment_text":"clarify dedup-at-write"}\n```';
    expect(parseArbiterExit(text).verdict).toBe('amend_spec');
  });

  it('parses a pushback verdict', () => {
    const text =
      '```json\n{"verdict":"pushback","pushback_message":"Builder misread; chips are out of T-05 scope per task notes."}\n```';
    const exit = parseArbiterExit(text);
    expect(exit.verdict).toBe('pushback');
    expect(exit.pushback_message).toMatch(/misread/);
  });

  it('throws on invalid verdict', () => {
    const text = '```json\n{"verdict":"reject_completely"}\n```';
    expect(() => parseArbiterExit(text)).toThrow(/invalid verdict/);
  });

  it('throws when no parseable exit', () => {
    expect(() => parseArbiterExit('plain prose nothing else')).toThrow();
  });
});
