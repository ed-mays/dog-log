import { useEffect, useState } from 'react';

// Per design §D8: render the timer with requestAnimationFrame, throttling
// state updates to ~250ms (visible second resolution per BR-3, but smoother
// to the eye). startedAt is the source of truth; elapsed is computed.
const TICK_THROTTLE_MS = 250;

function formatElapsed(elapsedMs: number): string {
  const safe = Math.max(0, elapsedMs);
  const totalSeconds = Math.floor(safe / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function useIncidentTimer(startedAt: Date): string {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let rafId = 0;
    let lastTick = Date.now();
    const tick = () => {
      const current = Date.now();
      if (current - lastTick >= TICK_THROTTLE_MS) {
        lastTick = current;
        setNow(current);
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return formatElapsed(now - startedAt.getTime());
}
