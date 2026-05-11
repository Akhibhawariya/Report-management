/** @param {string | number | null | undefined} n */
export function formatInteger(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return '—';
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(x);
}

/** Expects a decimal string or number (API may return Prisma Decimal as string). */
export function formatCurrency(n) {
  const x = typeof n === 'string' ? Number(n) : Number(n);
  if (!Number.isFinite(x)) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(x);
}
