'use client';

import type { Order, OrderStatus } from '@bazaar/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper, tableFeatures, useTable } from '@tanstack/react-table';
import { browserApi } from '@/lib/api';
import { rupees } from '@/lib/money';
import { useAdminOrders } from '@/lib/queries';

type PaymentView = {
  status: string;
  amountPaise: number;
  razorpayOrderId: string | null;
};

const nextStatus: Partial<Record<OrderStatus, Array<'confirmed' | 'shipped' | 'delivered' | 'cancelled'>>> = {
  payment_pending: ['cancelled'],
  paid: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
};

const features = tableFeatures({});
const helper = createColumnHelper<typeof features, Order>();
const columns = helper.columns([
  helper.accessor('number', { header: 'Order' }),
  helper.accessor('status', { header: 'Status' }),
  helper.accessor('totalPaise', { header: 'Total', cell: (info) => rupees(info.getValue()) }),
  helper.display({ id: 'actions', header: 'Actions' }),
]);
const emptyOrders: Order[] = [];

export default function AdminOrdersPage() {
  const orders = useAdminOrders();
  const queryClient = useQueryClient();
  const table = useTable({ features, columns, data: orders.data ?? emptyOrders });
  const transition = useMutation({
    mutationFn: (input: { id: string; status: string }) =>
      browserApi(`/admin/v1/orders/${input.id}/transition`, { method: 'POST', body: JSON.stringify({ status: input.status }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] }),
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Orders</h1>
      {orders.isError ? <p className="mt-3 text-danger">{orders.error instanceof Error ? orders.error.message : 'Could not load orders'}</p> : null}
      {transition.isError ? <p className="mt-3 text-danger">{transition.error instanceof Error ? transition.error.message : 'Could not update the order'}</p> : null}
      <div className="mt-4 overflow-x-auto rounded-lg bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-muted">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => (
                  <th key={header.id} className="p-3">
                    {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b border-line odd:bg-sand/60">
                {row.getAllCells().map((cell) => (
                  <td key={cell.id} className="p-3 align-top">
                    {cell.column.id === 'actions' ? (
                      <OrderActions order={row.original} onTransition={(status) => transition.mutate({ id: row.original.id, status })} />
                    ) : (
                      <table.FlexRender cell={cell} />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrderActions({ order, onTransition }: { order: Order; onTransition: (status: string) => void }) {
  const payment = useQuery({
    queryKey: ['admin', 'payment', order.id],
    enabled: false,
    queryFn: () => browserApi<PaymentView>(`/admin/v1/orders/${order.id}/payment`),
  });

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {(nextStatus[order.status] ?? []).map((status) => (
          <button key={status} className="rounded bg-ink px-2 py-1 text-white" onClick={() => onTransition(status)}>
            {status}
          </button>
        ))}
        <button className="rounded border border-line px-2 py-1" onClick={() => void payment.refetch()}>
          Payment
        </button>
      </div>
      {payment.data ? (
        <p className="mt-2 text-muted">
          {payment.data.status} · {rupees(payment.data.amountPaise)} · {payment.data.razorpayOrderId}
        </p>
      ) : null}
      {payment.isError ? <p className="mt-2 text-danger">No payment</p> : null}
    </div>
  );
}
