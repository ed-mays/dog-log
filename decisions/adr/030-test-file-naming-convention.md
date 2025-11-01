# 30. Test File Naming Convention

- Status: Accepted
- Date: 2025-11-01

## Context

To maintain a well-organized and easily navigable codebase, we need a consistent and predictable naming strategy for our test files. A clear convention helps developers quickly identify the scope of a test (e.g., unit, integration) and locate it within the project structure. This aligns with our existing practice of co-locating tests with the code they verify.

## Decision

We will adopt the following naming patterns for test files throughout the project:

1.  **Unit/Component Tests**: Test files that focus on a single component, hook, or module will be named after the specific unit under test, followed by the `.test.tsx` suffix. These files should be co-located with the source file.
    - **Pattern**: `{Component|Hook|Module}.test.tsx`
    - **Example**: A test for `PetList.tsx` will be named `PetList.test.tsx` and reside in the same directory.

2.  **Integration Tests**: Test files that cover end-to-end user flows or interactions between multiple components within a feature will be named after the feature, followed by the `.integration.test.tsx` suffix.
    - **Pattern**: `{Feature}.integration.test.tsx`
    - **Example**: An integration test for the entire pet creation and listing flow could be named `Pets.integration.test.tsx` and placed within the `src/features/pets` directory.

## Consequences

**Pros:**

- **Improved Discoverability**: Makes it easy for developers to find the tests associated with a specific piece of code.
- **Clarity of Scope**: The file name itself clearly communicates whether the test is a focused unit test or a broader integration test.
- **Consistency**: Enforces a uniform structure across the entire project, reducing cognitive load.

**Cons:**

- This is a low-risk organizational convention with no significant downsides.
