vi.mock('@featureFlags/hooks/useFeatureFlag');
vi.mock('@store/auth.store', () => ({
  useAuthStore: vi.fn(),
}));
vi.mock('@store/pets.store', () => ({
  usePetsStore: vi.fn(),
}));
vi.mock('@services/vetService');

import { render, screen } from '@test-utils';
import { useFeatureFlag } from '@featureFlags/hooks/useFeatureFlag';
import { AppRoutes } from '../../../AppRoutes';
import {
  installAuthStoreMock,
  installPetsStoreMock,
} from '@testUtils/mocks/mockStoreInstallers';
import { vetService } from '@services/vetService';

// Basic routing tests for vets feature (Slice 0)
describe('Vets routes (flag-gated)', () => {
  const mockUseFeatureFlag = useFeatureFlag as unknown as vi.Mock;

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
    mocked.getVet.mockResolvedValue({
      id: 'abc',
      ownerUserId: 'user1',
      name: 'Dr. Test',
      phone: '555-1234',
      createdAt: new Date(),
      updatedAt: new Date(),
      _normName: 'drtest',
      _e164Phone: '+15551234',
      isArchived: false,
      createdBy: 'user1',
    });
    mocked.searchVets.mockResolvedValue([]);
    mocked.updateVet.mockResolvedValue({});
    mocked.createVet.mockResolvedValue({});
  });

  it('renders VetListPage at /vets when vetsEnabled=true', async () => {
    mockUseFeatureFlag.mockImplementation((flag: string) => {
      if (flag === 'vetsEnabled') return true;
      return true; // enable other flags by default
    });

    render(<AppRoutes />, { initialRoutes: ['/vets'] });

    expect(
      await screen.findByRole('heading', { name: /veterinarians/i })
    ).toBeInTheDocument();
  });

  it('redirects to feature-unavailable when vetsEnabled=false', async () => {
    mockUseFeatureFlag.mockImplementation((flag: string) => {
      if (flag === 'vetsEnabled') return false;
      return true; // others enabled
    });

    render(<AppRoutes />, { initialRoutes: ['/vets'] });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /feature not enabled/i
    );
  });

  it('renders AddVetPage at /vets/add when enabled', async () => {
    mockUseFeatureFlag.mockImplementation((flag: string) => {
      if (flag === 'vetsEnabled') return true;
      return true;
    });

    render(<AppRoutes />, { initialRoutes: ['/vets/add'] });

    expect(
      await screen.findByRole('heading', { name: /add veterinarian/i })
    ).toBeInTheDocument();
  });

  it('renders EditVetPage at /vets/:id/edit when enabled', async () => {
    mockUseFeatureFlag.mockImplementation((flag: string) => {
      if (flag === 'vetsEnabled') return true;
      return true;
    });

    render(<AppRoutes />, { initialRoutes: ['/vets/abc/edit'] });

    expect(
      await screen.findByRole('heading', { name: /edit veterinarian/i })
    ).toBeInTheDocument();
  });
});
