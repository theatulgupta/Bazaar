export const PERMISSIONS = [
  'catalog:write',
  'orders:read',
  'orders:fulfill',
  'payments:read',
  'inventory:read',
  'audit:read',
] as const;

export type Permission = (typeof PERMISSIONS)[number];
export type RoleName = 'CUSTOMER' | 'ADMIN';

export function permissionsFor(role: RoleName): Permission[] {
  if (role === 'ADMIN') return [...PERMISSIONS];
  return ['orders:read'];
}
