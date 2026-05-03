import { describe, it, expect, vi } from 'vitest';
import { EventEmitter } from 'node:events';
import { Readable, Writable } from 'node:stream';
import { dispatchSubagent } from './subagent-dispatch';

interface FakeChild extends EventEmitter {
  stdin: Writable;
  stdout: Readable;
  stderr: Readable;
  kill: (signal?: string) => boolean;
  killed: boolean;
}

function makeFakeChild(opts: {
  stdoutChunks?: string[];
  stderrChunks?: string[];
  exitCode: number | null;
  exitDelayMs?: number;
}): FakeChild {
  const child = new EventEmitter() as FakeChild;

  const stdinChunks: string[] = [];
  child.stdin = new Writable({
    write(chunk, _encoding, cb) {
      stdinChunks.push(chunk.toString());
      cb();
    },
    final(cb) {
      cb();
    },
  });

  child.stdout = Readable.from((opts.stdoutChunks ?? []).map(Buffer.from));
  child.stderr = Readable.from((opts.stderrChunks ?? []).map(Buffer.from));

  child.kill = vi.fn(() => {
    child.killed = true;
    return true;
  });
  child.killed = false;

  setTimeout(() => {
    child.emit('exit', opts.exitCode);
  }, opts.exitDelayMs ?? 5);

  return child;
}

const VALID_ENVELOPE = JSON.stringify({
  type: 'result',
  subtype: 'success',
  is_error: false,
  result: '{"status":"success","commit_sha":"abc123"}',
  stop_reason: 'end_turn',
  session_id: 'session-1',
  total_cost_usd: 0.42,
  duration_ms: 1234,
  num_turns: 3,
});

describe('dispatchSubagent', () => {
  it('builds claude args with the expected defaults', async () => {
    const spawnImpl = vi.fn(() =>
      makeFakeChild({ stdoutChunks: [VALID_ENVELOPE], exitCode: 0 })
    ) as unknown as typeof import('node:child_process').spawn;

    await dispatchSubagent({
      prompt: 'hello',
      spawnImpl,
    });

    expect(spawnImpl).toHaveBeenCalledTimes(1);
    const call = (spawnImpl as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(call[0]).toBe('claude');
    expect(call[1]).toEqual([
      '-p',
      '--output-format',
      'json',
      '--model',
      'sonnet',
    ]);
  });

  it('passes permission-mode, allowed/disallowed tools, and append-system-prompt through', async () => {
    const spawnImpl = vi.fn(() =>
      makeFakeChild({ stdoutChunks: [VALID_ENVELOPE], exitCode: 0 })
    ) as unknown as typeof import('node:child_process').spawn;

    await dispatchSubagent({
      prompt: 'hi',
      model: 'haiku',
      permissionMode: 'plan',
      allowedTools: ['Read', 'Grep'],
      disallowedTools: ['Bash(firebase deploy)'],
      appendSystemPrompt: 'extra',
      spawnImpl,
    });

    const args = (spawnImpl as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0][1] as string[];
    expect(args).toContain('--model');
    expect(args).toContain('haiku');
    expect(args).toContain('--permission-mode');
    expect(args).toContain('plan');
    expect(args).toContain('--allowedTools');
    expect(args).toContain('Read');
    expect(args).toContain('Grep');
    expect(args).toContain('--disallowedTools');
    expect(args).toContain('Bash(firebase deploy)');
    expect(args).toContain('--append-system-prompt');
    expect(args).toContain('extra');
  });

  it('parses the JSON envelope and returns structured fields', async () => {
    const spawnImpl = vi.fn(() =>
      makeFakeChild({ stdoutChunks: [VALID_ENVELOPE], exitCode: 0 })
    ) as unknown as typeof import('node:child_process').spawn;

    const result = await dispatchSubagent({ prompt: 'go', spawnImpl });

    expect(result.resultText).toBe(
      '{"status":"success","commit_sha":"abc123"}'
    );
    expect(result.isError).toBe(false);
    expect(result.costUsd).toBe(0.42);
    expect(result.durationMs).toBe(1234);
    expect(result.numTurns).toBe(3);
    expect(result.sessionId).toBe('session-1');
    expect(result.stopReason).toBe('end_turn');
  });

  it('marks isError=true when claude reports is_error in the envelope', async () => {
    const errorEnvelope = JSON.stringify({
      type: 'result',
      subtype: 'error_during_execution',
      is_error: true,
      result: 'something went wrong',
      stop_reason: 'tool_use',
      session_id: 's',
      total_cost_usd: 0,
      duration_ms: 0,
      num_turns: 0,
    });
    const spawnImpl = vi.fn(() =>
      makeFakeChild({ stdoutChunks: [errorEnvelope], exitCode: 0 })
    ) as unknown as typeof import('node:child_process').spawn;

    const result = await dispatchSubagent({ prompt: 'go', spawnImpl });
    expect(result.isError).toBe(true);
  });

  it('throws when stdout has no parseable envelope and exit was non-zero', async () => {
    const spawnImpl = vi.fn(() =>
      makeFakeChild({
        stdoutChunks: [],
        stderrChunks: ['boom'],
        exitCode: 1,
      })
    ) as unknown as typeof import('node:child_process').spawn;

    await expect(dispatchSubagent({ prompt: 'go', spawnImpl })).rejects.toThrow(
      /exited with code 1/
    );
  });

  it('throws when stdout has content but no parseable envelope', async () => {
    const spawnImpl = vi.fn(() =>
      makeFakeChild({
        stdoutChunks: ['some warning\nnot json\n'],
        exitCode: 0,
      })
    ) as unknown as typeof import('node:child_process').spawn;

    await expect(dispatchSubagent({ prompt: 'go', spawnImpl })).rejects.toThrow(
      /result envelope/
    );
  });

  it('writes the prompt to the child stdin', async () => {
    let captured = '';
    const child = makeFakeChild({
      stdoutChunks: [VALID_ENVELOPE],
      exitCode: 0,
    });
    child.stdin = new Writable({
      write(chunk, _encoding, cb) {
        captured += chunk.toString();
        cb();
      },
      final(cb) {
        cb();
      },
    });
    const spawnImpl = vi.fn(
      () => child
    ) as unknown as typeof import('node:child_process').spawn;

    await dispatchSubagent({ prompt: 'the-prompt-text', spawnImpl });

    expect(captured).toBe('the-prompt-text');
  });
});
