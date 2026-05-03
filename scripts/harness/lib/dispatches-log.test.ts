import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  appendDispatch,
  loadDispatchesLog,
  type DispatchLogEntry,
} from './dispatches-log';

let workDir: string;
let logPath: string;

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), 'dispatches-log-'));
  logPath = join(workDir, '.harness/dispatches.jsonl');
});

function makeEntry(over: Partial<DispatchLogEntry> = {}): DispatchLogEntry {
  return {
    ts: '2026-05-03T20:00:00.000Z',
    run_id: 'T-99-1',
    task_id: 'T-99',
    role: 'builder',
    cost_usd: 0.5,
    duration_ms: 60_000,
    num_turns: 5,
    session_id: 'session-1',
    stop_reason: 'end_turn',
    status: 'success',
    commit_sha: 'abc123',
    ...over,
  };
}

describe('appendDispatch', () => {
  it('creates the directory and writes one line per entry', () => {
    appendDispatch(logPath, makeEntry());
    appendDispatch(logPath, makeEntry({ task_id: 'T-100' }));

    const raw = readFileSync(logPath, 'utf8');
    expect(raw.split('\n').filter((l) => l.length > 0)).toHaveLength(2);
  });

  it('round-trips an entry through loadDispatchesLog', () => {
    const entry = makeEntry({
      role: 'cold-reader',
      verdict: 'veto',
      findings_count: 2,
    });
    appendDispatch(logPath, entry);

    const loaded = loadDispatchesLog(logPath);
    expect(loaded).toHaveLength(1);
    expect(loaded[0]).toEqual(entry);
  });
});

describe('loadDispatchesLog', () => {
  it('returns empty array when the log file does not exist', () => {
    expect(loadDispatchesLog(logPath)).toEqual([]);
  });

  it('skips malformed lines silently', () => {
    appendDispatch(logPath, makeEntry());
    // Append a corrupt line (e.g., a half-written entry from a crash).
    writeFileSync(
      logPath,
      readFileSync(logPath, 'utf8') + 'not-json\n',
      'utf8'
    );
    appendDispatch(logPath, makeEntry({ task_id: 'T-100' }));

    const loaded = loadDispatchesLog(logPath);
    // Two valid entries; the malformed line in the middle is silently skipped.
    expect(loaded).toHaveLength(2);
    expect(loaded[0]?.task_id).toBe('T-99');
    expect(loaded[1]?.task_id).toBe('T-100');
  });
});
