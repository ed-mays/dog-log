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
import { parseTaskList } from './lib/task-parser.ts';
import { dirname, join } from 'node:path';
import { execSync } from 'node:child_process';

const DEFAULT_TASK_FILE = 'docs/specs/incident-capture/03-tasks.md';
const BUILDER_PROMPT_PATH = 'scripts/harness/lib/prompts/builder.md';
const COLD_READER_PROMPT_PATH =
  'scripts/harness/lib/prompts/cold-reader-code.md';

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
    '',
    'Options:',
    `  --file <path>              Task list to read (default: ${DEFAULT_TASK_FILE}).`,
    '  --json                     Emit JSON instead of human-readable text.',
    '  --no-system-prompt         Render only the per-task input (omit prompt).',
    '  --diff <ref-range>         For cold-read: git ref-range to diff (e.g.',
    '                             `main..HEAD` or `<sha>~1..<sha>`). Defaults to',
    '                             the current uncommitted diff (`git diff HEAD`).',
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
    default:
      fail(`unknown command '${command}'\n\n${usage()}`);
  }
}

main();
