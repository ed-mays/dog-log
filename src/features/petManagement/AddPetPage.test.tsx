import { screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import type { Pet, PetCreateInput } from '@features/petManagement/types';
import AddPetPage from './AddPetPage';
import { render } from '@test-utils';

const addPetMock = vi.fn<[PetCreateInput], Promise<void>>(() =>
  Promise.resolve()
);

vi.mock('@store/pets.store', () => ({
  usePetsStore: (selector: (state: { addPet: typeof addPetMock }) => unknown) =>
    selector({ addPet: addPetMock }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<{ [key: string]: unknown }>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const testBirthDate = new Date('2023-01-01T00:00:00.000Z');

vi.mock('@features/petManagement/PetForm', () => ({
  PetForm: (props: {
    onSubmit: (pet: Pet) => void;
    onCancel: () => void;
    onDirtyChange?: (dirty: boolean) => void;
  }) => (
    <div>
      <button
        onClick={() => {
          props.onDirtyChange?.(true);
          props.onSubmit({
            name: 'Rover',
            breed: 'Hound',
            birthDate: testBirthDate,
          } as Pet);
        }}
      >
        OK
      </button>
      <button
        onClick={() => {
          props.onDirtyChange?.(true);
          props.onCancel();
        }}
      >
        Cancel
      </button>
      <button onClick={() => props.onDirtyChange?.(true)}>Dirty</button>
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

describe('AddPetPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the PetForm', () => {
    render(<AddPetPage />);
    expect(screen.getByText('OK')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('submits form, adds pet to store, navigates to /pets', async () => {
    render(<AddPetPage />);
    fireEvent.click(screen.getByText('OK'));

    await waitFor(() => {
      expect(addPetMock).toHaveBeenCalledWith({
        name: 'Rover',
        breed: 'Hound',
        birthDate: testBirthDate,
      });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/pets');
    });
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
