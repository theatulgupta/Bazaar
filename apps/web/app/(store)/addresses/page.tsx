'use client';

import { addressInputSchema, type Address, type AddressInput } from '@bazaar/contracts';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError, browserApi } from '@/lib/api';
import { useAddressesQuery, useMe } from '@/lib/queries';
import { zodIssue } from '@/lib/validate';

const empty: AddressInput = {
  name: '',
  mobile: '',
  houseNo: '',
  street: '',
  landmark: '',
  pincode: '',
  city: '',
  state: '',
};

const labels: Record<keyof AddressInput, string> = {
  name: 'Full name',
  mobile: 'Mobile',
  houseNo: 'House / flat',
  street: 'Street',
  landmark: 'Landmark',
  pincode: 'Pincode',
  city: 'City',
  state: 'State',
};

export default function AddressesPage() {
  const me = useMe();
  const addresses = useAddressesQuery(Boolean(me.data));
  const queryClient = useQueryClient();
  const create = useMutation({
    mutationFn: (input: AddressInput) => browserApi<Address>('/api/v1/addresses', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }),
  });
  const form = useForm({
    defaultValues: empty,
    validators: { onSubmit: addressInputSchema },
    onSubmit: async ({ value }) => {
      await create.mutateAsync(value);
      form.reset();
    },
  });

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section>
        <h1 className="text-2xl font-semibold">Addresses</h1>
        {me.isError ? <p className="mt-3 text-muted">Sign in to manage addresses.</p> : null}
        <div className="mt-4 space-y-3">
          {addresses.data?.map((address) => (
            <article key={address.id} className="rounded-lg bg-white p-3">
              <p className="font-semibold">{address.name}</p>
              <p className="text-sm text-muted">
                {address.houseNo}, {address.street}, {address.landmark}
              </p>
              <p className="text-sm text-muted">
                {address.city}, {address.state} {address.pincode} · {address.mobile}
              </p>
            </article>
          ))}
        </div>
      </section>
      <form
        className="space-y-3 rounded-lg bg-white p-4"
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <h2 className="text-lg font-semibold">New address</h2>
        {(Object.keys(empty) as Array<keyof AddressInput>).map((fieldName) => (
          <form.Field key={fieldName} name={fieldName} validators={{ onBlur: zodIssue(addressInputSchema.shape[fieldName]) }}>
            {(field) => (
              <input
                placeholder={labels[fieldName]}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                className="w-full rounded-lg border border-line px-3 py-2"
              />
            )}
          </form.Field>
        ))}
        <form.Subscribe selector={(state) => state.errorMap.onSubmit}>
          {(error) => (error ? <p className="text-danger">{error instanceof ApiError ? error.message : 'Could not save the address'}</p> : null)}
        </form.Subscribe>
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <button disabled={isSubmitting} className="rounded-lg bg-primary px-4 py-3 font-semibold text-onPrimary">
              {isSubmitting ? 'Saving...' : 'Save address'}
            </button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
