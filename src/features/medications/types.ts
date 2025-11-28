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
  defaultStrengthDescription?: string;
  notes?: string;
  isArchived: boolean;
}

export interface ScheduleConfig {
  timesOfDay?: string[]; // HH:mm in local time
  intervalHours?: number;
  intervalDays?: number;
  weekdays?: number[]; // 0–6, for weekly
  startDate: string; // ISO date (local)
  endDate?: string; // ISO date (for temporary meds)
  notes?: string;
}

export interface PetMedication extends BaseEntity {
  petId: string;
  medicationDefinitionId: string;
  customLabel?: string;
  form: MedicationForm;
  route: MedicationRoute;
  strengthDescription?: string;
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
  timestampScheduled?: string; // ISO datetime
  amountGiven: number;
  doseUnit: DoseUnit;
  status: DoseStatus;
  givenBy?: string;
  notes?: string;
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
