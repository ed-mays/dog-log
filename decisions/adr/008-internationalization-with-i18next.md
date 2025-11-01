TITLE: Internationalization (i18n) with i18next

STATUS: Accepted
DATE: 2025-10-31

CONTEXT:
The application must support multiple languages to be accessible to a global audience. A scalable and maintainable
solution for managing translations is required.

DECISION:
We will use `i18next` and `react-i18next` for handling internationalization. Translations will be organized into JSON
files by language and namespace (e.g., `src/locales/en/common.json`). The `useTranslation` hook will be used within
components to access translated strings.

CONSEQUENCES:

- **Positive**:
  - A mature, feature-rich, and widely adopted solution for i18n in React.
  - Supports namespaces, which helps organize translations and allows for lazy loading.
  - Strong integration with the React ecosystem.
  - Decouples translation text from the code, making it easy for translators to work with the JSON files.
- **Negative**:
  - Adds a layer of complexity to the development workflow.
  - Requires discipline to ensure all user-facing strings are correctly externalized.

ALTERNATIVES CONSIDERED:

- **FormatJS (React Intl)**: Another excellent and powerful i18n library. `i18next` was chosen for its flexible backend
  and plugin architecture, but the choice is largely preferential as both are strong contenders.
- **Manual implementation**: Building a custom i18n solution would be time-consuming and unlikely to match the
  robustness of established libraries.

AUTHOR: Gemini

RELATED:

- `src/i18n.tsx`
- `src/locales/`
