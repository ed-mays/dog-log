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
    },
  },
];
