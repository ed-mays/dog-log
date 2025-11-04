import { render } from '@test-utils';
import { RoutePrefetcher } from './RoutePrefetcher';
import { usePetsStore } from '@store/pets.store.ts';
import { vi } from 'vitest';
import type { Pet } from '@features/pets/types.ts';
import type { AuthState } from '@store/auth.store.ts';

// Mock stores used by RoutePrefetcher
vi.mock('@store/pets.store.ts', () => ({
  usePetsStore: vi.fn(),
}));
vi.mock('@store/auth.store.ts', () => ({
  useAuthStore: vi.fn(),
}));

// Import after mocks so types resolve
import { useAuthStore } from '@store/auth.store.ts';

// Minimal slice types for selector typing in tests
type TestPetsSlice = { pets: Pet[]; fetchPets: () => void };

describe('RoutePrefetcher', () => {
  const mockUsePetsStore = usePetsStore as unknown as vi.Mock;
  const mockUseAuthStore = useAuthStore as unknown as vi.Mock;
  const fetchPetsSpy = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('calls fetchPets on /pets when auth ready and no pets', () => {
    const petStoreState: TestPetsSlice = { pets: [], fetchPets: fetchPetsSpy };
    mockUsePetsStore.mockImplementation(
      (selector: (s: TestPetsSlice) => unknown) => selector(petStoreState)
    );

    const authState: Pick<AuthState, 'user' | 'initializing'> = {
      user: { uid: 'u1' } as NonNullable<AuthState['user']>,
      initializing: false,
    };
    mockUseAuthStore.mockReturnValue(authState);

    render(<RoutePrefetcher />, { initialRoutes: ['/pets'] });

    expect(fetchPetsSpy).toHaveBeenCalledTimes(1);
  });

  test('does not fetch when pets already present', () => {
    const petStoreState: TestPetsSlice = {
      // Use a minimal Pet shape for the test; other fields (if any) are not required here
      pets: [{ id: '1', name: 'Fido', breed: 'Golden' } as unknown as Pet],
      fetchPets: fetchPetsSpy,
    };
    mockUsePetsStore.mockImplementation(
      (selector: (s: TestPetsSlice) => unknown) => selector(petStoreState)
    );

    const authState: Pick<AuthState, 'user' | 'initializing'> = {
      user: { uid: 'u1' } as NonNullable<AuthState['user']>,
      initializing: false,
    };
    mockUseAuthStore.mockReturnValue(authState);

    render(<RoutePrefetcher />, { initialRoutes: ['/pets'] });

    expect(fetchPetsSpy).not.toHaveBeenCalled();
  });

  test('does not fetch while auth is initializing', () => {
    const petStoreState: TestPetsSlice = { pets: [], fetchPets: fetchPetsSpy };
    mockUsePetsStore.mockImplementation(
      (selector: (s: TestPetsSlice) => unknown) => selector(petStoreState)
    );

    const authState: Pick<AuthState, 'user' | 'initializing'> = {
      user: null,
      initializing: true,
    };
    mockUseAuthStore.mockReturnValue(authState);

    render(<RoutePrefetcher />, { initialRoutes: ['/pets'] });

    expect(fetchPetsSpy).not.toHaveBeenCalled();
  });

  test('does not fetch when not on /pets route', () => {
    const petStoreState: TestPetsSlice = { pets: [], fetchPets: fetchPetsSpy };
    mockUsePetsStore.mockImplementation(
      (selector: (s: TestPetsSlice) => unknown) => selector(petStoreState)
    );

    const authState: Pick<AuthState, 'user' | 'initializing'> = {
      user: { uid: 'u1' } as NonNullable<AuthState['user']>,
      initializing: false,
    };
    mockUseAuthStore.mockReturnValue(authState);

    render(<RoutePrefetcher />, { initialRoutes: ['/other'] });

    expect(fetchPetsSpy).not.toHaveBeenCalled();
  });

  test('fetches after auth finishes initializing on /pets refresh', async () => {
    const petStoreState: TestPetsSlice = { pets: [], fetchPets: fetchPetsSpy };
    mockUsePetsStore.mockImplementation(
      (selector: (s: TestPetsSlice) => unknown) => selector(petStoreState)
    );

    // Mutable auth state that test can change between renders
    let authState: Pick<AuthState, 'user' | 'initializing'> = {
      user: null,
      initializing: true,
    };
    mockUseAuthStore.mockImplementation(() => authState);

    const { rerender } = render(<RoutePrefetcher />, {
      initialRoutes: ['/pets'],
    });
    expect(fetchPetsSpy).not.toHaveBeenCalled();

    // Simulate auth becoming ready
    authState = {
      user: { uid: 'u1' } as NonNullable<AuthState['user']>,
      initializing: false,
    };
    rerender(<RoutePrefetcher />);

    expect(fetchPetsSpy).toHaveBeenCalledTimes(1);
  });
});
