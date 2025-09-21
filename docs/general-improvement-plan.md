# Dog Log — Modernization & Code Quality Improvement Plan

A prioritized, actionable backlog to align the codebase with modern React (19), TypeScript (strict), testing, i18n, accessibility, and state management best practices.

Notes
- Keep changes incremental; add tests alongside refactors.
- Follow the project’s developer guidelines (feature-first, aliases, co-located tests/styles).
- Prefer small PRs grouped by theme below.

---

Implementation Notes
- Make changes incrementally, keeping PRs focused (one theme per PR).
- Update tests with each change; prefer `@/test-utils` wrapper for providers (i18n, feature flags).
- Avoid breaking APIs; where necessary, deprecate and migrate gradually.
