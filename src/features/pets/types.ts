export interface Pet {
  id: string;
  name: string;
  breed: string;
  birthDate: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isArchived: boolean;
  archivedAt?: Date;
  archivedBy?: string;
}

export interface PetCreateInput {
  name: string;
  breed: string;
  birthDate: Date;
}

export interface PetUpdateInput {
  name?: string;
  breed?: string;
  birthDate?: Date;
  isArchived?: boolean;
}

export interface PetQueryOptions {
  limit?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  isArchived?: boolean;
}
