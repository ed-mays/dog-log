TITLE: Use Vite for Build and Dev Server

STATUS: Accepted
DATE: 2025-10-31

CONTEXT:
The project needs a fast and efficient build tool and development server to support a productive development workflow.
Slow build times and feedback loops can significantly hinder developer productivity.

DECISION:
We will use Vite as the primary build tool and development server. It leverages native ES modules in the browser for an
extremely fast dev server and uses Rollup for optimized production builds.

CONSEQUENCES:

- **Positive**:
  - Near-instantaneous server start-up and Hot Module Replacement (HMR).
  - Out-of-the-box support for TypeScript, JSX, and CSS.
  - Optimized production builds with code splitting, tree-shaking, and other performance enhancements.
  - Simple and clean configuration compared to alternatives.
- **Negative**:
  - The ecosystem, while mature, is not as extensive as Webpack's. Some specific or complex build requirements might
    require custom plugins or workarounds.

ALTERNATIVES CONSIDERED:

- **Webpack**: The historical standard for React applications. It is powerful and flexible but is notoriously complex to
  configure and can have slow build times, especially on large projects.
- **Create React App (CRA)**: Provides a zero-configuration setup but is less flexible and has been surpassed by Vite in
  terms of development speed.

AUTHOR: Gemini

RELATED:

- `vite.config.ts`
