import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageHeader } from '../../../../../../shared/ui/page-header/page-header';
import { Card } from '../../../../../../shared/ui/card/card';
import { Button } from '../../../../../../shared/ui/button/button';
import { Badge } from '../../../../../../shared/ui/badge/badge';
import { DateInput } from '../../../../../../shared/ui/date-input/date-input';
import { FormField } from '../../../../../../shared/ui/form-field/form-field';
import { TextInput } from '../../../../../../shared/ui/text-input/text-input';
import { Select } from '../../../../../../shared/ui/select/select';
import { SegmentedTabs, TabOption } from '../../../../../../shared/ui/segmented-tabs/segmented-tabs';
import { DataTable, DataTableAction, DataTableColumn } from '../../../../../../shared/ui/data-table/data-table';
import { KpiCard } from '../../../../../../shared/ui/kpi-card/kpi-card';
import { ErrorState } from '../../../../../../shared/ui/error-state/error-state';
import { DialogService } from '../../../../../../core/services/dialog.service';
import { ConfirmDialog, ConfirmDialogData } from '../../../../../../shared/ui/confirm-dialog/confirm-dialog';
import { ToastService } from '../../../../../../core/services/toast.service';
import { ApiError } from '../../../../../../core/services/api.service';
import { ReportingExportService } from '../../../../../../core/services/reporting-export.service';
import { StatusTone, documentStatusMeta } from '../../../../../../core/models/status.model';
import { formatNumber } from '../../../../../../core/utils/format';
import { AccountingService } from '../../data/accounting.service';
import {
  ACCOUNT_CLASSES, AccountingMapping, AccountingPeriod, Balance, BalanceLine, ChartAccount,
  GrandLivre, GrandLivreAccount, InboxEvent, InboxSummary, JournalEntry, Lettering,
} from '../../data/accounting.model';
import { ChartAccountForm } from '../chart-account-form/chart-account-form';
import { MappingForm } from '../mapping-form/mapping-form';
import { OdForm } from '../od-form/od-form';

const TABS: TabOption[] = [
  { value: 'chart', label: 'Plan comptable' },
  { value: 'journal', label: 'Journal' },
  { value: 'balance', label: 'Balance' },
  { value: 'grand-livre', label: 'Grand livre' },
  { value: 'lettrage', label: 'Lettrage' },
  { value: 'periods', label: 'Périodes' },
  { value: 'mappings', label: 'Correspondances' },
  { value: 'inbox', label: 'Inbox' },
];

/**
 * The accounting desk. Eight views over erp-accounting, each loading lazily on
 * first visit so opening the page costs one request, not eight.
 */
@Component({
  selector: 'app-comptabilite',
  standalone: true,
  imports: [
    FormsModule, PageHeader, Card, Button, Badge, DateInput, FormField, TextInput,
    Select, SegmentedTabs, DataTable, KpiCard, ErrorState,
  ],
  templateUrl: './comptabilite.html',
  styleUrl: './comptabilite.css',
})
export class Comptabilite implements OnInit {
  private readonly service = inject(AccountingService);
  private readonly exports = inject(ReportingExportService);
  private readonly dialog = inject(DialogService);
  private readonly toast = inject(ToastService);

  tabs = TABS;
  activeTab = signal('chart');
  accountClasses = ACCOUNT_CLASSES;

  today = new Date().toISOString().slice(0, 10);
  firstOfYear = `${new Date().getFullYear()}-01-01`;
  from = signal(this.firstOfYear);
  to = signal(this.today);
  /** `GET /periods` serves one exercise at a time and requires the year. */
  year = signal(new Date().getFullYear());

  chartAccounts = signal<ChartAccount[]>([]);
  chartLoading = signal(true);
  chartError = signal(false);
  chartClass = signal('');

  journalEntries = signal<JournalEntry[]>([]);
  journalLoading = signal(true);
  journalError = signal(false);

  balance = signal<Balance | null>(null);
  balanceLoading = signal(false);
  balanceError = signal(false);

  grandLivre = signal<GrandLivre | null>(null);
  grandLivreLoading = signal(false);
  grandLivreError = signal(false);
  grandLivreAccount = signal('');

  periods = signal<AccountingPeriod[]>([]);
  periodsLoading = signal(true);
  periodsError = signal(false);

  letteringAccount = signal('411');
  letterings = signal<Lettering[]>([]);
  letteringsLoading = signal(false);

  mappings = signal<AccountingMapping[]>([]);
  mappingsLoading = signal(false);

  inboxEvents = signal<InboxEvent[]>([]);
  inboxSummary = signal<InboxSummary | null>(null);
  inboxLoading = signal(false);

  readonly failedCount = computed(() => this.inboxSummary()?.failed ?? 0);

  chartColumns: DataTableColumn<ChartAccount>[] = [
    { key: 'code', header: 'Code', width: '100px' },
    { key: 'label', header: 'Libellé' },
    { key: 'accountClass', header: 'Classe', width: '110px' },
    { key: 'active', header: 'Statut', align: 'center', cell: (r) => (r.active ? 'Actif' : 'Inactif') },
  ];

  chartActions: DataTableAction<ChartAccount>[] = [
    {
      icon: 'x', label: 'Désactiver', danger: true,
      visible: (r) => r.active && !r.system,
      run: (r) => this.toggleAccount(r, false),
    },
    {
      icon: 'check-circle', label: 'Réactiver',
      visible: (r) => !r.active,
      run: (r) => this.toggleAccount(r, true),
    },
  ];

  journalColumns: DataTableColumn<JournalEntry>[] = [
    { key: 'reference', header: 'Référence', width: '140px' },
    { key: 'entryDate', header: 'Date' },
    { key: 'journalType', header: 'Journal', width: '110px' },
    { key: 'description', header: 'Description' },
    { key: 'totalDebit', header: 'Débit', align: 'right', cell: (r) => formatNumber(r.totalDebit) },
    { key: 'totalCredit', header: 'Crédit', align: 'right', cell: (r) => formatNumber(r.totalCredit) },
    { key: 'status', header: 'Statut', cell: (r) => documentStatusMeta(r.status).label },
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

  letteringColumns: DataTableColumn<Lettering>[] = [
    { key: 'code', header: 'Code', width: '100px' },
    { key: 'accountCode', header: 'Compte', width: '110px' },
    { key: 'amount', header: 'Montant', align: 'right', cell: (r) => formatNumber(r.amount) },
    { key: 'letteredAt', header: 'Lettré le', cell: (r) => (r.letteredAt ? new Date(r.letteredAt).toLocaleDateString('fr-FR') : '—') },
  ];

  letteringActions: DataTableAction<Lettering>[] = [
    { icon: 'trash', label: 'Délettrer', danger: true, run: (r) => this.unletter(r) },
  ];

  mappingColumns: DataTableColumn<AccountingMapping>[] = [
    { key: 'entityType', header: 'Entité' },
    { key: 'entityId', header: 'Identifiant', cell: (r) => r.entityId ?? 'Par défaut' },
    { key: 'accountType', header: 'Usage' },
    { key: 'accountCode', header: 'Compte', width: '110px' },
    { key: 'label', header: 'Libellé' },
  ];

  inboxColumns: DataTableColumn<InboxEvent>[] = [
    { key: 'eventType', header: 'Événement' },
    { key: 'sourceReference', header: 'Source', cell: (r) => r.sourceReference || '—' },
    { key: 'status', header: 'Statut', cell: (r) => documentStatusMeta(r.status).label },
    { key: 'attempts', header: 'Tentatives', align: 'right', cell: (r) => String(r.attempts ?? 0) },
    { key: 'lastError', header: 'Dernière erreur', cell: (r) => r.lastError || '—' },
  ];

  inboxActions: DataTableAction<InboxEvent>[] = [
    {
      icon: 'refresh', label: 'Rejouer',
      visible: (r) => r.status === 'FAILED',
      run: (r) => this.retryEvent(r),
    },
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
    if (tab === 'lettrage' && this.letterings().length === 0) this.loadLetterings();
    if (tab === 'mappings' && this.mappings().length === 0) this.loadMappings();
    if (tab === 'inbox' && !this.inboxSummary()) this.loadInbox();
  }

  statusTone(status: string): StatusTone { return documentStatusMeta(status).tone; }

  // ---- Plan comptable ----

  loadChart(): void {
    this.chartLoading.set(true);
    this.chartError.set(false);
    this.service.chartList({ page: 0, size: 200, accountClass: this.chartClass() || undefined }).subscribe({
      next: (res) => { this.chartAccounts.set(res.content); this.chartLoading.set(false); },
      error: () => { this.chartLoading.set(false); this.chartError.set(true); },
    });
  }

  onChartClass(value: string): void { this.chartClass.set(value); this.loadChart(); }

  createAccount(): void {
    const ref = this.dialog.open(ChartAccountForm, { title: 'Nouveau compte' });
    ref.closed$.subscribe((ok) => { if (ok) this.loadChart(); });
  }

  editAccount(account: ChartAccount): void {
    const ref = this.dialog.open(ChartAccountForm, { title: `Compte ${account.code}`, data: { account } });
    ref.closed$.subscribe((ok) => { if (ok) this.loadChart(); });
  }

  private toggleAccount(account: ChartAccount, activate: boolean): void {
    const request$ = activate ? this.service.chartActivate(account.id) : this.service.chartDeactivate(account.id);
    request$.subscribe({
      next: () => { this.toast.success(activate ? 'Compte réactivé.' : 'Compte désactivé.'); this.loadChart(); },
      error: (e) => this.toast.error(e instanceof ApiError ? e.message : 'Action impossible.'),
    });
  }

  // ---- Journal ----

  loadJournal(): void {
    this.journalLoading.set(true);
    this.journalError.set(false);
    this.service.journalList({ page: 0, size: 50 }).subscribe({
      next: (res) => { this.journalEntries.set(res.content); this.journalLoading.set(false); },
      error: () => { this.journalLoading.set(false); this.journalError.set(true); },
    });
  }

  createOd(): void {
    const ref = this.dialog.open(OdForm, {
      title: 'Nouvelle opération diverse', size: 'lg',
      data: { periods: this.periods().filter((p) => p.status === 'OPEN'), accounts: this.chartAccounts() },
    });
    ref.closed$.subscribe((ok) => { if (ok) this.loadJournal(); });
  }

  reverseEntry(entry: JournalEntry): void {
    const ref = this.dialog.open<ConfirmDialogData, boolean>(ConfirmDialog, {
      title: 'Contre-passer l’écriture ?',
      data: { message: `Une écriture miroir de ${entry.reference} sera générée. L’originale reste au journal.`, danger: true, confirmLabel: 'Contre-passer' },
    });
    ref.closed$.subscribe((confirmed) => {
      if (!confirmed) return;
      this.service.journalReverse(entry.id).subscribe({
        next: () => { this.toast.success('Écriture contre-passée.'); this.loadJournal(); },
        error: (e) => this.toast.error(e instanceof ApiError ? e.message : 'Action impossible.'),
      });
    });
  }

  // ---- États ----

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
    this.service.grandLivre(this.from(), this.to(), this.grandLivreAccount() || undefined).subscribe({
      next: (g) => { this.grandLivre.set(g); this.grandLivreLoading.set(false); },
      error: () => { this.grandLivreLoading.set(false); this.grandLivreError.set(true); },
    });
  }

  exportBalance(): void { this.exports.accounting('balance', this.window()).subscribe(); }
  exportGrandLivre(): void {
    this.exports.accounting('grand-livre', this.window(), { accountCode: this.grandLivreAccount() || undefined }).subscribe();
  }
  exportJournal(): void { this.exports.accounting('journal', this.window()).subscribe(); }

  private window() { return { from: this.from(), to: this.to(), format: 'PDF' as const }; }

  // ---- Lettrage ----

  loadLetterings(): void {
    const account = this.letteringAccount().trim();
    if (!account) return;
    this.letteringsLoading.set(true);
    this.service.letterings(account).subscribe({
      next: (list) => { this.letterings.set(list); this.letteringsLoading.set(false); },
      error: () => { this.letterings.set([]); this.letteringsLoading.set(false); },
    });
  }

  letterAuto(): void {
    const account = this.letteringAccount().trim();
    if (!account) return;
    this.service.letterAuto(account, this.from(), this.to()).subscribe({
      next: (created) => {
        this.toast.success(created.length ? `${created.length} lettrage(s) créé(s).` : 'Aucun rapprochement automatique trouvé.');
        this.loadLetterings();
      },
      error: (e) => this.toast.error(e instanceof ApiError ? e.message : 'Lettrage impossible.'),
    });
  }

  private unletter(lettering: Lettering): void {
    const ref = this.dialog.open<ConfirmDialogData, boolean>(ConfirmDialog, {
      title: 'Annuler le lettrage ?',
      data: { message: `Les lignes du lettrage ${lettering.code} redeviendront non lettrées.`, danger: true, confirmLabel: 'Délettrer' },
    });
    ref.closed$.subscribe((confirmed) => {
      if (!confirmed) return;
      this.service.unletter(lettering.id).subscribe({
        next: () => { this.toast.success('Lettrage annulé.'); this.loadLetterings(); },
        error: (e) => this.toast.error(e instanceof ApiError ? e.message : 'Action impossible.'),
      });
    });
  }

  // ---- Périodes ----

  loadPeriods(): void {
    this.periodsLoading.set(true);
    this.periodsError.set(false);
    this.service.periods(this.year()).subscribe({
      next: (list) => { this.periods.set(list); this.periodsLoading.set(false); },
      error: () => { this.periodsLoading.set(false); this.periodsError.set(true); },
    });
  }

  onYear(value: string): void {
    const year = Number(value);
    if (!Number.isFinite(year) || year < 2000) return;
    this.year.set(year);
    this.loadPeriods();
  }

  /** Creates the month that has no period yet, starting from January. */
  createPeriod(): void {
    const taken = new Set(this.periods().map((p) => p.month));
    const month = [...Array(12).keys()].map((i) => i + 1).find((m) => !taken.has(m));
    if (!month) { this.toast.error('Les douze mois de cet exercice existent déjà.'); return; }

    const year = this.year();
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0));
    this.service.createPeriod({
      year, month,
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    }).subscribe({
      next: () => { this.toast.success('Période créée.'); this.loadPeriods(); },
      error: (e) => this.toast.error(e instanceof ApiError ? e.message : 'Création impossible.'),
    });
  }

  closePeriod(period: AccountingPeriod): void {
    const ref = this.dialog.open<ConfirmDialogData, boolean>(ConfirmDialog, {
      title: `Clôturer ${period.label} ?`,
      data: { message: 'Aucune nouvelle écriture ne pourra plus être enregistrée sur cette période.', confirmLabel: 'Clôturer' },
    });
    ref.closed$.subscribe((confirmed) => {
      if (!confirmed) return;
      this.service.closePeriod(period.id).subscribe({
        next: () => { this.toast.success('Période clôturée.'); this.loadPeriods(); },
        error: (e) => this.toast.error(e instanceof ApiError ? e.message : 'Action impossible.'),
      });
    });
  }

  reopenPeriod(period: AccountingPeriod): void {
    this.service.reopenPeriod(period.id).subscribe({
      next: () => { this.toast.success('Période rouverte.'); this.loadPeriods(); },
      error: (e) => this.toast.error(e instanceof ApiError ? e.message : 'Action impossible.'),
    });
  }

  // ---- Correspondances ----

  loadMappings(): void {
    this.mappingsLoading.set(true);
    this.service.mappings().subscribe({
      next: (list) => { this.mappings.set(list); this.mappingsLoading.set(false); },
      error: () => this.mappingsLoading.set(false),
    });
  }

  createMapping(): void {
    const ref = this.dialog.open(MappingForm, { title: 'Nouvelle correspondance' });
    ref.closed$.subscribe((ok) => { if (ok) this.loadMappings(); });
  }

  editMapping(mapping: AccountingMapping): void {
    const ref = this.dialog.open(MappingForm, { title: 'Modifier la correspondance', data: { mapping } });
    ref.closed$.subscribe((ok) => { if (ok) this.loadMappings(); });
  }

  deleteMapping(mapping: AccountingMapping): void {
    const ref = this.dialog.open<ConfirmDialogData, boolean>(ConfirmDialog, {
      title: 'Supprimer la correspondance ?',
      data: { message: `Les écritures retomberont sur le compte par défaut, ou sur le 471 en dernier recours.`, danger: true },
    });
    ref.closed$.subscribe((confirmed) => {
      if (!confirmed) return;
      this.service.deleteMapping(mapping.id).subscribe({
        next: () => { this.toast.success('Correspondance supprimée.'); this.loadMappings(); },
        error: (e) => this.toast.error(e instanceof ApiError ? e.message : 'Suppression impossible.'),
      });
    });
  }

  // ---- Inbox ----

  loadInbox(): void {
    this.inboxLoading.set(true);
    this.service.inboxSummary().subscribe({
      next: (s) => this.inboxSummary.set(s),
      error: () => this.inboxSummary.set({ pending: 0, posted: 0, failed: 0 }),
    });
    this.service.inbox({ page: 0, size: 100 }).subscribe({
      next: (res) => { this.inboxEvents.set(res.content); this.inboxLoading.set(false); },
      error: () => this.inboxLoading.set(false),
    });
  }

  retryFailed(): void {
    this.service.retryFailedInbox().subscribe({
      next: (r) => { this.toast.success(`${r.succeeded}/${r.attempted} événement(s) rejoué(s).`); this.loadInbox(); },
      error: (e) => this.toast.error(e instanceof ApiError ? e.message : 'Rejeu impossible.'),
    });
  }

  private retryEvent(event: InboxEvent): void {
    this.service.retryInboxEvent(event.id).subscribe({
      next: () => { this.toast.success('Événement rejoué.'); this.loadInbox(); },
      error: (e) => this.toast.error(e instanceof ApiError ? e.message : 'Rejeu impossible.'),
    });
  }
}
