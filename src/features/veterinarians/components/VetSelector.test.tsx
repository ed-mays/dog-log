import { vi, describe, beforeEach, it, expect } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@test-utils';
import {
  within,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import type { VetFormValues } from './VetForm';
import {
  installAuthStoreMock,
  resetInstalledStoreMocks,
} from '@testUtils/mocks/mockStoreInstallers';
import { installVetServiceMock } from '@testUtils/mocks/mockVetService';
import { makeVet } from '@testUtils/factories/makeVet';

vi.mock('@store/auth.store', () => ({
  useAuthStore: vi.fn(),
}));
vi.mock('@services/vetService');
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

import VetSelector from './VetSelector';

describe('VetSelector', () => {
  const vetServiceMock = installVetServiceMock();

  beforeEach(() => {
    vi.resetAllMocks();
    resetInstalledStoreMocks();
    installAuthStoreMock({
      user: {
        uid: 'user1',
        email: 't@t.com',
        displayName: 'T',
        photoURL: null,
      },
    });
  });

  it('queries vets and calls onSelect when an existing vet is chosen', async () => {
    const user = userEvent.setup();
    const v1 = makeVet({ name: 'Dr. Alpha', _normName: 'alpha' });
    vetServiceMock.searchVets.mockImplementation(async (_uid, query) => {
      if (query === 'alp') return [v1];
      return [];
    });

    const onSelect = vi.fn();
    render(<VetSelector onSelect={onSelect} />);

    const input = screen.getByRole('combobox');
    await user.type(input, 'alp');

    // Wait for debounce and search
    const option = await screen.findByText('Dr. Alpha');
    await user.click(option);

    expect(vetServiceMock.searchVets).toHaveBeenCalledWith('user1', 'alp');
    expect(onSelect).toHaveBeenCalledWith(v1);
  });

  it('triggers search on input (loading branch executes) and completes when resolved', async () => {
    const user = userEvent.setup();
    vetServiceMock.searchVets.mockResolvedValue([]);

    render(<VetSelector onSelect={vi.fn()} />);
    const input = screen.getByRole('combobox');
    await user.type(input, 'test');

    // Wait for service to be called
    await waitFor(() => expect(vetServiceMock.searchVets).toHaveBeenCalled());
  });

  it('shows Create dialog when "Create new vet…" is chosen and forwards submit to service then onSelect', async () => {
    const user = userEvent.setup();
    vetServiceMock.searchVets.mockResolvedValue([]);
    const newVet = makeVet({ name: 'Dr. Beta' });
    vetServiceMock.createVet.mockResolvedValue(newVet);

    const onSelect = vi.fn();
    render(<VetSelector onSelect={onSelect} />);

    const input = screen.getByRole('combobox');
    await user.click(input);

    // "Create new vet…" should appear
    const createOption = await screen.findByRole('option', {
      name: /create new vet/i,
    });
    await user.click(createOption);

    // Dialog opens with mocked VetForm
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeVisible();

    // Click submit (mocked VetForm auto-submits with preset values)
    const submit = await within(dialog).findByRole('button', {
      name: /save|add/i,
    });
    await user.click(submit);

    await waitFor(() => expect(vetServiceMock.createVet).toHaveBeenCalled());
    await waitFor(() =>
      expect(onSelect).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Dr. Beta' })
      )
    );
  });

  it('keeps dialog open and does not call onSelect when createVet rejects', async () => {
    const user = userEvent.setup();
    vetServiceMock.searchVets.mockResolvedValue([]);
    vetServiceMock.createVet.mockRejectedValue(new Error('duplicate'));

    const onSelect = vi.fn();
    render(<VetSelector onSelect={onSelect} />);

    const input = screen.getByRole('combobox');
    await user.click(input);
    const createOption = await screen.findByRole('option', {
      name: /create new vet/i,
    });
    await user.click(createOption);

    const dialog = await screen.findByRole('dialog');
    const submit = await within(dialog).findByRole('button', {
      name: /save|add/i,
    });
    await user.click(submit);

    await waitFor(() => expect(vetServiceMock.createVet).toHaveBeenCalled());
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeVisible();
  });

  it('closes the dialog when the external Cancel button is clicked', async () => {
    const user = userEvent.setup();
    vetServiceMock.searchVets.mockResolvedValue([]);

    render(<VetSelector onSelect={vi.fn()} />);
    const input = screen.getByRole('combobox');
    await user.click(input);
    const createOption = await screen.findByRole('option', {
      name: /create new vet/i,
    });
    await user.click(createOption);

    const dialog = await screen.findByRole('dialog');
    const cancelBtn = await within(dialog).findByRole('button', {
      name: /cancel/i,
    });
    await user.click(cancelBtn);

    await waitForElementToBeRemoved(() => screen.queryByRole('dialog'));
  });

  it('does nothing when not authenticated: no search and create submit is a no-op', async () => {
    installAuthStoreMock({ user: null }); // unauth
    const user = userEvent.setup();
    vetServiceMock.searchVets.mockResolvedValue([]);

    const onSelect = vi.fn();
    render(<VetSelector onSelect={onSelect} />);

    const input = screen.getByRole('combobox');
    await user.type(input, 'test');

    // Should NOT search - wait a bit to ensure debounce would have fired
    await new Promise((r) => setTimeout(r, 300));
    expect(vetServiceMock.searchVets).not.toHaveBeenCalled();
  });
});
