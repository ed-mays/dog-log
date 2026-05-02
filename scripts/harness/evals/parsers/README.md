# Parser corpus eval suite

Snapshot tests for `task-parser.ts` and `spec-parser.ts` against the actual
`docs/specs/incident-capture/` artifacts. Catches **silent template drift**:
if a parser refactor changes how real-world artifacts are interpreted, the
snapshot diff surfaces it. Distinct from the parsers' unit tests, which
cover edge cases by _construction_ rather than by _real input_.

## Why this exists

`task-parser.test.ts` (31 tests) and `spec-parser.test.ts` (21 tests) cover
the parsing logic. They do not assert anything about the _current real
artifacts_ — meaning a parser change that subtly breaks how `03-tasks.md`'s
T-01 entry is interpreted (e.g., whether the TDD-waiver Note is preserved)
would pass every unit test.

The corpus runs each parser against the live artifact and diffs the
produced parse tree against a snapshot. Combined with the CLI-snapshots
suite (which catches drift in the prompt-rendering layer), the two suites
cover the input-assembly path end-to-end.

## What's snapshotted

- `snapshots/task-parser-03-tasks.snapshot.json` — `parseTaskList()` output
  for `docs/specs/incident-capture/03-tasks.md`. Includes counts of tasks
  per slice, every task's id + status + citation list, and the open-DQ
  index. Sensitive to any change in task numbering, slice boundaries, or
  citation extraction.

- `snapshots/spec-parser-01-spec-sections.snapshot.json` — `extractSpecSections()`
  output for `01-spec.md`. Snapshots the full set of section IDs
  (e.g. §1, §2, §3, ...) the parser identifies.

- `snapshots/spec-parser-02-design-sections.snapshot.json` — same for
  `02-design.md` (e.g. §D1, §D2, §D3, ...).

## Tombstone coverage

`01-spec.md` carries tombstoned items (e.g., AC-14 was tombstoned in round
2 with an explicit pointer to its replacements). The corpus snapshot
captures whatever the parser actually does with tombstoned IDs today —
neither prescribing nor proscribing a specific behavior. If a future parser
change starts/stops listing tombstoned items as live, the snapshot diff
makes the behavioral change explicit.

## Updating snapshots (deliberate)

When an artifact changes intentionally (e.g., adding a new task or
amending a section), regenerate the snapshots:

```bash
pnpm tsx scripts/harness/evals/parsers/run.ts --update
```

Review the diff in the PR. Snapshots are the contract; updating them is
how the contract evolves.

## Running

```bash
pnpm tsx scripts/harness/evals/parsers/run.ts
```

Exits 1 with a structured diff on any mismatch.
