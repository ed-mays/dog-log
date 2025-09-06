## Dog Log

A modern **React** application scaffolded with **Vite** and written in **TypeScript**. It supports robust linting and testing, and leverages modular path aliases and i18n. This project uses the latest React 19+ and popular state and translation libraries.

***

### Project Structure

- **TypeScript** with strict type checking and modern bundler settings
- **Vite** for fast development & optimized builds
- Support for **path aliases**:
    - `@components/* → src/components/*`
    - `@store/* → src/store/*`
- Test setup with **Vitest** & **Testing Library**
- Linting & formatting with **ESLint** & **Prettier**
- Internationalization powered by **i18next** and **react-i18next**

***

## Getting Started

### Install dependencies

```bash
npm install
```

### Available Scripts

| Script                | Description                              |
|-----------------------|------------------------------------------|
| `npm run dev`         | Start development server (Vite)          |
| `npm run build`       | Type-check & build for production        |
| `npm run preview`     | Preview local production build           |
| `npm run lint`        | Run ESLint for code linting              |
| `npm run lint:fix`    | Auto-fix lint issues                     |
| `npm run format`      | Format codebase with Prettier            |
| `npm run test`        | Run unit & component tests (Vitest)      |
| `npm run test:coverage` | Run tests with code coverage           |

***

### Testing

- Uses **Vitest** for running fast TypeScript and component tests.
- **@testing-library/react**, **user-event**, and **jest-dom** for ergonomic, reliable UI/UX testing.
- TypeScript test globals and matchers included by default.

***

### Linting & Formatting

- **ESLint** for linting React, TypeScript, accessibility, and prettier integration.
- **Prettier** for code style and consistency.

***

### Internationalization

- **i18next** & **react-i18next** for easy language switching and translations.

***

### Path Aliases

- **@components/** and **@store/** resolve to `src/components/` and `src/store/` respectively, set in `tsconfig.app.json` and `tsconfig.json`. Update imports accordingly.

***

## Tech Stack

- React 19
- TypeScript (strict)
- Vite
- Vitest + Testing Library
- Zustand (state)
- i18next/react-i18next (i18n)
- ESLint, Prettier

***

### License

This project is private and not currently intended for open-source distribution.

***