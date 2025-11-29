import { vi } from 'vitest';

export function setupCommonMocks() {
  vi.mock('@store/pets.store', () => ({
    usePetsStore: vi.fn(),
  }));

  vi.mock('@store/auth.store', () => ({
    useAuthStore: vi.fn((selector) => selector({ user: { uid: 'test-user' } })),
  }));

  vi.mock('@services/petVetService', () => ({
    petVetService: {
      getPetVets: vi.fn(),
    },
  }));

  vi.mock('@services/logService', () => ({
    logger: {
      debug: vi.fn(),
      info: vi.fn(),
    },
  }));

  vi.mock('@i18n', () => ({
    loadNamespace: vi.fn().mockResolvedValue(undefined),
  }));
}
