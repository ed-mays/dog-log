import { render } from '@test-utils';
import { RoutePrefetcher } from './RoutePrefetcher';
import type { Pet } from '@features/pets/types';
import type { AuthState } from '@store/auth.store';
import {
  installPetsStoreMock,
  installAuthStoreMock,
} from '@testUtils/mocks/mockStoreInstallers';

// Mock stores used by RoutePrefetcher
vi.mock('@store/pets.store', () => ({
  usePetsStore: vi.fn(),
}));
vi.mock('@store/auth.store', () => ({
  useAuthStore: vi.fn(),
}));

describe('RoutePrefetcher', () => {
  const fetchPetsSpy = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('calls fetchPets on /pets when auth ready and no pets', () => {
    installPetsStoreMock({ pets: [], fetchPets: fetchPetsSpy });
    installAuthStoreMock({
      user: { uid: 'u1' } as NonNullable<AuthState['user']>,
      initializing: false,
    });

    render(<RoutePrefetcher />, { initialRoutes: ['/pets'] });

    expect(fetchPetsSpy).toHaveBeenCalledTimes(1);
  });

  test('does not fetch when pets already present', () => {
    installPetsStoreMock({
      pets: [{ id: '1', name: 'Fido', breed: 'Golden' } as unknown as Pet],
      fetchPets: fetchPetsSpy,
    });

    installAuthStoreMock({
      user: { uid: 'u1' } as NonNullable<AuthState['user']>,
      initializing: false,
    });

    render(<RoutePrefetcher />, { initialRoutes: ['/pets'] });

    expect(fetchPetsSpy).not.toHaveBeenCalled();
  });

  test('does not fetch while auth is initializing', () => {
    installPetsStoreMock({ pets: [], fetchPets: fetchPetsSpy });
    installAuthStoreMock({ user: null, initializing: true });

    render(<RoutePrefetcher />, { initialRoutes: ['/pets'] });

    expect(fetchPetsSpy).not.toHaveBeenCalled();
  });

  test('does not fetch when not on /pets route', () => {
    installPetsStoreMock({ pets: [], fetchPets: fetchPetsSpy });
    installAuthStoreMock({
      user: { uid: 'u1' } as NonNullable<AuthState['user']>,
      initializing: false,
    });

    render(<RoutePrefetcher />, { initialRoutes: ['/other'] });

    expect(fetchPetsSpy).not.toHaveBeenCalled();
  });

  test('fetches after auth finishes initializing on /pets refresh', async () => {
    installPetsStoreMock({ pets: [], fetchPets: fetchPetsSpy });

    const authMock = installAuthStoreMock({ user: null, initializing: true });

    const { rerender } = render(<RoutePrefetcher />, {
      initialRoutes: ['/pets'],
    });
    expect(fetchPetsSpy).not.toHaveBeenCalled();

    // Simulate auth becoming ready
    authMock.state.user = { uid: 'u1' } as NonNullable<AuthState['user']>;
    authMock.state.initializing = false;
    rerender(<RoutePrefetcher />);

    expect(fetchPetsSpy).toHaveBeenCalledTimes(1);
  });
});
