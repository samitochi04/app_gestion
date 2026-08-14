import { Component, OnInit, inject, signal } from '@angular/core';
import { PageHeader } from '../../../../../shared/ui/page-header/page-header';
import { Card } from '../../../../../shared/ui/card/card';
import { SearchInput } from '../../../../../shared/ui/search-input/search-input';
import { DataTable, DataTableColumn } from '../../../../../shared/ui/data-table/data-table';
import { Paginator } from '../../../../../shared/ui/paginator/paginator';
import { AuditEntry } from '../../data/audit.model';
import { AuditService } from '../../data/audit.service';

@Component({
  selector: 'app-audit-list',
  standalone: true,
  imports: [PageHeader, Card, SearchInput, DataTable, Paginator],
  templateUrl: './audit-list.html',
})
export class AuditList implements OnInit {
  private readonly service = inject(AuditService);

  entries = signal<AuditEntry[]>([]);
  loading = signal(true);
  page = signal(0);
  size = signal(20);
  totalElements = signal(0);
  totalPages = signal(0);
  search = signal('');

  columns: DataTableColumn<AuditEntry>[] = [
    { key: 'occurredAt', header: 'Date', cell: (r) => new Date(r.occurredAt).toLocaleString('fr-FR') },
    { key: 'module', header: 'Module' },
    { key: 'entityType', header: 'Entité' },
    { key: 'actionLabel', header: 'Action' },
    // The audit module records the actor's UUID (SecurityUtils.getCurrentUserId);
    // it does not depend on IAM to resolve an email, so userEmail is often
    // empty. Fall back to the userId so the column is never blank.
    { key: 'userEmail', header: 'Utilisateur', cell: (r) => r.userEmail || r.userId || '—' },
  ];

  ngOnInit(): void { this.load(0); }

  load(page: number): void {
    this.loading.set(true);
    this.service.list({ page, size: this.size(), search: this.search() }).subscribe({
      next: (res) => {
        this.entries.set(res.content);
        this.page.set(res.page); this.totalElements.set(res.totalElements); this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearch(term: string): void { this.search.set(term); this.load(0); }
}
