import { Injectable } from '@nestjs/common';
import type { AddressInput } from '@bazaar/contracts';
import { PrismaService } from '../../../platform/database/prisma.service';
import type { Tx } from '../../../platform/database/unit-of-work';
import {
  IdentityReader,
  IdentityWriter,
  type AddressRecord,
  type IdentityUser,
  type SessionRecord,
} from '../application/identity.ports';

function toUser(row: {
  id: string;
  email: string;
  name: string;
  role: 'CUSTOMER' | 'ADMIN';
  emailVerifiedAt: Date | null;
  passwordHash: string;
  verificationHash: string | null;
}): IdentityUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    emailVerified: row.emailVerifiedAt != null,
    passwordHash: row.passwordHash,
    verificationHash: row.verificationHash,
  };
}

@Injectable()
export class PrismaIdentity extends IdentityReader implements IdentityWriter {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<IdentityUser | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? toUser(row) : null;
  }

  async findByEmail(email: string): Promise<IdentityUser | null> {
    const row = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    return row ? toUser(row) : null;
  }

  async findByVerificationHash(hash: string): Promise<IdentityUser | null> {
    const row = await this.prisma.user.findFirst({ where: { verificationHash: hash } });
    return row ? toUser(row) : null;
  }

  async create(
    input: {
      name: string;
      email: string;
      passwordHash: string;
      verificationHash: string;
    },
    tx?: Tx,
  ): Promise<IdentityUser> {
    const db = tx ?? this.prisma;
    const row = await db.user.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash: input.passwordHash,
        verificationHash: input.verificationHash,
      },
    });
    return toUser(row);
  }

  async markVerified(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date(), verificationHash: null },
    });
  }

  async replaceVerificationHash(userId: string, verificationHash: string): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { verificationHash } });
  }

  async createSession(input: { userId: string; familyId: string; tokenHash: string; expiresAt: Date }): Promise<SessionRecord> {
    return this.prisma.session.create({ data: input });
  }

  async findSessionByHash(tokenHash: string): Promise<SessionRecord | null> {
    return this.prisma.session.findUnique({ where: { tokenHash } });
  }

  async revokeSession(id: string, replacedBy?: string): Promise<void> {
    await this.prisma.session.update({
      where: { id },
      data: { revokedAt: new Date(), replacedBy: replacedBy ?? null },
    });
  }

  async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async listAddresses(userId: string): Promise<AddressRecord[]> {
    const rows = await this.prisma.address.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    return rows.map(toAddress);
  }

  async createAddress(userId: string, input: AddressInput): Promise<AddressRecord> {
    const count = await this.prisma.address.count({ where: { userId } });
    const row = await this.prisma.address.create({
      data: { ...input, userId, isDefault: count === 0 },
    });
    return toAddress(row);
  }

  async deleteAddress(userId: string, addressId: string): Promise<boolean> {
    const result = await this.prisma.address.deleteMany({ where: { id: addressId, userId } });
    return result.count > 0;
  }

  async findAddress(userId: string, addressId: string): Promise<AddressRecord | null> {
    const row = await this.prisma.address.findFirst({ where: { id: addressId, userId } });
    return row ? toAddress(row) : null;
  }
}

function toAddress(row: {
  id: string;
  name: string;
  mobile: string;
  houseNo: string;
  street: string;
  landmark: string;
  pincode: string;
  city: string;
  state: string;
  isDefault: boolean;
}): AddressRecord {
  return {
    id: row.id,
    name: row.name,
    mobile: row.mobile,
    houseNo: row.houseNo,
    street: row.street,
    landmark: row.landmark,
    pincode: row.pincode,
    city: row.city,
    state: row.state,
    isDefault: row.isDefault,
  };
}
