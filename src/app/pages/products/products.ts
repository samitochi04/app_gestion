import { Component, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  Category,
  CreateProductRequest,
  Product,
  ProductFilters,
  ProductType,
  StockCurrent,
  UpdateProductRequest
} from '../../models/business.model';
import { CategoryService } from '../../services/category.service';
import { ProductService } from '../../services/product.service';
import { getApiErrorMessage } from '../../utils/http.util';

@Component({
  selector: 'app-products',
  imports: [ReactiveFormsModule, RouterLink, DecimalPipe],
  templateUrl: './products.html',
  styleUrl: './products.css'
})
export class ProductsComponent implements OnInit {
  protected readonly products = signal<Product[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly stockDetails = signal<StockCurrent[]>([]);
  protected readonly showStockModal = signal(false);
  protected readonly selectedProduct = signal<Product | null>(null);
  protected readonly loading = signal(false);
  protected readonly page = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly totalElements = signal(0);
  protected readonly showForm = signal(false);
  protected readonly editingProduct = signal<Product | null>(null);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly productTypes: ProductType[] = ['STOCKABLE', 'CONSUMABLE', 'SERVICE'];

  readonly filterForm: FormGroup;
  readonly productForm: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly productService: ProductService,
    private readonly categoryService: CategoryService
  ) {
    this.filterForm = this.fb.group({
      query: [''],
      categoryId: [''],
      active: ['all']
    });

    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      sku: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      type: ['STOCKABLE', [Validators.required]],
      categoryId: [''],
      unitPurchasePrice: [0, [Validators.required, Validators.min(0)]],
      unit: ['', [Validators.required]],
      marginPercent: [0, [Validators.min(0)]],
      unitSalePrice: [0, [Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (categories) => this.categories.set(categories),
      error: (error) => {
        this.errorMessage.set(getApiErrorMessage(error, 'Erreur lors du chargement des catégories'));
      }
    });
  }

  loadProducts(page = this.page()): void {
    this.loading.set(true);
    this.page.set(page);

    this.productService.getProducts(this.buildFilters(page)).subscribe({
      next: (response) => {
        this.products.set(response.content);
        this.totalPages.set(response.totalPages);
        this.totalElements.set(response.totalElements);
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(getApiErrorMessage(error, 'Erreur lors du chargement des produits'));
        this.loading.set(false);
      }
    });
  }

  applyFilters(): void {
    this.loadProducts(0);
  }

  clearFilters(): void {
    this.filterForm.reset({ query: '', categoryId: '', active: 'all' });
    this.loadProducts(0);
  }

  openCreateForm(): void {
    this.editingProduct.set(null);
    this.productForm.reset({
      name: '',
      sku: '',
      description: '',
      type: 'STOCKABLE',
      categoryId: '',
      unitPurchasePrice: 0,
      unit: '',
      marginPercent: 0,
      unitSalePrice: 0
    });
    this.productForm.get('sku')?.enable();
    this.productForm.get('type')?.enable();
    this.showForm.set(true);
    this.clearMessages();
  }

  openEditForm(product: Product): void {
    this.editingProduct.set(product);
    this.productForm.reset({
      name: product.name,
      sku: product.sku,
      description: product.description,
      type: product.type,
      categoryId: product.categoryId ?? '',
      unitPurchasePrice: product.unitPurchasePrice,
      unit: product.unit,
      marginPercent: product.marginPercent,
      unitSalePrice: product.unitSalePrice
    });
    this.productForm.get('sku')?.disable();
    this.productForm.get('type')?.disable();
    this.showForm.set(true);
    this.clearMessages();
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingProduct.set(null);
    this.productForm.get('sku')?.enable();
    this.productForm.get('type')?.enable();
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.clearMessages();

    const raw = this.productForm.getRawValue();
    const request$ = this.editingProduct()
      ? this.productService.updateProduct(this.editingProduct()!.id, {
          name: raw.name,
          description: raw.description,
          categoryId: raw.categoryId ? Number(raw.categoryId) : null,
          unitPurchasePrice: Number(raw.unitPurchasePrice),
          unit: raw.unit,
          marginPercent: Number(raw.marginPercent),
          unitSalePrice: Number(raw.unitSalePrice)
        } as UpdateProductRequest)
      : this.productService.createProduct({
          name: raw.name,
          sku: raw.sku,
          description: raw.description,
          type: raw.type,
          categoryId: raw.categoryId ? Number(raw.categoryId) : null,
          unitPurchasePrice: Number(raw.unitPurchasePrice),
          unit: raw.unit
        } as CreateProductRequest);

    request$.subscribe({
      next: () => {
        this.successMessage.set(
          this.editingProduct() ? 'Produit modifié avec succès' : 'Produit créé avec succès'
        );
        this.cancelForm();
        this.loadProducts(this.page());
      },
      error: (error) => {
        this.errorMessage.set(getApiErrorMessage(error, 'Erreur lors de l\'enregistrement du produit'));
        this.loading.set(false);
      }
    });
  }

  deleteProduct(product: Product): void {
    if (!confirm(`Supprimer le produit "${product.name}" ?`)) {
      return;
    }

    this.loading.set(true);
    this.clearMessages();

    this.productService.deleteProduct(product.id).subscribe({
      next: () => {
        this.successMessage.set('Produit supprimé avec succès');
        this.loadProducts(this.page());
      },
      error: (error) => {
        this.errorMessage.set(getApiErrorMessage(error, 'Erreur lors de la suppression du produit'));
        this.loading.set(false);
      }
    });
  }

  openStockModal(product: Product): void {
    this.selectedProduct.set(product);
    this.showStockModal.set(true);
    this.stockDetails.set([]);

    this.productService.getProductStock(product.id).subscribe({
      next: (stock) => this.stockDetails.set(stock),
      error: (error) => {
        this.errorMessage.set(getApiErrorMessage(error, 'Erreur lors du chargement du stock produit'));
      }
    });
  }

  closeStockModal(): void {
    this.showStockModal.set(false);
    this.selectedProduct.set(null);
    this.stockDetails.set([]);
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages() || page === this.page()) {
      return;
    }

    this.loadProducts(page);
  }

  getCategoryName(categoryId: number | null): string {
    if (categoryId === null) {
      return 'Non classé';
    }

    return this.categories().find((category) => category.id === categoryId)?.name ?? 'Inconnue';
  }

  private buildFilters(page: number): ProductFilters {
    const raw = this.filterForm.getRawValue();

    return {
      page,
      size: 10,
      query: raw.query,
      categoryId: raw.categoryId ? Number(raw.categoryId) : null,
      active: raw.active === 'all' ? null : raw.active === 'true'
    };
  }

  private clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }
}
