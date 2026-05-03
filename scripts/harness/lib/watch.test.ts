import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { watchState } from './watch';
import { appendEvent, initState } from './state-store';
import { loadDispatchesLog } from './dispatches-log';

let workDir: string;
let statePath: string;

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), 'watch-'));
  statePath = join(workDir, '.harness/state.json');
});

describe('watchState — exits on orchestrate_end', () => {
  it('prints all events appended before orchestrate_end and returns', async () => {
    initState('T-99', statePath);
    appendEvent(
      statePath,
      {
        task_id: 'T-99',
        type: 'orchestrate_start',
        payload: { caps: {} },
      },
      { dispatchesLogPath: null }
    );
    appendEvent(
      statePath,
      {
        task_id: 'T-99',
        type: 'dispatch_start',
        payload: { role: 'builder', attempt: 1 },
      },
      { dispatchesLogPath: null }
    );
    appendEvent(
      statePath,
      {
        task_id: 'T-99',
        type: 'dispatch_end',
        payload: {
          role: 'builder',
          cost_usd: 0.5,
          duration_ms: 60000,
          num_turns: 5,
          session_id: 's',
          stop_reason: 'end_turn',
          status: 'success',
          commit_sha: 'abc12345',
        },
      },
      { dispatchesLogPath: null }
    );
    appendEvent(
      statePath,
      {
        task_id: 'T-99',
        type: 'orchestrate_end',
        payload: { outcome: 'success', totalCostUsd: 0.5 },
      },
      { dispatchesLogPath: null }
    );

    const lines: string[] = [];
    const sleep = vi.fn().mockResolvedValue(undefined);
    await watchState({
      statePath,
      intervalMs: 1,
      noColor: true,
      write: (s) => lines.push(s),
      sleep,
    });

    const out = lines.join('');
    expect(out).toMatch(/START/);
    expect(out).toMatch(/dispatch_start.*builder/);
    expect(out).toMatch(/dispatch_end.*builder.*status=success/);
    expect(out).toMatch(/sha=abc12345/);
    expect(out).toMatch(/END/);
    // Cumulative cost meter should appear once we've seen the dispatch_end.
    expect(out).toMatch(/\[\$0\.5000\]/);
  });

  it('waits for the file to appear when state.json does not yet exist', async () => {
    let polls = 0;
    const sleep = vi.fn().mockImplementation(async () => {
      polls += 1;
      if (polls === 2) {
        // After two polls, create state with an orchestrate_end so the loop can finish.
        initState('T-1', statePath);
        appendEvent(
          statePath,
          {
            task_id: 'T-1',
            type: 'orchestrate_end',
            payload: { outcome: 'success' },
          },
          { dispatchesLogPath: null }
        );
      }
    });
    const lines: string[] = [];
    await watchState({
      statePath,
      intervalMs: 1,
      noColor: true,
      write: (s) => lines.push(s),
      sleep,
    });
    expect(lines.join('')).toMatch(/waiting for/);
    expect(lines.join('')).toMatch(/END/);
  });

  it('respects maxWaitMs when no orchestrate_end ever fires', async () => {
    initState('T-1', statePath);
    let calls = 0;
    const now = vi.fn().mockImplementation(() => calls++ * 100);
    const sleep = vi.fn().mockResolvedValue(undefined);
    const lines: string[] = [];
    await watchState({
      statePath,
      intervalMs: 1,
      maxWaitMs: 200,
      noColor: true,
      write: (s) => lines.push(s),
      sleep,
      now,
    });
    expect(lines.join('')).toMatch(/max wait/);
  });
});

describe('appendEvent — JSONL dual-write (Axis 5 integration)', () => {
  it('writes a dispatch_end event to BOTH state.json and dispatches.jsonl', () => {
    const dispatchesPath = join(workDir, '.harness/dispatches.jsonl');
    initState('T-99', statePath);
    appendEvent(
      statePath,
      {
        task_id: 'T-99',
        type: 'dispatch_end',
        payload: {
          role: 'builder',
          cost_usd: 0.5,
          duration_ms: 1000,
          num_turns: 5,
          session_id: 'sess',
          stop_reason: 'end_turn',
          status: 'success',
          commit_sha: 'abc',
        },
      },
      { dispatchesLogPath: dispatchesPath }
    );
    // The default behavior (no override) would compute the path from the
    // state.json's directory; here we pass the path explicitly and verify
    // the JSONL got a line.

    const entries = loadDispatchesLog(dispatchesPath);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      task_id: 'T-99',
      role: 'builder',
      status: 'success',
      cost_usd: 0.5,
    });
  });

  it('does NOT write non-dispatch events to dispatches.jsonl', () => {
    const dispatchesPath = join(workDir, '.harness/dispatches.jsonl');
    initState('T-99', statePath);
    appendEvent(
      statePath,
      {
        task_id: 'T-99',
        type: 'orchestrate_start',
        payload: { caps: {} },
      },
      { dispatchesLogPath: dispatchesPath }
    );

    const entries = loadDispatchesLog(dispatchesPath);
    expect(entries).toEqual([]);
  });

  it('skips JSONL write entirely when dispatchesLogPath is null', () => {
    const dispatchesPath = join(workDir, '.harness/dispatches.jsonl');
    initState('T-99', statePath);
    appendEvent(
      statePath,
      {
        task_id: 'T-99',
        type: 'dispatch_end',
        payload: {
          role: 'builder',
          cost_usd: 0.5,
          duration_ms: 1,
          num_turns: 1,
          session_id: 's',
          stop_reason: 'end_turn',
          status: 'success',
        },
      },
      { dispatchesLogPath: null }
    );

    expect(existsSync(dispatchesPath)).toBe(false);
  });
});
