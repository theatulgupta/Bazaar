'use client';

import { loginSchema } from '@bazaar/contracts';
import { useForm } from '@tanstack/react-form';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ApiError } from '@/lib/api';
import { signIn } from '@/lib/session';
import { zodIssue } from '@/lib/validate';

function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get('next') || '/account';
  const form = useForm({
    defaultValues: { email: '', password: '' },
    validators: { onSubmit: loginSchema },
    onSubmit: async ({ value }) => {
      await signIn(value.email, value.password);
      router.push(next.startsWith('/') ? next : '/account');
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
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <form.Field name="email" validators={{ onChange: zodIssue(loginSchema.shape.email) }}>
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
      <form.Field name="password" validators={{ onChange: zodIssue(loginSchema.shape.password) }}>
        {(field) => (
          <input
            type="password"
            placeholder="Password"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
            className="w-full rounded-lg border border-line px-3 py-3"
          />
        )}
      </form.Field>
      <form.Subscribe selector={(state) => state.errorMap.onSubmit}>
        {(error) => (error ? <p className="text-danger">{error instanceof ApiError ? error.message : 'Could not sign in'}</p> : null)}
      </form.Subscribe>
      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <button disabled={isSubmitting} className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-onPrimary">
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        )}
      </form.Subscribe>
      <Link href="/register" className="block text-info">
        Create an account
      </Link>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
