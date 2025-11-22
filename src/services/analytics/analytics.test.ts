import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We need to test both branches of track(): MODE==='test' and other

describe('analytics.track', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs?.();
  });

  it('is a no-op in test mode', async () => {
    // Ensure test mode explicitly
    vi.stubEnv('MODE', 'test');
    const mod = await import('./analytics');
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    mod.track('vet_search', { termLength: 1 });
    expect(spy).not.toHaveBeenCalled();
  });

  it('logs to console in non-test mode', async () => {
    vi.stubEnv('MODE', 'development');
    const mod = await import('./analytics');
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    mod.track('vet_created', { hasClinicName: false });
    expect(spy).toHaveBeenCalledWith('[analytics]', 'vet_created', {
      hasClinicName: false,
    });
  });
});

it('logs with default empty props object when props are omitted', async () => {
  vi.stubEnv('MODE', 'development');
  const mod = await import('./analytics');
  const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
  mod.track('vet_updated');
  expect(spy).toHaveBeenCalledWith('[analytics]', 'vet_updated', {});
});
