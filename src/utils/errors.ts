export function toErrorMessage(err: unknown): string {
  if (err == null) return '';
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message ?? '';
  try {
    // Attempt to stringify objects for debugging-friendly detail; keep short
    const str = JSON.stringify(err);
    return typeof str === 'string' && str !== '{}' ? str : '';
  } catch {
    return '';
  }
}
