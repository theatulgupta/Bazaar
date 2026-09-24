export function rupees(paise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: paise % 100 === 0 ? 0 : 2,
  }).format(paise / 100);
}

export function toPaise(rupeeInput: string): number {
  const value = Number(rupeeInput);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.round(value * 100);
}
