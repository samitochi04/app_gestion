import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageHeader } from '../../../../../shared/ui/page-header/page-header';
import { Card } from '../../../../../shared/ui/card/card';
import { Button } from '../../../../../shared/ui/button/button';
import { Badge } from '../../../../../shared/ui/badge/badge';
import { DateInput } from '../../../../../shared/ui/date-input/date-input';
import { FormField } from '../../../../../shared/ui/form-field/form-field';
import { SegmentedTabs, TabOption } from '../../../../../shared/ui/segmented-tabs/segmented-tabs';
import { DataTable, DataTableColumn } from '../../../../../shared/ui/data-table/data-table';
import { DialogService } from '../../../../../core/services/dialog.service';
import { ConfirmDialog } from '../../../../../shared/ui/confirm-dialog/confirm-dialog';
import { ToastService } from '../../../../../core/services/toast.service';
import { ApiError } from '../../../../../core/services/api.service';
import { AccountingService } from '../../data/accounting.service';
import {
  AccountingPeriod, Balance, BalanceLine, ChartAccount,
  GrandLivre, GrandLivreAccount, JournalEntry,
} from '../../data/accounting.model';
import { ChartAccountForm } from '../chart-account-form/chart-account-form';
import { OdForm } from '../od-form/od-form';
import { ErrorState } from '../../../../../shared/ui/error-state/error-state';
import { formatNumber } from '../../../../../core/utils/format';

const TABS: TabOption[] = [
  { value: 'chart', label: 'Plan comptable' },
  { value: 'journal', label: 'Journal' },
  { value: 'balance', label: 'Balance' },
  { value: 'grand-livre', label: 'Grand livre' },
  { value: 'periods', label: 'Périodes' },
];

@Component({
  selector: 'app-comptabilite',
  standalone: true,
  imports: [FormsModule, PageHeader, Card, Button, Badge, DateInput, FormField, SegmentedTabs, DataTable, ErrorState],
  templateUrl: './comptabilite.html',
  styleUrl: './comptabilite.css',
})
export class Comptabilite implements OnInit {
  private readonly service = inject(AccountingService);
  private readonly dialog = inject(DialogService);
  private readonly toast = inject(ToastService);

  tabs = TABS;
  activeTab = signal('chart');

  today = new Date().toISOString().slice(0, 10);
  firstOfYear = `${new Date().getFullYear()}-01-01`;
  from = signal(this.firstOfYear);
  to = signal(this.today);

  chartAccounts = signal<ChartAccount[]>([]);
  chartLoading = signal(true);
  chartError = signal(false);

  journalEntries = signal<JournalEntry[]>([]);
  journalLoading = signal(true);
  journalError = signal(false);

  balance = signal<Balance | null>(null);
  balanceLoading = signal(false);
  balanceError = signal(false);

  grandLivre = signal<GrandLivre | null>(null);
  grandLivreLoading = signal(false);
  grandLivreError = signal(false);

  periods = signal<AccountingPeriod[]>([]);
  periodsLoading = signal(true);
  periodsError = signal(false);

  chartColumns: DataTableColumn<ChartAccount>[] = [
    { key: 'code', header: 'Code', width: '100px' },
    { key: 'label', header: 'Libellé' },
    { key: 'accountClass', header: 'Classe', width: '90px' },
    { key: 'active', header: 'Statut', align: 'center', cell: (r) => (r.active ? 'Actif' : 'Inactif') },
  ];

  journalColumns: DataTableColumn<JournalEntry>[] = [
    { key: 'reference', header: 'Référence', width: '140px' },
    { key: 'entryDate', header: 'Date' },
    { key: 'description', header: 'Description' },
    { key: 'totalDebit', header: 'Débit', align: 'right', cell: (r) => formatNumber(r.totalDebit) },
    { key: 'totalCredit', header: 'Crédit', align: 'right', cell: (r) => formatNumber(r.totalCredit) },
    { key: 'balanced', header: 'Équilibré', align: 'center', cell: (r) => (r.balanced ? 'Oui' : 'Non') },
  ];

  balanceColumns: DataTableColumn<BalanceLine>[] = [
    { key: 'code', header: 'Code', width: '100px' },
    { key: 'label', header: 'Libellé' },
    { key: 'totalDebit', header: 'Débit', align: 'right', cell: (r) => formatNumber(r.totalDebit) },
    { key: 'totalCredit', header: 'Crédit', align: 'right', cell: (r) => formatNumber(r.totalCredit) },
    { key: 'soldeDebiteur', header: 'Solde débiteur', align: 'right', cell: (r) => formatNumber(r.soldeDebiteur) },
    { key: 'soldeCrediteur', header: 'Solde créditeur', align: 'right', cell: (r) => formatNumber(r.soldeCrediteur) },
  ];

  grandLivreColumns: DataTableColumn<GrandLivreAccount>[] = [
    { key: 'code', header: 'Code', width: '100px' },
    { key: 'label', header: 'Libellé' },
    { key: 'totalDebit', header: 'Débit', align: 'right', cell: (r) => formatNumber(r.totalDebit) },
    { key: 'totalCredit', header: 'Crédit', align: 'right', cell: (r) => formatNumber(r.totalCredit) },
    { key: 'solde', header: 'Solde', align: 'right', cell: (r) => formatNumber(r.solde) },
  ];

  periodColumns: DataTableColumn<AccountingPeriod>[] = [
    { key: 'label', header: 'Période' },
    { key: 'startDate', header: 'Début' },
    { key: 'endDate', header: 'Fin' },
    { key: 'status', header: 'Statut' },
  ];

  ngOnInit(): void {
    this.loadChart();
    this.loadJournal();
    this.loadPeriods();
  }

  selectTab(tab: string): void {
    this.activeTab.set(tab);
    if (tab === 'balance' && !this.balance()) this.loadBalance();
    if (tab === 'grand-livre' && !this.grandLivre()) this.loadGrandLivre();
  }

  loadChart(): void {
    this.chartLoading.set(true);
    this.chartError.set(false);
    this.service.chartList({ page: 0, size: 100 }).subscribe({
      next: (res) => { this.chartAccounts.set(res.content); this.chartLoading.set(false); },
      error: () => { this.chartLoading.set(false); this.chartError.set(true); },
    });
  }

  loadJournal(): void {
    this.journalLoading.set(true);
    this.journalError.set(false);
    this.service.journalList({ page: 0, size: 50 }).subscribe({
      next: (res) => { this.journalEntries.set(res.content); this.journalLoading.set(false); },
      error: () => { this.journalLoading.set(false); this.journalError.set(true); },
    });
  }

  loadBalance(): void {
    this.balanceLoading.set(true);
    this.balanceError.set(false);
    this.service.balance(this.from(), this.to()).subscribe({
      next: (b) => { this.balance.set(b); this.balanceLoading.set(false); },
      error: () => { this.balanceLoading.set(false); this.balanceError.set(true); },
    });
  }

  loadGrandLivre(): void {
    this.grandLivreLoading.set(true);
    this.grandLivreError.set(false);
    this.service.grandLivre(this.from(), this.to()).subscribe({
      next: (g) => { this.grandLivre.set(g); this.grandLivreLoading.set(false); },
      error: () => { this.grandLivreLoading.set(false); this.grandLivreError.set(true); },
    });
  }

  loadPeriods(): void {
    this.periodsLoading.set(true);
    this.periodsError.set(false);
    this.service.periods().subscribe({
      next: (list) => { this.periods.set(list); this.periodsLoading.set(false); },
      error: () => { this.periodsLoading.set(false); this.periodsError.set(true); },
    });
  }

  createAccount(): void {
    const ref = this.dialog.open(ChartAccountForm, { title: 'Nouveau compte' });
    ref.closed$.subscribe((ok) => { if (ok) this.loadChart(); });
  }

  editAccount(account: ChartAccount): void {
    const ref = this.dialog.open(ChartAccountForm, { title: 'Modifier le compte', data: { account } });
    ref.closed$.subscribe((ok) => { if (ok) this.loadChart(); });
  }

  createOd(): void {
    const ref = this.dialog.open(OdForm, { title: 'Nouvelle opération diverse', size: 'lg', data: { periods: this.periods() } });
    ref.closed$.subscribe((ok) => { if (ok) this.loadJournal(); });
  }

  reverseEntry(entry: JournalEntry): void {
    const ref = this.dialog.open<{ message: string; danger: boolean }, boolean>(ConfirmDialog, {
      title: 'Contre-passer l’écriture ?',
      data: { message: `Contre-passer l’écriture ${entry.reference} ?`, danger: true },
    });
    ref.closed$.subscribe((confirmed) => {
      if (!confirmed) return;
      this.service.journalReverse(entry.id).subscribe({
        next: () => { this.toast.success('Écriture contre-passée.'); this.loadJournal(); },
        error: (e) => this.toast.error(e instanceof ApiError ? e.message : 'Action impossible.'),
      });
    });
  }

  createPeriod(): void {
    const now = new Date();
    this.service.createPeriod({
      year: now.getFullYear(), month: now.getMonth() + 1,
      startDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`,
      endDate: this.today,
    }).subscribe({
      next: () => { this.toast.success('Période créée.'); this.loadPeriods(); },
      error: (e) => this.toast.error(e instanceof ApiError ? e.message : 'Création impossible.'),
    });
  }

  closePeriod(period: AccountingPeriod): void {
    this.service.closePeriod(period.id).subscribe({
      next: () => { this.toast.success('Période clôturée.'); this.loadPeriods(); },
      error: (e) => this.toast.error(e instanceof ApiError ? e.message : 'Action impossible.'),
    });
  }

  reopenPeriod(period: AccountingPeriod): void {
    this.service.reopenPeriod(period.id).subscribe({
      next: () => { this.toast.success('Période rouverte.'); this.loadPeriods(); },
      error: (e) => this.toast.error(e instanceof ApiError ? e.message : 'Action impossible.'),
    });
  }

  exportBalance(): void { this.service.exportBalance(this.from(), this.to()); }
  exportGrandLivre(): void { this.service.exportGrandLivre(this.from(), this.to()); }
  exportJournal(): void { this.service.exportJournal(this.from(), this.to()); }
}
