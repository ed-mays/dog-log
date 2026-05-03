# Spec-Anchored Agentic Harness — Engineering Overview

**Snapshot date:** 2026-05-03 (after round 41, slice 2 closed)
**Status:** Operational with end-to-end orchestration. Two slices of `incident-capture` shipped end-to-end through `harness orchestrate T-N`. Twelve methodology findings logged across rounds 26-41; 9 shipped, 3 (and counting) queued for PR-B.

This document captures the state of the harness as a reference for an article about harness engineering. It describes what exists today, what's been validated end-to-end, what's missing, and the empirical cost/convergence baselines.

**Intended cadence:** refresh at every slice close, alongside the §T0 changelog entry. The session log (`generate-spec-anchored-artifacts-log.md`) carries the round-by-round narrative; this doc is the sustainable-summary view that an outside reader can pick up cold.

---

## What the harness is

A 4-role pipeline that drives per-task TDD against a curated `03-tasks.md` task list. Each role is a Claude Code subagent invoked via `claude -p` from a thin TypeScript CLI. The orchestrator chains them; per-task progress is logged to `.harness/state.json`.

```
                            CLI (scripts/harness/cli.ts)
                            └─ wraps three read-only + three render + three live-dispatch + one orchestrate command

  ┌─────────────────────────────────────────────────────────────┐
  │  task-parser ─▶ controller (read-only summaries)            │
  │     └─ reads docs/specs/incident-capture/03-tasks.md         │
  │     └─ "next" / "status" / slice-boundary detection          │
  └─────────────────────────────────────────────────────────────┘

      builder              cold-reader              drift-arbiter
      ───────              ───────────              ─────────────
      claude -p (sonnet)   claude -p (sonnet)       claude -p (sonnet)
      bypassPermissions    plan (read-only)         acceptEdits, no Bash
      Bash deny on deploy  no tool denials          writes spec/design only

      Inputs:              Inputs:                  Inputs:
       task + cited spec    task + cited spec        spec_gap payload
       + design + verify    + design + git diff      + spec/design context
       + project ctx        of the produced commit

      Outputs (parsed):    Outputs (parsed):        Outputs (parsed):
       success | spec_gap   approve | veto           amend_spec
       verify_fail          + structured findings    amend_design
       budget_exceeded                               amend_task
                                                    pushback
                                                    + amendment.{file,
                                                       anchor, before,
                                                       after, changelog}
```

### Why 4 roles

- **Controller** is pure orchestration — never an LLM. Today: `harness orchestrate T-N` chains build → review → (route by scope_check) → arbiter or halt; logs every step to `.harness/state.json`; enforces per-task budget cap ($5 / 30 min).
- **Builder** does TDD in a fresh subagent session. Writes tests first, implements minimum code, runs the verify gate, commits with a citation. Has tool access for code + tests + git but not for infra-deploy commands.
- **Cold-reader** is structurally blind to producer reasoning. A separate subagent session with no memory of the build. Reads only the diff + cited spec/design sections. This blindness is the value — it catches what the builder rationalized.
- **Drift-arbiter** resolves spec/design ambiguity. Read-mostly. Can write to spec/design files but not run code. Produces an `amendment.{file, anchor, before, after, changelog_entry}` that's structurally precise enough to be applied deterministically.

Each role has a tight prompt, a small action space, and a structured exit. The structured exit is what makes chaining possible — the controller knows what to do next based on a parsed YAML/JSON payload, not free-text interpretation.

---

## Current capabilities (validated end-to-end on real tasks)

| Path                                                                                    | Status                                                                            | First validated                                                        |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `build T-N` produces `success` exit on a real task                                      | ✅                                                                                | round 29 (T-11)                                                        |
| `build T-N` produces `verify_fail` exit                                                 | ✅                                                                                | round 27-28 (T-11)                                                     |
| Parse-failure path captures raw text + cost/duration metadata                           | ✅                                                                                | round 29 (T-11 attempt 1)                                              |
| `review T-N` produces `approve` verdict                                                 | ✅                                                                                | round 30 (T-12)                                                        |
| `review T-N` produces `veto` with structured finding                                    | ✅                                                                                | round 31 (T-13)                                                        |
| `arbitrate-run gap.json` produces `amend_design` verdict                                | ✅                                                                                | round 31 (T-13)                                                        |
| `arbitrate-run gap.json` produces `amend_task` verdict                                  | ✅                                                                                | round 25 (hand-test)                                                   |
| `amend_spec` / `pushback` verdicts                                                      | ❌ never seen live                                                                | 6 prior arbiter dispatches all returned `amend_design` or `amend_task` |
| Build → cold-reader-veto → arbiter → operator-applies → re-build → re-review-approve    | ✅                                                                                | round 31 (T-13 full cycle)                                             |
| `harness orchestrate T-N` chains build → review automatically (happy path)              | ✅                                                                                | round 33 (T-14)                                                        |
| Orchestrator routes cold-reader veto to halt-for-human (scope_check 1-2)                | ✅                                                                                | rounds 39 (T-22), 41 (T-25)                                            |
| Orchestrator applies arbiter `amend_*` deterministically                                | ⚠️ implemented but not exercised live (no arbiter run since orchestrator shipped) | —                                                                      |
| Operator pushback to builder (cold-reader returned approve, operator caught divergence) | ✅ via manual `claude -p` shell-out                                               | rounds 37 (T-17), 41 (T-25)                                            |
| Budget cap (timeout) firing on a real dispatch                                          | ❌ never seen                                                                     | (would trigger after 30 min builder, 10 min review/arbiter)            |

---

## Empirical cost baselines (subscription-quota equivalent USD)

Cost numbers are reported by `claude -p`'s JSON envelope as `total_cost_usd`. The dog-log harness runs against a Claude Code subscription; the dollar number is informational (equivalent pay-as-you-go cost), not a real bill. Useful for comparing dispatch efficiency over time and for budgeting if the harness ever moves to API-key auth.

### Per-task baselines (post-orchestrator)

| Tier                              | Example                            | Builder      | Cold-reader   | Total            | Notes                                                                            |
| --------------------------------- | ---------------------------------- | ------------ | ------------- | ---------------- | -------------------------------------------------------------------------------- |
| Data file                         | T-19 chipCatalog                   | $0.30        | $0.27         | $0.57            | smallest dispatchable shape                                                      |
| Repository                        | T-18 IncidentRepository RMW        | $0.62        | $0.27         | $0.89            | mocked-Firestore TDD                                                             |
| Service                           | T-17 incidentService mutations     | $0.85        | $0.27         | $1.12            | (then +$0.66 pushback re-dispatch = $1.78 total)                                 |
| Component (leaf)                  | T-21 SeverityChips                 | $1.16        | $0.27         | $1.43            | includes paired store-method chore                                               |
| Component (with carry-over logic) | T-23 ObservationChips              | $1.23        | $0.27         | $1.50            |                                                                                  |
| Component (composing 4 children)  | T-25 IncidentCaptureSurface        | $0.66        | $0.35 + $0.25 | $1.26            | second cold-reader run was operator re-dispatch (finding #10)                    |
| Page with redirect                | T-13 ActiveIncidentPage (clean)    | $1.17        | $0.29         | $1.46            |                                                                                  |
| Page (full escalation cycle)      | T-13 with veto + arbiter + rebuild | —            | —             | $3.49            |                                                                                  |
| Pushback re-dispatch              | T-17, T-22                         | ~$0.66-$0.76 | optional      | adds $0.66-$1.00 | always preceded by full cold-reader re-dispatch ($0.25-$0.35) due to finding #10 |

### Slice-cumulative

| Slice                       | Tasks | Subagent total                                                                   | Avg per task | Pushbacks      | Notes                                            |
| --------------------------- | ----- | -------------------------------------------------------------------------------- | ------------ | -------------- | ------------------------------------------------ |
| 1 (foundation + start/stop) | 11    | ~$8 (mixed: hand-built T-06..T-10, harness-driven T-11..T-15, manual smoke T-16) | —            | 0              | rounds 26-35; harness was being built mid-flight |
| 2 (mid-event editing)       | 10    | $11.13                                                                           | $1.11        | 2 (T-17, T-22) | rounds 36-41; orchestrator-driven from start     |

**Pattern observations:**

- Within a tier, cost is stable across task instances (~10% variance). Variance comes from cited-section breadth, not task complexity per se.
- Pushback adds ~50-70% to a task's cost ($1.12 → $1.78 for T-17). Usually one pushback per ~5 tasks at current cold-reader scope; if cold-reader scope #7 lands (finding #6), expect this rate to drop.
- Cold-reader cost is remarkably stable ($0.27 ± $0.05) regardless of diff size — it's gated by the prompt + cited-sections context, not the diff.
- A "bad" round (full escalation: builder veto + arbiter + rebuild + re-review) is ~3× the happy-path cost. Manageable as long as it's the exception; budgeting should plan ~$5/task worst case.

---

## What the harness DOESN'T do today (post-orchestrator gaps)

The orchestrator covered the round-31 gap list. New gaps surfaced during slice 2 (rounds 36-41):

1. **Operator pushback path when cold-reader returns approve.** When operator review catches a divergence cold-reader missed, today the only options are: (a) operator-fix in a follow-up commit (defeats the orchestrator), (b) revert and re-dispatch fresh (likely reproduces the bug), (c) reset, render input, append pushback, shell to `claude -p` directly. (c) was used in rounds 37, 41; works but is ~12 min of operator labor and bypasses state.json. **Finding #7.**

2. **State.json doesn't capture cold-reader finding text.** When cold-reader vetoes via the orchestrator, only the verdict + count are persisted; the finding bodies are lost. Operator must re-dispatch ($0.25-$0.35) just to read what the verdict was about. **Finding #10.**

3. **Cold-reader doesn't load the task body — only cited spec/design sections.** This means `What:` line directives like "implement six methods named X, Y, Z" are invisible to the cold-reader; it can only verify BR coverage, which is too loose. Two T-17 divergences (round 37) sat in plain sight against the task contract and cold-reader approved both. **Finding #6.**

4. **Builder hallucinates `commit_sha` in structured exit.** The 40-char SHA in the builder's exit is a free-text string the model invents. First 7 chars usually match the real short SHA; remaining 33 chars are sometimes invented (T-20 round 38), sometimes correct (T-22 round 39). Orchestrator's `git diff <sha>~1..<sha>` fails on the hallucinated form. Fix: orchestrator should `git rev-parse HEAD` immediately after builder dispatch instead of trusting the exit field. **Finding #9.**

5. **Cold-reader verdict non-determinism on identical input.** T-25 (round 41): same diff, same prompt, opposite verdicts on two consecutive runs (veto with 1 finding, then approve with 0 findings). Different from format-compliance non-determinism (round 34) — this is _judgment_ non-determinism. Mitigations to consider: N=3 majority vote, lower temperature, accept and rely on operator review as the consistency layer. Worth quantifying with a 5x rerun before designing a fix. **Finding #12.**

6. **Forward-of-wire-up file friction.** When a task ships a new file that isn't yet imported by anything (e.g. T-19 chipCatalog before T-21 SeverityChips), preflight's knip + coverage gates fail on push. Today operator manually adds knip ignore + writes a stub test. Could be detected pre-push or auto-stubbed by the builder protocol. **Finding #8 candidate (single instance, not yet promoted).**

7. **Three uncommon arbiter verdicts never seen live.** `amend_spec`, `pushback`, and the orchestrator's auto-apply path for any arbiter outcome — none have run in production. The eval suite covers them via fixture cases but the full live trajectory is unverified.

8. **Resume after interrupt.** State.json captures events but no resume logic exists. If operator Ctrl+Cs an in-flight orchestrate, restart starts fresh.

9. **Budget cap firing.** Per-task $5 cap and 30-min wall clock have been implemented but never tripped. No empirical evidence the halt path works.

---

## File map

```
scripts/harness/
├── cli.ts                                    # 10 commands (3 read-only + 3 render + 3 dispatch + 1 orchestrate)
├── README.md                                 # operator docs, dispatch defaults table
├── lib/
│   ├── task-parser.ts                        # parse 03-tasks.md → typed Task[]
│   ├── spec-parser.ts                        # parse 01-spec.md (BR/AC/NFR cites)
│   ├── controller.ts                         # status + next-actionable, slice gates (read-only)
│   ├── orchestrate.ts                        # the chained loop with halt policies (round 32)
│   ├── state-store.ts                        # append-only event log at .harness/state.json
│   ├── citation-linter.ts                    # commit-msg validation (Husky hook)
│   ├── builder-input.ts                      # render builder per-task input
│   ├── cold-reader-input.ts                  # render cold-reader per-task input
│   ├── drift-arbiter-input.ts                # render arbiter per-arbitration input
│   ├── subagent-dispatch.ts                  # generic claude -p wrapper
│   ├── prompts/
│   │   ├── builder.md                        # 9-step TDD discipline + drift-escalation contract
│   │   ├── cold-reader-code.md               # 6 positive scopes + 5 negative + severity rubric
│   │   └── drift-arbiter.md                  # 4 verdicts + amendment shape contract
│   └── dispatch/
│       ├── parse-structured-exit.ts          # JSON/YAML permissive parser for role exits
│       ├── apply-amendment.ts                # deterministic before/after substitution + changelog routing (round 32)
│       ├── builder-dispatch.ts               # builder + ArbiterAmendment-shaped exit
│       ├── cold-reader-dispatch.ts           # cold-reader, plan mode, structured findings
│       └── arbiter-dispatch.ts               # arbiter, acceptEdits, no Bash
└── evals/
    ├── citation-linter/                      # 5 cases (matcher contract)
    ├── builder/                              # 12+ cases (incl. 2 verify_fail, 1 success baseline)
    ├── cold-reader/                          # 14 cases (12 reg / 1 neg / 1 adversarial)
    ├── drift-arbiter/                        # 6 cases (5 amend_task, 1 amend_design — no amend_spec/pushback)
    ├── cli-snapshots/                        # 3 prompt-render snapshots (drift detection)
    ├── parsers/                              # 3 markdown→typed snapshots
    └── integration/                          # 1 cross-suite trajectory
```

---

## Dispatch defaults (per role)

| Role        | Model    | Permission mode     | Tool denials                                                                                                                                                                                                      | Timeout |
| ----------- | -------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| Builder     | `sonnet` | `bypassPermissions` | Bash deny on `firebase deploy`, `vercel deploy`, `gcloud`, `kubectl apply`, `terraform apply`. The deny list is the safety boundary; `bypassPermissions` is required so the subagent can run its own verify gate. | 30 min  |
| Cold-reader | `sonnet` | `plan` (read-only)  | _none_                                                                                                                                                                                                            | 10 min  |
| Arbiter     | `sonnet` | `acceptEdits`       | Bash entirely (arbiter writes spec/design only, never runs commands)                                                                                                                                              | 10 min  |

Why `bypassPermissions` for builder: in `acceptEdits` mode, file edits auto-accept but Bash blocks for approval. In `claude -p` headless mode there's no interactive approval, so the subagent stalls at the verify gate. The deny list (5 specific Bash patterns) plus the prompt-level no-deploy rule together cover the dangerous-Bash surface without blocking the verify gate.

Why `plan` for cold-reader: it should never write or run anything. Read-only review is the role's invariant.

Why `acceptEdits` + `Bash` denied for arbiter: it writes amendments to spec/design files. It should never run code or commit. Bash entirely denied makes that invariant mechanically enforceable.

---

## How a single task flows through the harness today

(Orchestrated — operator runs one command per task.)

1. **`pnpm tsx scripts/harness/cli.ts orchestrate T-N`** — kicks off the full chain in a single process.
2. Builder dispatches. Logs `dispatch_start` and `dispatch_end` events to `.harness/state.json` with cost, duration, status, parsed exit fields.
3. On builder `success` → orchestrator auto-runs cold-reader on the produced commit's diff.
4. On cold-reader `approve` → orchestrator exits with `outcome: success`, total cost summary printed.
5. On cold-reader `veto` → orchestrator inspects the finding's `scope_check`:
   - **scope_check 1 or 2** (BR not implemented; AC not asserted) → builder error → halt for human (`outcome: halt_builder_error_veto`). Operator re-dispatches builder with veto context manually (no native CLI yet — finding #7).
   - **scope_check 3-6** (silent design choice; design drift; coupling; type-contract conformance) → escalates to arbiter automatically (not yet exercised live).
6. On arbiter `amend_*` → orchestrator applies the `before`/`after` substitution + appends changelog + commits as `chore(spec): apply arbiter amendment` + re-dispatches builder (not yet exercised live).
7. On 2nd builder retry or cap exceeded → halt with `outcome: halt_*` and detailed reason.

Manual fallback paths still in use for two situations:

- **Operator pushback** (cold-reader approved but operator caught divergence): reset commit, render input via `harness prepare T-N`, append findings as a `## Operator pushback` section, shell to `claude -p` directly with the augmented input.
- **Inspecting cold-reader veto findings**: re-dispatch `harness review T-N --diff <sha>~1..<sha>` to get the full finding text (state.json only stores verdict + count — finding #10).

The full happy-path orchestrated cycle has been validated end-to-end on 5 tasks (T-14, T-15, T-18, T-19, T-23, T-24). The veto-then-halt path has been validated twice (T-22 round 39, T-25 round 41).

---

## Methodology fixes shipped during validation (rounds 26-41)

Each was surfaced by a real dispatch and shipped as a permanent prompt or dispatcher change in the same PR (the "logged ≠ shipped" anti-pattern was retired in round 28):

### Rounds 26-31 (subagent dispatch + arbiter wiring)

1. **Dispatcher resilience** (round 27). Parser used to throw on missing `status` field, discarding the JSON envelope's metadata. Fixed: dispatchers return `{ exit: T | null, raw, parseError? }`; CLI prints `parse_error` + last 1000 chars of raw text on failure.
2. **Verify-command derivation rule** (round 27). Subagent invented Jest CLI syntax (`--testPathPattern`) on a Vitest project. Cost $0.71 to surface. Builder.md now instructs subagents to consult `package.json` scripts before constructing verify commands.
3. **Final-verify-rerun rule** (round 28). Subagent reported `verify_fail` after counting RED-phase test failures. Cost $0.68. Builder.md now requires a final verify run after refactor; only that run determines success.
4. **`bypassPermissions` for builder** (round 29). `acceptEdits` mode blocked Bash; subagent stalled at verify. Cost $0.65. Switched builder default to `bypassPermissions`; deny list is the safety boundary.
5. **Arbiter dispatcher schema mismatch** (round 31). `ArbiterExit` interface used wrong field names. Cost $0.32. Fixed the interface, updated CLI render to print full amendment without truncation.

### Rounds 32-34 (orchestrator + cold-reader format)

6. **Orchestrator round 1** (round 32). Built `harness orchestrate T-N` end-to-end: chains build → review → (route by scope_check) → arbiter+apply, with retry caps + budget caps + state.json. 30 mocked-dispatcher unit tests cover all paths.
7. **ESM/CJS interop bug** (round 33). `state-store.ts` used `require('node:fs').renameSync` which worked in vitest (CJS-tolerant) but not tsx (ESM-strict). Fixed: import `renameSync` from `node:fs` directly.
8. **Cold-reader format-compliance non-determinism** (round 34). Cold-reader emitted markdown prose preamble before the required JSON fence (~10% rate). Strengthened prompt (`NO prose before or after the fence`); orchestrator now captures `raw_result_text` in `dispatch_end` payload on parse failure so the next occurrence is debuggable from state.json alone.

### Rounds 35-41 (slice 1 close + slice 2 + new findings)

9. **Frozen-timer fix** (round 35, post-T-16 manual smoke). `useIncidentTimer` ignored `endedAt` and kept ticking after STOP. Root cause: round-31's `amend_design` updated the store but the fix didn't propagate to the timer hook signature. Surfaced **finding #5: per-task cold-reads do not catch invariant propagation across previously-shipped tasks.** Captured for PR-B.
10. **Coverage backfill pattern** (rounds 36, 38, 39, 41). Builder consistently ships happy-path AC tests but misses defensive-throw branches and "wired-elsewhere" coverage. Each instance: operator backfills 2-6 tests in a paired commit. Surfaced **finding #6: cold-reader scope #2 doesn't cover defensive throws OR the task's "What" line as contract.**
11. **First operator pushback** (round 37, T-17). Cold-reader approved an orchestrator dispatch with two clear spec divergences (collapsed 6 named methods to 4, inverted appendJournal computation responsibility). Operator manually shelled to `claude -p` with explicit pushback. Surfaced **finding #7: harness has no operator-pushback CLI when cold-reader returned approve.** $1.78 round cost (~58% premium over clean dispatch).
12. **Builder commit_sha hallucination** (round 38, T-20). Builder reported a 40-char SHA where the first 7 matched the real commit but the remaining 33 were invented; orchestrator's `git diff <sha>` failed → cold-reader didn't auto-run. Surfaced **finding #9: orchestrator should derive SHA from `git rev-parse HEAD` post-dispatch instead of trusting the exit field.**
13. **First veto-via-orchestrator + cold-reader finding text loss** (round 39, T-22). Orchestrator routed correctly (scope_check 2 → halt for human) but state.json kept only verdict + count, not the finding bodies. Operator paid $0.32 to re-dispatch cold-reader just to read the finding. Surfaced **finding #10: state.json should capture full findings array.**
14. **Cold-reader verdict non-determinism** (round 41, T-25). Identical diff, same prompt, opposite verdicts on two consecutive runs (veto then approve). Surfaced **finding #12: cold-reader verdict non-determinism on identical input.** Quantification deferred (5x rerun proposed) before designing a fix.

**Pattern over time:** Cost-to-surface a methodology finding has dropped from $0.71 (round 27) to $0.32 (round 31) to $0.27 (round 39, where the dispatcher infrastructure caught the gap immediately). The harness's own diagnostic surface keeps improving. New findings now surface as cleanly-classified events in `state.json` rather than mysterious failures.

---

## What we know about prompt convergence

After two slices end-to-end (16 orchestrator-driven dispatches, 2 pushbacks, 2 vetoes, 0 arbiter escalations from cold-reader): the **cost-per-task floor is stable** within tier (data $0.57, repository $0.89, service $1.12, leaf component $1.43, composing component $1.26-1.50, page $1.46). The **pushback rate is ~12.5%** (2 of 16) and is rooted in cold-reader's task-body-blindness (finding #6). The **veto rate is ~12.5%** (2 of 16) and is rooted in the same gap.

This is the empirical signal that the **builder and arbiter prompts are converged**. The cold-reader prompt is the bottleneck — every finding in rounds 36-41 was either a cold-reader miss or a cold-reader inconsistency. PR-B work targeting findings #6, #10, #12 is the highest-leverage next investment.

A second-order observation: **operator review remains the consistency layer**. When cold-reader misses, operator catches in 5-10 min of diff review against the task. When cold-reader catches, operator confirms in seconds. The harness never approaches "ship without human review" — and shouldn't, given the verdict non-determinism.

---

## Eval suites (offline contract tests for prompt drift detection)

| Suite           | Cases                                                                | What it catches                                                                                                              |
| --------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| citation-linter | 5 (2 reg / 2 neg / 1 adv)                                            | commit-msg citation grammar regression                                                                                       |
| builder         | 12+ (incl. 2 verify_fail, 1 success baseline)                        | builder structured-exit shape + verify_fail signatures                                                                       |
| cold-reader     | 14 (12 reg / 1 neg / 1 adv)                                          | cold-reader scope drift (false-positives on style nits; misses on real spec violations)                                      |
| drift-arbiter   | 6 (5 amend_task, 1 amend_design — no amend_spec/pushback yet)        | arbiter verdict routing, amendment shape                                                                                     |
| cli-snapshots   | 3 (`prepare T-02` / `cold-read T-01` / `arbitrate T-01-V2-spec-gap`) | silent prompt edits (any change to `builder.md` / `cold-reader-code.md` / `drift-arbiter.md` requires snapshot regeneration) |
| parsers         | 3 (task / spec / design markdown snapshots)                          | parser drift                                                                                                                 |
| integration     | 1 (round-17→21 trajectory, 5 cross-referenced steps)                 | cross-suite consistency                                                                                                      |
| orchestrator    | 30 mocked-dispatcher unit tests                                      | happy path, veto-then-arbiter, retry-cap halt, budget-cap halt, state.json append correctness                                |

The cli-snapshots suite is the most operationally valuable: any prompt change shows up as a snapshot diff, which forces the change to be reviewed in the PR diff alongside the new behavior it enables.

---

## What the orchestrator does today (round 32 implementation, validated rounds 33-41)

A `harness orchestrate T-N` CLI command that chains the existing dispatchers with explicit policies:

1. Calls `dispatchBuilder(taskId)`. Logs `dispatch_start` + `dispatch_end` events to state.json.
2. On builder `success`: calls `dispatchColdReader(taskId, diffRange)`. Logs.
3. On cold-reader `approve`: success exit, slice advances. Final summary printed (total cost, dispatches, amendments).
4. On cold-reader `veto`: routes by `scope_check`:
   - 1 or 2 (builder error) → halt for human (`outcome: halt_builder_error_veto`).
   - 3-6 (spec/design ambiguity) → escalates to arbiter (auto-apply path implemented but not yet exercised live).
5. On arbiter `amend_*`: applies amendment via deterministic `before` → `after` substitution + appends changelog entry to the right section (§10 spec / §D11 design / §T0 task). Re-dispatches builder.
6. On arbiter `pushback`: re-dispatches builder with the clarification (not yet exercised live).
7. On 2nd builder retry or 2nd arbiter dispatch: halt for human.
8. Per-task cap: $5 cost / 30 min wall clock total. Halt for human on cap (not yet tripped live).

State persistence: append-only event log at `.harness/state.json`. Each dispatch_end carries cost, duration, num_turns, session_id, stop_reason, status/verdict, commit_sha (when applicable). Sufficient for post-hoc audit and for resuming if interrupted (resume logic not yet implemented).

---

## Open design questions

- **Cold-reader N=k voting?** Finding #12 surfaced verdict non-determinism. Three possible mitigations: run cold-reader 3x and majority-vote (3x cost), lower temperature to make verdicts deterministic but risk losing genuine ambiguity-detection, or accept current variance and rely on operator review as the consistency layer. Need a 5x quantification round before deciding.

- **Cold-reader prompt with task body?** Finding #6 says cold-reader doesn't load the task's "What" line, only cited spec sections. Adding the task body to cold-reader input is a 1-line prompt change + ~50 input tokens. Should land alongside positive scope #7 ("Does the diff implement every method/symbol/file named in the task's 'What' line?").

- **Operator-pushback CLI shape?** Finding #7. Two designs: (a) `harness pushback T-N --findings findings.md` resets HEAD~1 + renders input + appends findings + dispatches builder + logs to state.json. (b) Make cold-reader emit a `proposed_pushback` field whenever it vetoes, so operator can confirm or edit a pre-drafted pushback. Lean: ship (a) first; consider (b) after 2-3 more pushback instances.

- **Auto-apply arbiter amendments live.** The orchestrator implements this but no veto in slices 1-2 actually escalated to arbiter (both routed to `halt_builder_error_veto`). First exercise will be the first task where cold-reader vetoes with scope_check 3-6.

---

## Lineage

The harness was built incrementally over 41 rounds documented in `generate-spec-anchored-artifacts-log.md`. Key inflection points:

- Round 10 — `task-parser.ts` shipped (the first piece)
- Round 18 — V2 builder prompt with explicit drift-escalation triggers
- Round 19 — drift-arbiter prompt + eval scaffold
- Round 24 — first multi-task organic harness run (foundation slice T-02..T-05)
- Round 26 — pivot: paused slice 1 hand-build to ship subagent dispatch
- Round 27 — first live `claude -p` dispatch (failed, but produced the dispatcher resilience fix)
- Round 29 — first live `success` exit from builder
- Round 30 — first live cold-reader `approve`
- Round 31 — first full escalation cycle end-to-end (manual chain)
- Round 32 — orchestrator round 1 (build → review → arbiter+apply chain + state.json)
- Round 33 — first fully-orchestrated commit (T-14)
- Round 35 — slice 1 closes (11/11) + first invariant-propagation finding (#5)
- Round 36 — first multi-dispatch orchestrated task (T-18) + finding #6
- Round 37 — first operator pushback (T-17) + finding #7
- Round 38 — first orchestrator bug (commit_sha hallucination, T-20) + finding #9
- Round 39 — first orchestrator-detected veto (T-22) + findings #10, #11
- Round 41 — first cold-reader verdict non-determinism instance (T-25) + finding #12; slice 2 closes (10/10)

Each round is documented with cost, duration, structured exit, and what changed in the prompts or dispatchers as a result. The session log is the canonical artifact for tracing prompt convergence over time; this document is the sustainable summary refreshed at each slice close.
