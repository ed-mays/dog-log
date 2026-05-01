import type { BaseEntity } from '@repositories/types';

// Enums
export type MedicationForm =
  | 'pill'
  | 'liquid'
  | 'chew'
  | 'injection'
  | 'topical'
  | 'other';

export type MedicationRoute =
  | 'oral'
  | 'topical'
  | 'subcutaneous'
  | 'intramuscular'
  | 'other';

export type DoseUnit =
  | 'tablet'
  | 'mL'
  | 'drop'
  | 'capsule'
  | 'scoop'
  | 'spray'
  | 'other';

export type ScheduleType =
  | 'onceDaily'
  | 'twiceDaily'
  | 'everyXHours'
  | 'everyXDays'
  | 'weekly'
  | 'monthly'
  | 'custom';

export type DoseStatus =
  | 'given'
  | 'skipped'
  | 'missed'
  | 'vomited'
  | 'otherIssue';

// Interfaces
export interface MedicationDefinition extends BaseEntity {
  name: string;
  defaultForm: MedicationForm;
  defaultRoute: MedicationRoute;
  defaultStrengthDescription?: string | null;
  notes?: string | null;
  isArchived: boolean;
}

interface ScheduleConfig {
  timesOfDay?: string[] | null; // HH:mm in local time
  intervalHours?: number | null;
  intervalDays?: number | null;
  weekdays?: number[] | null; // 0–6, for weekly
  startDate: string; // ISO date (local)
  endDate?: string | null; // ISO date (for temporary meds)
  notes?: string | null;
}

export interface PetMedication extends BaseEntity {
  petId: string;
  medicationDefinitionId: string;
  customLabel?: string | null;
  form: MedicationForm;
  route: MedicationRoute;
  strengthDescription?: string | null;
  doseAmount: number;
  doseUnit: DoseUnit;
  scheduleType: ScheduleType;
  scheduleConfig: ScheduleConfig;
  active: boolean;
}

export interface DoseLog extends BaseEntity {
  petId: string;
  petMedicationId: string;
  timestampGiven: string; // ISO datetime (local)
  timestampScheduled?: string | null; // ISO datetime
  amountGiven: number;
  doseUnit: DoseUnit;
  status: DoseStatus;
  givenBy?: string | null;
  notes?: string | null;
}

// Input Types for Repositories
export type MedicationDefinitionCreateInput = Omit<
  MedicationDefinition,
  'id' | 'createdAt' | 'updatedAt'
>;
export type MedicationDefinitionUpdateInput =
  Partial<MedicationDefinitionCreateInput>;

export type PetMedicationCreateInput = Omit<
  PetMedication,
  'id' | 'createdAt' | 'updatedAt'
>;
export type PetMedicationUpdateInput = Partial<PetMedicationCreateInput>;

export type DoseLogCreateInput = Omit<
  DoseLog,
  'id' | 'createdAt' | 'updatedAt'
>;
export type DoseLogUpdateInput = Partial<DoseLogCreateInput>;
