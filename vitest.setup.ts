import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Global test-time mock to prevent AuthBootstrap side-effects (auth listener, etc.)
// Escape hatch for module-under-test suites:
//   vi.resetModules();
//   vi.unmock('@features/authentication/AuthBootstrap');
//   const { default: AuthBootstrap } = await import(
//     '@features/authentication/AuthBootstrap'
//   );
vi.mock('@features/authentication/AuthBootstrap', () => ({
  default: () => null,
}));
