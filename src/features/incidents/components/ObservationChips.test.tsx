import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ObservationChips } from './ObservationChips';
import type { Incident } from '@features/incidents/types';
import { useIncidentStore, type IncidentState } from '@store/useIncidentStore';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@store/useIncidentStore');

function makeIncident(overrides: Partial<Incident> = {}): Incident {
  const now = new Date('2026-05-02T10:00:00.000Z');
  return {
    id: 'inc-1',
    userId: 'user-1',
    createdBy: 'user-1',
    petId: 'pet-1',
    startedAt: now,
    endedAt: null,
    type: null,
    severity: null,
    chips: [],
    journal: [],
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('ObservationChips (AC-3, AC-21, BR-7, BR-32)', () => {
  const mockToggleChip = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useIncidentStore).mockReturnValue({
      toggleChip: mockToggleChip,
    } as unknown as IncidentState);
  });

  describe('AC-3 — toggle without type (BR-7, BR-4)', () => {
    it('Given no type and a toggled-on chip, the chip is visible in the carry-over group', () => {
      render(
        <ObservationChips
          incident={makeIncident({ type: null, chips: ['rigid'] })}
        />
      );

      expect(
        screen.getByRole('button', { name: 'incidents.chips.rigid' })
      ).toBeInTheDocument();
    });

    it('Given no type, When caregiver taps a carry-over chip, Then toggleChip fires with that chipId', async () => {
      const user = userEvent.setup();
      render(
        <ObservationChips
          incident={makeIncident({ type: null, chips: ['rigid'] })}
        />
      );

      await user.click(
        screen.getByRole('button', { name: 'incidents.chips.rigid' })
      );

      expect(mockToggleChip).toHaveBeenCalledWith('rigid');
    });

    it('Given no type and no chips, Then no chip buttons render (empty container, no error)', () => {
      render(
        <ObservationChips incident={makeIncident({ type: null, chips: [] })} />
      );
      expect(screen.queryAllByRole('button')).toHaveLength(0);
    });
  });

  describe('AC-21 — carry-over chips visible after type change (BR-19, BR-32)', () => {
    it('Given type=injury with chips including seizure-specific "rigid", Then injury catalog renders and "rigid" appears in carry-over', () => {
      // 'vocalizing' is in both seizure + injury catalogs → curated
      // 'rigid' is seizure-specific, not in injury catalog → carry-over
      render(
        <ObservationChips
          incident={makeIncident({
            type: 'injury',
            chips: ['vocalizing', 'rigid'],
          })}
        />
      );

      // injury curated chip present
      expect(
        screen.getByRole('button', { name: 'incidents.chips.bleeding' })
      ).toBeInTheDocument();

      // carry-over chip from seizure catalog remains visible
      expect(
        screen.getByRole('button', { name: 'incidents.chips.rigid' })
      ).toBeInTheDocument();
    });

    it('Given type=injury, When caregiver taps carry-over chip "rigid", Then toggleChip called with "rigid"', async () => {
      const user = userEvent.setup();
      render(
        <ObservationChips
          incident={makeIncident({
            type: 'injury',
            chips: ['vocalizing', 'rigid'],
          })}
        />
      );

      await user.click(
        screen.getByRole('button', { name: 'incidents.chips.rigid' })
      );

      expect(mockToggleChip).toHaveBeenCalledWith('rigid');
    });

    it('Carry-over chip has aria-pressed=true (it is toggled on by definition, BR-32)', () => {
      render(
        <ObservationChips
          incident={makeIncident({ type: 'injury', chips: ['rigid'] })}
        />
      );

      expect(
        screen.getByRole('button', { name: 'incidents.chips.rigid' })
      ).toHaveAttribute('aria-pressed', 'true');
    });

    it('Seizure chip not toggled on and not in injury catalog is absent from render', () => {
      render(
        <ObservationChips
          incident={makeIncident({ type: 'injury', chips: [] })}
        />
      );

      expect(
        screen.queryByRole('button', { name: 'incidents.chips.rigid' })
      ).not.toBeInTheDocument();
    });
  });

  describe('curated chips — aria-pressed and toggle (NFR-6, BR-7)', () => {
    it('aria-pressed reflects toggle state on curated chips', () => {
      render(
        <ObservationChips
          incident={makeIncident({ type: 'seizure', chips: ['rigid'] })}
        />
      );

      expect(
        screen.getByRole('button', { name: 'incidents.chips.rigid' })
      ).toHaveAttribute('aria-pressed', 'true');
      expect(
        screen.getByRole('button', { name: 'incidents.chips.salivating' })
      ).toHaveAttribute('aria-pressed', 'false');
    });

    it('Tapping an untoggled curated chip calls toggleChip with its id', async () => {
      const user = userEvent.setup();
      render(
        <ObservationChips
          incident={makeIncident({ type: 'seizure', chips: [] })}
        />
      );

      await user.click(
        screen.getByRole('button', { name: 'incidents.chips.rigid' })
      );

      expect(mockToggleChip).toHaveBeenCalledWith('rigid');
    });

    it('All injury catalog chips render when type=injury', () => {
      render(
        <ObservationChips
          incident={makeIncident({ type: 'injury', chips: [] })}
        />
      );

      for (const chipId of [
        'bleeding',
        'limping',
        'swelling',
        'vocalizing',
        'exposed_wound',
        'foreign_object',
      ]) {
        expect(
          screen.getByRole('button', { name: `incidents.chips.${chipId}` })
        ).toBeInTheDocument();
      }
    });
  });
});
