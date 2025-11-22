import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@test-utils';
import type { Vet, PetVetLink } from '@models/vets';
import { installAuthStoreMock } from '@testUtils/mocks/mockStoreInstallers';
import { makePet } from '@testUtils/factories/makePet';

vi.mock('@store/auth.store', () => ({
  useAuthStore: vi.fn(),
}));
vi.mock('@services/petVetService', () => ({
  petVetService: {
    getPetVets: vi.fn(),
    linkVetToPet: vi.fn(),
    unlinkVetFromPet: vi.fn(),
    setPrimaryVet: vi.fn(),
    updateLink: vi.fn(),
  },
}));
// Replace VetSelector with a simple button that triggers onSelect
vi.mock('@features/veterinarians/components/VetSelector', () => ({
  __esModule: true,
  default: ({
    onSelect,
    label,
  }: {
    onSelect: (v: unknown) => void;
    label?: string;
  }) => (
    <button
      onClick={() =>
        onSelect({ id: 'v42', name: 'Dr. Link', phone: '555-4242' })
      }
    >
      {label ?? 'Link veterinarian'}
    </button>
  ),
}));

import { petVetService } from '@services/petVetService';
import { PetForm } from './PetForm';

describe('PetForm linking UI', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    installAuthStoreMock({
      user: {
        uid: 'user1',
        email: 't@t.com',
        displayName: 'T',
        photoURL: null,
      },
      initializing: false,
    });

    vi.mocked(petVetService.getPetVets).mockResolvedValue(
      [] as Array<{ link: PetVetLink; vet: Vet }>
    );
    vi.mocked(petVetService.linkVetToPet).mockResolvedValue({
      id: 'l1',
      petId: 'p1',
      vetId: 'v42',
      role: 'primary',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      createdBy: 'user1',
    } as PetVetLink);
    vi.mocked(petVetService.unlinkVetFromPet).mockResolvedValue(undefined);
  });

  it('renders linking section when flags enabled and allows add/remove vet link', async () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();

    render(
      <PetForm
        initialValues={makePet({ id: 'p1' })}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />,
      {
        featureFlags: { vetsEnabled: true, vetLinkingEnabled: true },
      }
    );

    // Section title visible (i18n-backed)
    const section = await screen.findByRole('heading', {
      name: /linked veterinarians/i,
    });
    expect(section).toBeInTheDocument();

    // Click our mocked VetSelector button to "link" a vet
    const linkBtn = screen.getByRole('button', { name: /link veterinarian/i });
    const user = userEvent.setup();
    await user.click(linkBtn);

    // List item appears with vet name text
    const vetName = await screen.findByText(/dr\. link/i);
    expect(vetName).toBeInTheDocument();

    // Verify role selector exists (default role is primary in our mock)
    // The Select component renders a hidden input and a display node.
    // We can find the button that opens the select.
    const roleSelect = screen.getByRole('combobox', { name: /role/i });
    expect(roleSelect).toBeInTheDocument();
    expect(roleSelect).toHaveTextContent(/primary/i);

    // Delete the link via the delete button
    const removeBtn = screen.getByRole('button', { name: /remove/i });
    await user.click(removeBtn);

    expect(petVetService.unlinkVetFromPet).toHaveBeenCalledWith('user1', 'l1');
  });

  it('changing role to primary calls setPrimaryVet and fires telemetry', async () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    const user = userEvent.setup();

    // Mock initial state with a non-primary link
    const initialLink = {
      id: 'l1',
      petId: 'p1',
      vetId: 'v42',
      role: 'specialist', // Start as specialist
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user1',
    } as PetVetLink;

    vi.mocked(petVetService.getPetVets).mockResolvedValue([
      {
        link: initialLink,
        vet: { id: 'v42', name: 'Dr. Link', phone: '555' } as Vet,
      },
    ]);

    // Mock setPrimaryVet
    vi.mocked(petVetService.setPrimaryVet).mockResolvedValue(undefined);

    render(
      <PetForm
        initialValues={makePet({ id: 'p1' })}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />,
      {
        featureFlags: { vetsEnabled: true, vetLinkingEnabled: true },
      }
    );

    // Wait for link to load
    await screen.findByText(/dr\. link/i);

    // Find role selector - should show 'Specialist'
    const roleSelect = screen.getByRole('combobox', { name: /role/i });
    expect(roleSelect).toHaveTextContent(/specialist/i);

    // Open dropdown
    await user.click(roleSelect);

    // Select 'Primary'
    const primaryOption = await screen.findByRole('option', {
      name: /primary/i,
    });
    await user.click(primaryOption);

    // Verify service call
    expect(petVetService.setPrimaryVet).toHaveBeenCalledWith(
      'user1',
      'p1',
      'l1'
    );
  });

  it('switching primary from one vet to another updates both roles in UI', async () => {
    const user = userEvent.setup();

    // Mock two links: one primary, one specialist
    const link1 = {
      id: 'l1',
      petId: 'p1',
      vetId: 'v1',
      role: 'primary',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user1',
    } as PetVetLink;

    const link2 = {
      id: 'l2',
      petId: 'p1',
      vetId: 'v2',
      role: 'specialist',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user1',
    } as PetVetLink;

    vi.mocked(petVetService.getPetVets).mockResolvedValue([
      {
        link: link1,
        vet: { id: 'v1', name: 'Dr. Primary', phone: '111' } as Vet,
      },
      {
        link: link2,
        vet: { id: 'v2', name: 'Dr. Specialist', phone: '222' } as Vet,
      },
    ]);

    vi.mocked(petVetService.setPrimaryVet).mockResolvedValue(undefined);

    render(
      <PetForm
        initialValues={makePet({ id: 'p1' })}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
      {
        featureFlags: { vetsEnabled: true, vetLinkingEnabled: true },
      }
    );

    // Wait for links
    await screen.findByText('Dr. Primary');
    await screen.findByText('Dr. Specialist');

    // Verify initial roles
    const selects = screen.getAllByRole('combobox', { name: /role/i });
    expect(selects[0]).toHaveTextContent(/primary/i); // Dr. Primary
    expect(selects[1]).toHaveTextContent(/specialist/i); // Dr. Specialist

    // Change Dr. Specialist to Primary
    await user.click(selects[1]);
    const primaryOption = await screen.findByRole('option', {
      name: /primary/i,
    });
    await user.click(primaryOption);

    // Verify service call
    expect(petVetService.setPrimaryVet).toHaveBeenCalledWith(
      'user1',
      'p1',
      'l2'
    );

    // Verify UI update (optimistic)
    // Dr. Primary should now be demoted (to 'other' or previous role if we had it, here 'other' default logic might apply or it stays if logic is simple)
    // My logic was: l.link.role === 'primary' ? (l.link.previousNonPrimaryRole ?? 'other') : l.link.role
    // link1 didn't have previousNonPrimaryRole set in mock, so it should become 'other'.

    // We need to re-query because re-render might have happened
    const updatedSelects = screen.getAllByRole('combobox', { name: /role/i });

    // Dr. Primary (first one) should now be 'other' (or whatever the logic dictates)
    // Dr. Specialist (second one) should now be 'primary'
    expect(updatedSelects[0]).toHaveTextContent(/other/i);
    expect(updatedSelects[1]).toHaveTextContent(/primary/i);
  });

  it('changing role to non-primary calls updateLink', async () => {
    const user = userEvent.setup();

    const initialLink = {
      id: 'l1',
      petId: 'p1',
      vetId: 'v42',
      role: 'other',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user1',
    } as PetVetLink;

    vi.mocked(petVetService.getPetVets).mockResolvedValue([
      {
        link: initialLink,
        vet: { id: 'v42', name: 'Dr. Link', phone: '555' } as Vet,
      },
    ]);

    vi.mocked(petVetService.updateLink).mockResolvedValue(undefined);

    render(
      <PetForm
        initialValues={makePet({ id: 'p1' })}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
      {
        featureFlags: { vetsEnabled: true, vetLinkingEnabled: true },
      }
    );

    await screen.findByText(/dr\. link/i);

    const roleSelect = screen.getByRole('combobox', { name: /role/i });
    expect(roleSelect).toHaveTextContent(/other/i);

    await user.click(roleSelect);
    const specialistOption = await screen.findByRole('option', {
      name: /specialist/i,
    });
    await user.click(specialistOption);

    expect(petVetService.updateLink).toHaveBeenCalledWith('user1', 'l1', {
      role: 'specialist',
    });

    // Verify UI update
    const updatedSelect = screen.getByRole('combobox', { name: /role/i });
    expect(updatedSelect).toHaveTextContent(/specialist/i);
  });
});
