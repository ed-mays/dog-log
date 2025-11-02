import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// We'll re-import the module after changing NODE_ENV so the singleton picks up the env
const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

function getLoggerFresh() {
  vi.resetModules();
  // dynamic import after reset so module-level singletons init under current env
  return import('./logService').then((m) => m.logger);
}

describe('logger (logService)', () => {
  let infoSpy: vi.SpyInstance;
  let errorSpy: vi.SpyInstance;

  beforeEach(() => {
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    infoSpy.mockRestore();
    errorSpy.mockRestore();
    process.env.NODE_ENV = ORIGINAL_NODE_ENV;
  });

  it('logs info and error in non-production environments', async () => {
    process.env.NODE_ENV = 'test';
    const logger = await getLoggerFresh();

    logger.info('hello', { a: 1 });
    logger.error('boom', { b: 2 });

    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledTimes(1);

    const [infoFirstArg, infoSecondArg, infoThirdArg] = infoSpy.mock.calls[0];
    expect(typeof infoFirstArg).toBe('string');
    expect((infoFirstArg as string).startsWith('[INFO] ')).toBe(true);
    expect(infoSecondArg).toBe('hello');
    expect(infoThirdArg).toEqual({ a: 1 });

    const [errFirstArg, errSecondArg, errThirdArg] = errorSpy.mock.calls[0];
    expect(typeof errFirstArg).toBe('string');
    expect((errFirstArg as string).startsWith('[ERROR] ')).toBe(true);
    expect(errSecondArg).toBe('boom');
    expect(errThirdArg).toEqual({ b: 2 });
  });

  it('does not log in production', async () => {
    process.env.NODE_ENV = 'production';
    const logger = await getLoggerFresh();

    logger.info('hello');
    logger.error('boom');

    expect(infoSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('handles optional context parameter by logging empty string when undefined', async () => {
    process.env.NODE_ENV = 'test';
    const logger = await getLoggerFresh();

    logger.info('hello');
    logger.error('boom');

    expect(infoSpy).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();

    const infoCall = infoSpy.mock.calls[0];
    const errorCall = errorSpy.mock.calls[0];
    expect(infoCall[2]).toBe('');
    expect(errorCall[2]).toBe('');
  });
});
