export interface ChartAccount {
  id: number;
  code: string;
  label: string;
  accountClass: string;
  type: string;
  isParent: boolean;
  parentCode: string;
  active: boolean;
  system: boolean;
  createdAt: string;
}

export interface ChartAccountRequest {
  code: string;
  label: string;
  accountClass: string;
  type: string;
  parentCode?: string;
}

export interface JournalLine {
  id?: number;
  productId?: number;
  productName?: string;
  quantity?: number;
  unitSalePrice?: number;
  discount?: number;
  vatRate?: number;
  amountHT?: number;
  vatAmount?: number;
  amountTTC?: number;
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
  productId: number;
  quantity: number;
  unitCost: number;
}

export interface OdEntryRequest {
  description: string;
  entryDate: string;
  lines: OdEntryLine[];
  periodId: number;
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

export interface AccountingPeriodRequest {
  year: number; month: number; label?: string; startDate: string; endDate: string;
}
