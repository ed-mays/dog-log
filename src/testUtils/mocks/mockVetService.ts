import { vi } from 'vitest';
import { vetService } from '@services/vetService';

/**
 * Helper to mock vetService methods.
 * Can be used when vetService is mocked via vi.mock('@services/vetService')
 * OR when using real service and spying (if adapted, but current usage implies full mock).
 *
 * This helper assumes the test file has already called:
 * vi.mock('@services/vetService');
 *
 * It returns the mocked methods typed correctly for assertions.
 */
export function installVetServiceMock() {
  const mocks = {
    searchVets: vi.mocked(vetService.searchVets),
    createVet: vi.mocked(vetService.createVet),
    getVet: vi.mocked(vetService.getVet),
    updateVet: vi.mocked(vetService.updateVet),
    archiveVet: vi.mocked(vetService.archiveVet),
  };
  return mocks;
}
