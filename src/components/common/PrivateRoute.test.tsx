import { render, screen } from '@/test-utils';
import { Routes, Route } from 'react-router-dom';
import { PrivateRoute } from './PrivateRoute';
import { useAuthStore } from '@store/auth.store';
import { useFeatureFlag } from '../../featureFlags/useFeatureFlag';
import '@testing-library/jest-dom';

// Mock the hooks
vi.mock('@store/auth.store');
vi.mock('../../featureFlags/useFeatureFlag');

describe('PrivateRoute', () => {
  const mockUseAuthStore = useAuthStore as vi.Mock;
  const mockUseFeatureFlag = useFeatureFlag as vi.Mock;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should redirect to /welcome if auth is not enabled', () => {
    mockUseFeatureFlag.mockReturnValue(false);
    const authStoreState = { initializing: false, user: { uid: 'test' } };
    mockUseAuthStore.mockImplementation((selector) => selector(authStoreState));

    render(
      <Routes>
        <Route
          path="/private"
          element={
            <PrivateRoute>
              <div>Private Content</div>
            </PrivateRoute>
          }
        />
        <Route path="/welcome" element={<div>Welcome Page</div>} />
      </Routes>,
      { initialRoutes: ['/private'] }
    );

    expect(screen.getByText('Welcome Page')).toBeInTheDocument();
  });

  it('should render loading indicator while initializing', () => {
    mockUseFeatureFlag.mockReturnValue(true);
    const authStoreState = { initializing: true, user: null };
    mockUseAuthStore.mockImplementation((selector) => selector(authStoreState));

    render(
      <PrivateRoute>
        <div>Private Content</div>
      </PrivateRoute>
    );

    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });

  it('should redirect to /welcome if user is not authenticated', () => {
    mockUseFeatureFlag.mockReturnValue(true);
    const authStoreState = { initializing: false, user: null };
    mockUseAuthStore.mockImplementation((selector) => selector(authStoreState));

    render(
      <Routes>
        <Route
          path="/private"
          element={
            <PrivateRoute>
              <div>Private Content</div>
            </PrivateRoute>
          }
        />
        <Route path="/welcome" element={<div>Welcome Page</div>} />
      </Routes>,
      { initialRoutes: ['/private'] }
    );

    expect(screen.getByText('Welcome Page')).toBeInTheDocument();
  });

  it('should render children if user is authenticated', () => {
    mockUseFeatureFlag.mockReturnValue(true);
    const authStoreState = { initializing: false, user: { uid: 'test' } };
    mockUseAuthStore.mockImplementation((selector) => selector(authStoreState));

    render(
      <PrivateRoute>
        <div>Private Content</div>
      </PrivateRoute>
    );

    expect(screen.getByText('Private Content')).toBeInTheDocument();
  });
});
