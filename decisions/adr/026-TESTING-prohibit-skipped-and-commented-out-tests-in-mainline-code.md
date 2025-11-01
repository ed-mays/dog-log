TITLE: Prohibit Skipped and Commented-Out Tests in Mainline Code

STATUS: Accepted
DATE: 2025-11-01

CONTEXT:
Our codebase contains several instances of skipped (`test.skip`, `it.skip`) and commented-out tests. These represent incomplete work and create "test debt." They give a false sense of security regarding test coverage and can become quickly outdated, making them difficult to re-enable later. They indicate that important scenarios are not being verified by our CI process.

DECISION:
All tests merged into the main development branch must be runnable. The use of `test.skip`, `it.skip`, `test.todo`, `it.todo`, or commenting out entire test blocks is prohibited in mainline code. If a test is temporarily broken or a feature is incomplete, it should be developed on a feature branch. For future work, a ticket should be created instead of leaving a skipped test. All existing skipped and commented-out tests must be implemented or deleted.

CONSEQUENCES:

- **Positive:**
  - Ensures that our test suite accurately reflects the state of the codebase.
  - Prevents the accumulation of test debt.
  - Improves confidence in our test coverage reports.
  - Forces intentionality; if a test can't be written, it should be tracked as a task, not left as dead code.
- **Negative:**
  - Requires an upfront effort to fix or remove all existing skipped tests.
  - Developers can no longer merge code with temporarily disabled tests as placeholders.

ALTERNATIVES CONSIDERED:

- **Allowing skipped tests:** Rejected because it encourages leaving tests in a broken or incomplete state indefinitely, which erodes the value of the test suite.
- **Using `test.todo`:** While slightly more descriptive than `test.skip`, it shares the same fundamental problem of allowing non-running tests to be merged, creating unactioned debt. It is better to track this work in an issue tracker.

AUTHOR: Gemini

RELATED:

- `007-testing-strategy-with-vitest-and-testing-library.md`
