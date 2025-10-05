import type { BaseEntity } from '@repositories/types.tsx';

export interface User extends BaseEntity {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}
