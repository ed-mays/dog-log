import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('@features/authentication/AuthBootstrap', () => ({
  default: () => null,
}));
