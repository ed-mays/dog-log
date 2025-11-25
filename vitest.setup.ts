import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { defaultFeatureFlags } from './src/featureFlags/config';

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

// Mock remoteConfigService globally to avoid indexedDB errors and async loading in tests
vi.mock('./src/services/remoteConfig', () => ({
  remoteConfigService: {
    init: vi.fn().mockResolvedValue(undefined),
    fetchAndActivate: vi.fn().mockResolvedValue(true),
    getFeatureFlag: vi.fn((key) => defaultFeatureFlags[key]),
    getAllFlags: vi.fn(() => defaultFeatureFlags),
  },
}));
