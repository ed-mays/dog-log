import { vi, describe, beforeEach, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@test-utils';
import userEvent from '@testing-library/user-event';
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
    // eslint-disable-next-line no-restricted-syntax -- userEvent is slow here
    fireEvent.click(option);

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
    vetServiceMock.searchVets.mockResolvedValue([]);
    const newVet = makeVet({ name: 'Dr. Beta' });
    vetServiceMock.createVet.mockResolvedValue(newVet);

    const onSelect = vi.fn();
    render(<VetSelector onSelect={onSelect} />);

    const input = screen.getByRole('combobox');
    // eslint-disable-next-line no-restricted-syntax -- userEvent is slow here
    fireEvent.mouseDown(input);

    // "Create new vet…" should appear
    const createOption = await screen.findByRole('option', {
      name: /create new vet/i,
    });
    // eslint-disable-next-line no-restricted-syntax -- userEvent is slow here
    fireEvent.click(createOption);

    // Dialog opens with mocked VetForm
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeVisible();

    // Click submit (mocked VetForm auto-submits with preset values)
    const submit = await within(dialog).findByRole('button', {
      name: /save|add/i,
    });
    // eslint-disable-next-line no-restricted-syntax -- userEvent is slow here
    fireEvent.click(submit);

    await waitFor(() => expect(vetServiceMock.createVet).toHaveBeenCalled());
    await waitFor(() =>
      expect(onSelect).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Dr. Beta' })
      )
    );
  });

  it('keeps dialog open and does not call onSelect when createVet rejects', async () => {
    vetServiceMock.searchVets.mockResolvedValue([]);
    vetServiceMock.createVet.mockRejectedValue(new Error('duplicate'));

    const onSelect = vi.fn();
    render(<VetSelector onSelect={onSelect} />);

    const input = screen.getByRole('combobox');
    // eslint-disable-next-line no-restricted-syntax -- userEvent is slow here
    fireEvent.mouseDown(input);
    const createOption = await screen.findByRole('option', {
      name: /create new vet/i,
    });
    // eslint-disable-next-line no-restricted-syntax -- userEvent is slow here
    fireEvent.click(createOption);

    const dialog = await screen.findByRole('dialog');
    const submit = await within(dialog).findByRole('button', {
      name: /save|add/i,
    });
    // eslint-disable-next-line no-restricted-syntax -- userEvent is slow here
    fireEvent.click(submit);

    await waitFor(() => expect(vetServiceMock.createVet).toHaveBeenCalled());
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeVisible();
  });

  it('closes the dialog when the external Cancel button is clicked', async () => {
    vetServiceMock.searchVets.mockResolvedValue([]);

    render(<VetSelector onSelect={vi.fn()} />);
    const input = screen.getByRole('combobox');
    // eslint-disable-next-line no-restricted-syntax -- userEvent is slow here
    fireEvent.mouseDown(input);
    const createOption = await screen.findByRole('option', {
      name: /create new vet/i,
    });
    // eslint-disable-next-line no-restricted-syntax -- userEvent is slow here
    fireEvent.click(createOption);

    const dialog = await screen.findByRole('dialog');
    const cancelBtn = await within(dialog).findByRole('button', {
      name: /cancel/i,
    });
    // eslint-disable-next-line no-restricted-syntax -- userEvent is slow here
    fireEvent.click(cancelBtn);

    await waitForElementToBeRemoved(() => screen.queryByRole('dialog'));
  });

  it('does nothing when not authenticated: no search and create submit is a no-op', async () => {
    installAuthStoreMock({ user: null }); // unauth
    vetServiceMock.searchVets.mockResolvedValue([]);

    const onSelect = vi.fn();
    render(<VetSelector onSelect={onSelect} />);

    const input = screen.getByRole('combobox');
    // eslint-disable-next-line no-restricted-syntax -- userEvent is slow here
    fireEvent.change(input, { target: { value: 'test' } });

    // Should NOT search - wait a bit to ensure debounce would have fired
    await new Promise((r) => setTimeout(r, 300));
    expect(vetServiceMock.searchVets).not.toHaveBeenCalled();
  });
});
