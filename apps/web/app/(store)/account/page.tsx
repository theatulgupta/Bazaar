import type { Order, UserProfile } from '@bazaar/contracts';
import Link from 'next/link';
import { ApiError } from '@/lib/api';
import { serverApi } from '@/lib/server-api';
import { rupees } from '@/lib/money';
import { SignOut } from '@/components/sign-out';

export default async function AccountPage() {
  let user: UserProfile;
  try {
    user = await serverApi<UserProfile>('/api/v1/me');
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return (
        <p>
          <Link href="/login" className="text-info">
            Sign in
          </Link>{' '}
          to see your account.
        </p>
      );
    }
    throw error;
  }
  const orders = await serverApi<Order[]>('/api/v1/orders');
  return (
    <div>
      <h1 className="text-2xl font-semibold">Hello, {user.name}</h1>
      <p className="text-muted">{user.email}</p>
      {!user.emailVerified ? (
        <p className="mt-2 text-danger">
          Verify your email before checkout. <Link href="/verify-email" className="text-info">Resend the link</Link>
        </p>
      ) : null}
      <div className="mt-4 flex gap-4">
        <Link href="/addresses" className="text-info">
          Addresses
        </Link>
        <Link href="/orders" className="text-info">
          Orders
        </Link>
        {user.role === 'ADMIN' ? (
          <Link href="/admin" className="text-info">
            Admin
          </Link>
        ) : null}
      </div>
      <h2 className="mb-2 mt-8 text-xl font-semibold">Recent orders</h2>
      {orders.map((order) => (
        <Link key={order.id} href={`/orders/${order.id}`} className="mb-2 block rounded-lg bg-white p-3">
          <span className="font-semibold">{order.number}</span>
          <span className="text-muted"> · {order.status} · {rupees(order.totalPaise)}</span>
        </Link>
      ))}
      <SignOut />
    </div>
  );
}
