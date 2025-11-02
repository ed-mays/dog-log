import { render } from '@test-utils';
import { RoutePrefetcher } from './RoutePrefetcher';
import { usePetsStore } from '@store/pets.store';
import { useUiStore } from '@store/ui.store';
import { vi } from 'vitest';

vi.mock('@store/pets.store', () => ({
  usePetsStore: vi.fn(),
}));
vi.mock('@store/ui.store');

describe('RoutePrefetcher', () => {
  const mockUsePetsStore = usePetsStore as vi.Mock;
  const mockUseUiStore = useUiStore as vi.Mock;
  const fetchPetsSpy = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should call fetchPets when on a pets route with no pets and not loading', () => {
    const petStoreState = { pets: [], fetchPets: fetchPetsSpy };
    mockUsePetsStore.mockImplementation((selector) => selector(petStoreState));
    const uiStoreState = { loading: false };
    mockUseUiStore.mockImplementation((selector) => selector(uiStoreState));

    render(<RoutePrefetcher />, { initialRoutes: ['/pets'] });

    expect(fetchPetsSpy).toHaveBeenCalledTimes(1);
  });

  it('should not call fetchPets when on a pets route but pets are already present', () => {
    const petStoreState = {
      pets: [{ id: '1', name: 'Fido', breed: 'Golden' }],
      fetchPets: fetchPetsSpy,
    };
    mockUsePetsStore.mockImplementation((selector) => selector(petStoreState));
    const uiStoreState = { loading: false };
    mockUseUiStore.mockImplementation((selector) => selector(uiStoreState));

    render(<RoutePrefetcher />, { initialRoutes: ['/pets'] });

    expect(fetchPetsSpy).not.toHaveBeenCalled();
  });

  it('should not call fetchPets when on a pets route but already loading', () => {
    const petStoreState = { pets: [], fetchPets: fetchPetsSpy };
    mockUsePetsStore.mockImplementation((selector) => selector(petStoreState));
    const uiStoreState = { loading: true };
    mockUseUiStore.mockImplementation((selector) => selector(uiStoreState));

    render(<RoutePrefetcher />, { initialRoutes: ['/pets'] });

    expect(fetchPetsSpy).not.toHaveBeenCalled();
  });

  it('should not call fetchPets when not on a pets route', () => {
    const petStoreState = { pets: [], fetchPets: fetchPetsSpy };
    mockUsePetsStore.mockImplementation((selector) => selector(petStoreState));
    const uiStoreState = { loading: false };
    mockUseUiStore.mockImplementation((selector) => selector(uiStoreState));

    render(<RoutePrefetcher />, { initialRoutes: ['/other'] });

    expect(fetchPetsSpy).not.toHaveBeenCalled();
  });
});
