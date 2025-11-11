import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@test-utils';
import {
  within,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import type { AuthState } from '@store/auth.store';
import type { Vet } from '@models/vets';
import type { VetFormValues } from './VetForm';

vi.mock('@store/auth.store', () => ({
  useAuthStore: vi.fn(),
}));
vi.mock('@services/vetService', () => ({
  vetService: {
    searchVets: vi.fn(),
    createVet: vi.fn(),
  },
}));
// Mock VetForm used inside VetSelector to avoid relying on complex form UI
vi.mock('./VetForm', () => ({
  __esModule: true,
  default: ({
    onSubmit,
    onCancel,
    submitLabel,
  }: {
    onSubmit: (values: VetFormValues) => void;
    onCancel: () => void;
    submitLabel?: string;
  }) => (
    <div>
      <button onClick={() => onSubmit({ name: 'Dr. Beta', phone: '555-2222' })}>
        {submitLabel ?? 'Save'}
      </button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

import { useAuthStore } from '@store/auth.store';
import { vetService } from '@services/vetService';
import VetSelector from './VetSelector';

function makeVet(overrides: Partial<Vet> = {}): Vet {
  return {
    id: overrides.id ?? 'v1',
    ownerUserId: 'user1',
    name: overrides.name ?? 'Dr. Jane',
    phone: overrides.phone ?? '555-1000',
    email: overrides.email,
    website: overrides.website,
    clinicName: overrides.clinicName,
    address: overrides.address,
    specialties: overrides.specialties,
    notes: overrides.notes,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'user1',
    isArchived: false,
    archivedAt: undefined,
    archivedBy: undefined,
    _normName: 'drjane',
    _e164Phone: '+15551000',
  };
}

describe('VetSelector', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(useAuthStore).mockImplementation(
      (sel: (s: AuthState) => unknown) =>
        sel({
          user: { uid: 'user1' },
          initializing: false,
          error: null,
          initAuthListener: () => () => {},
          signInWithGoogle: async () => {},
          signOut: async () => {},
          reset: () => {},
        })
    );
    vi.mocked(vetService.searchVets).mockResolvedValue([
      makeVet({ id: 'v1', name: 'Dr. Alpha' }),
    ]);
  });

  it('queries vets and calls onSelect when an existing vet is chosen', async () => {
    const onSelect = vi.fn();
    render(<VetSelector label="Link vet" onSelect={onSelect} />);

    const input = await screen.findByLabelText(
      /link vet|link veterinarian|link/i
    );
    const user = userEvent.setup();
    await user.type(input, 'Al');

    // Option from search should appear
    const opt = await screen.findByRole('option', { name: /dr\. alpha/i });
    await user.click(opt);

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'v1', name: 'Dr. Alpha' })
    );
  });

  it('shows Create dialog when "Create new vet…" is chosen and forwards submit to service then onSelect', async () => {
    const onSelect = vi.fn();
    render(<VetSelector onSelect={onSelect} />);

    const user = userEvent.setup();
    const input = await screen.findByLabelText(
      /link veterinarian|link vet|link/i
    );

    await user.click(input);
    // The appended create option is always present
    const createOpt = await screen.findByRole('option', {
      name: /create new vet/i,
    });
    await user.click(createOpt);

    // Stub createVet to resolve a vet
    vi.mocked(vetService.createVet).mockResolvedValueOnce(
      makeVet({ id: 'v2', name: 'Dr. Beta' })
    );

    // The VetForm is mocked; wait for dialog and click the submit button which calls onSubmit
    const dialog = await screen.findByRole('dialog');
    const submit = await (await import('@testing-library/react'))
      .within(dialog)
      .findByRole('button', { name: /add|save/i });
    await user.click(submit);

    // createVet and onSelect happen in an async IIFE inside the component; wait for them deterministically
    await waitFor(() => expect(vetService.createVet).toHaveBeenCalled());
    await waitFor(() =>
      expect(onSelect).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'v2', name: 'Dr. Beta' })
      )
    );
  });
});

it('triggers search on input (loading branch executes) and completes when resolved', async () => {
  const onSelect = vi.fn();
  // Create a deferred promise to control resolution
  let resolveFn: (v: Vet[]) => void = () => {};
  const deferred: Promise<Vet[]> = new Promise<Vet[]>(
    (res) => (resolveFn = res)
  );
  vi.mocked(vetService.searchVets).mockReturnValueOnce(deferred);

  render(<VetSelector onSelect={onSelect} />);
  const user = userEvent.setup();
  const input = await screen.findByLabelText(
    /link veterinarian|link vet|link/i
  );
  await user.type(input, 'Dr');

  // Ensure search was kicked off while promise is pending (loading=true branch rendered)
  await waitFor(() => expect(vetService.searchVets).toHaveBeenCalled());

  // Resolve and ensure code path completes without errors
  resolveFn([]);
  await waitFor(() => expect(vetService.searchVets).toHaveBeenCalledTimes(1));
});

it('keeps dialog open and does not call onSelect when createVet rejects', async () => {
  const onSelect = vi.fn();
  render(<VetSelector onSelect={onSelect} />);
  const user = userEvent.setup();

  const input = await screen.findByLabelText(
    /link veterinarian|link vet|link/i
  );
  await user.click(input);
  const createOpt = await screen.findByRole('option', {
    name: /create new vet/i,
  });
  await user.click(createOpt);

  // Reject createVet
  vi.mocked(vetService.createVet).mockRejectedValueOnce(new Error('duplicate'));

  const dialog = await screen.findByRole('dialog');
  const submit = await within(dialog).findByRole('button', {
    name: /add|save/i,
  });
  await user.click(submit);

  await waitFor(() => expect(vetService.createVet).toHaveBeenCalled());
  // onSelect should not be called, dialog should remain
  await waitFor(() => expect(onSelect).not.toHaveBeenCalled());
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});

it('closes the dialog when the external Cancel button is clicked', async () => {
  const onSelect = vi.fn();
  render(<VetSelector onSelect={onSelect} />);
  const user = userEvent.setup();

  const input = await screen.findByLabelText(
    /link veterinarian|link vet|link/i
  );
  await user.click(input);
  const createOpt = await screen.findByRole('option', {
    name: /create new vet/i,
  });
  await user.click(createOpt);

  const dialog = await screen.findByRole('dialog');
  const cancel = await within(dialog).findByRole('button', {
    name: /cancel|cancelar/i,
  });
  await user.click(cancel);

  await waitForElementToBeRemoved(() => screen.queryByRole('dialog'));
});

it('does nothing when not authenticated: no search and create submit is a no-op', async () => {
  vi.resetAllMocks();
  // Auth without user
  vi.mocked(useAuthStore).mockImplementation((sel: (s: AuthState) => unknown) =>
    sel({
      user: null,
      initializing: false,
      error: null,
      initAuthListener: () => () => {},
      signInWithGoogle: async () => {},
      signOut: async () => {},
      reset: () => {},
    })
  );
  const onSelect = vi.fn();
  render(<VetSelector onSelect={onSelect} />);
  const user = userEvent.setup();

  // Typing should not trigger searchVets
  const input = await screen.findByLabelText(
    /link veterinarian|link vet|link/i
  );
  await user.type(input, 'Hi');
  expect(vetService.searchVets).not.toHaveBeenCalled();

  // Open create option and attempt submit
  await user.click(input);
  const createOpt = await screen.findByRole('option', {
    name: /create new vet/i,
  });
  await user.click(createOpt);

  const dialog = await screen.findByRole('dialog');
  const submit = await within(dialog).findByRole('button', {
    name: /add|save/i,
  });
  await user.click(submit);

  // createVet should not be called due to early return; dialog remains open
  expect(vetService.createVet).not.toHaveBeenCalled();
  expect(onSelect).not.toHaveBeenCalled();
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});
