import { render, screen } from '@test-utils';
import { PrivateRoute } from './PrivateRoute';
import { useAuthStore } from '@store/auth.store';
import { useFeatureFlag } from '@featureFlags/hooks/useFeatureFlag';
import '@testing-library/jest-dom';

// Mock the hooks
vi.mock('@store/auth.store', () => ({
  useAuthStore: vi.fn(),
}));
vi.mock('@featureFlags/hooks/useFeatureFlag');

describe('PrivateRoute', () => {
  const mockUseFeatureFlag = useFeatureFlag as vi.Mock;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should render children if auth is not enabled', () => {
    mockUseFeatureFlag.mockReturnValue(false);
    // user state shouldn't matter
    const authStoreState = { user: null };
    vi.mocked(useAuthStore).mockImplementation((selector) =>
      selector(authStoreState)
    );

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
    vi.mocked(useAuthStore).mockImplementation((selector) =>
      selector(authStoreState)
    );

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
    vi.mocked(useAuthStore).mockImplementation((selector) =>
      selector(authStoreState)
    );

    render(
      <PrivateRoute>
        <div>Private Content</div>
      </PrivateRoute>
    );

    expect(screen.getByText('Private Content')).toBeInTheDocument();
  });
});
