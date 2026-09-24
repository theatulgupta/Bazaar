'use client';

import { useAudit } from '@/lib/queries';

export function AuditList() {
  const audit = useAudit();
  const entries = audit.data ?? [];

  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold">Recent audit</h2>
      <ul className="mt-3 space-y-2">
        {entries.map((entry) => (
          <li key={entry.id} className="rounded-lg bg-white px-3 py-2 text-sm">
            <span className="font-semibold">{entry.action}</span>
            <span className="text-muted">
              {' '}
              · {entry.entityType} · {new Date(entry.createdAt).toLocaleString('en-IN')}
            </span>
          </li>
        ))}
        {entries.length === 0 ? <li className="text-muted">No audit entries yet.</li> : null}
      </ul>
    </section>
  );
}
