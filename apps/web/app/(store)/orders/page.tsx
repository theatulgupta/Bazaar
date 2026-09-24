import type { Order } from '@bazaar/contracts';
import Link from 'next/link';
import { ApiError } from '@/lib/api';
import { serverApi } from '@/lib/server-api';
import { rupees } from '@/lib/money';

export default async function OrdersPage() {
  try {
    const orders = await serverApi<Order[]>('/api/v1/orders');
    return (
      <div>
        <h1 className="text-2xl font-semibold">Your orders</h1>
        <div className="mt-4 space-y-2">
          {orders.length === 0 ? <p className="text-muted">No orders yet.</p> : null}
          {orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`} className="block rounded-lg bg-white p-4">
              <p className="font-semibold">{order.number}</p>
              <p className="text-muted">
                {order.status} · {rupees(order.totalPaise)}
              </p>
            </Link>
          ))}
        </div>
      </div>
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return (
        <Link href="/login?next=/orders" className="text-info">
          Sign in to see your orders
        </Link>
      );
    }
    throw error;
  }
}
