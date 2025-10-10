vi.mock('./featureFlags/hooks/useFeatureFlag');
vi.mock('@store/auth.store');

import { render, screen } from '@test-utils';
import { AppRoutes } from './AppRoutes';
import { useFeatureFlag } from './featureFlags/hooks/useFeatureFlag';
import { useAuthStore } from '@store/auth.store';
import '@testing-library/jest-dom';

describe('AppRoutes', () => {
  const mockUseFeatureFlag = useFeatureFlag as unknown as vi.Mock;
  const mockUseAuthStore = useAuthStore as unknown as vi.Mock;

  beforeEach(() => {
    vi.resetAllMocks();

    const authStoreState = { initializing: false, user: { uid: 'test' } };
    mockUseAuthStore.mockImplementation((selector?: (s: any) => any) =>
      selector ? selector(authStoreState) : authStoreState
    );

    mockUseFeatureFlag.mockReturnValue(true);
  });

  it('renders PetListPage for /pets when feature is enabled', async () => {
    mockUseFeatureFlag.mockImplementation(
      (flag: string) => flag === 'petListEnabled' || flag === 'authEnabled'
    );

    render(<AppRoutes />, { initialRoutes: ['/pets'] });

    expect(await screen.findByTestId('pet-list')).toBeInTheDocument();
  });

  it('redirects to feature-unavailable when pet list feature is disabled', async () => {
    mockUseFeatureFlag.mockImplementation(
      (flag: string) => flag !== 'petListEnabled'
    );
    render(<AppRoutes />, { initialRoutes: ['/pets'] });

    // If your feature-unavailable route/component renders this string:
    expect(await screen.findByText('Feature not enabled')).toBeInTheDocument();
  });

  it('renders AddPetPage for /pets/new', async () => {
    render(<AppRoutes />, { initialRoutes: ['/pets/new'] });

    // 2) Await a label rendered by the form
    expect(await screen.findByLabelText('Name')).toBeInTheDocument();
  });
});
