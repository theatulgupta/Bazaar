import type { RoleName } from './permissions';

export type AuthenticatedRecord = {
  id: string;
  email: string;
  name: string;
  role: RoleName;
  emailVerified: boolean;
};

export abstract class UserLookup {
  abstract findById(id: string): Promise<AuthenticatedRecord | null>;
}
