import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, TextField, Typography } from '@mui/material';
import formStyles from '@styles/FormStyles.module.css';
import type { Vet, VetAddress } from '@models/vets';

export type VetFormValues = {
  name: string;
  phone: string;
  email?: string;
  website?: string;
  clinicName?: string;
  address?: VetAddress;
  specialties?: string[];
  notes?: string;
};

type VetFormProps = {
  title?: string;
  initialValues: VetFormValues;
  onSubmit: (values: VetFormValues) => void | Promise<void>;
  onCancel: () => void;
  errorMessage?: string | null;
  submitLabel?: string;
};

export default function VetForm({
  title,
  initialValues,
  onSubmit,
  onCancel,
  errorMessage,
  submitLabel,
}: VetFormProps) {
  const { t } = useTranslation('veterinarians');

  const [values, setValues] = useState<VetFormValues>({ ...initialValues });
  useEffect(() => setValues({ ...initialValues }), [initialValues]);

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const errors = useMemo(() => {
    const e: Record<string, string | undefined> = {};
    if (!values.name?.trim()) e.name = t('validation.name.required');
    if (!values.phone?.trim()) e.phone = t('validation.phone.required');
    return e;
  }, [values.name, values.phone, t]);

  const isValid = Object.keys(errors).length === 0;

  function setField(name: string, value: unknown) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  function setAddressField(
    name: keyof NonNullable<Vet['address']>,
    value: string
  ) {
    setValues((prev) => ({
      ...prev,
      address: { ...(prev.address ?? {}), [name]: value },
    }));
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ name: true, phone: true });
    if (!isValid) return;
    await onSubmit({
      ...values,
      specialties: normalizeSpecialties(values.specialties),
    });
  }

  return (
    <form className={formStyles.formRoot} onSubmit={handleSubmit} noValidate>
      {title && (
        <Typography variant="h5" sx={{ mb: 2 }}>
          {title}
        </Typography>
      )}

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        }}
      >
        <Box>
          <TextField
            id="vet-name"
            name="name"
            label={t('fields.name')}
            value={values.name}
            onChange={(e) => setField('name', e.target.value)}
            onBlur={handleBlur}
            required
            error={!!(touched.name && errors.name)}
            helperText={touched.name && errors.name}
            fullWidth
            size="small"
          />
        </Box>
        <Box>
          <TextField
            id="vet-phone"
            name="phone"
            label={t('fields.phone')}
            value={values.phone}
            onChange={(e) => setField('phone', e.target.value)}
            onBlur={handleBlur}
            required
            error={!!(touched.phone && errors.phone)}
            helperText={touched.phone && errors.phone}
            fullWidth
            size="small"
          />
        </Box>
        <Box>
          <TextField
            id="vet-email"
            name="email"
            type="email"
            label={t('fields.email')}
            value={values.email ?? ''}
            onChange={(e) => setField('email', e.target.value)}
            fullWidth
            size="small"
          />
        </Box>
        <Box>
          <TextField
            id="vet-website"
            name="website"
            type="url"
            label={t('fields.website')}
            value={values.website ?? ''}
            onChange={(e) => setField('website', e.target.value)}
            fullWidth
            size="small"
          />
        </Box>
        <Box sx={{ gridColumn: '1 / -1' }}>
          <TextField
            id="vet-clinic"
            name="clinicName"
            label={t('fields.clinicName')}
            value={values.clinicName ?? ''}
            onChange={(e) => setField('clinicName', e.target.value)}
            fullWidth
            size="small"
          />
        </Box>
        <Box>
          <TextField
            id="vet-address-line1"
            name="address.line1"
            label={t('fields.address.line1')}
            value={values.address?.line1 ?? ''}
            onChange={(e) => setAddressField('line1', e.target.value)}
            fullWidth
            size="small"
          />
        </Box>
        <Box>
          <TextField
            id="vet-address-line2"
            name="address.line2"
            label={t('fields.address.line2')}
            value={values.address?.line2 ?? ''}
            onChange={(e) => setAddressField('line2', e.target.value)}
            fullWidth
            size="small"
          />
        </Box>

        {/* City/Region/Postal nested grid to achieve thirds on sm+ */}
        <Box sx={{ gridColumn: '1 / -1' }}>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
            }}
          >
            <Box>
              <TextField
                id="vet-address-city"
                name="address.city"
                label={t('fields.address.city')}
                value={values.address?.city ?? ''}
                onChange={(e) => setAddressField('city', e.target.value)}
                fullWidth
                size="small"
              />
            </Box>
            <Box>
              <TextField
                id="vet-address-region"
                name="address.region"
                label={t('fields.address.region')}
                value={values.address?.region ?? ''}
                onChange={(e) => setAddressField('region', e.target.value)}
                fullWidth
                size="small"
              />
            </Box>
            <Box>
              <TextField
                id="vet-address-postal"
                name="address.postalCode"
                label={t('fields.address.postalCode')}
                value={values.address?.postalCode ?? ''}
                onChange={(e) => setAddressField('postalCode', e.target.value)}
                fullWidth
                size="small"
              />
            </Box>
          </Box>
        </Box>

        <Box sx={{ gridColumn: '1 / -1' }}>
          <TextField
            id="vet-address-country"
            name="address.country"
            label={t('fields.address.country')}
            value={values.address?.country ?? ''}
            onChange={(e) => setAddressField('country', e.target.value)}
            fullWidth
            size="small"
          />
        </Box>
        <Box sx={{ gridColumn: '1 / -1' }}>
          <TextField
            id="vet-specialties"
            name="specialties"
            label={t('fields.specialties')}
            placeholder={t('placeholders.specialties')}
            value={(values.specialties ?? []).join(', ')}
            onChange={(e) =>
              setField(
                'specialties',
                e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
              )
            }
            fullWidth
            size="small"
          />
        </Box>
        <Box sx={{ gridColumn: '1 / -1' }}>
          <TextField
            id="vet-notes"
            name="notes"
            label={t('fields.notes')}
            value={values.notes ?? ''}
            onChange={(e) => setField('notes', e.target.value)}
            fullWidth
            size="small"
            multiline
            minRows={3}
          />
        </Box>
      </Box>

      <Box className={formStyles.formActions} sx={{ mt: 2 }}>
        <Button
          className={formStyles.formButton}
          type="button"
          onClick={onCancel}
        >
          {t('responses.cancel', { ns: 'common' })}
        </Button>
        <Button
          className={`${formStyles.formButton} ${formStyles.formButtonPrimary}`}
          type="submit"
          variant="contained"
          color="primary"
          disabled={!isValid}
        >
          {submitLabel ??
            t('responses.save', { ns: 'common', defaultValue: 'Save' })}
        </Button>
      </Box>
    </form>
  );
}

function normalizeSpecialties(
  value?: string[] | undefined
): string[] | undefined {
  if (!value) return value;
  const list = value.map((s) => s.trim()).filter(Boolean);
  return list.length ? list : undefined;
}
