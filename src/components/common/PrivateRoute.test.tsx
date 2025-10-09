import { render, screen } from '@/test-utils';
import { PrivateRoute } from './PrivateRoute';
import { useAuthStore } from '@/store/auth.store';
import { useFeatureFlag } from '@/featureFlags/useFeatureFlag';
import '@testing-library/jest-dom';

// Mock the hooks
vi.mock('@/store/auth.store');
vi.mock('@/featureFlags/useFeatureFlag');

describe('PrivateRoute', () => {
  const mockUseAuthStore = useAuthStore as vi.Mock;
  const mockUseFeatureFlag = useFeatureFlag as vi.Mock;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should render children if auth is not enabled', () => {
    mockUseFeatureFlag.mockReturnValue(false);
    // user state shouldn't matter
    const authStoreState = { user: null };
    mockUseAuthStore.mockImplementation((selector) => selector(authStoreState));

    render(
      <PrivateRoute>
        <div>Private Content</div>
      </PrivateRoute>
    );

    expect(screen.getByText('Private Content')).toBeInTheDocument();
  });

  it('should render null if auth is enabled and user is not authenticated', () => {
    mockUseFeatureFlag.mockReturnValue(true);
    const authStoreState = { user: null };
    mockUseAuthStore.mockImplementation((selector) => selector(authStoreState));

    const { container } = render(
      <PrivateRoute>
        <div>Private Content</div>
      </PrivateRoute>
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('should render children if auth is enabled and user is authenticated', () => {
    mockUseFeatureFlag.mockReturnValue(true);
    const authStoreState = { user: { uid: 'test' } };
    mockUseAuthStore.mockImplementation((selector) => selector(authStoreState));

    render(
      <PrivateRoute>
        <div>Private Content</div>
      </PrivateRoute>
    );

    expect(screen.getByText('Private Content')).toBeInTheDocument();
  });
});
