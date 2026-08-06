import { Component, OnInit, inject, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { PageHeader } from '../../../../../shared/ui/page-header/page-header';
import { Card } from '../../../../../shared/ui/card/card';
import { Button } from '../../../../../shared/ui/button/button';
import { SearchInput } from '../../../../../shared/ui/search-input/search-input';
import { DataTable, DataTableAction, DataTableColumn } from '../../../../../shared/ui/data-table/data-table';
import { Paginator } from '../../../../../shared/ui/paginator/paginator';
import { DialogService } from '../../../../../core/services/dialog.service';
import { ConfirmDialog, ConfirmDialogData } from '../../../../../shared/ui/confirm-dialog/confirm-dialog';
import { PromptDialog, PromptDialogData } from '../../../../../shared/ui/prompt-dialog/prompt-dialog';
import { ToastService } from '../../../../../core/services/toast.service';
import { ApiError } from '../../../../../core/services/api.service';
import { selectUser } from '../../../../../core/store/session/session.selectors';
import { AppUser } from '../../data/user.model';
import { UserService } from '../../data/user.service';
import { AssignRoleForm } from '../assign-role-form/assign-role-form';
import { UtilisateurForm } from '../utilisateur-form/utilisateur-form';

@Component({
  selector: 'app-utilisateurs-list',
  standalone: true,
  imports: [PageHeader, Card, Button, SearchInput, DataTable, Paginator],
  templateUrl: './utilisateurs-list.html',
})
export class UtilisateursList implements OnInit {
  private readonly service = inject(UserService);
  private readonly dialog = inject(DialogService);
  private readonly toast = inject(ToastService);
  private readonly store = inject(Store);

  /** An administrator may not close their own account; the action stays hidden. */
  private readonly currentUser = toSignal(this.store.select(selectUser), { initialValue: null });

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
    { key: 'mustChangePassword', header: 'Mot de passe', cell: (r) => (r.mustChangePassword ? 'À changer' : 'Défini') },
    { key: 'active', header: 'Statut', align: 'center', cell: (r) => (r.active ? 'Actif' : 'Inactif') },
  ];

  actions: DataTableAction<AppUser>[] = [
    {
      icon: 'refresh',
      label: 'Réinitialiser le mot de passe',
      run: (u) => this.resetPassword(u),
    },
    {
      icon: 'check-circle',
      label: 'Réactiver le compte',
      visible: (u) => !u.active,
      run: (u) => this.setActive(u, true),
    },
    {
      icon: 'x',
      label: 'Désactiver le compte',
      danger: true,
      visible: (u) => u.active && u.id !== this.currentUser()?.id,
      run: (u) => this.setActive(u, false),
    },
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

  create(): void {
    const ref = this.dialog.open(UtilisateurForm, { title: 'Nouveau compte utilisateur' });
    ref.closed$.subscribe((ok) => { if (ok) this.load(0); });
  }

  assignRole(user: AppUser): void {
    const ref = this.dialog.open(AssignRoleForm, { title: `Assigner un rôle — ${user.fullName}`, data: { user } });
    ref.closed$.subscribe((ok) => { if (ok) this.load(this.page()); });
  }

  private resetPassword(user: AppUser): void {
    const ref = this.dialog.open<PromptDialogData, string>(PromptDialog, {
      title: `Réinitialiser — ${user.fullName}`,
      data: {
        label: 'Mot de passe provisoire',
        message: 'Le titulaire devra le changer à sa prochaine connexion.',
        confirmLabel: 'Réinitialiser',
      },
    });
    ref.closed$.subscribe((temporaryPassword) => {
      if (!temporaryPassword) return;
      this.service.resetPassword(user.id, { temporaryPassword }).subscribe({
        next: () => { this.toast.success('Mot de passe réinitialisé.'); this.load(this.page()); },
        error: (e) => this.toast.error(e instanceof ApiError ? e.message : 'Réinitialisation impossible.'),
      });
    });
  }

  private setActive(user: AppUser, active: boolean): void {
    const ref = this.dialog.open<ConfirmDialogData, boolean>(ConfirmDialog, {
      title: active ? 'Réactiver le compte ?' : 'Désactiver le compte ?',
      data: {
        message: active
          ? `« ${user.fullName} » pourra de nouveau se connecter.`
          : `« ${user.fullName} » ne pourra plus se connecter. Le compte est conservé : les traces d’audit le référencent.`,
        danger: !active,
        confirmLabel: active ? 'Réactiver' : 'Désactiver',
      },
    });
    ref.closed$.subscribe((confirmed) => {
      if (!confirmed) return;
      const request$ = active ? this.service.activate(user.id) : this.service.deactivate(user.id);
      request$.subscribe({
        next: () => { this.toast.success(active ? 'Compte réactivé.' : 'Compte désactivé.'); this.load(this.page()); },
        error: (e) => this.toast.error(e instanceof ApiError ? e.message : 'Opération impossible.'),
      });
    });
  }
}
