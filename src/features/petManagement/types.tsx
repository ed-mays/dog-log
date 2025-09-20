// Unified types for petManagement feature
// Keep id optional to support creation forms while allowing persisted pets to have ids
export interface Pet {
  id?: string;
  name: string;
  breed: string;
}
