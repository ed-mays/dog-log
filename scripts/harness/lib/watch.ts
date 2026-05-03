/**
 * `harness watch` — pretty-print orchestrator events as they're appended
 * to state.json (Axis 4 — round 43).
 *
 * Polls the file at a configurable interval, prints any events not yet
 * shown. Exits cleanly on `orchestrate_end` (or Ctrl+C).
 *
 * fs.watch is unreliable on macOS for files written via atomic-rename
 * (which writeStateAtomic in state-store.ts uses) — the watcher fires on
 * the temp-file's create, then the rename triggers a separate inode and
 * the watcher detaches. Polling is duller but works everywhere.
 */

import { existsSync } from 'node:fs';
import {
  loadState,
  type StateEvent,
  type OrchestratorState,
} from './state-store';

export interface WatchOptions {
  /** Path to the state.json to watch. */
  statePath: string;
  /** Poll interval in milliseconds. Default 500ms. */
  intervalMs?: number;
  /** Hard cap — stop watching after this many ms even if no orchestrate_end. */
  maxWaitMs?: number;
  /** Sink for output. Defaults to process.stdout.write. */
  write?: (s: string) => void;
  /** Sleep impl (test seam). */
  sleep?: (ms: number) => Promise<void>;
  /** When true, omit ANSI color codes (for non-TTY or `--no-color`). */
  noColor?: boolean;
  /** Inject `Date.now()` (test seam). */
  now?: () => number;
}

const ANSI = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

export async function watchState(opts: WatchOptions): Promise<void> {
  const intervalMs = opts.intervalMs ?? 500;
  const maxWaitMs = opts.maxWaitMs ?? 60 * 60 * 1000;
  const write = opts.write ?? ((s: string) => process.stdout.write(s));
  const sleep = opts.sleep ?? defaultSleep;
  const now = opts.now ?? (() => Date.now());

  const startMs = now();
  let seenCount = 0;
  let cumulativeCostUsd = 0;
  const fileExistsAtStart = existsSync(opts.statePath);
  if (!fileExistsAtStart) {
    write(
      paint(
        opts,
        ANSI.dim,
        `harness watch: waiting for ${opts.statePath} to appear...\n`
      )
    );
  }

  while (true) {
    if (now() - startMs > maxWaitMs) {
      write(
        paint(
          opts,
          ANSI.dim,
          `\nharness watch: max wait (${(maxWaitMs / 1000 / 60).toFixed(0)} min) reached; exiting.\n`
        )
      );
      return;
    }

    const state = loadState(opts.statePath);
    if (!state) {
      await sleep(intervalMs);
      continue;
    }

    const events = state.events;
    if (events.length > seenCount) {
      for (let i = seenCount; i < events.length; i++) {
        const e = events[i]!;
        const cost = numericPayloadField(e, 'cost_usd');
        if (cost !== null) cumulativeCostUsd += cost;
        write(formatEvent(e, state, cumulativeCostUsd, opts) + '\n');
      }
      seenCount = events.length;
    }

    // Stop on orchestrate_end (the loop wrote everything; nothing more coming).
    if (events.some((e) => e.type === 'orchestrate_end')) {
      return;
    }

    await sleep(intervalMs);
  }
}

function paint(opts: WatchOptions, color: string, text: string): string {
  if (opts.noColor) return text;
  return `${color}${text}${ANSI.reset}`;
}

function numericPayloadField(e: StateEvent, key: string): number | null {
  const v = e.payload[key];
  return typeof v === 'number' ? v : null;
}

function formatEvent(
  e: StateEvent,
  state: OrchestratorState,
  cumulativeCostUsd: number,
  opts: WatchOptions
): string {
  const elapsedSec = Math.floor(
    (new Date(e.ts).getTime() - new Date(state.started_at).getTime()) / 1000
  );
  const elapsedStr = `T+${formatElapsed(elapsedSec)}`.padStart(8);
  const tag = formatEventTag(e, opts);
  const detail = formatEventDetail(e);
  const costMeter =
    cumulativeCostUsd > 0
      ? paint(opts, ANSI.dim, ` [$${cumulativeCostUsd.toFixed(4)}]`)
      : '';
  return `${paint(opts, ANSI.dim, elapsedStr)}  ${tag}  ${detail}${costMeter}`;
}

function formatEventTag(e: StateEvent, opts: WatchOptions): string {
  switch (e.type) {
    case 'orchestrate_start':
      return paint(opts, ANSI.bold + ANSI.cyan, '▶ START          ');
    case 'orchestrate_end': {
      const outcome = String(e.payload.outcome ?? '');
      const color =
        outcome === 'success' ? ANSI.bold + ANSI.green : ANSI.bold + ANSI.red;
      return paint(opts, color, '■ END            ');
    }
    case 'dispatch_start': {
      const role = String(e.payload.role ?? '');
      return paint(opts, ANSI.blue, `→ dispatch_start ${role.padEnd(12)}`);
    }
    case 'dispatch_end': {
      const role = String(e.payload.role ?? '');
      const verdict =
        e.payload.verdict ?? e.payload.status ?? e.payload.parse_error ?? '';
      const color =
        verdict === 'approve' || verdict === 'success'
          ? ANSI.green
          : verdict === 'veto' || verdict === 'verify_fail'
            ? ANSI.yellow
            : ANSI.dim;
      return paint(opts, color, `← dispatch_end   ${role.padEnd(12)}`);
    }
    case 'amendment_applied':
      return paint(opts, ANSI.green, '✎ amendment_app  ');
    case 'amendment_apply_failed':
      return paint(opts, ANSI.red, '✗ amendment_fail ');
    case 'cycle_halt':
      return paint(opts, ANSI.bold + ANSI.red, '⊘ cycle_halt     ');
    case 'pushback_dispatch':
      return paint(opts, ANSI.cyan, '⟲ pushback       ');
  }
}

function formatEventDetail(e: StateEvent): string {
  const p = e.payload;
  const parts: string[] = [];
  if (typeof p.attempt === 'number') parts.push(`attempt=${p.attempt}`);
  if (typeof p.diff_sha === 'string')
    parts.push(`diff=${(p.diff_sha as string).slice(0, 8)}`);
  if (typeof p.commit_sha === 'string')
    parts.push(`sha=${(p.commit_sha as string).slice(0, 8)}`);
  if (typeof p.status === 'string') parts.push(`status=${p.status}`);
  if (typeof p.verdict === 'string') parts.push(`verdict=${p.verdict}`);
  if (typeof p.findings_count === 'number')
    parts.push(`findings=${p.findings_count}`);
  if (typeof p.outcome === 'string') parts.push(`outcome=${p.outcome}`);
  if (typeof p.reason === 'string') parts.push(p.reason as string);
  if (typeof p.parse_error === 'string')
    parts.push(`parse_error=${p.parse_error}`);
  return parts.join(' ');
}

function formatElapsed(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec - m * 60;
  return `${m}m${String(s).padStart(2, '0')}s`;
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}
