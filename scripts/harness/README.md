# Spec-Anchored Harness — CLI

The harness orchestrates a 4-role pipeline (controller, builder, cold-reader, drift-arbiter) to drive a per-task TDD loop against a curated `03-tasks.md`. Architecture lives in `~/.claude/plans/i-want-to-explore-compressed-shannon.md`. Per-feature session log lives at `generate-spec-anchored-artifacts-log.md`.

## Read-only commands (no LLM dispatch)

```bash
pnpm tsx scripts/harness/cli.ts status           # progress per slice + open DQs
pnpm tsx scripts/harness/cli.ts next             # next actionable task
pnpm tsx scripts/harness/cli.ts lint-commit FILE # validate citation in commit msg
```

## Render-only commands (prepare prompts for hand-paste)

These commands build the role's full prompt + per-task input and write to stdout. Use when you want to inspect what a subagent would receive, or to feed it manually into a different harness.

```bash
pnpm tsx scripts/harness/cli.ts prepare T-11             # builder
pnpm tsx scripts/harness/cli.ts cold-read T-11 --diff main..HEAD  # cold-reader
pnpm tsx scripts/harness/cli.ts arbitrate gap.json       # drift-arbiter
```

## Subagent dispatch (live `claude -p` invocation)

Spawns a fresh Claude Code subagent in a clean session, parses the structured exit per the role's contract, returns cost + duration + verdict.

**Prerequisites:** `claude` CLI installed and authenticated (this is the same `claude` you use to start an interactive session). Subagents inherit your auth + plugins + settings.

```bash
# Builder — writes code, runs verify, commits. Uses bypassPermissions (deny list is the safety net).
pnpm tsx scripts/harness/cli.ts build T-11

# Cold-reader — read-only review of HEAD~1..HEAD diff against cited spec/design.
pnpm tsx scripts/harness/cli.ts review T-11
pnpm tsx scripts/harness/cli.ts review T-11 --diff main..HEAD

# Drift-arbiter — resolves a spec_gap by amending spec/design/task or pushing back.
pnpm tsx scripts/harness/cli.ts arbitrate-run gap.json
```

Each command supports `--json` for machine-readable output (suitable for piping into another tool).

### Dispatch defaults

| Role        | Model    | Permission mode     | Tool denials                                                                                                                                                                                                                                                                                | Timeout |
| ----------- | -------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| Builder     | `sonnet` | `bypassPermissions` | Bash deny on `firebase deploy`, `vercel deploy`, `gcloud`, `kubectl apply`, `terraform apply` (round-25 no-deploy rule). The deny list is the safety boundary; `bypassPermissions` is required so the subagent can run its own verify gate (round-29 finding — `acceptEdits` blocked Bash). | 30 min  |
| Cold-reader | `sonnet` | `plan` (read-only)  | _none_                                                                                                                                                                                                                                                                                      | 10 min  |
| Arbiter     | `sonnet` | `acceptEdits`       | Bash entirely (arbiter writes spec/design only, never runs commands)                                                                                                                                                                                                                        | 10 min  |

Override via opts on `dispatchBuilder`/`dispatchColdReader`/`dispatchArbiter` if calling directly from TS.

### Exit codes

- `build`: 0 if `success`, 2 otherwise (`spec_gap` / `verify_fail` / `budget_exceeded`)
- `review`: 0 if `approve`, 2 if `veto`
- `arbitrate-run`: 0 always (the arbiter always returns a verdict; humans interpret)

### State persistence

Not yet implemented. Each dispatch is currently stateless — no `.harness/state.json`, no event log, no retry tracking across invocations. The next iteration will add an append-only event log so the controller can resume mid-slice and produce per-PR cost/duration reports.

## Eval suites

Per-role contract tests live in `scripts/harness/evals/`. Each suite is shape-validated at load time today; live subagent dispatch lands case-by-case.

```bash
pnpm tsx scripts/harness/evals/cli-snapshots/run.ts    # 3 prompt-render snapshots
pnpm tsx scripts/harness/evals/builder/run.ts          # 8 builder cases
pnpm tsx scripts/harness/evals/cold-reader/run.ts      # 14 cold-reader cases
pnpm tsx scripts/harness/evals/drift-arbiter/run.ts    # 6 arbiter cases
pnpm tsx scripts/harness/evals/parsers/run.ts          # 3 parser snapshots
pnpm tsx scripts/harness/evals/citation-linter/run.ts  # 5 linter cases
pnpm tsx scripts/harness/evals/integration/run.ts      # 1 cross-suite trajectory
```

When an intentional change to a role prompt or input renderer alters output, regenerate the affected snapshot per the suite's local README.
