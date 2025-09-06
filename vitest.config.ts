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
        'dist/',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/__tests__/**',
        '**/featureFlags.config.ts', // Exclude specific config file
        '**/*.config.ts', // Exclude all config TS files (pattern)
        '**/*.config.js', // Exclude all config JS files (pattern)
        'vite.config.*', // Exclude Vite config, TS or JS
        'vitest.config.*', // Exclude Vitest config, TS or JS
        'src/**/*.types.tsx',
        'src/main.tsx',
        'src/i18n.tsx',
        '**/*.d.ts',
      ],
    },
  },
});
