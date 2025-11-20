vi.mock('@store/auth.store', () => ({
  useAuthStore: vi.fn(),
}));
vi.mock('@store/pets.store', () => ({
  usePetsStore: vi.fn(),
}));
vi.mock('@services/vetService');

import { render, screen } from '@test-utils';
import { AppRoutes } from '../../../AppRoutes';
import {
  installAuthStoreMock,
  installPetsStoreMock,
} from '@testUtils/mocks/mockStoreInstallers';
import { vetService } from '@services/vetService';
import { makeVet } from '@testUtils/factories/makeVet';

// Basic routing tests for vets feature (Slice 0)
describe('Vets routes (flag-gated)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    installAuthStoreMock({ user: { uid: 'user1' }, initializing: false });
    installPetsStoreMock({ pets: [] });

    const mocked = vetService as unknown as {
      getVet: vi.Mock;
      searchVets: vi.Mock;
      updateVet: vi.Mock;
      createVet: vi.Mock;
    };
    mocked.getVet.mockResolvedValue(
      makeVet({
        id: 'abc',
        ownerUserId: 'user1',
        name: 'Dr. Test',
      })
    );
    mocked.searchVets.mockResolvedValue([]);
    mocked.updateVet.mockResolvedValue({});
    mocked.createVet.mockResolvedValue({});
  });

  it('renders VetListPage at /vets when vetsEnabled=true', async () => {
    render(<AppRoutes />, {
      initialRoutes: ['/vets'],
      featureFlags: { vetsEnabled: true },
    });

    expect(
      await screen.findByRole('heading', { name: /veterinarians/i })
    ).toBeInTheDocument();
  });

  it('redirects to feature-unavailable when vetsEnabled=false', async () => {
    render(<AppRoutes />, {
      initialRoutes: ['/vets'],
      featureFlags: { vetsEnabled: false },
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /feature not enabled/i
    );
  });

  it('renders AddVetPage at /vets/add when enabled', async () => {
    render(<AppRoutes />, {
      initialRoutes: ['/vets/add'],
      featureFlags: { vetsEnabled: true },
    });

    expect(
      await screen.findByRole('heading', { name: /add veterinarian/i })
    ).toBeInTheDocument();
  });

  it('renders EditVetPage at /vets/:id/edit when enabled', async () => {
    render(<AppRoutes />, {
      initialRoutes: ['/vets/abc/edit'],
      featureFlags: { vetsEnabled: true },
    });

    expect(
      await screen.findByRole('heading', { name: /edit veterinarian/i })
    ).toBeInTheDocument();
  });
});
