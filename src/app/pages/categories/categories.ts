import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../../models/business.model';
import { CategoryService } from '../../services/category.service';
import { getApiErrorMessage } from '../../utils/http.util';

@Component({
  selector: 'app-categories',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './categories.html',
  styleUrl: './categories.css'
})
export class CategoriesComponent implements OnInit {
  protected readonly categories = signal<Category[]>([]);
  protected readonly loading = signal(false);
  protected readonly showForm = signal(false);
  protected readonly editingCategory = signal<Category | null>(null);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');

  readonly categoryForm: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly categoryService: CategoryService
  ) {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading.set(true);
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(getApiErrorMessage(error, 'Erreur lors du chargement des catégories'));
        this.loading.set(false);
      }
    });
  }

  openCreateForm(): void {
    this.editingCategory.set(null);
    this.categoryForm.reset({ name: '', description: '' });
    this.showForm.set(true);
    this.clearMessages();
  }

  openEditForm(category: Category): void {
    this.editingCategory.set(category);
    this.categoryForm.reset({
      name: category.name,
      description: category.description
    });
    this.showForm.set(true);
    this.clearMessages();
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingCategory.set(null);
    this.categoryForm.reset({ name: '', description: '' });
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.clearMessages();

    const payload = this.categoryForm.getRawValue() as CreateCategoryRequest | UpdateCategoryRequest;
    const request$ = this.editingCategory()
      ? this.categoryService.updateCategory(this.editingCategory()!.id, payload as UpdateCategoryRequest)
      : this.categoryService.createCategory(payload as CreateCategoryRequest);

    request$.subscribe({
      next: () => {
        this.successMessage.set(
          this.editingCategory() ? 'Catégorie modifiée avec succès' : 'Catégorie créée avec succès'
        );
        this.cancelForm();
        this.loadCategories();
      },
      error: (error) => {
        this.errorMessage.set(getApiErrorMessage(error, 'Erreur lors de l\'enregistrement de la catégorie'));
        this.loading.set(false);
      }
    });
  }

  deleteCategory(category: Category): void {
    if (!confirm(`Supprimer la catégorie "${category.name}" ?`)) {
      return;
    }

    this.loading.set(true);
    this.clearMessages();

    this.categoryService.deleteCategory(category.id).subscribe({
      next: () => {
        this.successMessage.set('Catégorie supprimée avec succès');
        this.loadCategories();
      },
      error: (error) => {
        this.errorMessage.set(getApiErrorMessage(error, 'Erreur lors de la suppression de la catégorie'));
        this.loading.set(false);
      }
    });
  }

  private clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }
}
