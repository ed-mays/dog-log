Here’s a concise, opinionated checklist distilled from the referenced articles and aligned with a small, pure React 19 + TypeScript + Vite + Vitest stack. It emphasizes modern React patterns, strict typing, fast builds, pragmatic state/data choices, and testing-first ergonomics for maintainability and speed.[1][2][3]

### Project baseline

- Use React 19 with function components, modern hooks, and TypeScript strict mode to catch defects early and document intent through types.[3][1]
- Keep Vite as the dev/build tool for fast HMR and optimized production builds; build with tsc -b followed by vite build to type-check before bundling.[3]
- Adopt project-level path aliases (e.g., @components, @store) to keep imports stable as code grows and to reflect the intended module boundaries.[1]

### Component patterns

- Prefer composition-first components with clear inputs/outputs; extract logic into custom hooks to separate behavior from rendering and improve reuse/testing.[1][3]
- Use container-presentational separation only where it reduces complexity; keep most components “presentational” and colocate logic in focused hooks like useThing().[3][1]
- Apply compound components for cohesive UIs that need flexible, ergonomic APIs, and use Context providers when cross-cutting state otherwise causes prop-drilling.[1][3]

### State management

- Start with React state colocated near usage; lift only as far as necessary to avoid unnecessary re-renders and keep components independent .
- Use Context sparingly for true app-wide concerns (theme, auth, i18n toggles); consider a small store like Zustand for shared client state when multiple distant consumers emerge.[3][1]
- Maintain a single source of truth for each piece of state and avoid duplicating the same data in multiple stores/contexts to prevent divergence .

### Data fetching

- For client-side apps, prefer thin fetch layers inside custom hooks and combine Suspense/lazy boundaries for good loading UX; add memoization only where profiling shows benefit.[2][3]
- If caching/async coordination becomes complex, adopt TanStack Query for request deduplication, cache lifetimes, and background refresh without overhauling components .
- Keep fetch responsibilities close to pages/route segments; expose typed service functions and return narrow shapes to reduce coupling and excess re-renders.[3]

### Routing

- Use React Router for navigation in a pure React + Vite setup; keep routes declarative, split routes lazily, and colocate loaders/adapters near route components.[2][3]
- Organize routes by feature to minimize cross-feature imports and enable route-level splitting and testability per feature boundary.[2]

### Performance

- Measure first (React Profiler, Core Web Vitals) and then optimize; overusing useMemo/useCallback can hurt clarity without measured wins .
- Introduce memoization primitives where prop-stable boundaries eliminate hot re-renders and apply React.lazy with Suspense for route and component-level code splitting.[2][1]
- Consider React 19 features like useOptimistic and the React Compiler, but gate experimental compiler usage behind an opt-in lint/plugin and watch library compatibility notes.[2][3]

### Testing

- Use Vitest + Testing Library + jsdom for fast, behavior-focused tests; prefer testing user flows and DOM accessibility over implementation details.[1][3]
- Run vitest with coverage (coverage-v8) and instrument via vite-plugin-istanbul to track meaningful thresholds as the codebase grows.[3]
- Keep test utilities in a shared helpers folder, and test hooks in isolation to ensure logic remains decoupled from rendering.[1][3]

### Code quality

- Enforce ESLint (React, Hooks, a11y, TS) plus Prettier for formatting; wire npm run lint and npm run format in CI to keep the main branch clean.[1][3]
- Prefer small, single-purpose modules and stable public interfaces per folder; extract reusable logic into custom hooks with clear signatures and minimal ambient dependencies.[3][1]
- Use TypeScript to define component props, event handlers, and API contracts; prefer discriminated unions and generics to model domain constraints and reduce runtime checks.[3]

### i18n

- Centralize translation resources (i18next/react-i18next), avoid hardcoded strings, and lazy-load namespaces when features/routes mount to reduce initial bundles.[1][3]
- Keep translation keys stable and colocate them by feature to enable parallel work and safe refactors.[1]

### Folder structure

- Use a feature-first layout with subfolders for components, hooks, and tests; reserve @components for cross-feature UI primitives and @store for shared state.[1]
- Keep index.ts files as public entry points that re-export stable APIs, not everything; this clarifies intended usage and reduces accidental coupling.[3]

### Build and scripts

- Rely on npm scripts for a single source of truth: dev, build (tsc -b && vite build), preview, lint, format, test, and test:coverage to standardize local/CI flows.[3][1]
- Fail builds on type errors and lints to prevent drift; ensure tsconfig paths match vite-tsconfig-paths for consistent alias resolution in editor and bundler.[1][3]

### Accessibility

- Use semantic HTML first, add ARIA only when necessary, and lint for a11y to catch regressions early; test keyboard navigation and common screen readers in CI/local .
- Favor components with built-in accessibility primitives and test visible labels/roles in Testing Library assertions rather than implementation details.[3]

### When not to use Next.js

- For SPAs, internal tools, dashboards, and apps without SSR/SEO needs, pure React + Vite is simpler, cheaper, and plenty capable; add React Router and modern hooks for UX.[2]
- Be mindful of ecosystem readiness around React 19 features; verify libraries in use are compatible before adopting experimental optimizations globally.[2]

### Practical “do this” list

- Turn on strict TS, keep props and return types explicit, and avoid any in app code.[3]
- Build features around custom hooks + small components; defer state libraries until proven necessary, then add a light store like Zustand for cross-cutting state.[1][3]
- Split routes and large widgets with React.lazy/Suspense; measure re-render hotspots before adding memoization, and keep memo boundaries prop-stable.[2][1]
- Test user interactions with Testing Library and track coverage via vitest coverage-v8 and Istanbul; prefer semantic queries and accessible roles.[1][3]
- Enforce ESLint + Prettier in CI and keep imports clean with @components and @store aliases tied to tsconfig and Vite config.[3][1]

Sources analyzed include Telerik’s React patterns, Strapi’s 2025 best practices, Wisp’s React 19 without Next guide, and a design-patterns overview, cross-checked against the project’s README and package.json to align with the chosen stack and scripts.[2][1][3]

Sources
[1] README.md https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_5b4ca584-1f04-4ddd-8dba-fc75ce6f3213/6ab6319f-e85e-4ffa-b173-c42b8a183009/README.md
[2] react-best-practices-references.txt https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/88440880/ce1a2f1c-e223-4eec-95ec-be65fffb14ce/react-best-practices-references.txt
[3] package.json https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_5b4ca584-1f04-4ddd-8dba-fc75ce6f3213/27107753-23c7-4feb-97af-c81f1f6f54d2/package.json
