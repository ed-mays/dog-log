import { screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import type { Pet } from '@features/petManagement/PetForm';
import AddPetPage from './AddPetPage';
import { render } from 'test-utils.tsx';

// ---- Typed Zustand Store Mock ----
type AddPet = (pet: Pet) => void;
interface PetsStoreState {
  addPet: AddPet;
}

// Always use the vi.fn mock directly
const addPetMock: AddPet = vi.fn();
vi.mock('@store/pets.store', () => ({
  usePetsStore: (selector: (state: PetsStoreState) => unknown) =>
    selector({ addPet: addPetMock }),
}));

// ---- Router useNavigate Mock ----
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<{ [key: string]: unknown }>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// ---- PetForm and ConfirmModal mocks ----
vi.mock('@features/petManagement/PetForm', () => ({
  PetForm: (props: {
    onSubmit: (pet: Pet) => void;
    onCancel: () => void;
    setDirty: (dirty: boolean) => void;
  }) => (
    <div>
      <button
        onClick={() => {
          props.setDirty(true);
          props.onSubmit({ name: 'Rover', breed: 'Hound' });
        }}
      >
        OK
      </button>
      <button
        onClick={() => {
          props.setDirty(true);
          props.onCancel();
        }}
      >
        Cancel
      </button>
      <button onClick={() => props.setDirty(true)}>Dirty</button>
    </div>
  ),
}));

vi.mock('@components/common/ConfirmModal/ConfirmModal', () => ({
  ConfirmModal: (props: { onAccept: () => void; onDecline: () => void }) => (
    <div>
      <button onClick={props.onAccept}>Accept</button>
      <button onClick={props.onDecline}>Decline</button>
    </div>
  ),
}));

// ---- Test Suite ----
describe('AddPetPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the PetForm', () => {
    render(<AddPetPage />);
    expect(screen.getByText('OK')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('submits form, adds pet to store, navigates to /pets', () => {
    render(<AddPetPage />);
    fireEvent.click(screen.getByText('OK'));
    expect(addPetMock).toHaveBeenCalledWith({
      name: 'Rover',
      breed: 'Hound',
      id: '3',
    });
    expect(mockNavigate).toHaveBeenCalledWith('/pets');
  });

  it('shows modal when cancel is clicked if dirty, then accepts and navigates', () => {
    render(<AddPetPage />);
    fireEvent.click(screen.getByText('Dirty'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.getByText('Accept')).toBeInTheDocument();
    expect(screen.getByText('Decline')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Accept'));
    expect(mockNavigate).toHaveBeenCalledWith('/pets');
  });

  it('shows modal on cancel if dirty, declines and stays on page', () => {
    render(<AddPetPage />);
    fireEvent.click(screen.getByText('Dirty'));
    fireEvent.click(screen.getByText('Cancel'));
    fireEvent.click(screen.getByText('Decline'));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('navigates away immediately if cancel is clicked and not dirty', () => {
    // Remock PetForm for this test: setDirty not called, so not dirty
    vi.doMock('@features/petManagement/PetForm', () => ({
      PetForm: (props: { onCancel: () => void }) => (
        <div>
          <button onClick={props.onCancel}>Cancel</button>
        </div>
      ),
    }));
    render(<AddPetPage />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockNavigate).toHaveBeenCalledWith('/pets');
  });
});
