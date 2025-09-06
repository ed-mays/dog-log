import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths({ projects: ['./tsconfig.app.json'] })],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.tsx'],
    coverage: {
      provider: 'v8', // 'v8' is the default
      reporter: ['text', 'html'], // Supported: terminal output & html report
      reportsDirectory: 'coverage', // Output directory for reports
      exclude: [
        'node_modules/',
        'test/',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/__tests__/**',
      ],
    },
  },
});
