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
