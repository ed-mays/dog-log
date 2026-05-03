import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter } from 'node:events';
import { Readable, Writable } from 'node:stream';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { dispatchPushback, buildPushbackSection } from './pushback-dispatch';

// Minimal fake-spawn helper, modeled on subagent-dispatch.test.ts.
interface FakeChild extends EventEmitter {
  stdin: Writable;
  stdout: Readable;
  stderr: Readable;
  kill: (signal?: string) => boolean;
  killed: boolean;
}

function makeFakeChild(opts: {
  stdoutChunks?: string[];
  exitCode: number | null;
  capturedStdin?: string[];
}): FakeChild {
  const child = new EventEmitter() as FakeChild;
  child.stdin = new Writable({
    write(chunk, _enc, cb) {
      opts.capturedStdin?.push(chunk.toString());
      cb();
    },
    final(cb) {
      cb();
    },
  });
  child.stdout = Readable.from((opts.stdoutChunks ?? []).map(Buffer.from));
  child.stderr = Readable.from([]);
  child.kill = vi.fn(() => {
    child.killed = true;
    return true;
  });
  child.killed = false;
  setTimeout(() => child.emit('exit', opts.exitCode), 5);
  return child;
}

const SUCCESS_ENVELOPE = JSON.stringify({
  type: 'result',
  subtype: 'success',
  is_error: false,
  result:
    '```json\n{"status":"success","commit_sha":"hallucinated-deadbeef"}\n```',
  stop_reason: 'end_turn',
  session_id: 'pb-session-1',
  total_cost_usd: 0.66,
  duration_ms: 9000,
  num_turns: 12,
});

let workDir: string;
let specDir: string;
let statePath: string;
let findingsPath: string;

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), 'pushback-'));
  specDir = join(workDir, 'docs/specs/incident-capture');
  mkdirSync(specDir, { recursive: true });

  // Minimal task list with one task; build off the project's real format.
  writeFileSync(
    join(specDir, '03-tasks.md'),
    [
      '# Tasks',
      '',
      'Status legend: `[ ]` not started · `[x]` done.',
      '',
      '## Slice T — test',
      '',
      '### `[x]` T-99 — test task',
      '',
      '- **Cite:** spec BR-1; design §D1',
      '- **What:** do the thing per BR-1.',
      '- **Verify:** unit tests pass.',
      '',
    ].join('\n'),
    'utf8'
  );
  writeFileSync(
    join(specDir, '01-spec.md'),
    '# Spec\n\n## §1 Foo\n\n- **BR-1** — must do the thing.\n',
    'utf8'
  );
  writeFileSync(
    join(specDir, '02-design.md'),
    '# Design\n\n## §D1 Foo\n\nThe design.\n',
    'utf8'
  );

  // Builder system prompt (minimal real-shape stub).
  mkdirSync(join(workDir, 'scripts/harness/lib/prompts'), {
    recursive: true,
  });
  writeFileSync(
    join(workDir, 'scripts/harness/lib/prompts/builder.md'),
    '# Builder\n\nYou are the builder.\n',
    'utf8'
  );

  statePath = join(workDir, '.harness/state.json');

  findingsPath = join(workDir, 'pushback.md');
  writeFileSync(
    findingsPath,
    '### Pushback A\n\nFix the divergence.\n',
    'utf8'
  );
});

describe('buildPushbackSection', () => {
  it('produces the standard ## Operator pushback re-dispatch section with verbatim findings body', () => {
    const section = buildPushbackSection('### One\n\nDo X.\n');
    expect(section).toContain('## Operator pushback re-dispatch');
    expect(section).toContain('### One');
    expect(section).toContain('Do X.');
  });

  it('trims trailing whitespace from the findings body', () => {
    const section = buildPushbackSection('the body\n\n\n\n');
    expect(section.endsWith('the body')).toBe(true);
  });
});

describe('dispatchPushback — file & validation', () => {
  it('throws when findings file does not exist', async () => {
    await expect(
      dispatchPushback({
        taskId: 'T-99',
        findingsPath: 'nope.md',
        cwd: workDir,
        statePath,
        taskListPath: join(specDir, '03-tasks.md'),
        promptPath: join(workDir, 'scripts/harness/lib/prompts/builder.md'),
      })
    ).rejects.toThrow(/findings file not found/);
  });

  it('throws when findings file is empty', async () => {
    writeFileSync(findingsPath, '   \n\n', 'utf8');
    await expect(
      dispatchPushback({
        taskId: 'T-99',
        findingsPath,
        cwd: workDir,
        statePath,
        taskListPath: join(specDir, '03-tasks.md'),
        promptPath: join(workDir, 'scripts/harness/lib/prompts/builder.md'),
      })
    ).rejects.toThrow(/findings file is empty/);
  });

  it('throws when task ID does not exist in the task list', async () => {
    await expect(
      dispatchPushback({
        taskId: 'T-NOPE',
        findingsPath,
        cwd: workDir,
        statePath,
        taskListPath: join(specDir, '03-tasks.md'),
        promptPath: join(workDir, 'scripts/harness/lib/prompts/builder.md'),
      })
    ).rejects.toThrow(/task T-NOPE not found/);
  });

  it('refuses to reset when HEAD~1 does not exist', async () => {
    // Default reset impl shells to git; inject a custom one that mimics the failure.
    await expect(
      dispatchPushback({
        taskId: 'T-99',
        findingsPath,
        reset: true,
        cwd: workDir,
        statePath,
        taskListPath: join(specDir, '03-tasks.md'),
        promptPath: join(workDir, 'scripts/harness/lib/prompts/builder.md'),
        resetImpl: () => {
          throw new Error(
            'pushback dispatch: --reset requested but HEAD~1 does not exist (refusing to reset on an initial commit)'
          );
        },
        spawnImpl: vi.fn() as never,
      })
    ).rejects.toThrow(/HEAD~1 does not exist/);
  });
});

describe('dispatchPushback — happy path', () => {
  it('renders builder input + appended pushback section, dispatches, and logs pushback_dispatch event', async () => {
    const captured: string[] = [];
    const spawnImpl = vi.fn(() =>
      makeFakeChild({
        stdoutChunks: [SUCCESS_ENVELOPE],
        exitCode: 0,
        capturedStdin: captured,
      })
    ) as unknown as typeof import('node:child_process').spawn;

    const result = await dispatchPushback({
      taskId: 'T-99',
      findingsPath,
      cwd: workDir,
      statePath,
      taskListPath: join(specDir, '03-tasks.md'),
      promptPath: join(workDir, 'scripts/harness/lib/prompts/builder.md'),
      spawnImpl,
      resolveHeadShaImpl: () => 'real-head-sha-123',
    });

    expect(result.exit?.status).toBe('success');
    expect(result.commitSha).toBe('real-head-sha-123');
    expect(result.parseError).toBeUndefined();

    // The prompt sent to the subagent must include both the standard builder
    // input AND the operator-pushback section.
    const sentPrompt = captured.join('');
    expect(sentPrompt).toContain('You are the builder.');
    expect(sentPrompt).toContain('## Operator pushback re-dispatch');
    expect(sentPrompt).toContain('### Pushback A');

    // state.json captures the pushback_dispatch event with cost/duration/sha.
    expect(existsSync(statePath)).toBe(true);
    const state = JSON.parse(readFileSync(statePath, 'utf8'));
    const events = state.events as Array<{
      type: string;
      payload: Record<string, unknown>;
    }>;
    const pb = events.find((e) => e.type === 'pushback_dispatch');
    expect(pb).toBeTruthy();
    expect(pb!.payload.cost_usd).toBe(0.66);
    expect(pb!.payload.commit_sha).toBe('real-head-sha-123');
    expect(pb!.payload.findings_source).toBe(findingsPath);
    expect(pb!.payload.reset).toBe(false);
  });

  it('runs reset before dispatch when reset=true', async () => {
    const resetImpl = vi.fn();
    const spawnImpl = vi.fn(() =>
      makeFakeChild({ stdoutChunks: [SUCCESS_ENVELOPE], exitCode: 0 })
    ) as unknown as typeof import('node:child_process').spawn;

    await dispatchPushback({
      taskId: 'T-99',
      findingsPath,
      reset: true,
      cwd: workDir,
      statePath,
      taskListPath: join(specDir, '03-tasks.md'),
      promptPath: join(workDir, 'scripts/harness/lib/prompts/builder.md'),
      spawnImpl,
      resetImpl,
      resolveHeadShaImpl: () => 'post-reset-sha',
    });

    expect(resetImpl).toHaveBeenCalledTimes(1);
    const state = JSON.parse(readFileSync(statePath, 'utf8'));
    const pb = state.events.find(
      (e: { type: string }) => e.type === 'pushback_dispatch'
    );
    expect(pb.payload.reset).toBe(true);
  });

  it('captures parse_error + raw_result_text when builder exit is malformed', async () => {
    const malformed = JSON.stringify({
      type: 'result',
      subtype: 'success',
      is_error: false,
      result: 'not a structured exit at all',
      stop_reason: 'end_turn',
      session_id: 'pb-session-bad',
      total_cost_usd: 0.5,
      duration_ms: 1000,
      num_turns: 5,
    });
    const spawnImpl = vi.fn(() =>
      makeFakeChild({ stdoutChunks: [malformed], exitCode: 0 })
    ) as unknown as typeof import('node:child_process').spawn;

    const result = await dispatchPushback({
      taskId: 'T-99',
      findingsPath,
      cwd: workDir,
      statePath,
      taskListPath: join(specDir, '03-tasks.md'),
      promptPath: join(workDir, 'scripts/harness/lib/prompts/builder.md'),
      spawnImpl,
      resolveHeadShaImpl: () => 'whatever',
    });

    expect(result.exit).toBeNull();
    expect(result.parseError).toBeTruthy();

    const state = JSON.parse(readFileSync(statePath, 'utf8'));
    const pb = state.events.find(
      (e: { type: string }) => e.type === 'pushback_dispatch'
    );
    expect(pb.payload.parse_error).toBeTruthy();
    expect(pb.payload.raw_result_text).toContain('not a structured exit');
  });
});
