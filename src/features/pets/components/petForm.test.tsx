import { beforeEach, describe } from 'vitest';
import { useState } from 'react';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PetForm } from './PetForm';
import type { Pet } from '../types';

import { render, withLocale } from '@test-utils';

describe('PetForm', () => {
  const initialPet: Pet = { name: '', breed: '' };

  // Use vi.fn() for all mocks (Vitest)
  let onSubmit: ReturnType<typeof vi.fn>;
  let onCancel: ReturnType<typeof vi.fn>;
  let onDirtyChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onSubmit = vi.fn();
    onCancel = vi.fn();
    onDirtyChange = vi.fn();
  });

  function renderForm(vals: Pet = initialPet) {
    render(
      <PetForm
        initialValues={vals}
        onSubmit={onSubmit}
        onCancel={onCancel}
        onDirtyChange={onDirtyChange}
      />
    );
  }

  const fillPetForm = async (
    name: string = 'Fido',
    breed: string = 'Beagle'
  ) => {
    await userEvent.type(await screen.findByLabelText(/name/i), name);
    await userEvent.type(await screen.findByLabelText(/breed/i), breed);
    return { name: name, breed: breed };
  };

  describe('i18n and basic rendering', () => {
    const localeCases = [
      [
        'en',
        {
          labels: [/name/i, /breed/i],
          buttons: ['OK', 'Cancel'],
        },
      ],
      [
        'es',
        {
          labels: [/nombre/i, /raza/i],
          buttons: ['Aceptar', 'Cancelar'],
        },
      ],
    ];

    it.each(localeCases)(
      'renders correctly in `%s` locale',
      async (locale, { labels, buttons }) => {
        await withLocale(locale, async () => {
          renderForm(initialPet);
          for (const label of labels) {
            expect(await screen.findByLabelText(label)).toBeInTheDocument();
            const input = await screen.findByLabelText(label);
            expect(input).toBeRequired();
          }
          for (const button of buttons) {
            expect(
              await screen.findByRole('button', { name: button })
            ).toBeInTheDocument();
          }
        });
      }
    );
  });

  describe('validation', () => {
    it('disables OK when form is invalid', async () => {
      renderForm();
      const okButton = await screen.findByRole('button', { name: /ok/i });
      expect(okButton).toBeDisabled();
    });

    it('enables OK when inputs are filled', async () => {
      renderForm();
      await fillPetForm();
      const okButton = screen.getByRole('button', { name: /ok/i });
      expect(okButton).toBeEnabled();
    });
  });

  describe('keyboard interaction', () => {
    describe('when using keyboard', () => {
      it('submits with Enter key from an input when valid', async () => {
        renderForm();
        const expectedPet = await fillPetForm();

        // Press Enter while focused in input should submit the form
        await userEvent.keyboard('{Enter}');
        expect(onSubmit).toHaveBeenCalledWith(expectedPet);
      });

      it.each(['{Enter}', ' '])(
        'cancels when activating focused cancel button with `%s` key',
        async (key) => {
          renderForm();
          const cancelButton = await screen.findByRole('button', {
            name: /cancel/i,
          });
          // Focus and activate via keyboard
          act(() => cancelButton.focus());
          await userEvent.keyboard(key);
          expect(onCancel).toHaveBeenCalledTimes(1);
        }
      );

      it('cancels when cancel button is clicked', async () => {
        renderForm();
        const cancelButton = await screen.findByRole('button', {
          name: /cancel/i,
        });
        await userEvent.click(cancelButton);
        expect(onCancel).toHaveBeenCalledTimes(1);
      });
    });

    it('calls onSubmit with pet data when clicking OK', async () => {
      renderForm();
      const expectedPet = await fillPetForm();
      const okButton = await screen.findByRole('button', { name: /ok/i });
      await userEvent.click(okButton);
      expect(onSubmit).toHaveBeenCalledWith(expectedPet);
    });
  });

  describe('when in controlled mode', () => {
    const ControlledHost = () => {
      const [val, setVal] = useState<Pet>();
      return (
        <PetForm
          initialValues={initialPet}
          value={val}
          onChange={setVal}
          onSubmit={onSubmit}
          onCancel={onCancel}
          onDirtyChange={onDirtyChange}
        />
      );
    };

    const changeNameField = async (newName: string) => {
      const nameInput = await screen.findByLabelText(/name/i);
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, newName);
    };

    it('calls onSubmit when submitted', async () => {
      render(<ControlledHost />);
      const expectedPet = await fillPetForm();
      const okButton = await screen.findByRole('button', { name: /ok/i });
      await userEvent.click(okButton);
      expect(onSubmit).toHaveBeenCalledWith(expectedPet);
    });

    it('calls onCancel when cancelled', async () => {
      render(<ControlledHost />);
      await fillPetForm();
      const cancelButton = await screen.findByRole('button', {
        name: /cancel/i,
      });
      await userEvent.click(cancelButton);
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('calls onDirtyChanged when values change', async () => {
      render(<ControlledHost />);
      await fillPetForm();
      expect(onDirtyChange).toHaveBeenLastCalledWith(true);
    });

    it('calls onDirtyChange(true) when form is modified', async () => {
      renderForm(initialPet);
      await changeNameField('Alice');
      expect(onDirtyChange).toHaveBeenLastCalledWith(true);
    });

    it('calls onDirtyChange(false) when reverted', async () => {
      renderForm({ name: 'A', breed: 'B' });
      await changeNameField('Alice');
      await changeNameField('A');
      expect(onDirtyChange).toHaveBeenLastCalledWith(false);
    });
  });
});
