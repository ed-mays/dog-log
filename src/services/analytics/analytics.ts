// src/services/analytics/analytics.ts
// Minimal, no-op analytics tracker for anonymized events.
// In production, wire to a real analytics provider.

export type AnalyticsEvent =
  | 'vet_created'
  | 'vet_updated'
  | 'vet_archived'
  | 'vet_link_created'
  | 'vet_link_deleted'
  | 'vet_primary_set'
  | 'vet_search';

export type AnalyticsProps = Record<string, unknown>;

export function isTestMode(): boolean {
  return import.meta.env.MODE === 'test';
}

export function track(event: AnalyticsEvent, props?: AnalyticsProps): void {
  // no-op in tests/dev unless wired
  if (isTestMode()) return;
  console.debug('[analytics]', event, props ?? {});
}
