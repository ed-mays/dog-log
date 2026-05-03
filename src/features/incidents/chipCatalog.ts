// Static chip catalog per incident type (resolves OQ-3, DQ-5). §D5
// other has no curated chips in v1; journal is the only structured data for that type.
import type { ChipId, IncidentTypeId } from './types';

export const chipCatalog: Record<IncidentTypeId, readonly ChipId[]> = {
  seizure: [
    'rigid',
    'salivating',
    'unconscious',
    'vocalizing',
    'paddling',
    'incontinence',
    'blind',
    'thirsty',
  ],
  injury: [
    'bleeding',
    'limping',
    'swelling',
    'vocalizing',
    'exposed_wound',
    'foreign_object',
  ],
  vomiting: ['food', 'bile', 'blood', 'foam', 'undigested', 'repeated'],
  choking: [
    'coughing',
    'gagging',
    'blue_gums',
    'panicking',
    'object_visible',
    'collapsed',
  ],
  allergic_reaction: [
    'facial_swelling',
    'hives',
    'itching',
    'vomiting',
    'breathing_difficulty',
    'lethargy',
  ],
  collapse: [
    'unresponsive',
    'brief_loss',
    'weak_pulse',
    'pale_gums',
    'recovered_quickly',
  ],
  ingestion: [
    'known_substance',
    'unknown_substance',
    'vomited_already',
    'lethargic',
    'drooling',
  ],
  other: [],
};
