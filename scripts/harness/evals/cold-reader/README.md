# Cold-Reader Eval Suite

Per the architecture plan §5, the cold-reader's effectiveness is the single
biggest determinant of harness output quality. This eval suite is the ground
truth for whether scoping is right — trust it over instinct when iterating
the prompt.

## Three suites

### `cases/regression/`

Past finalized PR diffs (and prose artifacts) with hand-labeled findings
lists. Re-run the cold-reader against them. Pass criterion: **≥80% recall on
CRITICAL/HIGH; ≥70% precision** (no more than 30% of emitted findings are
false positives).

### `cases/negative-scope/`

Diffs and artifacts that have ONLY style/architectural-opinion issues — no
real spec violations. Pass criterion: **cold-reader emits zero CRITICAL or
HIGH findings; MEDIUM/LOW are tolerated.** This is the specific
countermeasure for "promotes nits to HIGH" failure mode.

### `cases/adversarial/`

Diffs constructed deliberately with one CRITICAL spec violation buried among
many style nits. Pass criterion: **cold-reader catches the CRITICAL and
doesn't drown it in nit-noise.**

## Case format

Each case is a JSON file:

```json
{
  "case_id": "regression-001",
  "artifact_kind": "code" | "prose",
  "task_id": "T-NN",
  "source": "PR-123 round-1 (or path/to/file)",
  "input": {
    "diff_path": "fixtures/diffs/case-001.diff",
    "cited_spec_refs": ["BR-7", "AC-1"],
    "cited_design_refs": ["§D2"]
  },
  "expected": {
    "verdict": "approve" | "veto",
    "findings": [
      {
        "severity": "CRITICAL" | "HIGH" | "MEDIUM",
        "scope_check": 1 | 2 | 3 | 4 | 5,
        "cited_section": "BR-7",
        "evidence_pattern": "<regex against finding.evidence>",
        "description_pattern": "<regex against finding.description>"
      }
    ]
  }
}
```

The runner checks:

- `verdict` matches exactly.
- Every expected finding has a corresponding actual finding whose
  `severity`, `scope_check`, `cited_section` match AND whose `evidence` /
  `description` match the regex patterns.
- Recall = (matched expected) / (total expected).
- Precision = (matched expected) / (total actual). Extra actual findings
  reduce precision.

## Bootstrap status

| Suite                   | Cases seeded | Source                                 |
| ----------------------- | ------------ | -------------------------------------- |
| `cases/regression/`     | 4 (prose)    | PR #152 cold-read threads              |
| `cases/negative-scope/` | 0            | Pending — needs hand-constructed diffs |
| `cases/adversarial/`    | 0            | Pending — needs hand-constructed diffs |

The first 3–5 builder PRs become the bootstrap set for code regression
cases as we manually rate cold-reader output.

## Running the suite

```bash
pnpm tsx scripts/harness/evals/cold-reader/run.ts
```

The runner is currently a stub — it loads cases and prints what it WOULD
test against, but does not yet invoke the cold-reader subagent. Real
invocation lands when MVP step 6 (subagent dispatch) ships.

## When to re-run

Per plan §5: **on every cold-reader prompt change.** CI fails if pass rate
drops below thresholds (currently informational only since the runner is a
stub).
