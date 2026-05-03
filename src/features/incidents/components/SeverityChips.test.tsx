import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SeverityChips } from './SeverityChips';
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

describe('SeverityChips (AC-2, BR-6)', () => {
  const mockSetSeverity = vi.fn().mockResolvedValue(undefined);
  const mockClearSeverity = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useIncidentStore).mockReturnValue({
      setSeverity: mockSetSeverity,
      clearSeverity: mockClearSeverity,
    } as unknown as IncidentState);
  });

  it('AC-2: Given active incident with no severity, When caregiver taps mild, Then setSeverity called with mild', async () => {
    const user = userEvent.setup();
    render(<SeverityChips incident={makeIncident({ severity: null })} />);

    await user.click(
      screen.getByRole('button', { name: 'incidents.severity.mild' })
    );

    expect(mockSetSeverity).toHaveBeenCalledWith('mild');
    expect(mockClearSeverity).not.toHaveBeenCalled();
  });

  it('AC-2: Given active incident with mild selected, When caregiver taps mild again, Then clearSeverity called', async () => {
    const user = userEvent.setup();
    render(<SeverityChips incident={makeIncident({ severity: 'mild' })} />);

    await user.click(
      screen.getByRole('button', { name: 'incidents.severity.mild' })
    );

    expect(mockClearSeverity).toHaveBeenCalledTimes(1);
    expect(mockSetSeverity).not.toHaveBeenCalled();
  });

  it('AC-2: Given active incident with mild selected, When caregiver taps severe, Then setSeverity called with severe', async () => {
    const user = userEvent.setup();
    render(<SeverityChips incident={makeIncident({ severity: 'mild' })} />);

    await user.click(
      screen.getByRole('button', { name: 'incidents.severity.severe' })
    );

    expect(mockSetSeverity).toHaveBeenCalledWith('severe');
    expect(mockClearSeverity).not.toHaveBeenCalled();
  });

  it('aria-pressed reflects selection state (NFR-6)', () => {
    render(<SeverityChips incident={makeIncident({ severity: 'moderate' })} />);

    expect(
      screen.getByRole('button', { name: 'incidents.severity.mild' })
    ).toHaveAttribute('aria-pressed', 'false');
    expect(
      screen.getByRole('button', { name: 'incidents.severity.moderate' })
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: 'incidents.severity.severe' })
    ).toHaveAttribute('aria-pressed', 'false');
  });
});
