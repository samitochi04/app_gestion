import { Component, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  Product,
  ReceiveStockRequest,
  Reservation,
  ReserveStockRequest,
  StockCurrent,
  StockLot,
  StockMovement,
  TransferStockRequest,
  Warehouse
} from '../../models/business.model';
import { ProductService } from '../../services/product.service';
import { StockService } from '../../services/stock.service';
import { WarehouseService } from '../../services/warehouse.service';
import { getApiErrorMessage } from '../../utils/http.util';

@Component({
  selector: 'app-stock',
  imports: [ReactiveFormsModule, RouterLink, DatePipe, DecimalPipe],
  templateUrl: './stock.html',
  styleUrl: './stock.css'
})
export class StockComponent implements OnInit {
  protected readonly products = signal<Product[]>([]);
  protected readonly warehouses = signal<Warehouse[]>([]);
  protected readonly currentStock = signal<StockCurrent[]>([]);
  protected readonly movements = signal<StockMovement[]>([]);
  protected readonly lots = signal<StockLot[]>([]);
  protected readonly lastReservation = signal<Reservation | null>(null);
  protected readonly movementMode = signal<'receive' | 'issue' | 'adjust' | 'transfer'>('receive');
  protected readonly loadingCurrent = signal(false);
  protected readonly loadingMovements = signal(false);
  protected readonly loadingAction = signal(false);
  protected readonly currentPage = signal(0);
  protected readonly currentTotalPages = signal(0);
  protected readonly currentTotalElements = signal(0);
  protected readonly movementPage = signal(0);
  protected readonly movementTotalPages = signal(0);
  protected readonly movementTotalElements = signal(0);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');

  readonly movementForm: FormGroup;
  readonly movementFilterForm: FormGroup;
  readonly lotsForm: FormGroup;
  readonly reservationForm: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly stockService: StockService,
    private readonly productService: ProductService,
    private readonly warehouseService: WarehouseService
  ) {
    this.movementForm = this.fb.group({
      sourceWarehouseId: ['', [Validators.required]],
      destWarehouseId: [''],
      productId: ['', [Validators.required]],
      quantity: [1, [Validators.required, Validators.min(0.01)]],
      unitCost: [0, [Validators.min(0)]],
      reference: ['', [Validators.required]],
      notes: ['']
    });

    this.movementFilterForm = this.fb.group({
      type: [''],
      warehouseId: ['']
    });

    this.lotsForm = this.fb.group({
      productId: ['', [Validators.required]]
    });

    this.reservationForm = this.fb.group({
      productId: ['', [Validators.required]],
      warehouseId: ['', [Validators.required]],
      quantity: [1, [Validators.required, Validators.min(0.01)]],
      reference: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadLookups();
    this.loadCurrentStock();
    this.loadMovements();
  }

  loadLookups(): void {
    this.productService.getProducts({ page: 0, size: 100 }).subscribe({
      next: (response) => this.products.set(response.content),
      error: (error) => {
        this.errorMessage.set(getApiErrorMessage(error, 'Erreur lors du chargement des produits'));
      }
    });

    this.warehouseService.getWarehouses(false).subscribe({
      next: (warehouses) => this.warehouses.set(warehouses),
      error: (error) => {
        this.errorMessage.set(getApiErrorMessage(error, 'Erreur lors du chargement des entrepôts'));
      }
    });
  }

  setMovementMode(mode: 'receive' | 'issue' | 'adjust' | 'transfer'): void {
    this.movementMode.set(mode);
    if (mode === 'transfer') {
      this.movementForm.get('destWarehouseId')?.addValidators([Validators.required]);
    } else {
      this.movementForm.get('destWarehouseId')?.clearValidators();
      this.movementForm.patchValue({ destWarehouseId: '' });
    }
    this.movementForm.get('destWarehouseId')?.updateValueAndValidity();
  }

  loadCurrentStock(page = this.currentPage()): void {
    this.loadingCurrent.set(true);
    this.currentPage.set(page);

    this.stockService.getCurrent(page, 10).subscribe({
      next: (response) => {
        this.currentStock.set(response.content);
        this.currentTotalPages.set(response.totalPages);
        this.currentTotalElements.set(response.totalElements);
        this.loadingCurrent.set(false);
      },
      error: (error) => {
        this.errorMessage.set(getApiErrorMessage(error, 'Erreur lors du chargement du stock actuel'));
        this.loadingCurrent.set(false);
      }
    });
  }

  loadMovements(page = this.movementPage()): void {
    this.loadingMovements.set(true);
    this.movementPage.set(page);

    const raw = this.movementFilterForm.getRawValue();
    this.stockService
      .getMovements({
        page,
        size: 10,
        type: raw.type || undefined,
        warehouseId: raw.warehouseId ? Number(raw.warehouseId) : null
      })
      .subscribe({
        next: (response) => {
          this.movements.set(response.content);
          this.movementTotalPages.set(response.totalPages);
          this.movementTotalElements.set(response.totalElements);
          this.loadingMovements.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getApiErrorMessage(error, 'Erreur lors du chargement des mouvements'));
          this.loadingMovements.set(false);
        }
      });
  }

  applyMovementFilters(): void {
    this.loadMovements(0);
  }

  lookupLots(): void {
    if (this.lotsForm.invalid) {
      this.lotsForm.markAllAsTouched();
      return;
    }

    this.clearMessages();
    this.stockService.getLots(Number(this.lotsForm.get('productId')?.value)).subscribe({
      next: (lots) => {
        this.lots.set(lots);
        if (lots.length === 0) {
          this.successMessage.set('Aucun lot trouvé pour ce produit');
        }
      },
      error: (error) => {
        this.errorMessage.set(getApiErrorMessage(error, 'Erreur lors du chargement des lots'));
      }
    });
  }

  submitMovement(): void {
    if (this.movementForm.invalid) {
      this.movementForm.markAllAsTouched();
      return;
    }

    this.loadingAction.set(true);
    this.clearMessages();

    const raw = this.movementForm.getRawValue();
    const baseRequest = {
      warehouseId: Number(raw.sourceWarehouseId),
      reference: raw.reference,
      notes: raw.notes,
      lines: [
        {
          productId: Number(raw.productId),
          quantity: Number(raw.quantity),
          unitCost: Number(raw.unitCost)
        }
      ]
    };

    const request$ = this.movementMode() === 'receive'
      ? this.stockService.receive(baseRequest as ReceiveStockRequest)
      : this.movementMode() === 'issue'
        ? this.stockService.issue(baseRequest)
        : this.movementMode() === 'adjust'
          ? this.stockService.adjust(baseRequest)
          : this.stockService.transfer({
              sourceWarehouseId: Number(raw.sourceWarehouseId),
              destWarehouseId: Number(raw.destWarehouseId),
              reference: raw.reference,
              notes: raw.notes,
              lines: baseRequest.lines
            } as TransferStockRequest);

    request$.subscribe({
      next: () => {
        this.successMessage.set('Mouvement enregistré avec succès');
        this.loadingAction.set(false);
        this.movementForm.patchValue({ quantity: 1, unitCost: 0, reference: '', notes: '' });
        this.loadCurrentStock(this.currentPage());
        this.loadMovements(this.movementPage());
      },
      error: (error) => {
        this.errorMessage.set(getApiErrorMessage(error, 'Erreur lors de la création du mouvement'));
        this.loadingAction.set(false);
      }
    });
  }

  submitReservation(): void {
    if (this.reservationForm.invalid) {
      this.reservationForm.markAllAsTouched();
      return;
    }

    this.loadingAction.set(true);
    this.clearMessages();

    this.stockService.reserve({
      productId: Number(this.reservationForm.get('productId')?.value),
      warehouseId: Number(this.reservationForm.get('warehouseId')?.value),
      quantity: Number(this.reservationForm.get('quantity')?.value),
      reference: this.reservationForm.get('reference')?.value
    } as ReserveStockRequest).subscribe({
      next: (reservation) => {
        this.lastReservation.set(reservation);
        this.successMessage.set('Réservation créée avec succès');
        this.loadingAction.set(false);
        this.reservationForm.patchValue({ quantity: 1, reference: '' });
        this.loadCurrentStock(this.currentPage());
      },
      error: (error) => {
        this.errorMessage.set(getApiErrorMessage(error, 'Erreur lors de la réservation'));
        this.loadingAction.set(false);
      }
    });
  }

  releaseReservation(): void {
    const reservation = this.lastReservation();
    if (!reservation) {
      return;
    }

    this.loadingAction.set(true);
    this.clearMessages();

    this.stockService.release(reservation.id).subscribe({
      next: () => {
        this.successMessage.set('Réservation libérée avec succès');
        this.lastReservation.set(null);
        this.loadingAction.set(false);
        this.loadCurrentStock(this.currentPage());
      },
      error: (error) => {
        this.errorMessage.set(getApiErrorMessage(error, 'Erreur lors de la libération de la réservation'));
        this.loadingAction.set(false);
      }
    });
  }

  goToCurrentPage(page: number): void {
    if (page < 0 || page >= this.currentTotalPages() || page === this.currentPage()) {
      return;
    }

    this.loadCurrentStock(page);
  }

  goToMovementPage(page: number): void {
    if (page < 0 || page >= this.movementTotalPages() || page === this.movementPage()) {
      return;
    }

    this.loadMovements(page);
  }

  getWarehouseName(warehouseId: number): string {
    return this.warehouses().find((warehouse) => warehouse.id === warehouseId)?.name ?? `#${warehouseId}`;
  }

  getProductName(productId: number): string {
    return this.products().find((product) => product.id === productId)?.name ?? `#${productId}`;
  }

  private clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }
}
