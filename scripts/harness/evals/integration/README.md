# Integration eval suite

Cross-agent trajectory fixtures. Each case captures a complete builder →
cold-reader → drift-arbiter → builder loop as a single artifact, pointing
at the per-agent fixtures that already exist for each step.

## Why this exists

Per-agent eval suites validate **one role at a time**. They cannot detect
when two prompts compose poorly — e.g. when a cold-reader finding's
`cited_section` is in a format the drift-arbiter input assembler can't
handle, or when an arbiter's proposed amendment uses a grammar the
builder-input assembler doesn't carry through. Round 17 surfaced exactly
this composition issue (TDD vs verify-line); rounds 18-21 fixed it across
four PRs.

The integration suite is the system-level eval. Future controller dispatch
will validate orchestration against these fixtures.

## Case format

```jsonc
{
  "case_id": "trajectory-NN-short-name",
  "task_id": "T-NN",
  "title": "Round-NN→NN — narrative",
  "description": "...",
  "steps": [
    {
      "step": 1,
      "agent": "builder" | "cold-reader" | "drift-arbiter" | "human",
      "round": 17,
      "case_ref": "scripts/harness/evals/<agent>/cases/<bucket>/<file>.json",
      "outcome": "success" | "spec_gap" | "approve" | "veto" | "amend_task" | ...,
      "notes": "What this step proved; any prompt-iteration finding."
    }
  ],
  "expected_full_loop": "Brief: what the trajectory proves end-to-end.",
  "validation": "How to re-validate this trajectory (which fixtures to run)."
}
```

## Cases

- **`trajectory-T-01-loop-closure.json`** — the round-17→21 closed loop.
  Five steps: V1 silent → V2 spec_gap → arbiter amend_task → human apply
  amendment → V2 success. Points at the existing per-agent fixtures
  (`adversarial/round-17-V1-T-01-silent-tdd-conflict`,
  `regression/round-18-V2-T-01-spec-gap`,
  `regression/T-01-V2-spec-gap` arbiter case, `regression/T-01-V2-amended`
  builder case).

## Running

```bash
pnpm tsx scripts/harness/evals/integration/run.ts
```

Validates that every referenced per-agent case exists and parses cleanly.
Real loop execution lands when controller dispatch ships — the controller
itself becomes the integration runner.
