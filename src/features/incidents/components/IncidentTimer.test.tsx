import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IncidentTimer } from './IncidentTimer';

describe('IncidentTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the elapsed time as HH:MM:SS', () => {
    const now = new Date('2026-05-02T10:01:05.000Z');
    vi.setSystemTime(now);
    const startedAt = new Date(now.getTime() - 65_000);

    render(<IncidentTimer startedAt={startedAt} />);

    expect(screen.getByText('00:01:05')).toBeInTheDocument();
  });

  it('exposes the elapsed text via aria-live="polite" (NFR-6 §D9)', () => {
    const now = new Date('2026-05-02T10:00:00.000Z');
    vi.setSystemTime(now);

    render(<IncidentTimer startedAt={now} />);

    const live = screen.getByText('00:00:00');
    expect(live).toHaveAttribute('aria-live', 'polite');
  });

  it('uses monospace font-family per design §D9 (so digits do not jitter)', () => {
    const now = new Date('2026-05-02T10:00:00.000Z');
    vi.setSystemTime(now);

    render(<IncidentTimer startedAt={now} />);

    const live = screen.getByText('00:00:00');
    const fontFamily = window.getComputedStyle(live).fontFamily;
    expect(fontFamily.toLowerCase()).toContain('monospace');
  });
});
