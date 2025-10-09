import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import react from '@vitejs/plugin-react';
import istanbul from 'vite-plugin-istanbul';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tsconfigPaths(),
    istanbul({
      cypress: false,
      requireEnv: false,
      include: ['src/**/*.tsx', 'src/**/*.ts'],
      exclude: ['node_modules', 'src/testUtils/**', 'src/test-*.tsx'],
      extension: ['.tsx', '.ts'],
    }),
  ],
  define: {
    __DEV__: mode !== 'production',
  },
}));
