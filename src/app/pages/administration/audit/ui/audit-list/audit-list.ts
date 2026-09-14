import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { PageHeader } from '../../../../../shared/ui/page-header/page-header';
import { Card } from '../../../../../shared/ui/card/card';
import { Button } from '../../../../../shared/ui/button/button';
import { Icon } from '../../../../../shared/ui/icon/icon';
import { SearchInput } from '../../../../../shared/ui/search-input/search-input';
import { DataTable, DataTableColumn } from '../../../../../shared/ui/data-table/data-table';
import { Paginator } from '../../../../../shared/ui/paginator/paginator';
import { DialogService } from '../../../../../core/services/dialog.service';
import { FilterDialog, FilterFieldConfig } from '../../../../../shared/ui/filter-dialog/filter-dialog';
import { DetailDialog, DetailDialogData, DetailSection } from '../../../../../shared/ui/detail-dialog/detail-dialog';
import { AuditEntry } from '../../data/audit.model';
import { AuditService } from '../../data/audit.service';

/** All possible audit modules for filtering. */
const AUDIT_MODULES = [
  { value: 'IAM', label: 'IAM' },
  { value: 'STOCK', label: 'Stock' },
  { value: 'SALES', label: 'Ventes' },
  { value: 'BILLING', label: 'Facturation' },
  { value: 'SUPPLIER', label: 'Achats' },
  { value: 'ACCOUNTING', label: 'Comptabilité' },
  { value: 'MESSAGING', label: 'Messagerie' },
];

/** All possible audit actions for filtering. */
const AUDIT_ACTIONS = [
  { value: 'CREATE', label: 'Création' },
  { value: 'UPDATE', label: 'Modification' },
  { value: 'DELETE', label: 'Suppression' },
  { value: 'ACTIVATE', label: 'Activation' },
  { value: 'DEACTIVATE', label: 'Désactivation' },
  { value: 'STATUS_CHANGE', label: 'Changement de statut' },
  { value: 'LOGIN', label: 'Connexion' },
  { value: 'LOGIN_FAILED', label: 'Connexion échouée' },
  { value: 'LOGOUT', label: 'Déconnexion' },
  { value: 'PASSWORD_CHANGE', label: 'Changement de mot de passe' },
  { value: 'PASSWORD_RESET', label: 'Réinitialisation' },
  { value: 'ROLE_ASSIGNED', label: 'Rôle assigné' },
  { value: 'ROLE_REMOVED', label: 'Rôle retiré' },
  { value: 'STOCK_MOVEMENT', label: 'Mouvement de stock' },
  { value: 'ORDER_CONFIRMED', label: 'Commande confirmée' },
  { value: 'ORDER_SHIPPED', label: 'Commande expédiée' },
  { value: 'ORDER_CANCELLED', label: 'Commande annulée' },
  { value: 'INVOICE_VALIDATED', label: 'Facture validée' },
  { value: 'PAYMENT_RECORDED', label: 'Paiement enregistré' },
  { value: 'ENTRY_POSTED', label: 'Écriture comptabilisée' },
];

@Component({
  selector: 'app-audit-list',
  standalone: true,
  imports: [PageHeader, Card, Button, Icon, SearchInput, DataTable, Paginator],
  templateUrl: './audit-list.html',
})
export class AuditList implements OnInit {
  private readonly service = inject(AuditService);
  private readonly dialog = inject(DialogService);

  entries = signal<AuditEntry[]>([]);
  loading = signal(true);
  page = signal(0);
  size = signal(20);
  totalElements = signal(0);
  totalPages = signal(0);
  search = signal('');
  activeFilters = signal<Record<string, string | number | null>>({});
  activeFilterCount = computed(() => Object.keys(this.activeFilters()).length);

  columns: DataTableColumn<AuditEntry>[] = [
    { key: 'occurredAt', header: 'Date', cell: (r) => new Date(r.occurredAt).toLocaleString('fr-FR') },
    { key: 'module', header: 'Module' },
    { key: 'entityType', header: 'Entité' },
    { key: 'actionLabel', header: 'Action' },
    { key: 'userEmail', header: 'Utilisateur', cell: (r) => r.userEmail || r.userId || '—' },
  ];

  ngOnInit(): void { this.load(0); }

  load(page: number): void {
    this.loading.set(true);
    const filters = this.activeFilters();
    this.service.list({
      page,
      size: this.size(),
      search: this.search(),
      ...filters,
    }).subscribe({
      next: (res) => {
        this.entries.set(res.content);
        this.page.set(res.page);
        this.totalElements.set(res.totalElements);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearch(term: string): void { this.search.set(term); this.load(0); }

  openFilters(): void {
    const fields: FilterFieldConfig[] = [
      { key: 'module', label: 'Module', type: 'select', options: AUDIT_MODULES },
      { key: 'entityType', label: 'Type d\'entité', type: 'text', placeholder: 'Ex: Order, Invoice…' },
      { key: 'action', label: 'Action', type: 'select', options: AUDIT_ACTIONS },
      { key: 'userId', label: 'ID utilisateur', type: 'text', placeholder: 'UUID de l\'utilisateur' },
      { key: 'from', label: 'Date de début', type: 'date' },
      { key: 'to', label: 'Date de fin', type: 'date' },
    ];
    const ref = this.dialog.open<
      { fields: FilterFieldConfig[]; initial: Record<string, string | number | null> },
      Record<string, string | number | null>
    >(FilterDialog, {
      title: 'Filtrer l\'audit',
      data: { fields, initial: this.activeFilters() },
    });
    ref.closed$.subscribe((result) => {
      if (result === undefined) return;
      this.activeFilters.set(result);
      this.load(0);
    });
  }

  viewDetail(entry: AuditEntry): void {
    const sections: DetailSection[] = [
      {
        title: 'Informations générales',
        fields: [
          { label: 'Date', value: new Date(entry.occurredAt).toLocaleString('fr-FR') },
          { label: 'Module', value: entry.module },
          { label: 'Type d\'entité', value: entry.entityType },
          { label: 'ID entité', value: entry.entityId || '—' },
          { label: 'Action', value: entry.actionLabel || entry.action },
          { label: 'Utilisateur', value: entry.userEmail || entry.userId || '—' },
          { label: 'Adresse IP', value: entry.ipAddress || '—' },
        ],
      },
    ];

    // Old values section
    const oldEntries = Object.entries(entry.oldValues ?? {});
    if (oldEntries.length > 0) {
      sections.push({
        title: 'Anciennes valeurs',
        fields: oldEntries.map(([k, v]) => ({
          label: k,
          value: v != null ? String(v) : '—',
        })),
      });
    }

    // New values section
    const newEntries = Object.entries(entry.newValues ?? {});
    if (newEntries.length > 0) {
      sections.push({
        title: 'Nouvelles valeurs',
        fields: newEntries.map(([k, v]) => ({
          label: k,
          value: v != null ? String(v) : '—',
        })),
      });
    }

    // If neither old nor new values, show a note
    if (oldEntries.length === 0 && newEntries.length === 0) {
      sections.push({
        title: 'Détails',
        fields: [{ label: 'Données', value: 'Aucun détail enregistré pour cette entrée.' }],
      });
    }

    this.dialog.open<DetailDialogData>(DetailDialog, {
      title: `Audit — ${entry.actionLabel || entry.action}`,
      size: 'lg',
      data: { sections },
    });
  }
}
