import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text'],
      reportsDirectory: 'coverage',
      exclude: [
        'node_modules/',
        'test/',
        'dist/',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/__tests__/**',
        '**/featureFlags.config.ts',
        '**/*.config.ts',
        '**/*.config.js',
        'vite.config.*',
        'vitest.config.*',
        'src/**/*.types.ts',
        'src/main.tsx',
        'src/i18n.ts',
        '**/*.d.ts',
      ],
    },
  },
  resolve: {
    alias: {
      // Standard '@' aliases per project guidelines (no leading '/')
      '@components': path.resolve(__dirname, './src/components'),
      '@store': path.resolve(__dirname, './src/store'),
      '@features': path.resolve(__dirname, './src/features'),
      '@featureFlags': path.resolve(__dirname, './src/featureFlags'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@testUtils': path.resolve(__dirname, './src/testUtils'),

      // Additional commonly used aliases
      '@repositories': path.resolve(__dirname, './src/repositories'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@models': path.resolve(__dirname, './src/models'),
      '@firebase': path.resolve(__dirname, './src/firebase.ts'),
      '@i18n': path.resolve(__dirname, './src/i18n.ts'),

      // Convenience alias used in tests pointing to the render wrapper file
      '@test-utils': path.resolve(__dirname, './src/test-utils.tsx'),
    },
  },
});
