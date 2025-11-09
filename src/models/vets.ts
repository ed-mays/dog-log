// src/models/vets.ts
// Plain object types for Veterinarians feature

export type VetId = string;
export type PetVetLinkId = string;

export type VetAddress = {
  line1?: string;
  line2?: string;
  city?: string;
  region?: string; // state/province
  postalCode?: string;
  country?: string; // ISO code if available
};

export type Vet = {
  id: VetId;
  ownerUserId: string; // user scope
  name: string; // required
  phone: string; // required
  email?: string;
  website?: string;
  clinicName?: string;
  address?: VetAddress;
  specialties?: string[];
  notes?: string;
  createdAt: Date; // align with BaseEntity convention
  updatedAt: Date; // align with BaseEntity convention
  createdBy: string;
  isArchived?: boolean; // soft delete flag consistent with ArchivableEntity
  archivedAt?: Date;
  archivedBy?: string;

  // normalized fields (internal/search/uniqueness)
  _normName: string; // lowercased/trimmed
  _e164Phone: string; // best-effort normalized phone
};

export type PetVetRole = 'primary' | 'specialist' | 'emergency' | 'other';

export type PetVetLink = {
  id: PetVetLinkId;
  petId: string;
  vetId: VetId;
  role: PetVetRole; // primary enforcement handled by service
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  // Optional hint to restore when demoted from primary
  previousNonPrimaryRole?: Exclude<PetVetRole, 'primary'>;
};
