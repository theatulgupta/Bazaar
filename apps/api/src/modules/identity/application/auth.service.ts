import { createHash, randomBytes, randomUUID } from 'crypto';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import type { LoginInput, RegisterInput, UserProfile } from '@bazaar/contracts';
import { AuditService } from '../../../platform/audit/audit.service';
import type { Env } from '../../../platform/config/env';
import { loadEnv } from '../../../platform/config/env';
import { OutboxService } from '../../../platform/outbox/outbox.service';
import { UnitOfWork } from '../../../platform/database/unit-of-work';
import { conflict, invalid, unauthorized } from '../../../shared/domain-error';
import { IdentityReader, IdentityWriter } from './identity.ports';

export type IssuedTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  user: UserProfile;
};

@Injectable()
export class AuthService implements OnModuleInit {
  private dummyHash = '';
  private readonly env: Env;

  constructor(
    private readonly reader: IdentityReader,
    private readonly writer: IdentityWriter,
    private readonly jwt: JwtService,
    private readonly outbox: OutboxService,
    private readonly unitOfWork: UnitOfWork,
    private readonly audit: AuditService,
  ) {
    this.env = loadEnv();
  }

  async onModuleInit(): Promise<void> {
    this.dummyHash = await argon2.hash('not-a-real-password');
  }

  async register(input: RegisterInput): Promise<{ user: UserProfile }> {
    const existing = await this.reader.findByEmail(input.email);
    if (existing) throw conflict('Email already registered');
    const passwordHash = await argon2.hash(input.password);
    const token = randomBytes(32).toString('hex');
    const verificationHash = sha256(token);
    const user = await this.unitOfWork.run(async (tx) => {
      const created = await this.writer.create(
        {
          name: input.name,
          email: input.email,
          passwordHash,
          verificationHash,
        },
        tx,
      );
      await this.outbox.append(tx, 'identity.user_registered', {
        userId: created.id,
        email: created.email,
        name: created.name,
        token,
      });
      return created;
    });
    return { user: toProfile(user) };
  }

  async login(input: LoginInput): Promise<IssuedTokens> {
    const user = await this.reader.findByEmail(input.email);
    const hash = user?.passwordHash ?? this.dummyHash;
    const matches = await argon2.verify(hash, input.password);
    if (!user || !matches) throw unauthorized('Invalid credentials');
    const tokens = await this.issue(user.id, user.email, randomUUID());
    await this.audit.record({
      actorId: user.id,
      action: 'identity.login',
      entityType: 'user',
      entityId: user.id,
    });
    return { ...tokens, user: toProfile(user) };
  }

  async refresh(refreshToken: string | undefined): Promise<IssuedTokens> {
    if (!refreshToken) throw unauthorized('Sign in to continue');
    const session = await this.writer.findSessionByHash(sha256(refreshToken));
    if (!session) throw unauthorized('Sign in to continue');
    if (session.revokedAt || session.expiresAt.getTime() < Date.now()) {
      await this.writer.revokeFamily(session.familyId);
      throw unauthorized('Session expired. Sign in again');
    }
    const user = await this.reader.findById(session.userId);
    if (!user) throw unauthorized('Sign in to continue');
    const tokens = await this.issue(user.id, user.email, session.familyId);
    await this.writer.revokeSession(session.id, undefined);
    return { ...tokens, user: toProfile(user) };
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;
    const session = await this.writer.findSessionByHash(sha256(refreshToken));
    if (session) await this.writer.revokeFamily(session.familyId);
  }

  async verifyEmail(token: string): Promise<void> {
    const user = await this.reader.findByVerificationHash(sha256(token));
    if (!user) throw invalid('Verification link is invalid or already used');
    await this.writer.markVerified(user.id);
  }

  async resendVerification(userId: string): Promise<void> {
    const user = await this.reader.findById(userId);
    if (!user) throw unauthorized('Sign in to continue');
    if (user.emailVerified) return;
    const token = randomBytes(32).toString('hex');
    await this.writer.replaceVerificationHash(userId, sha256(token));
    await this.unitOfWork.run(async (tx) => {
      await this.outbox.append(tx, 'identity.user_registered', {
        userId: user.id,
        email: user.email,
        name: user.name,
        token,
      });
    });
  }

  async profile(userId: string): Promise<UserProfile> {
    const user = await this.reader.findById(userId);
    if (!user) throw unauthorized('Sign in to continue');
    return toProfile(user);
  }

  private async issue(userId: string, _email: string, familyId: string): Promise<Omit<IssuedTokens, 'user'>> {
    const refreshToken = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + this.env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
    await this.writer.createSession({
      userId,
      familyId,
      tokenHash: sha256(refreshToken),
      expiresAt,
    });
    const accessToken = await this.jwt.signAsync({ sub: userId });
    return { accessToken, refreshToken, expiresIn: this.env.JWT_ACCESS_TTL };
  }
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function toProfile(user: { id: string; name: string; email: string; role: 'CUSTOMER' | 'ADMIN'; emailVerified: boolean }): UserProfile {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
  };
}
