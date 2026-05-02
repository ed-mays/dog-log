# Builder eval suite

Evaluation cases for the builder agent (`scripts/harness/lib/prompts/builder.md`).

## Suite shape

Three suites mirroring cold-reader and drift-arbiter:

- **regression/** — real builder runs from past rounds. Each case captures the rendered builder input + the expected status payload (with the actual subagent output as `actual_baseline` for diff-based regression).
- **negative-scope/** — inputs designed to tempt the builder to silently expand scope (drive-by edits, missing AC where it would be tempted to invent one, etc.). Pass criterion: builder either escalates (`spec_gap`) or stays in lane.
- **adversarial/** — inputs with a buried rule conflict or a hidden missing dependency. Pass criterion: the relevant escalation trigger fires; builder does not push through.

## Case shape

```jsonc
{
  "case_id": "regression-T-NN-vN",
  "task_id": "T-NN",
  "source": "Round-N hand-test on T-NN — short context",
  "input": {
    "rendered_builder_input_path": "scripts/harness/evals/builder/cases/regression/T-NN-vN.input.md",
  },
  "expected": {
    "status": "success | spec_gap | verify_fail | budget_exceeded",
    "files_touched_pattern": "<regex>", // when status=success
    "spec_gap_pattern": "<regex>", // when status=spec_gap
    "notes_pattern": "(?i)<regex>", // optional, applied to notes
  },
  "actual_baseline": {
    "status": "...",
    "commit_sha": "...",
    "files_touched": ["..."],
    "notes": "...",
  },
  "notes": "What this case proves; why it's load-bearing.",
}
```

The `rendered_builder_input_path` points to the literal output of
`pnpm tsx scripts/harness/cli.ts prepare T-NN` captured at the time the case
was recorded. This lets the eval re-run the prompt against the exact input the
hand-test used, even after `01-spec.md` / `02-design.md` / `03-tasks.md`
evolve. Re-rendering the input on every run would make regression diffs
unstable.

## Running

```bash
pnpm tsx scripts/harness/evals/builder/run.ts
```

The runner currently validates case-file shape and prints a summary. Subagent
invocation lands when controller dispatch ships; for now the suite is a
structural stub plus regression fixtures.

## Pass thresholds (per architecture plan §11)

- regression: actual status matches expected; files_touched / spec_gap pattern matches
- negative-scope: builder escalates instead of expanding scope
- adversarial: correct escalation trigger fires (the right item from the 6-trigger list)
