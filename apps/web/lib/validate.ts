import type { ZodType } from 'zod';

export function zodIssue(schema: ZodType) {
  return ({ value }: { value: unknown }) => {
    const parsed = schema.safeParse(value);
    return parsed.success ? undefined : parsed.error.issues[0]?.message;
  };
}
