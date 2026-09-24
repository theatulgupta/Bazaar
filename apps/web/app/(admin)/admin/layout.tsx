'use client';

import { loginSchema } from '@bazaar/contracts';
import { useForm } from '@tanstack/react-form';
import { ClipboardList, LayoutDashboard, Package } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { useMe } from '@/lib/queries';
import { signIn } from '@/lib/session';
import { zodIssue } from '@/lib/validate';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = useMe();
  const form = useForm({
    defaultValues: { email: '', password: '' },
    validators: { onSubmit: loginSchema },
    onSubmit: async ({ value }) => {
      await signIn(value.email, value.password);
    },
  });

  if (me.isPending) return <p className="p-8">Loading admin...</p>;
  if (!me.data || me.data.role !== 'ADMIN') {
    return (
      <main className="mx-auto max-w-md p-8">
        <h1 className="font-display text-4xl">Bazaar</h1>
        <p className="mt-1 text-muted">Sign in to the stall office.</p>
        {me.data && me.data.role !== 'ADMIN' ? <p className="mt-3 text-danger">This account cannot open the admin console.</p> : null}
        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
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
          <button className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-onPrimary">Sign in</button>
        </form>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col bg-ink px-4 py-6 text-canvas">
        <p className="font-display text-3xl">Bazaar</p>
        <p className="mt-1 text-sm text-line">Stall office</p>
        <nav className="mt-8 flex flex-col gap-1">
          <SideLink href="/admin" icon={LayoutDashboard} label="Overview" />
          <SideLink href="/admin/products" icon={Package} label="Products" />
          <SideLink href="/admin/orders" icon={ClipboardList} label="Orders" />
        </nav>
        <p className="mt-auto text-xs text-line">{me.data.email}</p>
      </aside>
      <main className="min-w-0 flex-1 px-6 py-6">{children}</main>
    </div>
  );
}

function SideLink({ href, icon: Icon, label }: { href: string; icon: typeof Package; label: string }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link href={href} className={`flex items-center gap-2 rounded-lg px-3 py-2 ${active ? 'bg-primary text-onPrimary' : 'text-canvas'}`}>
      <Icon size={16} />
      {label}
    </Link>
  );
}
