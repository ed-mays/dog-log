vi.mock('@featureFlags/hooks/useFeatureFlag');
vi.mock('@store/auth.store', () => ({
  useAuthStore: vi.fn(),
}));
vi.mock('@store/pets.store', () => ({
  usePetsStore: vi.fn(),
}));

import { render, screen } from '@test-utils';
import { AppRoutes } from './AppRoutes';
import { useFeatureFlag } from '@featureFlags/hooks/useFeatureFlag';
import '@testing-library/jest-dom';
import i18n from '@testUtils/test-i18n';
import {
  installAuthStoreMock,
  installPetsStoreMock,
} from '@testUtils/mocks/mockStoreInstallers';

describe('AppRoutes', () => {
  const mockUseFeatureFlag = useFeatureFlag as unknown as vi.Mock;

  beforeEach(() => {
    vi.resetAllMocks();
    // Default: authenticated user, no pets required
    installAuthStoreMock({ user: { uid: 'test' }, initializing: false });
    installPetsStoreMock({ pets: [] });
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
    expect(await screen.findByLabelText(/name/i)).toBeInTheDocument();
  });
  it('renders NotFound page for unknown routes when authenticated with localized text', async () => {
    // Authenticated by default from beforeEach
    mockUseFeatureFlag.mockReturnValue(true);

    await i18n.changeLanguage('en');
    const expectedTitle = i18n.t('notFound.title', {
      ns: 'common',
      defaultValue: 'Page not found',
    });
    const expectedMsg = i18n.t('notFound.message', {
      ns: 'common',
      defaultValue: 'The page you are looking for does not exist.',
    });

    render(<AppRoutes />, { initialRoutes: ['/does-not-exist'] });

    expect(await screen.findByTestId('not-found-page')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: expectedTitle })
    ).toBeInTheDocument();
    expect(screen.getByText(expectedMsg)).toBeInTheDocument();
  });
});

it('redirects to feature-unavailable when addPetEnabled=false for /pets/new', async () => {
  // Authenticated by default from beforeEach
  (useFeatureFlag as unknown as vi.Mock).mockImplementation((flag: string) => {
    // disable addPetEnabled, enable others
    if (flag === 'addPetEnabled') return false;
    return true;
  });

  render(<AppRoutes />, { initialRoutes: ['/pets/new'] });
  expect(await screen.findByText('Feature not enabled')).toBeInTheDocument();
});

it('redirects to feature-unavailable when petActionsEnabled=false for /pets/:id/edit', async () => {
  // Authenticated by default from beforeEach
  (useFeatureFlag as unknown as vi.Mock).mockImplementation((flag: string) => {
    // disable petActionsEnabled, enable others
    if (flag === 'petActionsEnabled') return false;
    return true;
  });

  render(<AppRoutes />, { initialRoutes: ['/pets/123/edit'] });
  expect(await screen.findByText('Feature not enabled')).toBeInTheDocument();
});

// Direct route test for feature-unavailable (i18n-validated)
it('renders localized Feature Unavailable text via shared test i18n', async () => {
  // Authenticated by default from beforeEach in the describe block
  (useFeatureFlag as unknown as vi.Mock).mockReturnValue(true);

  await i18n.changeLanguage('en');
  const expected = i18n.t('featureNotEnabled', { ns: 'common' });

  render(<AppRoutes />, { initialRoutes: ['/feature-unavailable'] });

  expect(await screen.findByText(expected)).toBeInTheDocument();
});

// Authenticated user visiting /welcome should be redirected to /pets
it('redirects /welcome to /pets when authenticated', async () => {
  // Authenticated by default
  (useFeatureFlag as unknown as vi.Mock).mockReturnValue(true);

  render(<AppRoutes />, { initialRoutes: ['/welcome'] });

  // Expect the pet list to render after redirect to /pets
  expect(await screen.findByTestId('pet-list')).toBeInTheDocument();
});

// Positive case: edit route renders when petActionsEnabled=true
it('renders EditPetPage (or not-found alert) for /pets/:id/edit when feature enabled', async () => {
  (useFeatureFlag as unknown as vi.Mock).mockImplementation(() => true);

  render(<AppRoutes />, { initialRoutes: ['/pets/123/edit'] });

  // Edit page renders an alert if the pet is missing; asserting this proves route resolved
  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent(/pet not found/i);
});
