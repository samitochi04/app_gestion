import { Component, OnInit, inject, signal } from '@angular/core';
import { PageHeader } from '../../../../../shared/ui/page-header/page-header';
import { Card } from '../../../../../shared/ui/card/card';
import { SearchInput } from '../../../../../shared/ui/search-input/search-input';
import { DataTable, DataTableColumn } from '../../../../../shared/ui/data-table/data-table';
import { Paginator } from '../../../../../shared/ui/paginator/paginator';
import { DialogService } from '../../../../../core/services/dialog.service';
import { AppUser } from '../../data/user.model';
import { UserService } from '../../data/user.service';
import { AssignRoleForm } from '../assign-role-form/assign-role-form';

@Component({
  selector: 'app-utilisateurs-list',
  standalone: true,
  imports: [PageHeader, Card, SearchInput, DataTable, Paginator],
  templateUrl: './utilisateurs-list.html',
})
export class UtilisateursList implements OnInit {
  private readonly service = inject(UserService);
  private readonly dialog = inject(DialogService);

  users = signal<AppUser[]>([]);
  loading = signal(true);
  searchTerm = signal('');
  page = signal(0);
  size = signal(20);
  totalElements = signal(0);
  totalPages = signal(0);

  columns: DataTableColumn<AppUser>[] = [
    { key: 'fullName', header: 'Nom' },
    { key: 'email', header: 'E-mail' },
    { key: 'roles', header: 'Rôles', cell: (r) => r.roles.join(', ') || '—' },
    { key: 'active', header: 'Statut', align: 'center', cell: (r) => (r.active ? 'Actif' : 'Inactif') },
  ];

  ngOnInit(): void { this.load(0); }

  load(page: number): void {
    this.loading.set(true);
    this.service.list({ page, size: this.size() }).subscribe({
      next: (res) => {
        this.users.set(res.content);
        this.page.set(res.page); this.totalElements.set(res.totalElements); this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  assignRole(user: AppUser): void {
    const ref = this.dialog.open(AssignRoleForm, { title: `Assigner un rôle — ${user.fullName}`, data: { user } });
    ref.closed$.subscribe((ok) => { if (ok) this.load(this.page()); });
  }
}
