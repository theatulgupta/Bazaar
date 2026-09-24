/** Free delivery at ₹499 and above. Otherwise ₹40. Amounts are paise. */
export function shippingPaise(subtotalPaise: number): number {
  if (!Number.isInteger(subtotalPaise) || subtotalPaise < 0) {
    throw new Error('Subtotal must be a non-negative integer number of paise');
  }
  return subtotalPaise >= 49_900 ? 0 : 4_000;
}
