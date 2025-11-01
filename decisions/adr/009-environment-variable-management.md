TITLE: Environment Variable Management

STATUS: Accepted
DATE: 2025-10-31

CONTEXT:
The application requires different configurations for various environments (local development, production, etc.),
including feature flags and API keys. This configuration needs to be managed securely and effectively.

DECISION:
We will use Vite's built-in support for environment variables. All environment variables exposed to the client-side
application must be prefixed with `VITE_`. Local overrides for development will be stored in a `.env.local` file, which
is excluded from version control. Production environment variables will be set in the deployment environment.

CONSEQUENCES:

- **Positive**:
  - Simple and idiomatic way to handle environment variables in a Vite project.
  - Prevents accidental exposure of sensitive keys by requiring the `VITE_` prefix.
  - `.env.local` provides a clear and easy way for developers to configure their local setup.
- **Negative**:
  - Requires a server restart to apply changes to environment variables.
  - It is the developer's responsibility to not commit sensitive keys to `.env` files that are checked into version
    control.

ALTERNATIVES CONSIDERED:

- **Third-party configuration library**: Could provide more advanced features like validation, but adds another
  dependency for a problem that can be solved with the built-in tooling.

AUTHOR: Gemini

RELATED:

- `.env.local` (example)
- `vite.config.ts`
