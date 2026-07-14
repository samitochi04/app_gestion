import { Component, OnInit, inject, signal } from '@angular/core';
import { PageHeader } from '../../../../../shared/ui/page-header/page-header';
import { Card } from '../../../../../shared/ui/card/card';
import { Button } from '../../../../../shared/ui/button/button';
import { SearchInput } from '../../../../../shared/ui/search-input/search-input';
import { DataTable, DataTableColumn } from '../../../../../shared/ui/data-table/data-table';
import { DialogService } from '../../../../../core/services/dialog.service';
import { ConfirmDialog } from '../../../../../shared/ui/confirm-dialog/confirm-dialog';
import { ToastService } from '../../../../../core/services/toast.service';
import { ApiError } from '../../../../../core/services/api.service';
import { Role } from '../../data/role.model';
import { RoleService } from '../../data/role.service';
import { RoleForm } from '../role-form/role-form';

@Component({
  selector: 'app-roles-list',
  standalone: true,
  imports: [PageHeader, Card, Button, SearchInput, DataTable],
  templateUrl: './roles-list.html',
})
export class RolesList implements OnInit {
  private readonly service = inject(RoleService);
  private readonly dialog = inject(DialogService);
  private readonly toast = inject(ToastService);

  roles = signal<Role[]>([]);
  loading = signal(true);
  searchTerm = signal('');

  columns: DataTableColumn<Role>[] = [
    { key: 'name', header: 'Nom' },
    { key: 'description', header: 'Description' },
    { key: 'permissions', header: 'Permissions', cell: (r) => `${r.permissions.length} permission(s)` },
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.service.list().subscribe({
      next: (list) => { this.roles.set(list); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  create(): void {
    const ref = this.dialog.open(RoleForm, { title: 'Nouveau rôle', size: 'lg' });
    ref.closed$.subscribe((ok) => { if (ok) this.load(); });
  }

  edit(role: Role): void {
    const ref = this.dialog.open(RoleForm, { title: 'Modifier le rôle', size: 'lg', data: { role } });
    ref.closed$.subscribe((ok) => { if (ok) this.load(); });
  }

  remove(role: Role): void {
    const ref = this.dialog.open<{ message: string; danger: boolean }, boolean>(ConfirmDialog, {
      title: 'Supprimer le rôle ?',
      data: { message: `Supprimer le rôle « ${role.name} » ?`, danger: true },
    });
    ref.closed$.subscribe((confirmed) => {
      if (!confirmed) return;
      this.service.delete(role.id).subscribe({
        next: () => { this.toast.success('Rôle supprimé.'); this.load(); },
        error: (e) => this.toast.error(e instanceof ApiError ? e.message : 'Suppression impossible.'),
      });
    });
  }
}
