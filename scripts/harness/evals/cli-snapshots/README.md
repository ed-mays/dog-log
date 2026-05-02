# CLI snapshot eval suite

Snapshot tests for `scripts/harness/cli.ts` — pins the _exact_ output of the
three render commands (`prepare`, `cold-read`, `arbitrate`) so silent template
drift in the lib layer (`builder-input.ts`, `cold-reader-input.ts`,
`drift-arbiter-input.ts`) gets caught at PR review, not on the next subagent
hand-test.

## Why this exists

The lib unit tests cover the assembled `BuilderInput` / `ColdReaderInput` /
`DriftArbiterInput` shapes by construction. They do **not** assert what
`formatXxxMarkdown()` actually emits for a real artifact end-to-end. A
refactor that changes whitespace ordering, drops a section heading, or
reorders citations would pass every existing unit test while silently
changing the prompt every subagent receives. Snapshots catch that.

## Snapshot files

`snapshots/<command>-<task>-<scenario>.snapshot.md` — the literal stdout of
the CLI command at the time of capture.

Current snapshots:

- `prepare-T-02.snapshot.md` — builder input for T-02. T-02 is used (not
  T-01) so updating T-01's task notes during slice-0 iteration doesn't
  thrash this snapshot.
- `cold-read-T-01-no-diff.snapshot.md` — cold-reader input for T-01 with no
  `--diff` argument (empty diff section). Pins the prompt + cited-section
  layout independent of git state.
- `arbitrate-T-01-V2-spec-gap.snapshot.md` — drift-arbiter input for the
  round-18 spec_gap (re-uses the same payload the regression eval case
  captures). Pins the arbiter's rendered prompt across input-assembler
  refactors.

## Updating snapshots (deliberate)

When a lib change _intentionally_ alters the rendered output, regenerate the
snapshots:

```bash
pnpm tsx scripts/harness/cli.ts prepare T-02 > scripts/harness/evals/cli-snapshots/snapshots/prepare-T-02.snapshot.md
pnpm tsx scripts/harness/cli.ts cold-read T-01 > scripts/harness/evals/cli-snapshots/snapshots/cold-read-T-01-no-diff.snapshot.md
jq '.input.spec_gap' scripts/harness/evals/drift-arbiter/cases/regression/T-01-V2-spec-gap.json > /tmp/arb-input.json
pnpm tsx scripts/harness/cli.ts arbitrate /tmp/arb-input.json > scripts/harness/evals/cli-snapshots/snapshots/arbitrate-T-01-V2-spec-gap.snapshot.md
```

The diff in the PR is the prompt change. Reviewers should look at it, not
just at the lib code.

## Running

```bash
pnpm tsx scripts/harness/evals/cli-snapshots/run.ts
```

The runner re-invokes each CLI command, captures stdout, and diffs against
the stored snapshot. Exits 1 on any mismatch with a unified diff.

## Tradeoff

Snapshot tests are sometimes considered fragile. The mitigation here is
that we have _very few_ snapshots (3, by design) and they exist
specifically to prevent silent prompt drift — the failure mode they're
guarding against is exactly the one snapshot tests are _good_ at catching.
The friction of regenerating them on intentional changes is the feature,
not the bug.
