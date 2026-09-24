import { Injectable } from '@nestjs/common';
import type { AddressInput } from '@bazaar/contracts';
import { notFound } from '../../../shared/domain-error';
import { IdentityWriter, type AddressRecord } from './identity.ports';

@Injectable()
export class AddressService {
  constructor(private readonly identities: IdentityWriter) {}

  list(userId: string): Promise<AddressRecord[]> {
    return this.identities.listAddresses(userId);
  }

  create(userId: string, input: AddressInput): Promise<AddressRecord> {
    return this.identities.createAddress(userId, input);
  }

  async remove(userId: string, addressId: string): Promise<void> {
    const removed = await this.identities.deleteAddress(userId, addressId);
    if (!removed) throw notFound('Address not found');
  }
}
