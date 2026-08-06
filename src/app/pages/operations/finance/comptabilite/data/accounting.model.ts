import { SelectOption } from '../../../../../shared/ui/select/select';

/** OHADA journals — `JS` (stock) is a reference prefix, not a journal. */
export const JOURNAL_TYPES: SelectOption[] = [
  { value: 'VENTES', label: 'Ventes' },
  { value: 'ACHATS', label: 'Achats' },
  { value: 'TRESORERIE', label: 'Trésorerie' },
  { value: 'OD', label: 'Opérations diverses' },
];

/** The nine classes of the OHADA Acte Uniforme (9 = analytical accounting). */
export const ACCOUNT_CLASSES: SelectOption[] = [
  { value: 'CLASSE_1', label: 'Classe 1 — Ressources durables' },
  { value: 'CLASSE_2', label: 'Classe 2 — Actif immobilisé' },
  { value: 'CLASSE_3', label: 'Classe 3 — Stocks' },
  { value: 'CLASSE_4', label: 'Classe 4 — Tiers' },
  { value: 'CLASSE_5', label: 'Classe 5 — Trésorerie' },
  { value: 'CLASSE_6', label: 'Classe 6 — Charges' },
  { value: 'CLASSE_7', label: 'Classe 7 — Produits' },
  { value: 'CLASSE_8', label: 'Classe 8 — Hors activités ordinaires' },
  { value: 'CLASSE_9', label: 'Classe 9 — Comptabilité analytique' },
];

export interface ChartAccount {
  id: number;
  code: string;
  label: string;
  accountClass: string;
  type: string;
  isParent: boolean;
  parentCode: string;
  active: boolean;
  /** System accounts are seeded by migration and should not be renamed. */
  system: boolean;
  createdAt: string;
}

/**
 * `POST /api/accounting/chart` takes these as **query parameters**, not a JSON
 * body — the class is derived from the code by the backend.
 */
export interface CreateChartAccountRequest {
  code: string;
  label: string;
  parentCode?: string;
  isParent?: boolean;
}

export interface JournalLine {
  id?: number;
  accountCode: string;
  accountLabel?: string;
  label: string;
  debit?: number;
  credit?: number;
  letteringStatus?: string;
  letteringCode?: string;
}

export interface JournalEntry {
  id: number;
  reference: string;
  journalType: string;
  status: string;
  entryDate: string;
  description: string;
  sourceType: string;
  sourceReference: string;
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
  balanced: boolean;
  createdAt: string;
}

export interface OdEntryLine {
  accountCode: string;
  label: string;
  debit?: number;
  credit?: number;
}

export interface OdEntryRequest {
  periodId: number;
  entryDate: string;
  description: string;
  lines: OdEntryLine[];
  createdBy?: string;
}

export interface BalanceLine {
  code: string; label: string; totalDebit: number; totalCredit: number;
  soldeDebiteur: number; soldeCrediteur: number;
}

export interface Balance {
  from: string; to: string; lines: BalanceLine[]; totalDebit: number; totalCredit: number;
}

export interface GrandLivreAccount { code: string; label: string; totalDebit: number; totalCredit: number; solde: number; }
export interface GrandLivre { from: string; to: string; accounts: GrandLivreAccount[]; }

export interface AccountingPeriod {
  id: number; year: number; month: number; label: string;
  startDate: string; endDate: string; status: string;
  closedAt?: string; closedBy?: string;
}

/** Also passed as query parameters. */
export interface CreatePeriodRequest {
  year: number; month: number; startDate: string; endDate: string;
}

export interface Lettering {
  id: number;
  code: string;
  accountCode: string;
  status?: string;
  amount?: number;
  letteredAt?: string;
}

export interface AccountingMapping {
  id: number;
  entityType: string;
  /** Null means "default mapping for this entity type". */
  entityId: string | null;
  accountType: string;
  accountCode: string;
  label: string;
}

export interface UpsertMappingRequest {
  entityType: string;
  entityId?: string;
  accountType: string;
  accountCode: string;
  label?: string;
}

export interface InboxEvent {
  id: number;
  eventType: string;
  status: string;
  sourceReference?: string;
  attempts?: number;
  lastError?: string;
  receivedAt?: string;
  processedAt?: string;
}

export interface InboxSummary {
  pending: number;
  posted: number;
  failed: number;
}

export interface RetryResult {
  attempted: number;
  succeeded: number;
  failed: number;
}
