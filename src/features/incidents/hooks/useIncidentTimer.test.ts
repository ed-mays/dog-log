import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIncidentTimer } from './useIncidentTimer';

describe('useIncidentTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('formats elapsed time in HH:MM:SS for a 65-second-old startedAt', () => {
    const now = new Date('2026-05-02T10:01:05.000Z');
    vi.setSystemTime(now);
    const startedAt = new Date(now.getTime() - 65_000);

    const { result } = renderHook(() => useIncidentTimer(startedAt));

    expect(result.current).toBe('00:01:05');
  });

  it('formats hours-minutes-seconds for an elapsed > 1 hour', () => {
    const now = new Date('2026-05-02T11:23:07.000Z');
    vi.setSystemTime(now);
    const startedAt = new Date(
      now.getTime() - (3600_000 + 23 * 60_000 + 7_000)
    );

    const { result } = renderHook(() => useIncidentTimer(startedAt));

    expect(result.current).toBe('01:23:07');
  });

  it('returns 00:00:00 when startedAt is in the future or equal to now', () => {
    const now = new Date('2026-05-02T10:00:00.000Z');
    vi.setSystemTime(now);

    const { result } = renderHook(() => useIncidentTimer(now));

    expect(result.current).toBe('00:00:00');
  });

  it('re-renders as time advances (rAF + 250ms throttle per §D8)', () => {
    const start = new Date('2026-05-02T10:00:00.000Z');
    vi.setSystemTime(start);

    const { result } = renderHook(() => useIncidentTimer(start));
    expect(result.current).toBe('00:00:00');

    act(() => {
      vi.setSystemTime(new Date(start.getTime() + 1_000));
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe('00:00:01');
  });
});
