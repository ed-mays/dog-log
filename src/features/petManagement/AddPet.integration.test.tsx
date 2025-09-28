import { render, screen, waitFor } from '@/test-utils';
import userEvent from '@testing-library/user-event';
import App from '@/App';
import { afterEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import { useAuthStore } from '@store/auth.store';

// Mock child components with side-effects to isolate the test
vi.mock('@features/authentication/AuthBootstrap', () => ({
  default: () => null,
}));
vi.mock('@store/auth.store');

describe('Add Pet Integration Test', () => {
  const mockUseAuthStore = useAuthStore as vi.Mock;

  beforeEach(() => {
    vi.resetAllMocks();
    // Provide a default authenticated user for the test
    const authStoreState = { initializing: false, user: { uid: 'test' } };
    mockUseAuthStore.mockImplementation((selector) => selector(authStoreState));
  });

  afterEach(() => {
    // TODO: Reset firestore
  });

  it('should allow a user to add a new pet and see it in the list', async () => {
    const user = userEvent.setup();
    render(<App />, { initialRoutes: ['/pets'] });

    // 1. Start on the pet list page and click the "Add Pet" button
    const addPetButton = await screen.findByTestId('add-pet-button');
    await user.click(addPetButton);

    // 2. Arrive on the Add Pet page and fill out the form
    const nameInput = await screen.findByLabelText(/name/i);
    const breedInput = screen.getByLabelText(/breed/i);
    const saveButton = screen.getByRole('button', { name: /ok/i });

    await user.type(nameInput, 'Buddy');
    await user.type(breedInput, 'Golden Retriever');

    // 3. Click save and expect to be navigated back to the pet list
    await user.click(saveButton);
    await waitFor(() => {
      expect(screen.getByTestId('pet-list')).toBeInTheDocument();
    });

    // 4. Verify the new pet is now in the list
    expect(screen.getByText('Buddy')).toBeInTheDocument();
    expect(screen.getByText('Golden Retriever')).toBeInTheDocument();
  });
});
