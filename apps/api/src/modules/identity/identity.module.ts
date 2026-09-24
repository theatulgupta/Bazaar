import { Module } from '@nestjs/common';
import { UserLookup } from '../../platform/auth/user-lookup';
import { AddressService } from './application/address.service';
import { AuthService } from './application/auth.service';
import { IdentityReader, IdentityWriter } from './application/identity.ports';
import { PrismaIdentity } from './infrastructure/identity.prisma';
import { AccountController, AuthController } from './interface/auth.controller';

@Module({
  controllers: [AuthController, AccountController],
  providers: [
    PrismaIdentity,
    { provide: IdentityReader, useExisting: PrismaIdentity },
    { provide: IdentityWriter, useExisting: PrismaIdentity },
    { provide: UserLookup, useExisting: PrismaIdentity },
    AuthService,
    AddressService,
  ],
  exports: [IdentityReader, IdentityWriter, UserLookup, AuthService],
})
export class IdentityModule {}
