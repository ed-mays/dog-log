TITLE: Feature Flag Strategy for Gated Rollouts

STATUS: Accepted
DATE: 2025-10-31

CONTEXT:
The project needs a mechanism to decouple feature deployment from feature release, allowing new code to be deployed to
production in a disabled state. This enables safer rollouts, A/B testing, and quicker disabling of problematic features.

DECISION:
We will implement a lightweight, in-house feature flag system. A `FeatureFlagsProvider` will supply flag values via
React context. The `useFeatureFlag` hook will be the standard way to query the state of a flag. Default flag values will
be sourced from `VITE_` environment variables, and they can be overridden during testing via the shared `render`
function.

CONSEQUENCES:

- **Positive**:
  - Allows for continuous deployment practices by separating deployment from release.
  - Reduces risk by allowing new features to be tested in production before being enabled for all users.
  - Provides a simple way to manage different feature sets across environments.
  - Easy to mock and test different flag configurations.
- **Negative**:
  - Adds complexity to the code, as conditional logic must be written to handle both on/off states.
  - Requires a process for cleaning up old flags and associated dead code to prevent technical debt.

ALTERNATIVES CONSIDERED:

- **Third-party feature flagging service (e.g., LaunchDarkly)**: These services offer much more powerful features like
  percentage-based rollouts, user targeting, and a UI for managing flags. This was considered overkill for the current
  needs of the project and introduces an external dependency and cost.

AUTHOR: Gemini

RELATED:

- `src/featureFlags/`
