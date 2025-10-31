import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import type { PetCreateInput } from '@features/pets/types';
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

/*const testBirthDate = new Date('2023-01-01T00:00:00.000Z');
const testPet = {
  name: 'Rover',
  breed: 'Hound',
  birthDate: testBirthDate,
} as Pet;*/

/*vi.mock('@features/petManagement/components/PetForm', async () => ({
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
}));*/

/*vi.mock('@components/common/ConfirmModal/ConfirmModal', async () => ({
  ConfirmModal: (props: { onAccept: () => void; onDecline: () => void }) => (
    <div>
      <button onClick={props.onAccept}>Accept</button>
      <button onClick={props.onDecline}>Decline</button>
    </div>
  ),
}));*/

describe('AddPetPage', async () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the PetForm', async () => {
    render(<AddPetPage />);
    expect(await screen.findByText('OK')).toBeInTheDocument();
    expect(await screen.findByText('Cancel')).toBeInTheDocument();
  });

  // TODO: Fix this test
  // it('submits form, adds pet to store, navigates to /pets', async () => {
  //   render(<AddPetPage />);
  //
  //   const nameInput = await screen.findByLabelText('Name');
  //   const breedInput = await screen.findByLabelText('Breed');
  //
  //   nameInput.textContent = testPet.name;
  //   breedInput.textContent = testPet.breed;
  //   fireEvent.click(await screen.findByText('OK'));
  //
  //   await waitFor(() => {
  //     expect(addPetMock).toHaveBeenCalledWith({
  //       name: 'Rover',
  //       breed: 'Hound',
  //       birthDate: testBirthDate,
  //     });
  //   });
  //
  //   await waitFor(() => {
  //     expect(mockNavigate).toHaveBeenCalledWith('/pets');
  //   });
  // });

  // TODO: Fix this test
  //
  // it('shows modal when cancel is clicked if dirty, then accepts and navigates', async () => {
  //   render(<AddPetPage />);
  //   fireEvent.click(await screen.findByText('Cancel'));
  //   expect(await screen.findByText('OK')).toBeInTheDocument();
  //   expect(await screen.findByText('Cancel')).toBeInTheDocument();
  //   fireEvent.click(await screen.findByText('OK'));
  //   expect(mockNavigate).toHaveBeenCalledWith('/pets');
  // });
  //
  // TODO: Fix this test
  // it('shows modal on cancel if dirty, declines and stays on page', async () => {
  //   render(<AddPetPage />);
  //
  //   const nameInput = await screen.findByLabelText('Name');
  //   nameInput.textContent = testPet.name;
  //   fireEvent.click(await screen.findByText('Cancel'));
  //   fireEvent.click(await screen.findByText('Decline'));
  //   expect(mockNavigate).not.toHaveBeenCalled();
  // });

  it('navigates away immediately if cancel is clicked and not dirty', async () => {
    vi.doMock('@features/pets/components/PetForm', async () => ({
      PetForm: (props: { onCancel: () => void }) => (
        <div>
          <button onClick={props.onCancel}>Cancel</button>
        </div>
      ),
    }));
    const user = userEvent.setup();
    render(<AddPetPage />);
    await user.click(await screen.findByText('Cancel'));
    expect(mockNavigate).toHaveBeenCalledWith('/pets');
  });
});
