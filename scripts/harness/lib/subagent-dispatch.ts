/**
 * Generic subagent dispatch wrapper.
 *
 * Spawns a fresh `claude -p` subagent with the given prompt + options and
 * returns the parsed result envelope. The envelope is shape-stable across
 * Claude Code versions per `--output-format json` contract:
 *
 *   {
 *     "type": "result",
 *     "subtype": "success" | "error_during_execution" | ...,
 *     "is_error": boolean,
 *     "result": "<assistant's final text response>",
 *     "stop_reason": "end_turn" | "max_turns" | ...,
 *     "session_id": "<uuid>",
 *     "total_cost_usd": number,
 *     "duration_ms": number,
 *     "num_turns": number,
 *     "usage": { ... }
 *   }
 *
 * The role-specific dispatchers (builder, cold-reader, arbiter) call this
 * and then parse `resultText` for their respective structured exits.
 *
 * Pure relative to the spawn boundary — testable by mocking node:child_process.
 */

import { spawn, type ChildProcess } from 'node:child_process';

export type ClaudeModel = 'opus' | 'sonnet' | 'haiku';
export type PermissionMode =
  | 'acceptEdits'
  | 'plan'
  | 'bypassPermissions'
  | 'default';

export interface DispatchOptions {
  /** The prompt text passed to the subagent (the per-role system prompt + per-task input, already concatenated by the caller). */
  prompt: string;
  /** Model alias. Defaults to `sonnet` (the harness's standard role model). */
  model?: ClaudeModel;
  /** Permission mode for the subagent. Builder typically `acceptEdits`; cold-reader/arbiter typically `plan`. */
  permissionMode?: PermissionMode;
  /** Optional allowlist of tools (passed verbatim to `claude --allowedTools`). */
  allowedTools?: string[];
  /** Optional denylist of tools. Forbidden-deploy enforcement lives here. */
  disallowedTools?: string[];
  /** Working directory for the subagent. Defaults to the parent process cwd. */
  cwd?: string;
  /** Hard wall-clock cap. Subagent is killed on timeout. Default 15 min. */
  timeoutMs?: number;
  /** Optional appended system prompt (kept separate from the per-task input). */
  appendSystemPrompt?: string;
  /** Optional per-call extra args passed verbatim to claude. */
  extraArgs?: string[];
  /** For tests: inject a spawn implementation. */
  spawnImpl?: typeof spawn;
}

export interface DispatchResult {
  /** The assistant's final text response. The role dispatcher parses this further. */
  resultText: string;
  /** True if the subagent exited with `is_error: true` or non-zero code. */
  isError: boolean;
  /** USD cost. */
  costUsd: number;
  /** Wall-clock duration ms (per claude's own measurement). */
  durationMs: number;
  /** Number of assistant turns. */
  numTurns: number;
  /** Subagent session id (for log correlation). */
  sessionId: string;
  /** Stop reason from the model. */
  stopReason: string;
  /** Raw envelope, for debugging / structured logging. */
  rawEnvelope: unknown;
}

interface ClaudeJsonEnvelope {
  type: 'result';
  subtype: string;
  is_error: boolean;
  result: string;
  stop_reason: string;
  session_id: string;
  total_cost_usd: number;
  duration_ms: number;
  num_turns: number;
}

const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000;

export async function dispatchSubagent(
  opts: DispatchOptions
): Promise<DispatchResult> {
  const args = buildClaudeArgs(opts);
  const spawner = opts.spawnImpl ?? spawn;
  const child: ChildProcess = spawner('claude', args, {
    cwd: opts.cwd,
    env: process.env,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  // Pass the prompt over stdin — avoids ARG_MAX limits and shell escaping.
  child.stdin?.write(opts.prompt);
  child.stdin?.end();

  let stdout = '';
  let stderr = '';
  child.stdout?.on('data', (chunk: Buffer) => {
    stdout += chunk.toString('utf8');
  });
  child.stderr?.on('data', (chunk: Buffer) => {
    stderr += chunk.toString('utf8');
  });

  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timeoutHandle = setTimeout(() => {
    child.kill('SIGTERM');
  }, timeoutMs);

  const exitCode = await new Promise<number | null>((resolve) => {
    child.on('exit', (code) => resolve(code));
  });
  clearTimeout(timeoutHandle);

  if (exitCode !== 0 && !stdout.trim()) {
    throw new Error(
      `claude subagent exited with code ${exitCode} and no stdout. stderr: ${stderr.trim().slice(0, 500)}`
    );
  }

  const envelope = parseEnvelope(stdout);

  return {
    resultText: envelope.result,
    isError: envelope.is_error || exitCode !== 0,
    costUsd: envelope.total_cost_usd,
    durationMs: envelope.duration_ms,
    numTurns: envelope.num_turns,
    sessionId: envelope.session_id,
    stopReason: envelope.stop_reason,
    rawEnvelope: envelope,
  };
}

/**
 * Receives a prompt argument that is fed via stdin. The `-p` flag is
 * still passed (no following positional) to put claude into print mode.
 */
function buildClaudeArgs(opts: DispatchOptions): string[] {
  const args = ['-p', '--output-format', 'json'];

  args.push('--model', opts.model ?? 'sonnet');
  if (opts.permissionMode) {
    args.push('--permission-mode', opts.permissionMode);
  }
  if (opts.allowedTools && opts.allowedTools.length > 0) {
    args.push('--allowedTools', ...opts.allowedTools);
  }
  if (opts.disallowedTools && opts.disallowedTools.length > 0) {
    args.push('--disallowedTools', ...opts.disallowedTools);
  }
  if (opts.appendSystemPrompt) {
    args.push('--append-system-prompt', opts.appendSystemPrompt);
  }
  if (opts.extraArgs && opts.extraArgs.length > 0) {
    args.push(...opts.extraArgs);
  }
  return args;
}

function parseEnvelope(stdout: string): ClaudeJsonEnvelope {
  // claude -p --output-format json emits one JSON object on stdout. If the
  // stream included other lines (warnings, etc.) take the last well-formed
  // JSON line.
  const lines = stdout
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i]!;
    if (line.startsWith('{') && line.endsWith('}')) {
      try {
        const parsed = JSON.parse(line) as Partial<ClaudeJsonEnvelope>;
        if (
          parsed.type === 'result' &&
          typeof parsed.result === 'string' &&
          typeof parsed.is_error === 'boolean'
        ) {
          return parsed as ClaudeJsonEnvelope;
        }
      } catch {
        // try next line
      }
    }
  }
  throw new Error(
    `claude stdout did not contain a parseable result envelope. First 500 chars: ${stdout.slice(0, 500)}`
  );
}
