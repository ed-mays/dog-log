import type { BaseEntity } from '@repositories/types';

export interface Feeding extends BaseEntity {
  date: Date;
  foodType: string;
  notes?: string;
}

export interface FeedingCreateInput {
  date: Date;
  foodType: string;
  notes?: string;
}

export interface FeedingUpdateInput {
  date?: Date;
  foodType?: string;
  notes?: string;
}
