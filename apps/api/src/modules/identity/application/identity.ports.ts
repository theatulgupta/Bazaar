import type { AddressInput } from '@bazaar/contracts';
import type { AuthenticatedRecord } from '../../../platform/auth/user-lookup';
import { UserLookup } from '../../../platform/auth/user-lookup';
import type { Tx } from '../../../platform/database/unit-of-work';

export type IdentityUser = AuthenticatedRecord & {
  passwordHash: string;
  verificationHash: string | null;
};

export type SessionRecord = {
  id: string;
  userId: string;
  familyId: string;
  expiresAt: Date;
  revokedAt: Date | null;
};

export type AddressRecord = AddressInput & { id: string; isDefault: boolean };

export abstract class IdentityReader extends UserLookup {
  abstract findByEmail(email: string): Promise<IdentityUser | null>;
  abstract findByVerificationHash(hash: string): Promise<IdentityUser | null>;
}

export abstract class IdentityWriter {
  abstract create(
    input: {
      name: string;
      email: string;
      passwordHash: string;
      verificationHash: string;
    },
    tx?: Tx,
  ): Promise<IdentityUser>;
  abstract markVerified(userId: string): Promise<void>;
  abstract replaceVerificationHash(userId: string, verificationHash: string): Promise<void>;
  abstract createSession(input: { userId: string; familyId: string; tokenHash: string; expiresAt: Date }): Promise<SessionRecord>;
  abstract findSessionByHash(tokenHash: string): Promise<SessionRecord | null>;
  abstract revokeSession(id: string, replacedBy?: string): Promise<void>;
  abstract revokeFamily(familyId: string): Promise<void>;
  abstract listAddresses(userId: string): Promise<AddressRecord[]>;
  abstract createAddress(userId: string, input: AddressInput): Promise<AddressRecord>;
  abstract deleteAddress(userId: string, addressId: string): Promise<boolean>;
  abstract findAddress(userId: string, addressId: string): Promise<AddressRecord | null>;
}
