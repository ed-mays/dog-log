TITLE: Use Zustand for Global State Management

STATUS: Accepted
DATE: 2025-10-31

CONTEXT:
The application requires a global state management solution to handle state that is shared across multiple components or
features. React's built-in Context API can be insufficient for complex state or frequent updates due to performance
issues.

DECISION:
We will use Zustand for global state management. State will be organized into small, focused stores in `src/store/`.
Components will use hooks and selectors (`useStore(state => state.part)`) to subscribe to the smallest possible slice of
state, preventing unnecessary re-renders.

CONSEQUENCES:

- **Positive**:
  - Minimal boilerplate and a simple, intuitive API.
  - High performance due to selector-based subscriptions that prevent the "context provider" problem.
  - Unopinionated about where and how it's used (can be used for both global and local state).
  - Excellent TypeScript support.
- **Negative**:
  - Less structured than Redux, which could lead to less predictable state mutations if patterns are not enforced.
  - Being unopinionated can lead to inconsistencies if the team does not agree on conventions.

ALTERNATIVES CONSIDERED:

- **Redux Toolkit**: The official standard for Redux. It is very powerful and has excellent devtools but comes with more
  boilerplate and conceptual overhead (actions, reducers, thunks).
- **React Context API**: Suitable for simple, low-frequency state updates, but can cause significant performance issues
  in complex applications as any update re-renders all consumers.

AUTHOR: Gemini

RELATED:

- `src/store/`
