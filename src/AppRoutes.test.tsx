import { render, screen } from '@/test-utils';
import { AppRoutes } from './AppRoutes';
import { useFeatureFlag } from './featureFlags/useFeatureFlag';
import { useAuthStore } from '@/store/auth.store';
import '@testing-library/jest-dom';

vi.mock('./featureFlags/useFeatureFlag');
vi.mock('@/store/auth.store');

describe('AppRoutes', () => {
  const mockUseFeatureFlag = useFeatureFlag as vi.Mock;
  const mockUseAuthStore = useAuthStore as vi.Mock;

  beforeEach(() => {
    vi.resetAllMocks();
    // Provide a default authenticated user for protected routes
    const authStoreState = { initializing: false, user: { uid: 'test' } };
    mockUseAuthStore.mockImplementation((selector) =>
      selector ? selector(authStoreState) : authStoreState
    );
    // Default all feature flags to true for simplicity, tests can override
    mockUseFeatureFlag.mockReturnValue(true);
  });

  it('should render PetListPage for /pets route when feature is enabled', () => {
    mockUseFeatureFlag.mockImplementation(
      (flag) => flag === 'petListEnabled' || flag === 'authEnabled'
    );
    render(<AppRoutes />, { initialRoutes: ['/pets'] });
    expect(screen.getByTestId('pet-list')).toBeInTheDocument();
  });

  it('should redirect to /feature-unavailable for /pets route when feature is disabled', () => {
    mockUseFeatureFlag.mockImplementation((flag) => flag !== 'petListEnabled');
    render(<AppRoutes />, { initialRoutes: ['/pets'] });
    expect(screen.getByText('Feature not enabled')).toBeInTheDocument();
  });

  it('should render AddPetPage for /pets/new route', () => {
    render(<AppRoutes />, { initialRoutes: ['/pets/new'] });
    // The AddPetPage renders a form, check for a form field as a proxy for the page
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });
});
