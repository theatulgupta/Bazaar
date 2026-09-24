'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { browserApi } from '@/lib/api';
import { rupees } from '@/lib/money';
import { useOrderQuery } from '@/lib/queries';
import type { Order } from '@bazaar/contracts';

function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const pending = useSearchParams().get('pending');
  const order = useOrderQuery(id);
  const queryClient = useQueryClient();
  const cancel = useMutation({
    mutationFn: () => browserApi<Order>(`/api/v1/orders/${id}/cancel`, { method: 'POST' }),
    onSuccess: (next) => queryClient.setQueryData(['order', id], next),
  });
  const data = order.data;

  if (order.isError) return <p className="text-danger">{order.error instanceof Error ? order.error.message : 'Order not found'}</p>;
  if (!data) return <p>Loading order...</p>;

  return (
    <div className="rounded-lg bg-white p-6">
      <h1 className="text-2xl font-semibold">{data.number}</h1>
      <p className="mt-1 capitalize text-muted">{data.status.replaceAll('_', ' ')}</p>
      {data.status === 'payment_pending' ? (
        <p className="mt-3">
          {pending
            ? 'Order placed. This environment uses the fake payment driver, so the order stays payment pending until a signed webhook arrives.'
            : 'Waiting for the server to confirm payment.'}
        </p>
      ) : null}
      <p className="mt-4 text-lg font-semibold">Total {rupees(data.totalPaise)}</p>
      <ul className="mt-3 space-y-1">
        {data.items.map((item) => (
          <li key={item.productId}>
            {item.quantity} × {item.title}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-muted">
        {data.address.name}, {data.address.houseNo} {data.address.street}, {data.address.city} {data.address.pincode}
      </p>
      {data.status === 'payment_pending' || data.status === 'paid' || data.status === 'confirmed' ? (
        <button className="mt-4 text-danger" onClick={() => cancel.mutate()}>
          {cancel.isPending ? 'Cancelling...' : 'Cancel order'}
        </button>
      ) : null}
      {cancel.isError ? <p className="mt-2 text-danger">{cancel.error instanceof Error ? cancel.error.message : 'Could not cancel'}</p> : null}
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense>
      <OrderDetail />
    </Suspense>
  );
}
