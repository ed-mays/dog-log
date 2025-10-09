import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
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
        'src/**/*.types.tsx',
        'src/main.tsx',
        'src/i18n.tsx',
        '**/*.d.ts',
      ],
    },
  },
  resolve: {
    alias: {
      // Original "@/" aliases (keep for backward compatibility)
      '@/App': path.resolve(__dirname, './src/App.tsx'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/firebase': path.resolve(__dirname, './src/firebase.tsx'),
      '@/store': path.resolve(__dirname, './src/store'),
      '@/test-utils': path.resolve(__dirname, './src/test-utils.tsx'),
      '@/testUtils': path.resolve(__dirname, './src/testUtils'),
      '@/featureFlags': path.resolve(__dirname, './src/featureFlags'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/models': path.resolve(__dirname, './src/models'),
      '@/repositories': path.resolve(__dirname, './src/repositories'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/styles': path.resolve(__dirname, './src/styles'),
      '@/utils': path.resolve(__dirname, './src/utils'),

      // Aliases per project guidelines (no leading "/")
      '@components': path.resolve(__dirname, './src/components'),
      '@store': path.resolve(__dirname, './src/store'),
      '@features': path.resolve(__dirname, './src/features'),
      '@featureFlags': path.resolve(__dirname, './src/featureFlags'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@testUtils': path.resolve(__dirname, './src/testUtils'),
      '@repositories': path.resolve(__dirname, './src/repositories'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@models': path.resolve(__dirname, './src/models'),

      // Convenience alias used in tests pointing to the render wrapper file
      '@test-utils': path.resolve(__dirname, './src/test-utils.tsx'),
    },
  },
});
