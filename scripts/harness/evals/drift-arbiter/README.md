# Drift-Arbiter Eval Suite

Per the architecture plan §11, the drift-arbiter resolves `spec_gap` exits by
proposing a minimal, scoped amendment to spec / design / task — or pushing
back when the builder misread the spec. This eval suite is the ground truth
for whether the arbiter stays in scope and proposes the right verdict.

## Three suites (mirrors cold-reader)

### `cases/regression/`

Real spec_gap payloads from past builder runs, hand-labeled with the expected
verdict + amendment shape. Pass criterion: **≥80% verdict accuracy on
known-correct cases; amendment text matches the expected pattern.**

### `cases/negative-scope/`

Spec_gap payloads where the right move is `pushback` (the builder misread the
spec, no amendment is warranted), OR scenarios where the proposed amendment
should NOT touch unrelated text. Pass criterion: **arbiter emits `pushback`
for misread cases; emits minimal-blast-radius amendments otherwise.**

### `cases/adversarial/`

Spec_gap payloads where two artifacts could plausibly be amended (e.g. the
gap could be fixed in spec OR in task) and the arbiter must pick the
upstream one per the methodology rule. Or: payloads where the builder's
suggested amendment overshoots, and the arbiter should produce a smaller
fix. Pass criterion: **arbiter picks the upstream artifact; produces a
strictly-smaller amendment than the builder suggested when applicable.**

## Case format

```json
{
  "case_id": "regression-T-NN-<short-name>",
  "task_id": "T-NN",
  "source": "PR #N round-M / synthetic / etc.",
  "input": {
    "spec_gap": {
      "task_id": "T-NN",
      "cited_section": "BR-N" | ["BR-N", "§DM"] | "compound string",
      "gap_description": "...",
      "suggested_amendment": "...",
      "files_inspected": ["..."]
    }
  },
  "expected": {
    "verdict": "amend_spec" | "amend_design" | "amend_task" | "pushback",
    "amendment": {
      "file": "01-spec.md" | "02-design.md" | "03-tasks.md",
      "anchor_pattern": "<regex against amendment.anchor>",
      "before_pattern": "<regex against amendment.before; empty for pure additions>",
      "after_pattern": "<regex against amendment.after; key phrasing the amendment should contain>",
      "changelog_entry_pattern": "<regex against amendment.changelog_entry>"
    },
    "pushback_pattern": "<regex against pushback_clarification; only when verdict=pushback>"
  },
  "notes": "<optional: why this case matters, what failure mode it tests>"
}
```

The runner checks:

- `verdict` matches exactly.
- When `verdict` is an `amend_*`: the proposed amendment's `file` matches
  exactly; `anchor`, `before`, `after`, `changelog_entry` match their
  respective regex patterns.
- When `verdict` is `pushback`: the `pushback_clarification` matches its
  regex pattern.

## Bootstrap status

| Suite                   | Cases seeded | Source                                                          |
| ----------------------- | ------------ | --------------------------------------------------------------- |
| `cases/regression/`     | 1            | Round-18 V2 builder spec_gap on T-01                            |
| `cases/negative-scope/` | 0            | Pending — needs hand-constructed pushback cases                 |
| `cases/adversarial/`    | 0            | Pending — needs hand-constructed multi-artifact-ambiguity cases |

The first 3–5 real builder runs will produce additional regression cases as
spec_gaps emerge in the wild.

## Running the suite

```bash
pnpm tsx scripts/harness/evals/drift-arbiter/run.ts
```

The runner currently validates case-file shape and prints a coverage summary.
Real arbiter invocation lands when controller dispatch ships.
