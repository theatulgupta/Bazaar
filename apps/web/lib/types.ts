import type { auditEntrySchema } from '@bazaar/contracts';
import type { z } from 'zod';

export type AuditEntry = z.infer<typeof auditEntrySchema>;
