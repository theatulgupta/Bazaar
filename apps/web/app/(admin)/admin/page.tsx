import Link from 'next/link';
import { AuditList } from '@/components/audit-list';

export default function AdminHomePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Console</h1>
      <div className="mt-4 flex gap-4">
        <Link href="/admin/products" className="rounded-lg bg-white px-4 py-3 shadow-sm">
          Products and stock
        </Link>
        <Link href="/admin/orders" className="rounded-lg bg-white px-4 py-3 shadow-sm">
          Order queue
        </Link>
      </div>
      <AuditList />
    </div>
  );
}
