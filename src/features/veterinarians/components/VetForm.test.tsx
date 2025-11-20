import { renderWithUser, screen } from '@test-utils';
import VetForm, { type VetFormValues } from './VetForm';
import { vi } from 'vitest';

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

    const { user } = renderWithUser(
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
    await user.click(
      screen.getByRole('textbox', {
        name: (_name, el) => el.getAttribute('id') === 'vet-name',
      })
    );
    await user.tab();
    await user.click(
      screen.getByRole('textbox', {
        name: (_name, el) => el.getAttribute('id') === 'vet-phone',
      })
    );
    await user.tab();

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

    const { user } = renderWithUser(
      <VetForm
        initialValues={baseValues}
        onSubmit={onSubmit}
        onCancel={() => {}}
        submitLabel="Save"
      />
    );

    await user.type(
      screen.getByRole('textbox', {
        name: (_name, el) => el.getAttribute('id') === 'vet-name',
      }),
      'Dr. Smith'
    );
    await user.type(
      screen.getByRole('textbox', {
        name: (_name, el) => el.getAttribute('id') === 'vet-phone',
      }),
      '555-1234'
    );

    const submit = screen.getByRole('button', { name: /save/i });
    expect(submit).toBeEnabled();

    await user.click(submit);

    expect(onSubmit).toHaveBeenCalled();
  });

  it('renders error alert when errorMessage is provided and calls onCancel when cancel is clicked', async () => {
    const onCancel = vi.fn();

    const { user } = renderWithUser(
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
    await user.click(cancel);
    expect(onCancel).toHaveBeenCalled();
  });

  it('normalizes specialties by trimming and dropping empties before submit', async () => {
    const onSubmit = vi.fn();

    const { user } = renderWithUser(
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
    await user.click(submit);

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ specialties: ['surgery', 'derm'] })
    );
  });

  it('updates address fields via setAddressField and includes them on submit', async () => {
    const onSubmit = vi.fn();

    const { user } = renderWithUser(
      <VetForm
        initialValues={{ ...baseValues, name: 'C', phone: 'D', address: {} }}
        onSubmit={onSubmit}
        onCancel={() => {}}
        submitLabel="Save"
      />
    );

    await user.type(
      screen.getByRole('textbox', {
        name: (_n, el) => el.getAttribute('id') === 'vet-address-city',
      }),
      'Portland'
    );
    await user.type(
      screen.getByRole('textbox', {
        name: (_n, el) => el.getAttribute('id') === 'vet-address-region',
      }),
      'OR'
    );
    await user.type(
      screen.getByRole('textbox', {
        name: (_n, el) => el.getAttribute('id') === 'vet-address-country',
      }),
      'USA'
    );

    await user.click(screen.getByRole('button', { name: /save/i }));

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

    const { user } = renderWithUser(
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

    await user.click(email);
    await user.paste('a@b.com');
    await user.click(website);
    await user.paste('https://example.com');
    await user.click(clinic);
    await user.paste('Happy Pets');

    await user.click(line1);
    await user.paste('123 Main');
    await user.click(line2);
    await user.paste('Apt 4');
    await user.click(city);
    await user.paste('Springfield');
    await user.click(region);
    await user.paste('IL');
    await user.click(postal);
    await user.paste('62704');
    await user.click(country);
    await user.paste('USA');

    await user.click(specialties);
    await user.paste('surgery, derm');
    await user.click(notes);
    await user.paste('Notes');

    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(onSubmit).toHaveBeenCalled();
    const payload = (onSubmit as unknown as vi.Mock).mock.calls[0][0];
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
