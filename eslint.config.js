import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import jsxRuntime from 'eslint-plugin-react/configs/jsx-runtime.js';
import testingLibrary from 'eslint-plugin-testing-library';
import jestDom from 'eslint-plugin-jest-dom';

export default [
  // Global ignores
  { ignores: ['dist', 'coverage'] },

  // Base JS and TS configs
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,

  // React configuration for all relevant files
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      react: pluginReact,
    },
    rules: {
      ...pluginReact.configs.recommended.rules,
      ...jsxRuntime.rules,
    },
    settings: {
      react: {
        version: 'detect', // Automatically detect the React version
      },
    },
  },

  // Layer-boundary enforcement: stores never reach into repositories.
  // Type-only imports from `@repositories/types` are allowed (e.g. BaseEntity).
  // Excludes test files so mocks can target repository modules.
  {
    files: ['src/store/**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@repositories/*', '!@repositories/types'],
              message:
                'Stores must call services, not repositories directly. Add or use a service in src/services/. Type-only imports from @repositories/types are allowed.',
            },
          ],
        },
      ],
    },
  },

  // Layer-boundary enforcement: components and pages call hooks, not services.
  // Allowlist: cross-cutting utilities (`@services/logService`,
  // `@services/analytics/*`) are not business logic and may be imported anywhere.
  {
    files: [
      'src/features/**/pages/**/*.{ts,tsx}',
      'src/features/**/components/**/*.{ts,tsx}',
      'src/components/**/*.{ts,tsx}',
    ],
    ignores: ['**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@services/*',
                '!@services/logService',
                '!@services/analytics',
                '!@services/analytics/*',
              ],
              message:
                'Components and pages must go through hooks. Move the call into a hook in src/features/<domain>/hooks/. (Logger and analytics are exceptions.)',
            },
            {
              group: ['@repositories/*', '!@repositories/types'],
              message:
                'Components and pages must not import repositories. Use a hook that goes through a service.',
            },
          ],
        },
      ],
    },
  },

  // Testing Library and Jest-DOM configuration for test files
  {
    files: ['**/*.test.tsx', '**/*.test.ts'],
    plugins: { 'testing-library': testingLibrary, 'jest-dom': jestDom },
    rules: {
      ...testingLibrary.configs.react.rules,
      ...jestDom.configs.recommended.rules,
      // Step 9: Disallow importing fireEvent directly from @testing-library/react
      'no-restricted-imports': [
        'error',
        {
          name: '@testing-library/react',
          importNames: ['fireEvent'],
          message:
            'Do not import fireEvent in tests — use @testing-library/user-event instead.',
        },
      ],
      // Step 9: Also flag any direct usage of a fireEvent identifier
      'no-restricted-syntax': [
        'error',
        // vi.mock('<specifier>.ts') — enforce no .ts suffix in mock specifiers
        {
          selector:
            'CallExpression[callee.object.name="vi"][callee.property.name="mock"] > Literal.arguments:first-child[value=/\\.ts$/] ',
          message:
            'Avoid .ts suffix in vi.mock() specifiers; use the alias without extension (e.g., vi.mock("@store/x.store")).',
        },
        // Any MemberExpression like fireEvent.click(...)
        {
          selector: 'MemberExpression[object.name="fireEvent"]',
          message:
            'Do not use fireEvent — prefer @testing-library/user-event for interactions.',
        },
      ],
    },
  },
];
