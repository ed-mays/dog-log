# Citation-linter eval suite

Fixtures for `scripts/harness/lib/citation-linter.ts`. The unit tests in
`citation-linter.test.ts` cover edge cases by construction; this fixture
corpus captures _real commit messages_ (or close paraphrases of them) the
linter was either correctly accepting/rejecting in production, or had a bug
on. It catches **prompt-grammar drift**: if someone tightens a regex or
reorders the exemption checks, the corpus tells you which historical
behaviors changed.

## Suite shape

Three suites mirroring the agent eval scaffolds:

- **regression/** — real commit messages whose lint outcome is the contract.
  If you change the linter and a regression case flips, you've changed the
  contract; document it.
- **negative-scope/** — commits the linter should NOT flag (legitimate
  exempt patterns: scope, type, merge, revert, `[skip-cite]` marker on its
  own line). Insurance against over-tightening the rules.
- **adversarial/** — commits constructed to tempt the linter into the wrong
  answer. The round-12 `[skip-cite]`-in-help-text bug is the canonical seed.

## Case shape

```jsonc
{
  "case_id": "regression-NNN-short-name",
  "source": "Round-N session log entry / PR-#NNN / commit SHA",
  "input": {
    "commit_message": "<verbatim commit text>",
  },
  "expected": {
    "valid": true,
    "exempt_reason_pattern": "(?i)<regex>", // optional, when valid+exempt
    "citations_must_include": ["BR-7"], // optional
    "failure_reason_pattern": "(?i)<regex>", // required when valid=false
  },
  "notes": "What this case proves / why it's load-bearing.",
}
```

## Running

```bash
pnpm tsx scripts/harness/evals/citation-linter/run.ts
```

The runner validates case-file shape and prints a coverage summary. It
_does_ invoke `lintCommitMessage()` on each case (unlike the LLM-agent
runners, the linter is pure code so we can run it in-process at zero cost).
The runner exits 1 if any case mismatches, making it CI-suitable.

## Pass thresholds

- **regression**: 100% (these are real historical contracts)
- **negative-scope**: 100% (legitimate exempt patterns must stay exempt)
- **adversarial**: 100% (no historical bug may be re-introduced)
