// src/utils/phone.ts
// Best-effort phone normalization without heavy deps
// - Trim whitespace
// - Keep leading '+' if present
// - Remove non-digits (except leading '+')
// Returns: normalized string usable for equality/uniqueness
export function normalizePhone(input: string): string {
  if (!input) return '';
  const trimmed = String(input).trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D+/g, '');
  if (hasPlus) return `+${digits}`;
  // Best-effort E.164: assume default country US if 10 digits
  if (digits.length === 10) return `+1${digits}`;
  // Otherwise return digits as-is (could be already with country code omitted)
  return digits;
}

export function normalizeName(input: string): string {
  return (input ?? '').trim().toLowerCase();
}
