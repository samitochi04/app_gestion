import { Component, OnInit, inject, signal } from '@angular/core';
import { PageHeader } from '../../../../../../shared/ui/page-header/page-header';
import { Card } from '../../../../../../shared/ui/card/card';
import { Button } from '../../../../../../shared/ui/button/button';
import { SearchInput } from '../../../../../../shared/ui/search-input/search-input';
import { DataTable, DataTableColumn } from '../../../../../../shared/ui/data-table/data-table';
import { DialogService } from '../../../../../../core/services/dialog.service';
import { ConfirmDialog } from '../../../../../../shared/ui/confirm-dialog/confirm-dialog';
import { ToastService } from '../../../../../../core/services/toast.service';
import { ApiError } from '../../../../../../core/services/api.service';
import { Category } from '../../data/category.model';
import { CategoryService } from '../../data/category.service';
import { CategorieForm } from '../categorie-form/categorie-form';

@Component({
  selector: 'app-categories-list',
  standalone: true,
  imports: [PageHeader, Card, Button, SearchInput, DataTable],
  templateUrl: './categories-list.html',
})
export class CategoriesList implements OnInit {
  private readonly service = inject(CategoryService);
  private readonly dialog = inject(DialogService);
  private readonly toast = inject(ToastService);

  categories = signal<Category[]>([]);
  loading = signal(true);
  searchTerm = signal('');

  columns: DataTableColumn<Category>[] = [
    { key: 'name', header: 'Nom' },
    { key: 'description', header: 'Description' },
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.service.list().subscribe({
      next: (list) => { this.categories.set(list); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  create(): void {
    const ref = this.dialog.open(CategorieForm, { title: 'Nouvelle catégorie' });
    ref.closed$.subscribe((ok) => { if (ok) this.load(); });
  }

  edit(category: Category): void {
    const ref = this.dialog.open(CategorieForm, { title: 'Modifier la catégorie', data: { category } });
    ref.closed$.subscribe((ok) => { if (ok) this.load(); });
  }

  remove(category: Category): void {
    const ref = this.dialog.open<{ message: string; danger: boolean }, boolean>(ConfirmDialog, {
      title: 'Supprimer la catégorie ?',
      data: { message: `Supprimer « ${category.name} » ?`, danger: true },
    });
    ref.closed$.subscribe((confirmed) => {
      if (!confirmed) return;
      this.service.delete(category.id).subscribe({
        next: () => { this.toast.success('Catégorie supprimée.'); this.load(); },
        error: (e) => this.toast.error(e instanceof ApiError ? e.message : 'Suppression impossible.'),
      });
    });
  }
}
