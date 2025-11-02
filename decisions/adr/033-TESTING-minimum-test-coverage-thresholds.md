# 33. Minimum test coverage thresholds

- Status: Proposed
- Date: 2025-11-02

## Context

To ensure the quality and reliability of our codebase, we need to maintain a high level of test coverage. This helps to
prevent regressions and ensures that new code is adequately tested.

## Decision

We will enforce the following minimum test coverage thresholds for all new code:

- **Branches**: 90%
- **Functions**: 90%
- **Statements**: 90%

## Consequences

- All new pull requests must meet these minimum coverage levels before they can be merged.
- Existing code should be gradually improved to meet these standards.
- We will use our CI pipeline to automatically check for compliance with these thresholds.
