import { screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import type { Pet, PetCreateInput } from '@features/petManagement/types';
import AddPetPage from './AddPetPage';
import { render } from '@test-utils';

const addPetMock = vi.fn<[PetCreateInput], Promise<void>>(() =>
  Promise.resolve()
);

vi.mock('@store/pets.store', async () => ({
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

vi.mock('@features/petManagement/components/PetForm', async () => ({
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

vi.mock('@components/common/ConfirmModal/ConfirmModal', async () => ({
  ConfirmModal: (props: { onAccept: () => void; onDecline: () => void }) => (
    <div>
      <button onClick={props.onAccept}>Accept</button>
      <button onClick={props.onDecline}>Decline</button>
    </div>
  ),
}));

describe('AddPetPage', async () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the PetForm', async () => {
    render(<AddPetPage />);
    expect(await screen.findByText('OK')).toBeInTheDocument();
    expect(await screen.findByText('Cancel')).toBeInTheDocument();
  });

  it('submits form, adds pet to store, navigates to /pets', async () => {
    render(<AddPetPage />);
    fireEvent.click(await screen.findByText('OK'));

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

  it('shows modal when cancel is clicked if dirty, then accepts and navigates', async () => {
    render(<AddPetPage />);
    fireEvent.click(await screen.findByText('Dirty'));
    fireEvent.click(await screen.findByText('Cancel'));
    expect(await screen.findByText('Accept')).toBeInTheDocument();
    expect(await screen.findByText('Decline')).toBeInTheDocument();
    fireEvent.click(await screen.findByText('Accept'));
    expect(mockNavigate).toHaveBeenCalledWith('/pets');
  });

  it('shows modal on cancel if dirty, declines and stays on page', async () => {
    render(<AddPetPage />);
    fireEvent.click(await screen.findByText('Dirty'));
    fireEvent.click(await screen.findByText('Cancel'));
    fireEvent.click(await screen.findByText('Decline'));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('navigates away immediately if cancel is clicked and not dirty', async () => {
    vi.doMock('@features/petManagement/components/PetForm', async () => ({
      PetForm: (props: { onCancel: () => void }) => (
        <div>
          <button onClick={props.onCancel}>Cancel</button>
        </div>
      ),
    }));
    render(<AddPetPage />);
    fireEvent.click(await screen.findByText('Cancel'));
    expect(mockNavigate).toHaveBeenCalledWith('/pets');
  });
});
