import { addressInputSchema, type Address, type AddressInput } from '@bazaar/contracts';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field, TopBar } from '../src/components/ui';
import { api, ApiError } from '../src/lib/api';
import { useAddressesQuery } from '../src/lib/queries';
import { zodIssue } from '../src/lib/validate';
import { useSessionValue } from '../src/store/session';

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

export default function AddressesScreen() {
  const token = useSessionValue()?.accessToken;
  const queryClient = useQueryClient();
  const addresses = useAddressesQuery();
  const create = useMutation({
    mutationFn: (input: AddressInput) => api<Address>('/api/v1/addresses', { method: 'POST', token, body: JSON.stringify(input) }),
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
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <TopBar title="Addresses" />
      <ScrollView contentContainerClassName="gap-3 p-4">
        {addresses.data?.map((address) => (
          <View key={address.id} className="rounded-lg bg-surface p-4">
            <Text className="font-sans font-semibold text-ink">{address.name}</Text>
            <Text className="font-sans text-muted">
              {address.houseNo}, {address.street}, {address.landmark}
            </Text>
            <Text className="font-sans text-muted">
              {address.city}, {address.state} {address.pincode}
            </Text>
            <Text className="font-sans text-muted">{address.mobile}</Text>
          </View>
        ))}
        <Text className="mt-2 font-display text-2xl text-ink">New address</Text>
        {(Object.keys(empty) as Array<keyof AddressInput>).map((fieldName) => (
          <form.Field key={fieldName} name={fieldName} validators={{ onBlur: zodIssue(addressInputSchema.shape[fieldName]) }}>
            {(field) => (
              <Field
                label={labels[fieldName]}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChangeText={field.handleChange}
                error={field.state.meta.errors[0]?.toString()}
              />
            )}
          </form.Field>
        ))}
        <form.Subscribe selector={(state) => state.errorMap.onSubmit}>
          {(error) => (error ? <Text className="text-danger">{error instanceof ApiError ? error.message : 'Could not save the address'}</Text> : null)}
        </form.Subscribe>
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button label={isSubmitting ? 'Saving...' : 'Save address'} disabled={isSubmitting} onPress={() => void form.handleSubmit()} />
          )}
        </form.Subscribe>
      </ScrollView>
    </SafeAreaView>
  );
}
