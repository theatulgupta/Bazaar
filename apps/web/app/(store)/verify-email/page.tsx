'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { ApiError, browserApi } from '@/lib/api';

function VerifyEmail() {
  const token = useSearchParams().get('token');
  const [message, setMessage] = useState(token ? 'Checking the link...' : 'We will email a verification link.');

  useEffect(() => {
    if (!token) return;
    browserApi('/api/v1/auth/verify?token=' + encodeURIComponent(token))
      .then(() => setMessage('Email verified. You can check out.'))
      .catch((error: unknown) => setMessage(error instanceof ApiError ? error.message : 'This link is invalid or already used'));
  }, [token]);

  return (
    <div className="max-w-lg rounded-lg bg-white p-6">
      <h1 className="text-2xl font-semibold">Verify email</h1>
      <p className="mt-3">{message}</p>
      <button
        className="mt-4 rounded-lg bg-primary px-4 py-3 font-semibold text-onPrimary"
        onClick={() => {
          browserApi('/api/v1/auth/resend-verification', { method: 'POST' })
            .then(() => setMessage('A new link is on its way. If SMTP is not configured, the API logs the link.'))
            .catch((error: unknown) => setMessage(error instanceof ApiError ? error.message : 'Could not resend'));
        }}
      >
        Resend link
      </button>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmail />
    </Suspense>
  );
}
