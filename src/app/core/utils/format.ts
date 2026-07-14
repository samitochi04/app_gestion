/**
 * Shared, null-safe number/currency formatters. The backend can return
 * `null` for numeric fields (e.g. prices not yet set) — every formatter here
 * treats null/undefined as 0 rather than throwing.
 */

/** Formats a monetary value as "12 345 FCFA" (fr-FR grouping, FCFA currency). */
export function formatMoney(value: number | null | undefined): string {
  const v = value ?? 0;
  return `${v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FCFA`;
}

/** Formats a monetary value with no decimals — used for large KPI figures. */
export function formatMoneyRounded(value: number | null | undefined): string {
  const v = value ?? 0;
  return `${v.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA`;
}

/** Formats a plain decimal number (e.g. balance/journal figures), null-safe. */
export function formatNumber(value: number | null | undefined, decimals = 2): string {
  const v = value ?? 0;
  return v.toFixed(decimals);
}

/** Formats a percentage delta like "+4.2%" / "-1.8%", null-safe. */
export function formatPercent(value: number | null | undefined): string {
  const v = value ?? 0;
  const sign = v > 0 ? '+' : '';
  return `${sign}${v.toFixed(1)}%`;
}
