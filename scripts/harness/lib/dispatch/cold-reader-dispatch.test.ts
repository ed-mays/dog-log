import { describe, it, expect } from 'vitest';
import { parseColdReaderExit } from './cold-reader-dispatch';

describe('parseColdReaderExit', () => {
  it('parses an approve verdict with empty findings', () => {
    const text = `\`\`\`json
{
  "task_id": "T-06",
  "verdict": "approve",
  "findings": [],
  "summary": "Clean implementation matches §D2/§D3."
}
\`\`\``;
    const exit = parseColdReaderExit(text);
    expect(exit.verdict).toBe('approve');
    expect(exit.findings).toEqual([]);
    expect(exit.task_id).toBe('T-06');
  });

  it('parses a veto with multiple findings', () => {
    const text = `\`\`\`json
{
  "task_id": "T-05",
  "verdict": "veto",
  "findings": [
    {
      "severity": "HIGH",
      "scope_check": 4,
      "cited_section": "§D6",
      "evidence": "src/locales/en/common.json — incidents.chips.* missing",
      "description": "Design §D6 requires the full incidents subtree; chips omitted."
    },
    {
      "severity": "HIGH",
      "scope_check": 3,
      "cited_section": "NFR-5",
      "evidence": "src/locales/es/common.json — values are English",
      "description": "Producer silently used English for Spanish entries."
    }
  ],
  "summary": "Two HIGH on silent task-body deferrals."
}
\`\`\``;
    const exit = parseColdReaderExit(text);
    expect(exit.verdict).toBe('veto');
    expect(exit.findings).toHaveLength(2);
    expect(exit.findings[0]!.severity).toBe('HIGH');
    expect(exit.findings[0]!.scope_check).toBe(4);
    expect(exit.findings[1]!.cited_section).toBe('NFR-5');
  });

  it('throws on missing verdict', () => {
    const text = '```json\n{"task_id":"T-1","findings":[]}\n```';
    expect(() => parseColdReaderExit(text)).toThrow(/verdict/);
  });

  it('throws on invalid verdict', () => {
    const text =
      '```json\n{"task_id":"T-1","verdict":"maybe","findings":[]}\n```';
    expect(() => parseColdReaderExit(text)).toThrow(/invalid verdict/);
  });

  it('treats missing findings as empty array', () => {
    const text = '```json\n{"task_id":"T-1","verdict":"approve"}\n```';
    const exit = parseColdReaderExit(text);
    expect(exit.findings).toEqual([]);
  });

  it('throws when findings is not an array', () => {
    const text =
      '```json\n{"task_id":"T-1","verdict":"approve","findings":"none"}\n```';
    expect(() => parseColdReaderExit(text)).toThrow(
      /findings must be an array/
    );
  });
});
