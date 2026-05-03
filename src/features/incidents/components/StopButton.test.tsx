import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StopButton } from './StopButton';
import { useIncidentStore, type IncidentState } from '@store/useIncidentStore';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@store/useIncidentStore');

describe('StopButton', () => {
  const mockStopIncident = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useIncidentStore).mockReturnValue({
      stopIncident: mockStopIncident,
    } as unknown as IncidentState);
  });

  it('tap fires the stopIncident store action (BR-12, BR-13)', async () => {
    const user = userEvent.setup();
    render(<StopButton />);

    await user.click(screen.getByRole('button', { name: 'incidents.stop' }));

    expect(mockStopIncident).toHaveBeenCalledTimes(1);
  });

  it('aria-label matches the i18n value (BR-12)', () => {
    render(<StopButton />);

    expect(
      screen.getByRole('button', { name: 'incidents.stop' })
    ).toHaveAttribute('aria-label', 'incidents.stop');
  });
});
