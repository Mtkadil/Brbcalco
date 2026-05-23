export interface Chair {
  id: string; // e.g., 'chair1', 'chair2', 'chair3', 'chair4'
  name: string; // e.g., 'Sedia 1', 'Sedia 2', etc.
  total: number;
}

export const CHAIR_NAMES_MAP: { [key: number]: string } = {
  1: 'Amine',
  2: 'Maher',
  3: 'Adil',
  4: 'Kevin'
};

export type ScreenType = 'home-screen' | 'selection-screen' | 'chair-screen' | 'admin-dashboard';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  };
}
