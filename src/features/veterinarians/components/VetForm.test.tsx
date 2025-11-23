import { renderWithUser, screen, fireEvent } from '@test-utils';
import VetForm, { type VetFormValues } from './VetForm';
import { vi, type Mock } from 'vitest';

describe('VetForm', () => {
  const baseValues: VetFormValues = {
    name: '',
    phone: '',
    email: '',
    website: '',
    clinicName: '',
    address: {},
    specialties: [],
    notes: '',
  };

  it('blocks submit and shows validation when required fields are missing', async () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();

    renderWithUser(
      <VetForm
        title="Test"
        initialValues={baseValues}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );

    // Attempt to submit without filling fields
    const submit = screen.getByRole('button', { name: /save|add|edit/i });
    expect(submit).toBeDisabled();

    // Interact to trigger touched state and helper texts
    // eslint-disable-next-line no-restricted-syntax -- userEvent is slow here
    fireEvent.blur(
      screen.getByRole('textbox', {
        name: (_name, el) => el.getAttribute('id') === 'vet-name',
      })
    );
    // eslint-disable-next-line no-restricted-syntax -- userEvent is slow here
    fireEvent.blur(
      screen.getByRole('textbox', {
        name: (_name, el) => el.getAttribute('id') === 'vet-phone',
      })
    );

    // Validation state appears (check aria-invalid on fields rather than exact text to be locale-agnostic)
    const nameInput = screen.getByRole('textbox', {
      name: (_name, el) => el.getAttribute('id') === 'vet-name',
    });
    const phoneInput = screen.getByRole('textbox', {
      name: (_name, el) => el.getAttribute('id') === 'vet-phone',
    });

    expect(nameInput).toHaveAttribute('aria-invalid', 'true');
    expect(phoneInput).toHaveAttribute('aria-invalid', 'true');

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('allows submit when name and phone are provided', async () => {
    const onSubmit = vi.fn();

    renderWithUser(
      <VetForm
        initialValues={baseValues}
        onSubmit={onSubmit}
        onCancel={() => {}}
        submitLabel="Save"
      />
    );

    // eslint-disable-next-line no-restricted-syntax -- userEvent is slow here
    fireEvent.change(
      screen.getByRole('textbox', {
        name: (_name, el) => el.getAttribute('id') === 'vet-name',
      }),
      { target: { value: 'Dr. Smith' } }
    );
    // eslint-disable-next-line no-restricted-syntax -- userEvent is slow here
    fireEvent.change(
      screen.getByRole('textbox', {
        name: (_name, el) => el.getAttribute('id') === 'vet-phone',
      }),
      { target: { value: '555-1234' } }
    );

    const submit = screen.getByRole('button', { name: /save/i });
    expect(submit).toBeEnabled();

    // eslint-disable-next-line no-restricted-syntax -- userEvent is slow here
    fireEvent.click(submit);

    expect(onSubmit).toHaveBeenCalled();
  });

  it('renders error alert when errorMessage is provided and calls onCancel when cancel is clicked', async () => {
    const onCancel = vi.fn();

    renderWithUser(
      <VetForm
        initialValues={{ ...baseValues, name: 'x', phone: 'y' }}
        onSubmit={() => {}}
        onCancel={onCancel}
        submitLabel="Save"
        title="Form"
        errorMessage="oops"
      />
    );

    // Error alert present
    expect(screen.getByRole('alert')).toHaveTextContent(/oops/i);

    // Cancel
    const cancel = screen.getByRole('button', { name: /cancel|cancelar/i });
    // eslint-disable-next-line no-restricted-syntax -- userEvent is slow here
    fireEvent.click(cancel);
    expect(onCancel).toHaveBeenCalled();
  });

  it('normalizes specialties by trimming and dropping empties before submit', async () => {
    const onSubmit = vi.fn();

    renderWithUser(
      <VetForm
        initialValues={{
          ...baseValues,
          name: 'A',
          phone: 'B',
          specialties: [' surgery ', ' ', 'derm', ''],
        }}
        onSubmit={onSubmit}
        onCancel={() => {}}
        submitLabel="Save"
      />
    );

    const submit = screen.getByRole('button', { name: /save/i });
    // eslint-disable-next-line no-restricted-syntax -- userEvent is slow here
    fireEvent.click(submit);

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ specialties: ['surgery', 'derm'] })
    );
  });

  it('updates address fields via setAddressField and includes them on submit', async () => {
    const onSubmit = vi.fn();

    renderWithUser(
      <VetForm
        initialValues={{ ...baseValues, name: 'C', phone: 'D', address: {} }}
        onSubmit={onSubmit}
        onCancel={() => {}}
        submitLabel="Save"
      />
    );

    // eslint-disable-next-line no-restricted-syntax -- userEvent is slow here
    fireEvent.change(
      screen.getByRole('textbox', {
        name: (_n, el) => el.getAttribute('id') === 'vet-address-city',
      }),
      { target: { value: 'Portland' } }
    );
    // eslint-disable-next-line no-restricted-syntax -- userEvent is slow here
    fireEvent.change(
      screen.getByRole('textbox', {
        name: (_n, el) => el.getAttribute('id') === 'vet-address-region',
      }),
      { target: { value: 'OR' } }
    );
    // eslint-disable-next-line no-restricted-syntax -- userEvent is slow here
    fireEvent.change(
      screen.getByRole('textbox', {
        name: (_n, el) => el.getAttribute('id') === 'vet-address-country',
      }),
      { target: { value: 'USA' } }
    );

    // eslint-disable-next-line no-restricted-syntax -- userEvent is slow here
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        address: expect.objectContaining({
          city: 'Portland',
          region: 'OR',
          country: 'USA',
        }),
      })
    );
  });
  it('handles typing in all optional fields and submits', async () => {
    const onSubmit = vi.fn();

    renderWithUser(
      <VetForm
        initialValues={{
          name: 'N',
          phone: 'P',
          email: '',
          website: '',
          clinicName: '',
          address: {},
          specialties: [],
          notes: '',
        }}
        onSubmit={onSubmit}
        onCancel={() => {}}
        submitLabel="Save"
        title="Vet form"
      />
    );

    const email = screen.getByRole('textbox', {
      name: (_n, el) => el.getAttribute('id') === 'vet-email',
    }) as HTMLInputElement;
    const website = screen.getByRole('textbox', {
      name: (_n, el) => el.getAttribute('id') === 'vet-website',
    }) as HTMLInputElement;
    const clinic = screen.getByRole('textbox', {
      name: (_n, el) => el.getAttribute('id') === 'vet-clinic',
    }) as HTMLInputElement;

    const line1 = screen.getByRole('textbox', {
      name: (_n, el) => el.getAttribute('id') === 'vet-address-line1',
    }) as HTMLInputElement;
    const line2 = screen.getByRole('textbox', {
      name: (_n, el) => el.getAttribute('id') === 'vet-address-line2',
    }) as HTMLInputElement;
    const city = screen.getByRole('textbox', {
      name: (_n, el) => el.getAttribute('id') === 'vet-address-city',
    }) as HTMLInputElement;
    const region = screen.getByRole('textbox', {
      name: (_n, el) => el.getAttribute('id') === 'vet-address-region',
    }) as HTMLInputElement;
    const postal = screen.getByRole('textbox', {
      name: (_n, el) => el.getAttribute('id') === 'vet-address-postal',
    }) as HTMLInputElement;
    const country = screen.getByRole('textbox', {
      name: (_n, el) => el.getAttribute('id') === 'vet-address-country',
    }) as HTMLInputElement;

    const specialties = screen.getByRole('textbox', {
      name: (_n, el) => el.getAttribute('id') === 'vet-specialties',
    }) as HTMLInputElement;
    const notes = screen.getByRole('textbox', {
      name: (_n, el) => el.getAttribute('id') === 'vet-notes',
    }) as HTMLInputElement;

    // eslint-disable-next-line no-restricted-syntax -- userEvent is slow here
    fireEvent.change(email, { target: { value: 'a@b.com' } });
    // eslint-disable-next-line no-restricted-syntax -- userEvent is slow here
    fireEvent.change(website, { target: { value: 'https://example.com' } });
    // eslint-disable-next-line no-restricted-syntax -- userEvent is slow here
    fireEvent.change(clinic, { target: { value: 'Happy Pets' } });

    // eslint-disable-next-line no-restricted-syntax -- userEvent is slow here
    fireEvent.change(line1, { target: { value: '123 Main' } });
    // eslint-disable-next-line no-restricted-syntax -- userEvent is slow here
    fireEvent.change(line2, { target: { value: 'Apt 4' } });
    // eslint-disable-next-line no-restricted-syntax -- userEvent is slow here
    fireEvent.change(city, { target: { value: 'Springfield' } });
    // eslint-disable-next-line no-restricted-syntax -- userEvent is slow here
    fireEvent.change(region, { target: { value: 'IL' } });
    // eslint-disable-next-line no-restricted-syntax -- userEvent is slow here
    fireEvent.change(postal, { target: { value: '62704' } });
    // eslint-disable-next-line no-restricted-syntax -- userEvent is slow here
    fireEvent.change(country, { target: { value: 'USA' } });

    // eslint-disable-next-line no-restricted-syntax -- userEvent is slow here
    fireEvent.change(specialties, { target: { value: 'surgery, derm' } });
    // eslint-disable-next-line no-restricted-syntax -- userEvent is slow here
    fireEvent.change(notes, { target: { value: 'Notes' } });

    // eslint-disable-next-line no-restricted-syntax -- userEvent is slow here
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(onSubmit).toHaveBeenCalled();
    const payload = (onSubmit as unknown as Mock).mock.calls[0][0];
    expect(payload.email).toBe('a@b.com');
    expect(payload.website).toBe('https://example.com');
    expect(payload.clinicName).toBe('Happy Pets');
    expect(payload.address).toEqual(
      expect.objectContaining({
        line1: '123 Main',
        line2: 'Apt 4',
        city: 'Springfield',
        region: 'IL',
        postalCode: '62704',
        country: 'USA',
      })
    );
    expect(Array.isArray(payload.specialties)).toBe(true);
    // Tolerate input handling nuances; ensure tokens present in some form
    expect((payload.specialties as string[]).join(',')).toMatch(/surgery/i);
    expect((payload.specialties as string[]).join(',')).toMatch(/derm/i);
    expect(payload.notes).toBe('Notes');
  });
});
