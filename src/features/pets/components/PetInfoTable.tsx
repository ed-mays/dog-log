import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { Pet } from '@features/pets/types';

interface PetInfoTableProps {
  pet: Pet;
}

export function PetInfoTable({ pet }: PetInfoTableProps) {
  const { t } = useTranslation(['common', 'petProperties']);

  return (
    <Table sx={{ maxWidth: 600, margin: '0 auto' }}>
      <TableHead>
        <TableRow>
          <TableCell>
            {t('property', { ns: 'common', defaultValue: 'Property' })}
          </TableCell>
          <TableCell>
            {t('value', { ns: 'common', defaultValue: 'Value' })}
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow>
          <TableCell>{t('name', { ns: 'petProperties' })}</TableCell>
          <TableCell>{pet.name}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>{t('breed', { ns: 'petProperties' })}</TableCell>
          <TableCell>{pet.breed}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
