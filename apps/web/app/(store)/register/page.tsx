'use client';

import { registerSchema } from '@bazaar/contracts';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { browserApi } from '@/lib/api';
import { signIn } from '@/lib/session';
import { zodIssue } from '@/lib/validate';

export default function RegisterPage() {
  const router = useRouter();
  const form = useForm({
    defaultValues: { name: '', email: '', password: '' },
    validators: { onSubmit: registerSchema },
    onSubmit: async ({ value }) => {
      await browserApi('/api/v1/auth/register', { method: 'POST', body: JSON.stringify(value) });
      await signIn(value.email, value.password);
      router.push('/account');
    },
  });

  return (
    <form
      className="mx-auto max-w-md space-y-3 rounded-lg bg-white p-6"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <h1 className="text-2xl font-semibold">Create account</h1>
      <form.Field name="name" validators={{ onChange: zodIssue(registerSchema.shape.name) }}>
        {(field) => (
          <input
            required
            placeholder="Name"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
            className="w-full rounded-lg border border-line px-3 py-3"
          />
        )}
      </form.Field>
      <form.Field name="email" validators={{ onChange: zodIssue(registerSchema.shape.email) }}>
        {(field) => (
          <input
            type="email"
            placeholder="Email"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
            className="w-full rounded-lg border border-line px-3 py-3"
          />
        )}
      </form.Field>
      <form.Field name="password" validators={{ onChange: zodIssue(registerSchema.shape.password) }}>
        {(field) => (
          <input
            type="password"
            minLength={8}
            placeholder="Password"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
            className="w-full rounded-lg border border-line px-3 py-3"
          />
        )}
      </form.Field>
      <form.Subscribe selector={(state) => state.errorMap.onSubmit}>
        {(error) => (error ? <p className="text-danger">{error instanceof Error ? error.message : 'Could not create the account'}</p> : null)}
      </form.Subscribe>
      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <button disabled={isSubmitting} className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-onPrimary">
            {isSubmitting ? 'Creating...' : 'Create account'}
          </button>
        )}
      </form.Subscribe>
    </form>
  );
}
