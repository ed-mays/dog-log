#!/usr/bin/env node
/**
 * Spec-anchored harness CLI — read-only skeleton (MVP step 2).
 *
 * Usage:
 *   pnpm harness next             # show the next actionable task
 *   pnpm harness status           # show progress per slice
 *   pnpm harness next --json      # machine-readable
 *   pnpm harness status --json
 *   pnpm harness <cmd> --file <path>   # override the default task list
 *
 * Default task list: docs/specs/incident-capture/03-tasks.md
 *
 * Exits non-zero on parser warnings or when the requested information cannot
 * be produced (e.g. file missing). No agent dispatch — that lands in step 4.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import {
  loadNext,
  loadStatus,
  type SliceProgress,
  type StatusSummary,
} from './lib/controller.ts';
import { lintCommitMessage } from './lib/citation-linter.ts';
import {
  buildBuilderInput,
  formatBuilderInputMarkdown,
} from './lib/builder-input.ts';
import {
  buildColdReaderInput,
  formatColdReaderInputMarkdown,
} from './lib/cold-reader-input.ts';
import { checkTaskContract } from './lib/task-contract-check.ts';
import { deriveVerifyCommand } from './lib/derive-verify-command.ts';
import {
  buildDriftArbiterInput,
  formatDriftArbiterInputMarkdown,
  type SpecGapPayload,
} from './lib/drift-arbiter-input.ts';
import { parseTaskList } from './lib/task-parser.ts';
import { dispatchBuilder } from './lib/dispatch/builder-dispatch.ts';
import { dispatchColdReader } from './lib/dispatch/cold-reader-dispatch.ts';
import { dispatchArbiter } from './lib/dispatch/arbiter-dispatch.ts';
import {
  orchestrateTask,
  summarizeOrchestrateResult,
} from './lib/orchestrate.ts';
import { dispatchPushback } from './lib/pushback-dispatch.ts';
import {
  defaultDispatchesLogPath,
  loadDispatchesLog,
} from './lib/dispatches-log.ts';
import {
  computeStats,
  formatStatsHuman,
  type StatsFilters,
} from './lib/stats.ts';
import { defaultStatePath } from './lib/state-store.ts';
import { watchState } from './lib/watch.ts';
import { dirname, join } from 'node:path';
import { execSync } from 'node:child_process';

const DEFAULT_TASK_FILE = 'docs/specs/incident-capture/03-tasks.md';
const BUILDER_PROMPT_PATH = 'scripts/harness/lib/prompts/builder.md';
const COLD_READER_PROMPT_PATH =
  'scripts/harness/lib/prompts/cold-reader-code.md';
const DRIFT_ARBITER_PROMPT_PATH =
  'scripts/harness/lib/prompts/drift-arbiter.md';

function usage(): string {
  return [
    'Usage: harness <command> [options]',
    '',
    'Commands:',
    '  next                       Print the next actionable task and slice context.',
    '  status                     Print progress per slice plus open DQs.',
    '  lint-commit <file>         Validate a commit-message file against the',
    '                             citation rule. Exits non-zero if invalid.',
    '  prepare <task-id>          Render the builder system prompt + per-task',
    '                             input for hand-driving a single task.',
    '  cold-read <task-id>        Render the cold-reader system prompt + per-task',
    '                             input (cited sections + diff). Use --diff to',
    '                             pull the diff from a git ref-range.',
    '  arbitrate <spec-gap-file>  Render the drift-arbiter system prompt + per-',
    '                             arbitration input. <spec-gap-file> is a JSON',
    '                             file matching the SpecGapPayload shape.',
    '  build <task-id>            Dispatch a builder subagent on the task. Uses',
    '                             claude -p; returns the structured exit + cost.',
    '  review <task-id>           Dispatch a cold-reader subagent on the task',
    '                             diff. Use --diff for ref-range (default',
    '                             HEAD~1..HEAD).',
    '  arbitrate-run <spec-gap-file>',
    '                             Dispatch a drift-arbiter subagent on the gap.',
    '  orchestrate <task-id>      Chain build → review → (arbiter+apply) until',
    '                             success, halt for human, or hit a cap. Logs',
    '                             every step to .harness/state.json.',
    '  pushback <task-id>         Re-dispatch builder with operator findings as',
    '                             explicit context. Use --findings <path> to',
    '                             point at a markdown file with findings; pass',
    '                             --reset to first `git reset --hard HEAD~1`',
    '                             (discards the previous orchestrator commit).',
    '                             Logs a pushback_dispatch event to state.json.',
    '  stats                      Aggregate stats from .harness/dispatches.jsonl:',
    '                             per-role cost histogram, verdict distribution,',
    '                             per-task rollup, recent dispatches. Use --task,',
    '                             --role, --since to filter.',
    '  watch                      Tail .harness/state.json and pretty-print',
    '                             orchestrator events as they appear. Exits on',
    '                             orchestrate_end or Ctrl+C. Use --state to',
    '                             override the watched path; --no-color disables',
    '                             ANSI codes.',
    '',
    'Options:',
    `  --file <path>              Task list to read (default: ${DEFAULT_TASK_FILE}).`,
    '  --json                     Emit JSON instead of human-readable text.',
    '  --no-system-prompt         Render only the per-task input (omit prompt).',
    '  --diff <ref-range>         For cold-read / review: git ref-range to diff',
    '                             (e.g. `main..HEAD`). Defaults to the current',
    '                             uncommitted diff for cold-read and HEAD~1..HEAD',
    '                             for review.',
    '  --findings <path>          For pushback: markdown file with operator findings.',
    '  --reset                    For pushback: `git reset --hard HEAD~1` first.',
    '  --task <id>                For stats: filter by task id (e.g. T-22).',
    '  --role <r>                 For stats: filter by role (builder|cold-reader|arbiter|pushback).',
    '  --since <iso>              For stats: only entries with ts >= ISO datetime.',
    '  --state <path>             For watch: state.json path (default `.harness/state.json`).',
    '  --no-color                 For watch: disable ANSI color codes.',
    '  -h, --help                 Show this help.',
  ].join('\n');
}

function fail(message: string, exitCode = 1): never {
  process.stderr.write(`harness: ${message}\n`);
  process.exit(exitCode);
}

function readTaskFile(filePath: string): string {
  try {
    return readFileSync(filePath, 'utf8');
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return fail(`could not read task file '${filePath}': ${reason}`);
  }
}

function formatSliceLine(slice: SliceProgress): string {
  const ratio = `${slice.done}/${slice.total} done`;
  const tag = slice.complete
    ? '✓'
    : slice.inProgress > 0
      ? '~'
      : slice.blocked > 0
        ? '!'
        : ' ';
  const extras: string[] = [];
  if (slice.inProgress) extras.push(`${slice.inProgress} in progress`);
  if (slice.blocked) extras.push(`${slice.blocked} blocked`);
  const extrasStr = extras.length ? `  (${extras.join('; ')})` : '';
  return `  [${tag}] Slice ${slice.index} — ${slice.name.padEnd(40)} ${ratio}${extrasStr}`;
}

function printStatusHuman(file: string, status: StatusSummary): void {
  const out: string[] = [];
  out.push(`${file}`);
  out.push(
    `  Total: ${status.total}   pending: ${status.pending}   in progress: ${status.inProgress}   done: ${status.done}   blocked: ${status.blocked}`
  );
  out.push('');
  for (const slice of status.slices) {
    out.push(formatSliceLine(slice));
  }
  if (status.openDqs.length > 0) {
    out.push('');
    out.push('  Open DQs (need confirm before relevant phases):');
    for (const dq of status.openDqs) {
      out.push(`    ${dq.id}  ${dq.description}`);
    }
  }
  if (status.warnings.length > 0) {
    out.push('');
    out.push('  Warnings:');
    for (const w of status.warnings) out.push(`    ! ${w}`);
  }
  process.stdout.write(`${out.join('\n')}\n`);
}

function printNextHuman(file: string, next: ReturnType<typeof loadNext>): void {
  const out: string[] = [];
  out.push(`${file}`);
  if (!next.task) {
    out.push('');
    out.push('  No actionable task. All tasks done, blocked, or in progress.');
    process.stdout.write(`${out.join('\n')}\n`);
    return;
  }

  if (next.atSliceBoundary && next.slice) {
    out.push('');
    out.push(
      `  ⚠  Slice boundary: about to enter Slice ${next.slice.index} (${next.slice.name}).`
    );
    out.push(
      "     Per the methodology, run the prior slice's smoke task before dispatching."
    );
  }

  const t = next.task;
  out.push('');
  out.push(`  Next actionable: ${t.id} — ${t.description}`);
  out.push(`  Slice:           ${t.slice} (${t.sliceName})`);
  out.push(`  Status:          ${t.status}`);
  if (t.citations.spec.length > 0) {
    out.push(
      `  Spec cites:      ${t.citations.spec.map((c) => c.ref).join(', ')}`
    );
  }
  if (t.citations.design.length > 0) {
    out.push(
      `  Design cites:    ${t.citations.design.map((c) => c.ref).join(', ')}`
    );
  }
  if (t.dqTags.length > 0) {
    out.push(`  Open DQ tags:    ${t.dqTags.join(', ')}`);
  }
  if (t.verify) {
    out.push('');
    out.push(`  Verify: ${t.verify}`);
  }
  if (t.what) {
    out.push('');
    out.push('  What:');
    for (const line of t.what.split('\n')) {
      out.push(`    ${line}`);
    }
  }
  if (t.notes) {
    out.push('');
    out.push('  Notes:');
    for (const line of t.notes.split('\n')) {
      out.push(`    ${line}`);
    }
  }
  if (next.warnings.length > 0) {
    out.push('');
    out.push('  Warnings:');
    for (const w of next.warnings) out.push(`    ! ${w}`);
  }
  process.stdout.write(`${out.join('\n')}\n`);
}

function main(): void {
  const { values, positionals } = parseArgs({
    options: {
      file: { type: 'string' },
      json: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
      'no-system-prompt': { type: 'boolean', default: false },
      diff: { type: 'string' },
      findings: { type: 'string' },
      reset: { type: 'boolean', default: false },
      task: { type: 'string' },
      role: { type: 'string' },
      since: { type: 'string' },
      state: { type: 'string' },
      'no-color': { type: 'boolean', default: false },
    },
    allowPositionals: true,
  });

  if (values.help || positionals.length === 0) {
    process.stdout.write(`${usage()}\n`);
    process.exit(values.help ? 0 : 1);
  }

  const command = positionals[0];
  const fileArg = values.file ?? DEFAULT_TASK_FILE;
  const filePath = resolve(process.cwd(), fileArg);

  switch (command) {
    case 'status': {
      const md = readTaskFile(filePath);
      const status = loadStatus(md);
      if (values.json) {
        process.stdout.write(
          `${JSON.stringify({ file: fileArg, ...status }, null, 2)}\n`
        );
      } else {
        printStatusHuman(fileArg, status);
      }
      // Exit non-zero if the parser surfaced warnings — methodology says
      // a clean artifact has zero warnings. Tooling should not silently
      // tolerate them.
      process.exit(status.warnings.length === 0 ? 0 : 2);
      break;
    }
    case 'next': {
      const md = readTaskFile(filePath);
      const next = loadNext(md);
      if (values.json) {
        process.stdout.write(
          `${JSON.stringify({ file: fileArg, ...next }, null, 2)}\n`
        );
      } else {
        printNextHuman(fileArg, next);
      }
      process.exit(next.warnings.length === 0 ? 0 : 2);
      break;
    }
    case 'lint-commit': {
      const msgFile = positionals[1];
      if (!msgFile) {
        fail('lint-commit requires a commit-message file path\n\n' + usage());
      }
      const msgPath = resolve(process.cwd(), msgFile);
      let raw: string;
      try {
        raw = readFileSync(msgPath, 'utf8');
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        fail(`could not read commit-message file '${msgFile}': ${reason}`);
      }
      const result = lintCommitMessage(raw);
      if (values.json) {
        process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      } else if (result.valid) {
        const note = result.exemptReason
          ? `exempt (${result.exemptReason})`
          : `cites: ${result.citations.join(', ')}`;
        process.stdout.write(`harness: commit OK — ${note}\n`);
      } else {
        process.stderr.write(`harness: ${result.failureReason}\n`);
      }
      process.exit(result.valid ? 0 : 1);
      break;
    }
    case 'prepare': {
      const taskId = positionals[1];
      if (!taskId) {
        fail('prepare requires a task id (e.g. T-01)\n\n' + usage());
      }
      const tasksMd = readTaskFile(filePath);
      const parsed = parseTaskList(tasksMd);
      const task = parsed.tasks.find((t) => t.id === taskId);
      if (!task) {
        fail(`task ${taskId} not found in ${fileArg}`);
      }

      // Discover spec/design files as siblings of the task file. The methodology
      // convention is `<feature>/00-brief.md`, `01-spec.md`, `02-design.md`,
      // `03-tasks.md`. If the convention isn't followed, the user can override
      // by piping their own input — but for now we assume convention.
      const featureDir = dirname(filePath);
      const specPath = join(featureDir, '01-spec.md');
      const designPath = join(featureDir, '02-design.md');
      let specMd: string;
      let designMd: string;
      try {
        specMd = readFileSync(specPath, 'utf8');
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        fail(`could not read spec file '${specPath}': ${reason}`);
      }
      try {
        designMd = readFileSync(designPath, 'utf8');
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        fail(`could not read design file '${designPath}': ${reason}`);
      }

      const input = buildBuilderInput({
        task,
        specMarkdown: specMd,
        designMarkdown: designMd,
        derivedVerifyCommand: cliDeriveVerifyCommand(task.verify),
      });

      if (values.json) {
        process.stdout.write(`${JSON.stringify(input, null, 2)}\n`);
        process.exit(input.missing_citations.length === 0 ? 0 : 2);
      }

      // Default human form: builder system prompt + per-task input markdown,
      // ready to paste into a fresh Claude Code session.
      if (!values['no-system-prompt']) {
        const promptPath = resolve(process.cwd(), BUILDER_PROMPT_PATH);
        try {
          const systemPrompt = readFileSync(promptPath, 'utf8');
          process.stdout.write(systemPrompt);
          process.stdout.write('\n---\n\n');
        } catch (err) {
          const reason = err instanceof Error ? err.message : String(err);
          fail(
            `could not read builder prompt '${BUILDER_PROMPT_PATH}': ${reason}`
          );
        }
      }
      process.stdout.write(formatBuilderInputMarkdown(input));
      process.stdout.write('\n');
      process.exit(input.missing_citations.length === 0 ? 0 : 2);
      break;
    }
    case 'cold-read': {
      const taskId = positionals[1];
      if (!taskId) {
        fail('cold-read requires a task id (e.g. T-01)\n\n' + usage());
      }
      const tasksMd = readTaskFile(filePath);
      const parsed = parseTaskList(tasksMd);
      const task = parsed.tasks.find((t) => t.id === taskId);
      if (!task) {
        fail(`task ${taskId} not found in ${fileArg}`);
      }

      const featureDir = dirname(filePath);
      let specMd: string;
      let designMd: string;
      try {
        specMd = readFileSync(join(featureDir, '01-spec.md'), 'utf8');
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        fail(`could not read spec file: ${reason}`);
      }
      try {
        designMd = readFileSync(join(featureDir, '02-design.md'), 'utf8');
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        fail(`could not read design file: ${reason}`);
      }

      // Diff source: --diff <ref-range> runs `git diff <ref-range>`. Default
      // is `git diff HEAD` (uncommitted changes). Empty diff is allowed and
      // surfaces clearly in the output (the cold-reader will mark this case
      // as "nothing to review").
      const diffRange = values.diff;
      let diff: string;
      try {
        const args = diffRange ? ['diff', diffRange] : ['diff', 'HEAD'];
        diff = execSync(`git ${args.join(' ')}`, {
          encoding: 'utf8',
          maxBuffer: 16 * 1024 * 1024, // 16 MiB cap on diff size
        });
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        fail(`git diff failed: ${reason}`);
      }

      const input = buildColdReaderInput({
        task,
        specMarkdown: specMd,
        designMarkdown: designMd,
        diff,
        taskContractCheck: checkTaskContract(task.what, diff),
      });

      if (values.json) {
        process.stdout.write(`${JSON.stringify(input, null, 2)}\n`);
        process.exit(input.missing_citations.length === 0 ? 0 : 2);
      }

      if (!values['no-system-prompt']) {
        const promptPath = resolve(process.cwd(), COLD_READER_PROMPT_PATH);
        try {
          const systemPrompt = readFileSync(promptPath, 'utf8');
          process.stdout.write(systemPrompt);
          process.stdout.write('\n---\n\n');
        } catch (err) {
          const reason = err instanceof Error ? err.message : String(err);
          fail(
            `could not read cold-reader prompt '${COLD_READER_PROMPT_PATH}': ${reason}`
          );
        }
      }
      process.stdout.write(formatColdReaderInputMarkdown(input));
      process.stdout.write('\n');
      process.exit(input.missing_citations.length === 0 ? 0 : 2);
      break;
    }
    case 'arbitrate': {
      const specGapFile = positionals[1];
      if (!specGapFile) {
        fail('arbitrate requires a spec_gap JSON file path\n\n' + usage());
      }
      const gapPath = resolve(process.cwd(), specGapFile);
      let raw: string;
      try {
        raw = readFileSync(gapPath, 'utf8');
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        fail(`could not read spec_gap file '${specGapFile}': ${reason}`);
      }
      let spec_gap: SpecGapPayload;
      try {
        spec_gap = JSON.parse(raw) as SpecGapPayload;
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        fail(`spec_gap file '${specGapFile}' is not valid JSON: ${reason}`);
      }
      if (
        !spec_gap.task_id ||
        !spec_gap.cited_section ||
        !spec_gap.gap_description
      ) {
        fail(
          `spec_gap file is missing required fields (task_id, cited_section, gap_description)`
        );
      }

      const tasksMd = readTaskFile(filePath);
      const featureDir = dirname(filePath);
      let specMd: string;
      let designMd: string;
      try {
        specMd = readFileSync(join(featureDir, '01-spec.md'), 'utf8');
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        fail(`could not read spec file: ${reason}`);
      }
      try {
        designMd = readFileSync(join(featureDir, '02-design.md'), 'utf8');
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        fail(`could not read design file: ${reason}`);
      }

      const input = buildDriftArbiterInput({
        spec_gap,
        specMarkdown: specMd,
        designMarkdown: designMd,
        tasksMarkdown: tasksMd,
      });

      if (values.json) {
        process.stdout.write(`${JSON.stringify(input, null, 2)}\n`);
        process.exit(input.missing_citations.length === 0 ? 0 : 2);
      }

      if (!values['no-system-prompt']) {
        const promptPath = resolve(process.cwd(), DRIFT_ARBITER_PROMPT_PATH);
        try {
          const systemPrompt = readFileSync(promptPath, 'utf8');
          process.stdout.write(systemPrompt);
          process.stdout.write('\n---\n\n');
        } catch (err) {
          const reason = err instanceof Error ? err.message : String(err);
          fail(
            `could not read drift-arbiter prompt '${DRIFT_ARBITER_PROMPT_PATH}': ${reason}`
          );
        }
      }
      process.stdout.write(formatDriftArbiterInputMarkdown(input));
      process.stdout.write('\n');
      process.exit(input.missing_citations.length === 0 ? 0 : 2);
      break;
    }
    case 'build': {
      const taskId = positionals[1];
      if (!taskId) {
        fail('build requires a task id (e.g. T-11)\n\n' + usage());
      }
      void runBuild(taskId, filePath, fileArg, values.json).catch((err) => {
        const reason = err instanceof Error ? err.message : String(err);
        fail(`build dispatch failed: ${reason}`);
      });
      break;
    }
    case 'review': {
      const taskId = positionals[1];
      if (!taskId) {
        fail('review requires a task id\n\n' + usage());
      }
      void runReview(taskId, filePath, fileArg, values.diff, values.json).catch(
        (err) => {
          const reason = err instanceof Error ? err.message : String(err);
          fail(`review dispatch failed: ${reason}`);
        }
      );
      break;
    }
    case 'arbitrate-run': {
      const gapFile = positionals[1];
      if (!gapFile) {
        fail('arbitrate-run requires a spec_gap JSON file path\n\n' + usage());
      }
      void runArbitrate(gapFile, filePath, fileArg, values.json).catch(
        (err) => {
          const reason = err instanceof Error ? err.message : String(err);
          fail(`arbitrate-run dispatch failed: ${reason}`);
        }
      );
      break;
    }
    case 'orchestrate': {
      const taskId = positionals[1];
      if (!taskId) {
        fail('orchestrate requires a task id (e.g. T-14)\n\n' + usage());
      }
      void runOrchestrate(taskId, filePath, fileArg, values.json).catch(
        (err) => {
          const reason = err instanceof Error ? err.message : String(err);
          fail(`orchestrate failed: ${reason}`);
        }
      );
      break;
    }
    case 'pushback': {
      const taskId = positionals[1];
      if (!taskId) {
        fail(
          'pushback requires a task id (e.g. T-22) and --findings <path>\n\n' +
            usage()
        );
      }
      if (!values.findings) {
        fail(
          'pushback requires --findings <path> (markdown file with operator findings)\n\n' +
            usage()
        );
      }
      void runPushback(
        taskId,
        values.findings,
        values.reset === true,
        filePath,
        fileArg,
        values.json
      ).catch((err) => {
        const reason = err instanceof Error ? err.message : String(err);
        fail(`pushback failed: ${reason}`);
      });
      break;
    }
    case 'stats': {
      void runStats(values.task, values.role, values.since, values.json).catch(
        (err) => {
          const reason = err instanceof Error ? err.message : String(err);
          fail(`stats failed: ${reason}`);
        }
      );
      break;
    }
    case 'watch': {
      void runWatch(values.state, values['no-color'] === true).catch((err) => {
        const reason = err instanceof Error ? err.message : String(err);
        fail(`watch failed: ${reason}`);
      });
      break;
    }
    default:
      fail(`unknown command '${command}'\n\n${usage()}`);
  }
}

async function runBuild(
  taskId: string,
  filePath: string,
  fileArg: string,
  json: boolean
): Promise<void> {
  process.stderr.write(
    `harness: dispatching builder subagent for ${taskId} (this may take several minutes)...\n`
  );
  const { exit, raw, parseError } = await dispatchBuilder({
    taskId,
    taskListPath: filePath,
  });
  if (json) {
    process.stdout.write(
      `${JSON.stringify(
        {
          file: fileArg,
          task_id: taskId,
          exit,
          parse_error: parseError ?? null,
          raw_result_text: parseError ? raw.resultText : undefined,
          cost_usd: raw.costUsd,
          duration_ms: raw.durationMs,
          num_turns: raw.numTurns,
          session_id: raw.sessionId,
          stop_reason: raw.stopReason,
        },
        null,
        2
      )}\n`
    );
  } else {
    process.stdout.write(`builder exit: ${exit?.status ?? 'PARSE_FAILED'}\n`);
    process.stdout.write(`  cost: $${raw.costUsd.toFixed(4)}\n`);
    process.stdout.write(
      `  duration: ${(raw.durationMs / 1000).toFixed(1)}s\n`
    );
    process.stdout.write(`  turns: ${raw.numTurns}\n`);
    process.stdout.write(`  session: ${raw.sessionId}\n`);
    process.stdout.write(`  stop_reason: ${raw.stopReason}\n`);
    if (parseError) {
      process.stdout.write(`  parse_error: ${parseError}\n`);
      process.stdout.write(
        `  raw_result_text (last 1000 chars):\n---\n${raw.resultText.slice(-1000)}\n---\n`
      );
    }
    if (exit?.status === 'success' && exit.commit_sha) {
      process.stdout.write(`  commit: ${exit.commit_sha}\n`);
    }
    if (exit?.status === 'spec_gap') {
      process.stdout.write(
        `  cited: ${exit.cited_section}\n  gap: ${exit.gap_description}\n`
      );
    }
    if (exit?.status === 'verify_fail') {
      process.stdout.write(
        `  verify_command: ${exit.verify_command}\n  attempts: ${exit.attempts}\n`
      );
    }
  }
  process.exit(exit?.status === 'success' ? 0 : 2);
}

async function runReview(
  taskId: string,
  filePath: string,
  fileArg: string,
  diffRange: string | undefined,
  json: boolean
): Promise<void> {
  process.stderr.write(
    `harness: dispatching cold-reader subagent for ${taskId}...\n`
  );
  const { exit, raw, parseError } = await dispatchColdReader({
    taskId,
    diffRange,
    taskListPath: filePath,
  });
  if (json) {
    process.stdout.write(
      `${JSON.stringify(
        {
          file: fileArg,
          task_id: taskId,
          exit,
          parse_error: parseError ?? null,
          raw_result_text: parseError ? raw.resultText : undefined,
          cost_usd: raw.costUsd,
          duration_ms: raw.durationMs,
          stop_reason: raw.stopReason,
        },
        null,
        2
      )}\n`
    );
  } else {
    process.stdout.write(
      `cold-reader verdict: ${exit?.verdict ?? 'PARSE_FAILED'}\n`
    );
    process.stdout.write(`  cost: $${raw.costUsd.toFixed(4)}\n`);
    process.stdout.write(`  stop_reason: ${raw.stopReason}\n`);
    if (parseError) {
      process.stdout.write(`  parse_error: ${parseError}\n`);
      process.stdout.write(
        `  raw_result_text (last 1000 chars):\n---\n${raw.resultText.slice(-1000)}\n---\n`
      );
    }
    if (exit) {
      process.stdout.write(`  findings: ${exit.findings.length}\n`);
      for (const finding of exit.findings) {
        process.stdout.write(
          `  - ${finding.severity} #${finding.scope_check} (${finding.cited_section}): ${finding.description.slice(0, 100)}\n`
        );
      }
      if (exit.summary) {
        process.stdout.write(`  summary: ${exit.summary}\n`);
      }
    }
  }
  process.exit(exit?.verdict === 'approve' ? 0 : 2);
}

async function runArbitrate(
  gapFile: string,
  filePath: string,
  fileArg: string,
  json: boolean
): Promise<void> {
  const gapPath = resolve(process.cwd(), gapFile);
  const raw = readFileSync(gapPath, 'utf8');
  const specGap = JSON.parse(raw) as SpecGapPayload;
  process.stderr.write(
    `harness: dispatching arbiter subagent for ${specGap.task_id}...\n`
  );
  const {
    exit,
    raw: dispatchRaw,
    parseError,
  } = await dispatchArbiter({
    specGap,
    taskListPath: filePath,
  });
  if (json) {
    process.stdout.write(
      `${JSON.stringify(
        {
          file: fileArg,
          spec_gap: specGap,
          exit,
          parse_error: parseError ?? null,
          raw_result_text: parseError ? dispatchRaw.resultText : undefined,
          cost_usd: dispatchRaw.costUsd,
          duration_ms: dispatchRaw.durationMs,
          stop_reason: dispatchRaw.stopReason,
        },
        null,
        2
      )}\n`
    );
  } else {
    process.stdout.write(
      `arbiter verdict: ${exit?.verdict ?? 'PARSE_FAILED'}\n`
    );
    process.stdout.write(`  cost: $${dispatchRaw.costUsd.toFixed(4)}\n`);
    process.stdout.write(`  stop_reason: ${dispatchRaw.stopReason}\n`);
    if (parseError) {
      process.stdout.write(`  parse_error: ${parseError}\n`);
      process.stdout.write(
        `  raw_result_text (last 1000 chars):\n---\n${dispatchRaw.resultText.slice(-1000)}\n---\n`
      );
    }
    if (exit?.rationale) {
      process.stdout.write(`  rationale: ${exit.rationale}\n`);
    }
    if (exit?.amendment) {
      process.stdout.write(`  file:   ${exit.amendment.file}\n`);
      process.stdout.write(`  anchor: ${exit.amendment.anchor}\n`);
      process.stdout.write(`  before:\n---\n${exit.amendment.before}\n---\n`);
      process.stdout.write(`  after:\n---\n${exit.amendment.after}\n---\n`);
      process.stdout.write(
        `  changelog_entry: ${exit.amendment.changelog_entry}\n`
      );
    }
    if (exit?.pushback_clarification) {
      process.stdout.write(`  pushback: ${exit.pushback_clarification}\n`);
    }
    if (exit?.notes) {
      process.stdout.write(`  notes: ${exit.notes}\n`);
    }
  }
  process.exit(0);
}

async function runOrchestrate(
  taskId: string,
  filePath: string,
  fileArg: string,
  json: boolean
): Promise<void> {
  process.stderr.write(
    `harness: orchestrating ${taskId} — chained build → review → (arbiter) loop. This may take 5-15 minutes.\n`
  );
  const result = await orchestrateTask({
    taskId,
    taskListPath: filePath,
  });
  if (json) {
    process.stdout.write(
      `${JSON.stringify(
        {
          file: fileArg,
          task_id: taskId,
          outcome: result.outcome,
          builder_dispatches: result.builderDispatches,
          arbiter_dispatches: result.arbiterDispatches,
          total_cost_usd: result.totalCostUsd,
          last_commit_sha: result.lastCommitSha,
          halt_reason: result.haltReason,
          state_path: '.harness/state.json',
        },
        null,
        2
      )}\n`
    );
  } else {
    process.stdout.write(`${summarizeOrchestrateResult(result)}\n`);
    process.stdout.write(`state log: .harness/state.json\n`);
  }
  process.exit(result.outcome === 'success' ? 0 : 2);
}

async function runPushback(
  taskId: string,
  findingsPath: string,
  reset: boolean,
  filePath: string,
  fileArg: string,
  json: boolean
): Promise<void> {
  process.stderr.write(
    `harness: pushback re-dispatch for ${taskId} (findings: ${findingsPath}${reset ? ', after git reset --hard HEAD~1' : ''})...\n`
  );
  const result = await dispatchPushback({
    taskId,
    findingsPath,
    reset,
    taskListPath: filePath,
  });
  if (json) {
    process.stdout.write(
      `${JSON.stringify(
        {
          file: fileArg,
          task_id: taskId,
          findings_source: findingsPath,
          reset,
          status: result.exit?.status ?? null,
          parse_error: result.parseError ?? null,
          commit_sha: result.commitSha ?? null,
          cost_usd: result.raw.costUsd,
          duration_ms: result.raw.durationMs,
          num_turns: result.raw.numTurns,
          state_path: '.harness/state.json',
        },
        null,
        2
      )}\n`
    );
  } else {
    process.stdout.write(`pushback: ${result.exit?.status ?? 'parse_error'}\n`);
    process.stdout.write(`  cost: $${result.raw.costUsd.toFixed(4)}\n`);
    process.stdout.write(
      `  duration: ${(result.raw.durationMs / 1000).toFixed(1)}s\n`
    );
    process.stdout.write(`  num_turns: ${result.raw.numTurns}\n`);
    if (result.commitSha) {
      process.stdout.write(`  commit_sha: ${result.commitSha}\n`);
    }
    if (result.parseError) {
      process.stdout.write(`  parse_error: ${result.parseError}\n`);
      process.stdout.write(
        `  raw_result_text (last 1000 chars):\n---\n${result.raw.resultText.slice(-1000)}\n---\n`
      );
    }
    process.stdout.write(`state log: .harness/state.json\n`);
  }
  process.exit(result.exit?.status === 'success' ? 0 : 2);
}

async function runStats(
  taskId: string | undefined,
  role: string | undefined,
  since: string | undefined,
  json: boolean
): Promise<void> {
  const logPath = defaultDispatchesLogPath();
  const entries = loadDispatchesLog(logPath);
  if (entries.length === 0) {
    process.stderr.write(
      `harness: no dispatches logged at ${logPath}. Run \`harness orchestrate T-N\` first.\n`
    );
    process.exit(2);
  }
  const filters: StatsFilters = {};
  if (taskId) filters.taskId = taskId;
  if (role) {
    if (
      role !== 'builder' &&
      role !== 'cold-reader' &&
      role !== 'arbiter' &&
      role !== 'pushback'
    ) {
      fail(
        `--role must be one of: builder, cold-reader, arbiter, pushback (got ${role})`
      );
    }
    filters.role = role;
  }
  if (since) filters.since = since;
  const report = computeStats(entries, filters);
  if (json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(`${formatStatsHuman(report)}\n`);
  }
  process.exit(0);
}

async function runWatch(
  statePath: string | undefined,
  noColor: boolean
): Promise<void> {
  const path = statePath
    ? resolve(process.cwd(), statePath)
    : defaultStatePath();
  process.stderr.write(
    `harness: watching ${path} (Ctrl+C to stop; auto-exits on orchestrate_end)\n`
  );
  await watchState({ statePath: path, noColor });
  process.exit(0);
}

function cliDeriveVerifyCommand(
  verifyLine: string | null
): ReturnType<typeof deriveVerifyCommand> | null {
  try {
    const pkgPath = resolve(process.cwd(), 'package.json');
    const raw = readFileSync(pkgPath, 'utf8');
    const pkg = JSON.parse(raw) as { scripts?: Record<string, string> };
    return deriveVerifyCommand(verifyLine, pkg);
  } catch {
    return null;
  }
}

main();
