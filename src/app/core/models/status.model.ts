/**
 * Semantic status system — the single source of truth for color-coded
 * "signals" (badges/pills) across the app. Every tone maps to a design-system
 * status token (design.md §3), so a "rupture de stock" badge is the same red
 * everywhere, in every theme. Never assign status colors ad hoc in a component.
 */

/** Visual tone → resolves to --color-<tone> / --color-<tone>-tint in CSS. */
export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface StatusMeta {
  /** French label rendered inside the pill. */
  label: string;
  tone: StatusTone;
}

/* ------------------------------------------------------------------ */
/* Stock signals — driven by quantity vs. min level and lot expiry.    */
/* ------------------------------------------------------------------ */
export type StockStatus = 'OUT_OF_STOCK' | 'LOW' | 'EXPIRING' | 'EXPIRED' | 'OK';

export const STOCK_STATUS: Record<StockStatus, StatusMeta> = {
  OUT_OF_STOCK: { label: 'Rupture de stock', tone: 'danger' },
  EXPIRED:      { label: 'Périmé',           tone: 'danger' },
  LOW:          { label: 'Stock bas',        tone: 'warning' },
  EXPIRING:     { label: 'Expiration proche', tone: 'warning' },
  OK:           { label: 'En stock',         tone: 'success' },
};

/** Derive a stock signal from a quantity/min pair (expiry checked separately). */
export function deriveStockStatus(quantity: number, minQuantity = 0): StockStatus {
  if (quantity <= 0) return 'OUT_OF_STOCK';
  if (minQuantity > 0 && quantity <= minQuantity) return 'LOW';
  return 'OK';
}

/** Days-to-expiry threshold that flips a lot to the EXPIRING signal. */
export const EXPIRY_WARN_DAYS = 30;

export function deriveExpiryStatus(expiryDate?: string | null): StockStatus | null {
  if (!expiryDate) return null;
  const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return 'EXPIRED';
  if (days <= EXPIRY_WARN_DAYS) return 'EXPIRING';
  return null;
}

/* ------------------------------------------------------------------ */
/* Document signals — shared across quotes, orders, invoices, avoirs.  */
/* Keys mirror likely backend status enums; align labels once confirmed.*/
/* ------------------------------------------------------------------ */
export type DocumentStatus =
  | 'DRAFT' | 'SENT' | 'VALIDATED' | 'CONFIRMED' | 'PREPARING'
  | 'SHIPPED' | 'DELIVERED' | 'PAID' | 'PARTIALLY_PAID'
  | 'OVERDUE' | 'CANCELLED' | 'CONVERTED' | 'EXPIRED';

export const DOCUMENT_STATUS: Record<DocumentStatus, StatusMeta> = {
  DRAFT:          { label: 'Brouillon',       tone: 'neutral' },
  SENT:           { label: 'Envoyé',          tone: 'info' },
  VALIDATED:      { label: 'Validé',          tone: 'info' },
  CONFIRMED:      { label: 'Confirmé',        tone: 'info' },
  PREPARING:      { label: 'En préparation',  tone: 'warning' },
  SHIPPED:        { label: 'Expédié',         tone: 'info' },
  DELIVERED:      { label: 'Livré',           tone: 'success' },
  PAID:           { label: 'Payé',            tone: 'success' },
  PARTIALLY_PAID: { label: 'Partiellement payé', tone: 'warning' },
  OVERDUE:        { label: 'En retard',       tone: 'danger' },
  CANCELLED:      { label: 'Annulé',          tone: 'danger' },
  CONVERTED:      { label: 'Converti',        tone: 'neutral' },
  EXPIRED:        { label: 'Expiré',          tone: 'danger' },
};

/** Safe lookup — unknown backend values fall back to a neutral pill. */
export function documentStatusMeta(status: string): StatusMeta {
  return DOCUMENT_STATUS[status as DocumentStatus] ?? { label: status, tone: 'neutral' };
}
